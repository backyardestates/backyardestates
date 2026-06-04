import type { ProposalSnapshot } from "@/lib/proposalSnapshot";
import { ProposalStatus, type Proposal } from "@prisma/client";

// Loose address parser — splits a free-text address like
// "123 Main St, San Diego, CA 92101" into structured fields.
// Falls back to empty strings on parse failures so the (currently required)
// columns are still satisfied.
function parseAddress(address: string): {
    addressLine1: string;
    city: string;
    state: string;
    zip: string;
} {
    if (!address) return { addressLine1: "", city: "", state: "", zip: "" };
    const parts = address.split(",").map((p) => p.trim()).filter(Boolean);
    const addressLine1 = parts[0] ?? "";
    const city = parts[1] ?? "";
    let state = "";
    let zip = "";
    if (parts[2]) {
        // "CA 92101" or "CA" or just a state name
        const m = parts[2].match(/^([A-Za-z]{2,})\s*(\d{5}(?:-\d{4})?)?$/);
        if (m) {
            state = m[1] ?? "";
            zip = m[2] ?? "";
        } else {
            state = parts[2];
        }
    }
    if (parts[3] && !zip) zip = parts[3];
    return { addressLine1, city, state, zip };
}

/**
 * Build the Proposal column payload from a ProposalSnapshot. The full
 * snapshot goes in `snapshotJson`; the structured columns are populated for
 * future query / list use (Phase 3+ will start using them).
 */
export function snapshotToProposalCreate(
    snapshot: ProposalSnapshot,
    ctx: {
        userId: string;
        organizationId: string;
        status?: ProposalStatus;
    }
) {
    const { addressLine1, city, state, zip } = parseAddress(snapshot.address ?? "");

    return {
        organizationId: ctx.organizationId,
        createdById: ctx.userId,
        status: ctx.status ?? ProposalStatus.REVIEWED,

        customerName: snapshot.customerName ?? "",
        customerEmail: snapshot.customerEmail?.trim() || null,
        addressLine1,
        city,
        state,
        zip,
        addressKey: snapshot.addressKey,

        // Pipedrive linkage — promoted to columns so future queries (e.g.
        // "find all proposals attached to this Pipedrive deal") don't need
        // to scan the snapshot JSON blob.
        pipedrivePersonId: snapshot.pipedrivePersonId ?? null,
        pipedriveDealId: snapshot.pipedriveDealId ?? null,

        snapshotVersion: snapshot.schemaVersion ?? 1,
        snapshotJson: snapshot as unknown as object,
    };
}

/** The subset of Proposal columns `proposalToSnapshot` actually reads. Routes
 *  should `select` exactly these so Postgres never ships the unrelated large
 *  blobs (presenterBroadcast, agreementInput, prefillJson) on read paths. */
export type ProposalSnapshotSource = Pick<
    Proposal,
    | "snapshotJson"
    | "addressKey"
    | "updatedAt"
    | "customerName"
    | "customerEmail"
    | "addressLine1"
    | "city"
    | "state"
    | "zip"
>;

export const PROPOSAL_SNAPSHOT_SELECT = {
    snapshotJson: true,
    addressKey: true,
    updatedAt: true,
    customerName: true,
    customerEmail: true,
    addressLine1: true,
    city: true,
    state: true,
    zip: true,
} as const;

/**
 * Pull a ProposalSnapshot back out of a Proposal row. We prefer
 * `snapshotJson` (the full source-of-truth blob), and only fall back to the
 * structured columns when the JSON is missing or malformed.
 */
export function proposalToSnapshot(row: ProposalSnapshotSource): ProposalSnapshot | null {
    const json = row.snapshotJson;
    if (json && typeof json === "object") {
        return json as unknown as ProposalSnapshot;
    }
    // Legacy fallback: proposals saved before snapshotJson was wired up have
    // structured columns but no JSON blob. Reconstruct a minimal snapshot so
    // the master tool at least pre-fills customer name + address; the rep
    // then re-enters their site work / discounts and clicks Save to backfill
    // the snapshotJson column on next save.
    if (!row.addressKey) return null;
    const fullAddress = [row.addressLine1, row.city, row.state, row.zip]
        .filter(Boolean)
        .join(", ");
    return {
        schemaVersion: 1 as ProposalSnapshot["schemaVersion"],
        savedAt: row.updatedAt.toISOString(),
        addressKey: row.addressKey,
        customerName: row.customerName ?? "",
        customerEmail: row.customerEmail ?? "",
        address: fullAddress,
        owed: "",
        propertyPhotoUrl: null,
        customerMotivation: null,
        aduType: "" as ProposalSnapshot["aduType"],
        floorplanId: "",
        currentFirstPmtMonthly: "",
        customFloorplans: [],
        aduCompareIds: [],
        defaults: undefined as unknown as ProposalSnapshot["defaults"],
        estimatorByAduId: {},
        rentByAduId: {},
        baseCostByAduId: {},
        sqftByAduId: {},
        discountAmountByAduId: {},
        discountLinesByAduId: {},
        rentcast: { property: null, avm: null, rentals: [], market: null },
        featuredPropertyIds: [],
        featuredStoryIds: [],
        featuredRentals: [],
        slideOrder: [],
        projectTimeline: null,
        proposalPaymentSchedule: null,
        proposalPaymentSchedulesByAduId: {},
        activeStep: 1,
        doneSteps: [],
        siteWorkConfirmed: false,
        companionStorage: {},
    } as ProposalSnapshot;
}
