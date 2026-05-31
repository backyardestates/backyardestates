"use client";

import {
    usePresentationStore,
    type AdminBroadcast,
    type PresentationState,
} from "@/lib/store/presentationStore";
import { getCompanionScope } from "@/lib/admin/companionKeys";

// Per-proposal namespacing so an admin tab editing proposal B can't push state
// into a presenter window opened for proposal A (and vice-versa). Both sides
// resolve the same scope: the admin from its ?address/?proposalId, the presenter
// from the ?scope param `openPresenterWindow` appends.
const CHANNEL_BASE = "be_presentation";
const LS_BASE = "be_present_state";

function channelName(): string {
    return `${CHANNEL_BASE}:${getCompanionScope()}`;
}
function lsKey(): string {
    return `${LS_BASE}:${getCompanionScope()}`;
}

/**
 * Build the presenter-ready AdminBroadcast from a store snapshot. Used by
 * Phase 0b to persist a proposal's presenter payload at save time so
 * /present/[id] can render standalone. `startAdminSync` keeps its own inline
 * mapping (with customFloorplans omitted, since live custom units flow via
 * usePresentationWire) — this helper takes `includeCustomFloorplans` so the
 * persisted copy is self-contained.
 */
export function buildAdminBroadcast(
    state: PresentationState,
    opts: { includeCustomFloorplans?: boolean } = {},
): AdminBroadcast {
    return {
        customerName: state.customerName,
        propertyAddress: state.propertyAddress,
        aduType: state.aduType,
        propertyPhotoUrl: state.propertyPhotoUrl,
        customerMotivation: state.customerMotivation,
        comparedUnitIds: state.comparedUnitIds,
        aduTypeByUnitId: state.aduTypeByUnitId,
        bedsByUnitId: state.bedsByUnitId,
        bathsByUnitId: state.bathsByUnitId,
        labelByUnitId: state.labelByUnitId,
        customFloorplans: opts.includeCustomFloorplans
            ? state.floorplans.filter((fp) => fp._id.startsWith("custom_"))
            : [],
        featuredPropertyIds: state.featuredPropertyIds,
        featuredStoryIds: state.featuredStoryIds,
        featuredRentals: state.featuredRentals,
        slideOrder: state.slideOrder,
        projectTimeline: state.projectTimeline,
        proposalPaymentSchedule: state.proposalPaymentSchedule,
        proposalPaymentSchedulesByAduId: state.proposalPaymentSchedulesByAduId,
        scenarios: state.scenarios,
        rentalComps: state.rentalComps,
        rentByUnitId: state.rentByUnitId,
        paymentSchedules: state.paymentSchedules,
        siteWorkTagsByUnitId: state.siteWorkTagsByUnitId,
        siteWorkByUnitId: state.siteWorkByUnitId,
        discountLinesByUnitId: state.discountLinesByUnitId,
        exclusions: state.exclusions,
    };
}

let channel: BroadcastChannel | null = null;

function getChannel(): BroadcastChannel | null {
    if (typeof window === "undefined") return null;
    if (!channel) {
        try { channel = new BroadcastChannel(channelName()); } catch { return null; }
    }
    return channel;
}

// ── Wire protocol ─────────────────────────────────────────────────────────────
// Messages are tagged so a window can tell a state push from a connect request
// (and so two presenter windows don't try to consume each other's requests).
type ChannelMessage =
    | { kind: "state"; data: AdminBroadcast }
    | { kind: "request" };

// The most recent full payload the admin computed. Kept so the admin can replay
// it the instant a presenter/export window connects — no "click something to
// make it appear" wait. (BroadcastChannel never delivers a sender its own
// messages, so the admin won't echo this back to itself.)
let lastBroadcast: AdminBroadcast | null = null;

// ── Broadcast helpers ────────────────────────────────────────────────────────

export function broadcastAdminState(data: AdminBroadcast) {
    lastBroadcast = data;
    const ch = getChannel();
    if (!ch) return;
    try {
        ch.postMessage({ kind: "state", data } satisfies ChannelMessage);
    } catch (err) {
        console.error("[presentationSync] postMessage failed:", err);
    }
    try {
        localStorage.setItem(lsKey(), JSON.stringify({ ...data, _ts: Date.now() }));
    } catch { /* quota / private browsing */ }
}

// ── Admin-side: subscribe store → broadcast ──────────────────────────────────

let adminUnsubscribe: (() => void) | null = null;

export function startAdminSync(): () => void {
    if (adminUnsubscribe) adminUnsubscribe();

    adminUnsubscribe = usePresentationStore.subscribe((state) => {
        broadcastAdminState({
            customerName: state.customerName,
            propertyAddress: state.propertyAddress,
            aduType: state.aduType,
            propertyPhotoUrl: state.propertyPhotoUrl,
            customerMotivation: state.customerMotivation,
            comparedUnitIds: state.comparedUnitIds,
            aduTypeByUnitId: state.aduTypeByUnitId,
            bedsByUnitId: state.bedsByUnitId,
            bathsByUnitId: state.bathsByUnitId,
            labelByUnitId: state.labelByUnitId,
            // store-subscription path doesn't see admin local-state custom units —
            // those flow via usePresentationWire which broadcasts them directly.
            customFloorplans: [],
            featuredPropertyIds: state.featuredPropertyIds,
            featuredStoryIds: state.featuredStoryIds,
            featuredRentals: state.featuredRentals,
            slideOrder: state.slideOrder,
            projectTimeline: state.projectTimeline,
            proposalPaymentSchedule: state.proposalPaymentSchedule,
            proposalPaymentSchedulesByAduId: state.proposalPaymentSchedulesByAduId,
            scenarios: state.scenarios,
            rentalComps: state.rentalComps,
            rentByUnitId: state.rentByUnitId,
            paymentSchedules: state.paymentSchedules,
            siteWorkTagsByUnitId: state.siteWorkTagsByUnitId,
            siteWorkByUnitId: state.siteWorkByUnitId,
            discountLinesByUnitId: state.discountLinesByUnitId,
            exclusions: state.exclusions,
        });
    });

    return () => {
        adminUnsubscribe?.();
        adminUnsubscribe = null;
    };
}

// ── Admin-side: answer connect requests ─────────────────────────────────────
// Mounted by the admin tool (via usePresentationWire). When a presenter/export
// window announces itself with a "request", replay the latest full payload
// immediately so it renders without waiting for the next incidental edit.
export function startAdminResponder(): () => void {
    const ch = getChannel();
    if (!ch) return () => {};

    function handle(event: MessageEvent<ChannelMessage>) {
        if (event.data?.kind !== "request") return;
        if (!lastBroadcast) return; // nothing computed yet; the wire will push once hydrated
        try {
            ch!.postMessage({ kind: "state", data: lastBroadcast } satisfies ChannelMessage);
        } catch (err) {
            console.error("[presentationSync] replay failed:", err);
        }
        try {
            localStorage.setItem(lsKey(), JSON.stringify({ ...lastBroadcast, _ts: Date.now() }));
        } catch { /* quota / private browsing */ }
    }

    ch.addEventListener("message", handle);
    return () => ch.removeEventListener("message", handle);
}

// ── Presenter-side: receive broadcast → update store ────────────────────────

export function startPresenterSync(): () => void {
    const ch = getChannel();
    if (!ch) return () => {};

    // Hydrate from localStorage on first load
    try {
        const raw = localStorage.getItem(lsKey());
        if (raw) {
            const saved = JSON.parse(raw) as AdminBroadcast & { _ts?: number };
            delete (saved as any)._ts;
            usePresentationStore.getState().syncFromAdmin(saved);
        }
    } catch { /* malformed */ }

    function handleMessage(event: MessageEvent<ChannelMessage>) {
        if (event.data?.kind !== "state") return; // ignore requests from sibling windows
        usePresentationStore.getState().syncFromAdmin(event.data.data);
    }

    ch.addEventListener("message", handleMessage);

    // Announce ourselves so the admin replays current state right away, rather
    // than us waiting for the next edit-triggered broadcast.
    try {
        ch.postMessage({ kind: "request" } satisfies ChannelMessage);
    } catch { /* admin may not be open yet — LS hydration above still applies */ }

    return () => ch.removeEventListener("message", handleMessage);
}

// ── Convenience helpers ───────────────────────────────────────────────────────

export function syncSlide(n: number) {
    // Slide nav is local to presenter — not broadcast
    usePresentationStore.getState().setSlide(n);
}
