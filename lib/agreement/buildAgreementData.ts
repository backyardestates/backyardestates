// Pure data-shaping function: takes the admin's in-memory proposal state and
// returns the flat object that docxtemplater fills into the agreement template.
//
// The shape returned here is the contract between the admin tool and whoever
// authors the .docx template. To add a new placeholder, add a field here and
// a corresponding {tag} in the template — no other code needs to change.

import type { Floorplan } from "@/lib/rentcast/types";
import type { ProposalPaymentSchedule } from "@/lib/investment/proposalPaymentSchedule";
import type { SiteWorkLineItem, DiscountLineItem } from "@/lib/store/presentationStore";
import { resolveBeds, resolveBaths, resolveAduType, aduTypeLabel, aduTypeInline, type AduType } from "@/lib/units/resolveUnitSpec";

export interface AgreementBuildInput {
    customerName: string;
    propertyAddress: string;
    /** Per-unit payment schedules keyed by ADU id. The active schedule is
     *  chosen by `selectedAduId` (falling back to the first compared unit
     *  that has a schedule). Carries the same data as the legacy single
     *  `proposalPaymentSchedule` but lets the preview switch active units
     *  without recomputing on the admin side. */
    proposalPaymentSchedulesByAduId: Record<string, ProposalPaymentSchedule>;
    /** All units the customer is comparing. Used to generate the "Switch to
     *  X" exclusion bullets that show price deltas vs the active unit. */
    comparedUnitIds: string[];
    /** Which compared unit the agreement is currently based on. When absent,
     *  falls back to the first compared unit that has a schedule. */
    selectedAduId?: string | null;
    floorplans: Floorplan[];
    /** Site-work line items keyed by ADU id. Pass the merged set or the one
     *  for the proposed unit; only the entries we need will be used. */
    siteWorkByUnitId: Record<string, SiteWorkLineItem[]>;
    discountLinesByUnitId: Record<string, DiscountLineItem[]>;
    /** Free-text exclusions — one per line, or a pre-split array. */
    exclusions?: string[] | string;
    /** Per-unit beds/baths overrides from the merged Step 1. Falls back to
     *  the floorplan's own values when not present. */
    bedsByUnitId?: Record<string, number>;
    bathsByUnitId?: Record<string, number>;
    /** Per-unit ADU type overrides (detached/attached/garage) from Step 1. */
    aduTypeByUnitId?: Record<string, AduType>;
    /** Proposal-level default ADU type — used when a unit has no override. */
    aduType?: AduType | "";
}

/**
 * Build the "Switch to <other unit>" exclusion bullets that show the price
 * delta versus every other compared unit. Sales reps use these as on-the-fly
 * concessions: "If you change your mind to the 350, you save $25k."
 */
function buildUnitSwitchBullets(
    activeAduId: string | null,
    comparedUnitIds: string[],
    schedulesByAduId: Record<string, ProposalPaymentSchedule>,
    floorplans: Floorplan[],
    aduTypeByUnitId: Record<string, AduType> | undefined,
    globalAduType: AduType | "" | undefined,
): string[] {
    if (!activeAduId) return [];
    const activeTotal = schedulesByAduId[activeAduId]?.totalPrice;
    if (activeTotal == null) return [];

    const bullets: string[] = [];
    for (const id of comparedUnitIds) {
        if (id === activeAduId) continue;
        const other = schedulesByAduId[id];
        if (!other || other.totalPrice == null) continue;
        const fp = floorplans.find((f) => f._id === id);
        if (!fp) continue;
        const delta = activeTotal - other.totalPrice;
        let phrase: string;
        if (delta > 0) phrase = `Savings of ${fmtMoney(delta)}`;
        else if (delta < 0) phrase = `Additional cost of ${fmtMoney(Math.abs(delta))}`;
        else phrase = `Same total cost`;
        // Prefix the unit's ADU type so each bullet reads e.g.
        // "Switch to detached Estate 750 (750 sqft): Savings of $25,000".
        const typeLabel = aduTypeInline(resolveAduType(id, aduTypeByUnitId, globalAduType));
        const sqftLabel = fp.sqft ? ` (${fp.sqft.toLocaleString()} sqft)` : "";
        bullets.push(`Switch to ${typeLabel} ${fp.name}${sqftLabel}: ${phrase}`);
    }
    return bullets;
}

export interface AgreementTemplateData {
    // Customer & site
    customerName: string;
    customerLastName: string;
    propertyAddress: string;
    city: string;
    state: string;
    zip: string;

    // Today / contract
    today: string;            // e.g. "May 20, 2026"
    todayShort: string;       // e.g. "5/20/2026"
    contractDate: string;     // alias of today — kept for template authoring convenience

    // Today (extra forms for legal language like "this 20th day of May 2026")
    todayDay: string;         // "20th"
    todayMonthYear: string;   // "May 2026"

    // ADU
    /** Floorplan _id of the unit driving this agreement. Echoed so the
     *  preview client can highlight it in its switcher dropdown. */
    selectedAduId: string | null;
    aduName: string;
    /** ADU type of the contracted unit. `aduType` = title case ("Detached ADU",
     *  "Attached ADU", "Garage Conversion"); `aduTypeInline` = lowercase for
     *  mid-sentence use ("detached", "attached", "garage conversion").
     *  `aduNameWithType` = ready-to-drop phrase e.g. "detached Estate 750". */
    aduType: string;
    aduTypeInline: string;
    aduNameWithType: string;
    aduSqft: string;          // already formatted: "850 sqft"
    aduSqftNumber: number;
    aduBeds: number;
    aduBaths: number;
    contractTotal: string;    // "$235,000"
    contractTotalNumber: number;

    // Tables — docxtemplater loops on these with {#paymentSchedule}…{/paymentSchedule}
    paymentSchedule: AgreementMilestone[];
    siteWork: AgreementLineItem[];
    discounts: AgreementLineItem[];
    exclusions: { item: string }[];

    // Convenience totals
    siteWorkTotal: string;
    discountTotal: string;
}

export interface AgreementMilestone {
    index: number;          // 1-based row number
    label: string;
    trigger: string;
    amount: string;         // "$32,500"
    amountNumber: number;
}

export interface AgreementLineItem {
    label: string;
    amount: string;
    amountNumber: number;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function fmtMoney(n: number): string {
    if (!Number.isFinite(n)) return "—";
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
    }).format(n);
}

function fmtLongDate(d: Date): string {
    return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function fmtShortDate(d: Date): string {
    return d.toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "numeric" });
}

function ordinalDay(d: Date): string {
    const n = d.getDate();
    const v = n % 100;
    const suffix =
        v >= 11 && v <= 13 ? "th" :
        n % 10 === 1 ? "st" :
        n % 10 === 2 ? "nd" :
        n % 10 === 3 ? "rd" : "th";
    return `${n}${suffix}`;
}

function fmtMonthYear(d: Date): string {
    return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function lastName(full: string): string {
    const parts = full.trim().split(/\s+/);
    return parts[parts.length - 1] ?? "";
}

/**
 * Parse a single-line "123 Main St, Upland, CA 91786" address into parts.
 * Returns blanks when parts can't be confidently detected.
 */
function splitAddress(addr: string): { street: string; city: string; state: string; zip: string } {
    const parts = addr.split(",").map((p) => p.trim());
    const street = parts[0] ?? "";
    const city = parts[1] ?? "";
    const tail = (parts[2] ?? "").trim();
    // Tail is usually "CA 91786" — split on whitespace.
    const tailParts = tail.split(/\s+/);
    const state = tailParts[0] ?? "";
    const zip = tailParts.slice(1).join(" ") || "";
    return { street, city, state, zip };
}

function normalizeExclusions(exc: string[] | string | undefined): string[] {
    if (!exc) return [];
    if (Array.isArray(exc)) return exc.filter((s) => s && s.trim().length > 0);
    return exc
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
}

// ── Main builder ────────────────────────────────────────────────────────────

export function buildAgreementData(input: AgreementBuildInput): AgreementTemplateData {
    const today = new Date();

    // Address parts
    const { city, state, zip } = splitAddress(input.propertyAddress);

    // ADU — chosen by `selectedAduId` (the unit currently driving the
    // agreement). Falls back to the first compared unit that has a schedule
    // so the doc renders even if the rep hasn't explicitly picked yet.
    const schedules = input.proposalPaymentSchedulesByAduId ?? {};
    const comparedUnitIds = input.comparedUnitIds ?? [];
    const requested = input.selectedAduId;
    const aduId: string | null =
        (requested && schedules[requested]) ? requested :
        comparedUnitIds.find((id) => schedules[id]) ??
        Object.keys(schedules)[0] ?? null;
    const sched = aduId ? schedules[aduId] ?? null : null;
    const adu = aduId ? input.floorplans.find((fp) => fp._id === aduId) ?? null : null;
    const aduSqftNumber = adu?.sqft ?? 0;
    const contractTotalNumber = sched?.totalPrice ?? 0;

    // Payment schedule rows
    const paymentSchedule: AgreementMilestone[] = (sched?.entries ?? []).map((e, i) => ({
        index: i + 1,
        label: e.label,
        trigger: e.trigger,
        amount: fmtMoney(e.amount),
        amountNumber: e.amount,
    }));

    // Site work + discounts — pull the entries that match the contracted ADU.
    // Fall back to the first available unit if no aduId, so the template still
    // gets something to show during preview/testing.
    const siteWorkUnitId =
        (aduId && input.siteWorkByUnitId[aduId]) ? aduId : Object.keys(input.siteWorkByUnitId)[0] ?? "";
    const discountUnitId =
        (aduId && input.discountLinesByUnitId[aduId]) ? aduId : Object.keys(input.discountLinesByUnitId)[0] ?? "";

    const siteWorkItems = input.siteWorkByUnitId[siteWorkUnitId] ?? [];
    const discountItems = input.discountLinesByUnitId[discountUnitId] ?? [];

    const siteWork: AgreementLineItem[] = siteWorkItems.map((it) => ({
        label: it.label,
        amount: fmtMoney(it.total),
        amountNumber: it.total,
    }));

    const discounts: AgreementLineItem[] = discountItems.map((it) => ({
        label: it.label,
        amount: fmtMoney(it.amount),
        amountNumber: it.amount,
    }));

    const siteWorkTotalN = siteWork.reduce((a, b) => a + b.amountNumber, 0);
    const discountTotalN = discounts.reduce((a, b) => a + b.amountNumber, 0);

    // Auto "Switch to <other unit>" bullets — one per *other* compared unit
    // with a schedule. Prepended to the user's manual exclusions so they
    // always appear at the top of the exclusions list and stay in sync with
    // whichever unit is currently driving the agreement.
    const switchBullets = buildUnitSwitchBullets(
        aduId, comparedUnitIds, schedules, input.floorplans,
        input.aduTypeByUnitId, input.aduType,
    );

    // Resolve the contracted unit's ADU type for the sentence placeholders.
    const activeType: AduType = aduId
        ? resolveAduType(aduId, input.aduTypeByUnitId, input.aduType)
        : (input.aduType === "attached" || input.aduType === "garage" ? input.aduType : "detached");
    const activeTypeInline = aduTypeInline(activeType);
    const aduNameValue = adu?.name ?? "—";
    const aduNameWithType = adu ? `${activeTypeInline} ${aduNameValue}` : aduNameValue;
    const manualExclusions = normalizeExclusions(input.exclusions);
    const exclusions = [...switchBullets, ...manualExclusions].map((s) => ({ item: s }));

    return {
        customerName: input.customerName,
        customerLastName: lastName(input.customerName),
        propertyAddress: input.propertyAddress,
        city,
        state,
        zip,

        today: fmtLongDate(today),
        todayShort: fmtShortDate(today),
        contractDate: fmtLongDate(today),
        todayDay: ordinalDay(today),
        todayMonthYear: fmtMonthYear(today),

        selectedAduId: aduId,
        aduName: aduNameValue,
        aduType: aduTypeLabel(activeType),
        aduTypeInline: activeTypeInline,
        aduNameWithType,
        aduSqft: aduSqftNumber ? `${aduSqftNumber.toLocaleString()} sqft` : "—",
        aduSqftNumber,
        aduBeds: resolveBeds(adu, input.bedsByUnitId),
        aduBaths: resolveBaths(adu, input.bathsByUnitId),
        contractTotal: fmtMoney(contractTotalNumber),
        contractTotalNumber,

        paymentSchedule,
        siteWork,
        discounts,
        exclusions,

        siteWorkTotal: fmtMoney(siteWorkTotalN),
        discountTotal: fmtMoney(discountTotalN),
    };
}
