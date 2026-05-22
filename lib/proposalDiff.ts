import type { ProposalSnapshot } from "@/lib/proposalSnapshot";

export type DiffSection = {
    label: string;
    /** Each entry is a human-readable line. */
    changes: string[];
};

/**
 * Compute a high-level diff between two ProposalSnapshots — the kind of thing
 * a rep would want to scan to understand "what's different between my draft
 * and the canonical?". Not a generic JSON diff; instead, walks the known
 * user-editable sections and reports meaningful changes.
 *
 * Returns an empty array when the snapshots are equivalent on the fields the
 * UI cares about.
 */
export function diffSnapshots(
    a: ProposalSnapshot | null,
    b: ProposalSnapshot | null,
    labels: { a: string; b: string } = { a: "Draft", b: "Canonical" },
): DiffSection[] {
    if (!a && !b) return [];
    if (!a) return [{ label: "Snapshot", changes: [`${labels.a} doesn't exist yet`] }];
    if (!b) return [{ label: "Snapshot", changes: [`${labels.b} doesn't exist yet`] }];

    const sections: DiffSection[] = [];

    // Customer info
    const customer: string[] = [];
    if (a.customerName !== b.customerName) {
        customer.push(`Name: ${labels.a} "${a.customerName || "—"}" → ${labels.b} "${b.customerName || "—"}"`);
    }
    if (a.address !== b.address) {
        customer.push(`Address: ${labels.a} "${a.address || "—"}" → ${labels.b} "${b.address || "—"}"`);
    }
    if (a.owed !== b.owed) {
        customer.push(`Mortgage owed: ${labels.a} "${a.owed || "—"}" → ${labels.b} "${b.owed || "—"}"`);
    }
    if (a.customerMotivation !== b.customerMotivation) {
        customer.push(`Motivation: ${labels.a} "${a.customerMotivation || "—"}" → ${labels.b} "${b.customerMotivation || "—"}"`);
    }
    if (a.aduType !== b.aduType) {
        customer.push(`ADU type: ${labels.a} "${a.aduType || "—"}" → ${labels.b} "${b.aduType || "—"}"`);
    }
    if (customer.length > 0) sections.push({ label: "Customer & property", changes: customer });

    // ADUs compared
    const aIds = new Set(a.aduCompareIds ?? []);
    const bIds = new Set(b.aduCompareIds ?? []);
    const added = [...aIds].filter((id) => !bIds.has(id));
    const removed = [...bIds].filter((id) => !aIds.has(id));
    if (added.length || removed.length) {
        const lines: string[] = [];
        if (added.length) lines.push(`${labels.a} has ${added.length} unit${added.length === 1 ? "" : "s"} ${labels.b} doesn't (${added.join(", ")})`);
        if (removed.length) lines.push(`${labels.b} has ${removed.length} unit${removed.length === 1 ? "" : "s"} ${labels.a} doesn't (${removed.join(", ")})`);
        sections.push({ label: "Selected units", changes: lines });
    }

    // Site work — per-unit summary
    const siteUnitIds = new Set<string>([
        ...Object.keys(a.estimatorByAduId ?? {}),
        ...Object.keys(b.estimatorByAduId ?? {}),
    ]);
    const siteChanges: string[] = [];
    for (const unitId of siteUnitIds) {
        const ea = a.estimatorByAduId?.[unitId];
        const eb = b.estimatorByAduId?.[unitId];
        const qtysA = ea?.quantities ?? {};
        const qtysB = eb?.quantities ?? {};
        const itemIds = new Set([...Object.keys(qtysA), ...Object.keys(qtysB)]);
        let changed = 0;
        for (const id of itemIds) {
            if ((qtysA[id] ?? 0) !== (qtysB[id] ?? 0)) changed++;
        }
        const customA = (ea?.customItems ?? []).length;
        const customB = (eb?.customItems ?? []).length;
        if (changed > 0 || customA !== customB) {
            const customNote = customA !== customB ? `, custom items: ${labels.a}=${customA} / ${labels.b}=${customB}` : "";
            siteChanges.push(`Unit ${unitId.slice(0, 8)}…: ${changed} item${changed === 1 ? "" : "s"} differ${customNote}`);
        }
    }
    if (siteChanges.length) sections.push({ label: "Site work", changes: siteChanges });

    // Discount amounts per unit
    const discountUnitIds = new Set<string>([
        ...Object.keys(a.discountAmountByAduId ?? {}),
        ...Object.keys(b.discountAmountByAduId ?? {}),
    ]);
    const discountChanges: string[] = [];
    for (const unitId of discountUnitIds) {
        const da = a.discountAmountByAduId?.[unitId] ?? 0;
        const db = b.discountAmountByAduId?.[unitId] ?? 0;
        if (da !== db) {
            discountChanges.push(`Unit ${unitId.slice(0, 8)}…: ${labels.a} $${da.toLocaleString()} → ${labels.b} $${db.toLocaleString()}`);
        }
    }
    if (discountChanges.length) sections.push({ label: "Discounts", changes: discountChanges });

    // Slide curation (only count differences)
    if ((a.featuredPropertyIds?.length ?? 0) !== (b.featuredPropertyIds?.length ?? 0)
        || (a.featuredStoryIds?.length ?? 0) !== (b.featuredStoryIds?.length ?? 0)
        || (a.featuredRentals?.length ?? 0) !== (b.featuredRentals?.length ?? 0)) {
        sections.push({
            label: "Featured slide curation",
            changes: [
                `Properties: ${a.featuredPropertyIds?.length ?? 0} vs ${b.featuredPropertyIds?.length ?? 0}`,
                `Stories: ${a.featuredStoryIds?.length ?? 0} vs ${b.featuredStoryIds?.length ?? 0}`,
                `Featured rentals: ${a.featuredRentals?.length ?? 0} vs ${b.featuredRentals?.length ?? 0}`,
            ],
        });
    }

    // Slide order
    if (JSON.stringify(a.slideOrder ?? []) !== JSON.stringify(b.slideOrder ?? [])) {
        sections.push({
            label: "Slide order",
            changes: [`Order differs (${(a.slideOrder ?? []).length} vs ${(b.slideOrder ?? []).length} entries)`],
        });
    }

    // Project timeline
    if (JSON.stringify(a.projectTimeline ?? null) !== JSON.stringify(b.projectTimeline ?? null)) {
        sections.push({
            label: "Project timeline",
            changes: ["Timeline values differ — open Step 11 to compare"],
        });
    }

    // Payment schedule
    const aSched = a.proposalPaymentSchedulesByAduId ?? (a.proposalPaymentSchedule ? { _legacy: a.proposalPaymentSchedule } : {});
    const bSched = b.proposalPaymentSchedulesByAduId ?? (b.proposalPaymentSchedule ? { _legacy: b.proposalPaymentSchedule } : {});
    if (JSON.stringify(aSched) !== JSON.stringify(bSched)) {
        sections.push({
            label: "Payment schedule",
            changes: ["Schedule values differ — open Step 12 to compare"],
        });
    }

    return sections;
}
