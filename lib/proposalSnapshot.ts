// Admin proposal snapshot — captures all inputs, API results, and curation state
// for a single proposal so the user can save/resume across page reloads.
//
// Snapshots are stored together under a single localStorage key, indexed by a
// normalized address. Designed to be a self-contained JSON document so a future
// "share with teammate" feature can serialize it untouched.

import type { Floorplan, PropertyRecord, AvmValue, RentalListing } from "@/lib/rentcast/types";
import type { Defaults } from "@/lib/investment/types";
import type { EstimatorState } from "@/lib/investment/siteWorkItems";
import type { RentcastMarketStats } from "@/hooks/rentcast/useRentcastData";
import type { CustomerMotivation, FeaturedRental, ProjectTimeline } from "@/lib/store/presentationStore";
import type { ProposalPaymentSchedule } from "@/lib/investment/proposalPaymentSchedule";
import { readCompanion, writeCompanion } from "@/lib/admin/companionKeys";

export const PROPOSAL_SCHEMA_VERSION = 1 as const;
export const PROPOSALS_STORAGE_KEY = "be_admin_proposals_v1";
export const DRAFTS_STORAGE_KEY = "be_admin_drafts_v1";

// Step 3 (SiteWorkPanel) and Step 4 (DiscountsPanel) hydrate from these keys.
// We snapshot the raw JSON so loading a proposal restores panel behavior exactly.
export const COMPANION_LS_KEYS = ["swp_master", "swp_custom", "dp_master", "dp_custom"] as const;
export type CompanionKey = (typeof COMPANION_LS_KEYS)[number];

export interface ProposalSnapshot {
    schemaVersion: typeof PROPOSAL_SCHEMA_VERSION;
    savedAt: string; // ISO timestamp
    addressKey: string; // normalized address (the unique identifier)

    // Step 1
    customerName: string;
    /** Customer email (optional). Drives the agreement e-signature recipient;
     *  auto-fills from a linked Pipedrive person but is rep-editable. Optional
     *  for backward compatibility with snapshots saved before this field. */
    customerEmail?: string;
    address: string;
    owed: string;
    propertyPhotoUrl: string | null;
    customerMotivation: CustomerMotivation;
    aduType: "detached" | "attached" | "garage" | "";
    floorplanId: string;
    currentFirstPmtMonthly: string;

    // Step 1 (merged unit picker) — only persist custom (admin-added) floorplans;
    // Sanity ones reload from server.
    customFloorplans: Floorplan[];
    aduCompareIds: string[];
    // Per-unit overrides for ADU type / beds / baths, keyed by floorplan id.
    aduTypeByUnitId?: Record<string, "detached" | "attached" | "garage">;
    bedsByUnitId?: Record<string, number>;
    bathsByUnitId?: Record<string, number>;
    // Optional custom tag per unit (e.g. "Hillside") distinguishing duplicates.
    labelByUnitId?: Record<string, string>;

    // Investment model (Step 3, 4, 6)
    defaults: Defaults;
    estimatorByAduId: Record<string, EstimatorState>;
    rentByAduId: Record<string, string>;
    /** Rep override for the MAIN HOUSE monthly rent shown on the "ADU vs
     *  buying a house" slide. Empty/absent = use the automatic estimate
     *  (Zillow rentZestimate → median-scaled fallback). Optional for
     *  back-compat with older snapshots. */
    houseRentOverride?: string;
    baseCostByAduId: Record<string, string>;
    sqftByAduId: Record<string, string>;
    discountAmountByAduId: Record<string, number>;
    discountLinesByAduId: Record<string, { label: string; amount: number }[]>;

    // Rentcast API results — so we don't re-call expensive APIs on reload
    rentcast: {
        property: PropertyRecord | null;
        avm: AvmValue | null;
        rentals: RentalListing[];
        market: RentcastMarketStats | null;
    };

    // Steps 7, 8, 9 — slide curation
    featuredPropertyIds: string[];
    featuredStoryIds: string[];
    featuredRentals: FeaturedRental[];

    // Step 10 — custom slide order for the presenter. Empty = natural 1..N.
    slideOrder: number[];

    // Step 11 — admin-entered project timeline (BE + city days per phase).
    // null = use CITY_TIMELINES defaults at slide render time.
    projectTimeline: ProjectTimeline | null;

    // Step 12 — admin-tuned payment schedule for the proposal contract.
    // null until an ADU is picked and a schedule is generated.
    proposalPaymentSchedule: ProposalPaymentSchedule | null;

    /** Per-ADU schedules. Old snapshots only stored the singular field above;
     *  applySnapshot migrates them by keying the old schedule under its
     *  `aduId` when this field is absent. */
    proposalPaymentSchedulesByAduId?: Record<string, ProposalPaymentSchedule>;

    /** Pipedrive linkage — populated when the rep links this proposal to a
     *  Pipedrive person/deal from Step 1. Used to auto-post a note back to
     *  the CRM whenever the proposal is saved. Both nullable; either can
     *  be present without the other. */
    pipedrivePersonId?: string | null;
    pipedriveDealId?: string | null;

    /** Manual agreement exclusions — one per line. Stored per-proposal so the
     *  same line doesn't ghost across every agreement (the previous design
     *  kept this in browser-global localStorage). Optional for back-compat
     *  with snapshots saved before this field existed. */
    agreementExclusions?: string;

    /** Structured proposal exclusions (name + price + note). Supersedes the
     *  legacy free-text `agreementExclusions`; old snapshots are migrated on
     *  load. Drives the comparison slide's "Not included" block + agreement. */
    exclusions?: import("@/lib/store/presentationStore").ExclusionItem[];

    // Step status
    activeStep: number;
    doneSteps: number[];
    siteWorkConfirmed: boolean;

    // Verbatim copies of the panel-owned localStorage keys (Step 3 + Step 4).
    // Stored as raw strings (panel-side JSON) to avoid re-encoding drift.
    companionStorage: Partial<Record<CompanionKey, string | null>>;
}

export interface ProposalIndexEntry {
    addressKey: string;
    address: string;
    customerName: string;
    savedAt: string;
}

// ── Address normalization ────────────────────────────────────────────────────

/** Build a stable key from a free-text address. Lowercase, collapse whitespace,
 *  strip trailing punctuation. Two addresses that differ only in casing/spacing
 *  resolve to the same key. */
export function normalizeAddress(raw: string): string {
    return raw
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ")
        .replace(/[.,;]+$/g, "")
        .replace(/\s*,\s*/g, ", ");
}

// ── Storage CRUD ─────────────────────────────────────────────────────────────

/** Cap the number of proposals we keep in the localStorage mirror. The DB is
 *  the source of truth; LS is just a fast-path cache for the most-recently
 *  edited entries. Past this cap, oldest entries are evicted on every write. */
const MAX_LS_PROPOSALS = 10;

function readStore(storageKey: string): Record<string, ProposalSnapshot> {
    if (typeof window === "undefined") return {};
    try {
        const raw = window.localStorage.getItem(storageKey);
        if (!raw) return {};
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") return parsed as Record<string, ProposalSnapshot>;
        return {};
    } catch {
        return {};
    }
}

/** Quota-safe write. Trims the store to MAX_LS_PROPOSALS by oldest-first
 *  eviction, and if the resulting payload still won't fit (large rentcast
 *  blob etc.), evicts further until it succeeds. Returns true on success.
 *
 *  Returns false (instead of throwing) when the cache is fundamentally
 *  unwritable — the DB is the source of truth, so a missed LS write is
 *  not a data-loss event. */
function writeStore(storageKey: string, store: Record<string, ProposalSnapshot>): boolean {
    if (typeof window === "undefined") return false;

    // Hard cap: trim by ascending savedAt (oldest first).
    let entries = Object.entries(store);
    if (entries.length > MAX_LS_PROPOSALS) {
        entries.sort((a, b) => (a[1].savedAt < b[1].savedAt ? -1 : 1));
        entries = entries.slice(entries.length - MAX_LS_PROPOSALS);
    }
    // Always order newest-first so the next eviction loop pops the oldest.
    entries.sort((a, b) => (a[1].savedAt < b[1].savedAt ? 1 : -1));

    // Try to write; on QuotaExceededError, drop the oldest entry and retry.
    // Bail after a handful of attempts to avoid an infinite loop on a totally
    // saturated origin.
    let attempts = 0;
    while (attempts < MAX_LS_PROPOSALS + 2) {
        const payload: Record<string, ProposalSnapshot> = {};
        for (const [k, v] of entries) payload[k] = v;
        try {
            window.localStorage.setItem(storageKey, JSON.stringify(payload));
            return true;
        } catch (err) {
            // Best-effort detect quota errors across browsers — DOMException
            // with .name === "QuotaExceededError" (or code 22 / 1014). Any
            // other failure is also treated as "give up on LS for this write".
            attempts++;
            if (entries.length === 0) {
                console.warn(`[proposalSnapshot] writeStore gave up after quota errors`, err);
                return false;
            }
            // Drop the oldest entry (last in the newest-first array).
            entries.pop();
        }
    }
    return false;
}

function listFrom(storageKey: string): ProposalIndexEntry[] {
    const store = readStore(storageKey);
    return Object.values(store)
        .map((p) => ({
            addressKey: p.addressKey,
            address: p.address,
            customerName: p.customerName,
            savedAt: p.savedAt,
        }))
        .sort((a, b) => (a.savedAt < b.savedAt ? 1 : -1));
}

// ── Proposals (explicit Save) ────────────────────────────────────────────────

export function listProposals(): ProposalIndexEntry[] {
    return listFrom(PROPOSALS_STORAGE_KEY);
}

export function getProposal(addressKey: string): ProposalSnapshot | null {
    return readStore(PROPOSALS_STORAGE_KEY)[addressKey] ?? null;
}

export function hasProposal(addressKey: string): boolean {
    return getProposal(addressKey) !== null;
}

/** Thrown by saveProposal when someone else saved a newer canonical since
 *  this editor loaded — the caller decides whether to overwrite (force) or
 *  back off and load the latest. */
export class ProposalConflictError extends Error {
    conflict: { savedBy: string | null; savedAt: string };
    constructor(conflict: { savedBy: string | null; savedAt: string }) {
        super("A newer version of this proposal was saved by someone else.");
        this.name = "ProposalConflictError";
        this.conflict = conflict;
    }
}

/** Save a proposal. The DB is the source of truth — the server upsert kicks
 *  off first so a localStorage quota error can never prevent persistence.
 *  Returns the awaitable server promise so callers can show "saving… → saved"
 *  based on server reality. The LS write is best-effort + quota-safe.
 *
 *  `baseSavedAt` = the canonical's savedAt at load time. The server rejects
 *  with 409 (→ ProposalConflictError) when the canonical moved past it,
 *  unless `force` is set. */
export function saveProposal(
    snapshot: ProposalSnapshot,
    opts?: { baseSavedAt?: string | null; force?: boolean }
): Promise<{ id?: string; savedAt?: string }> {
    const serverPromise = serverUpsertProposal(snapshot, "SAVED", null, opts);
    const store = readStore(PROPOSALS_STORAGE_KEY);
    store[snapshot.addressKey] = snapshot;
    writeStore(PROPOSALS_STORAGE_KEY, store);
    return serverPromise;
}

export function deleteProposal(addressKey: string): Promise<void> {
    const serverPromise = serverDeleteProposal(addressKey, "SAVED");
    const store = readStore(PROPOSALS_STORAGE_KEY);
    delete store[addressKey];
    writeStore(PROPOSALS_STORAGE_KEY, store);
    return serverPromise;
}

// ── Drafts (autosaved) ───────────────────────────────────────────────────────

export function listDrafts(): ProposalIndexEntry[] {
    return listFrom(DRAFTS_STORAGE_KEY);
}

export function getDraft(addressKey: string): ProposalSnapshot | null {
    return readStore(DRAFTS_STORAGE_KEY)[addressKey] ?? null;
}

export function hasDraft(addressKey: string): boolean {
    return getDraft(addressKey) !== null;
}

/** Same shape as saveProposal — server-first, LS-best-effort. Returns the
 *  server promise so the autosave UI can show real persistence status.
 *
 *  `draftId` pins the server row: when present, the server updates that draft
 *  BY ID (the address can change freely without forking a second draft).
 *  Callers should store the returned id and pass it on every subsequent save. */
export function saveDraft(
    snapshot: ProposalSnapshot,
    opts?: { draftId?: string | null }
): Promise<{ id?: string }> {
    const serverPromise = serverUpsertProposal(snapshot, "DRAFT", opts?.draftId ?? null);
    const store = readStore(DRAFTS_STORAGE_KEY);
    store[snapshot.addressKey] = snapshot;
    writeStore(DRAFTS_STORAGE_KEY, store);
    return serverPromise;
}

export function deleteDraft(addressKey: string): Promise<void> {
    const serverPromise = serverDeleteProposal(addressKey, "DRAFT");
    const store = readStore(DRAFTS_STORAGE_KEY);
    delete store[addressKey];
    writeStore(DRAFTS_STORAGE_KEY, store);
    return serverPromise;
}

/**
 * Fire-and-forget draft save for tab close / tab hide. `keepalive: true` lets
 * the browser finish the request after the page unloads (the regular debounced
 * autosave is simply dropped in that case — this was a real data-loss path).
 *
 * Note: browsers cap keepalive bodies around 64KB; an oversized snapshot may
 * be rejected, but the localStorage mirror below always captures it locally
 * and the next regular autosave will sync it.
 */
export function saveDraftKeepalive(snapshot: ProposalSnapshot, draftId?: string | null): void {
    if (typeof window === "undefined") return;
    try {
        const draftParam = draftId ? `&draftId=${encodeURIComponent(draftId)}` : "";
        void fetch(`/api/admin/proposals?status=DRAFT${draftParam}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(snapshot),
            keepalive: true,
        }).catch(() => {});
    } catch {
        /* never block unload */
    }
    const store = readStore(DRAFTS_STORAGE_KEY);
    store[snapshot.addressKey] = snapshot;
    writeStore(DRAFTS_STORAGE_KEY, store);
}

// ── Companion-key (panel-owned) localStorage helpers ─────────────────────────

export function captureCompanionStorage(): Partial<Record<CompanionKey, string | null>> {
    if (typeof window === "undefined") return {};
    const out: Partial<Record<CompanionKey, string | null>> = {};
    for (const key of COMPANION_LS_KEYS) {
        out[key] = readCompanion(key);
    }
    return out;
}

/**
 * Full replace of the panel-owned keys for the active proposal scope. ALWAYS
 * clears every companion key first, even when `snap` is missing or partial — a
 * blank or legacy proposal that carries no companionStorage must NOT inherit
 * the previously-open proposal's site-work / discounts. (For a partial write
 * that should leave other keys untouched, call `writeCompanion` directly.)
 */
export function restoreCompanionStorage(
    snap: Partial<Record<CompanionKey, string | null>> | undefined
): void {
    if (typeof window === "undefined") return;
    for (const key of COMPANION_LS_KEYS) {
        writeCompanion(key, snap?.[key] ?? null);
    }
}

/** Stable JSON of the companion-key snapshot — useful for change detection. */
export function companionStorageFingerprint(): string {
    return JSON.stringify(captureCompanionStorage());
}

// ── Server-backed sync (DB-backed, runs alongside the localStorage cache) ────

type ServerStatus = "SAVED" | "DRAFT";

async function serverUpsertProposal(
    snapshot: ProposalSnapshot,
    status: ServerStatus,
    draftId?: string | null,
    opts?: { baseSavedAt?: string | null; force?: boolean }
): Promise<{ id?: string; savedAt?: string }> {
    if (typeof window === "undefined") return {};
    // Throws on network errors AND on non-2xx server responses so callers
    // can surface "saving… → saved/error". Callers that don't care can
    // .catch() the promise — see `void saveDraft(snap).catch(...)` callsites.
    const params = new URLSearchParams({ status });
    if (draftId) params.set("draftId", draftId);
    if (opts?.baseSavedAt) params.set("baseSavedAt", opts.baseSavedAt);
    if (opts?.force) params.set("force", "1");
    const res = await fetch(`/api/admin/proposals?${params.toString()}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(snapshot),
    });
    if (res.status === 409) {
        const data = (await res.json().catch(() => ({}))) as {
            conflict?: { savedBy: string | null; savedAt: string };
        };
        throw new ProposalConflictError(
            data.conflict ?? { savedBy: null, savedAt: new Date().toISOString() }
        );
    }
    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Server save failed (${res.status})${text ? `: ${text}` : ""}`);
    }
    // Surface the saved proposal id so callers (e.g. the REVIEWED save) can
    // attach presenter payloads for by-id rendering. Best-effort parse.
    const data = (await res.json().catch(() => ({}))) as { id?: string; savedAt?: string };
    return { id: data.id, savedAt: data.savedAt };
}

async function serverDeleteProposal(
    addressKey: string,
    status: ServerStatus
): Promise<void> {
    if (typeof window === "undefined") return;
    try {
        await fetch(
            `/api/admin/proposals/${encodeURIComponent(addressKey)}?status=${status}`,
            { method: "DELETE" }
        );
    } catch (err) {
        console.warn(`[proposalSnapshot] server delete (${status}) failed`, err);
    }
}

/**
 * Fetch the server-side proposal index (metadata only — no snapshot blobs).
 * The DB is the source of truth; this powers the Saved & Drafts picker. Full
 * snapshots load one-at-a-time when a proposal is actually opened.
 *
 * (This replaces the old `syncFromServer`, which pulled EVERY snapshot blob
 * in the org into localStorage and then re-uploaded the local cache — a
 * multi-MB pull plus ~20 sequential heavy writes on every admin-tool mount.
 * That traffic was the root cause of production 504s on proposal load.)
 */
export async function fetchProposalIndex(
    status: ServerStatus
): Promise<ProposalIndexEntry[]> {
    if (typeof window === "undefined") return [];
    const res = await fetch(`/api/admin/proposals?status=${status}`);
    if (!res.ok) throw new Error(`Index fetch failed (${res.status})`);
    const data = (await res.json()) as { proposals: ProposalIndexEntry[] };
    return (data.proposals ?? []).filter((e) => !!e?.addressKey);
}

/** Fetch the caller's own server draft for an address (full snapshot). Used
 *  by the picker's "Save as Proposal" when the draft isn't in the LS cache. */
export async function fetchDraftFromServer(
    addressKey: string
): Promise<ProposalSnapshot | null> {
    if (typeof window === "undefined") return null;
    const res = await fetch(
        `/api/admin/proposals/${encodeURIComponent(addressKey)}?status=DRAFT`
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { proposal: ProposalSnapshot | null };
    return data.proposal ?? null;
}
