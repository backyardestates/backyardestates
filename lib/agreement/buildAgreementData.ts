// Pure data-shaping function: takes the admin's in-memory proposal state and
// returns the flat object that docxtemplater fills into the agreement template.
//
// The shape returned here is the contract between the admin tool and whoever
// authors the .docx template. To add a new placeholder, add a field here and
// a corresponding {tag} in the template — no other code needs to change.

import type { Floorplan } from "@/lib/rentcast/types";
import type { ProposalPaymentSchedule } from "@/lib/investment/proposalPaymentSchedule";
import type { SiteWorkLineItem, DiscountLineItem } from "@/lib/store/presentationStore";

export interface AgreementBuildInput {
    customerName: string;
    propertyAddress: string;
    proposalPaymentSchedule: ProposalPaymentSchedule | null;
    floorplans: Floorplan[];
    /** Site-work line items keyed by ADU id. Pass the merged set or the one
     *  for the proposed unit; only the entries we need will be used. */
    siteWorkByUnitId: Record<string, SiteWorkLineItem[]>;
    discountLinesByUnitId: Record<string, DiscountLineItem[]>;
    /** Free-text exclusions — one per line, or a pre-split array. */
    exclusions?: string[] | string;
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
    aduName: string;
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

    // ADU — derived from the proposal payment schedule (which encodes which
    // floorplan the admin actually contracted on).
    const sched = input.proposalPaymentSchedule;
    const aduId = sched?.aduId ?? null;
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

    const exclusions = normalizeExclusions(input.exclusions).map((s) => ({ item: s }));

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

        aduName: adu?.name ?? "—",
        aduSqft: aduSqftNumber ? `${aduSqftNumber.toLocaleString()} sqft` : "—",
        aduSqftNumber,
        aduBeds: adu?.beds ?? 0,
        aduBaths: adu?.baths ?? 0,
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
