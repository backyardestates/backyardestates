import { prisma } from "@/lib/prisma";
import { LineItemKind, MarkupType, DiscountType } from "@prisma/client";
import {
    buildActiveSnapshot,
    catalogToSiteWorkCategories,
    SITE_WORK_CATEGORIES,
    type SiteWorkCategory,
    type SiteWorkCatalogData,
} from "@/lib/investment/siteWorkItems";
import type { ProposalSnapshot } from "@/lib/proposalSnapshot";
import { listCategoriesWithItems } from "@/lib/db/siteWork";

/**
 * Project the live DB site-work catalog into the runtime-shape used by
 * buildActiveSnapshot. Cached at module scope inside a per-call helper to
 * keep one materialize call from hitting the DB twice.
 */
async function loadSiteWorkCategoriesFromDb(): Promise<SiteWorkCategory[]> {
    const rows = await listCategoriesWithItems().catch(() => []);
    if (rows.length === 0) return SITE_WORK_CATEGORIES;
    const projected: SiteWorkCatalogData = {
        categories: rows.map((c) => ({
            id: c.id,
            slug: c.slug,
            label: c.label,
            sortOrder: c.sortOrder,
            active: c.active,
            items: c.items.map((it) => ({
                id: it.id,
                slug: it.slug,
                label: it.label,
                // unit is a String in the DB; the buildActiveSnapshot consumer
                // narrows on equality with "quote" so the wider type is safe.
                unit: it.unit as "flat" | "sqft" | "lft" | "quote",
                beCost: it.beCost,
                markup: it.markup,
                sortOrder: it.sortOrder,
                active: it.active,
            })),
        })),
    };
    return catalogToSiteWorkCategories(projected);
}

/**
 * Replace the materialized ProposalLineItem + ProposalDiscount rows for a
 * proposal with fresh ones derived from the snapshot. Idempotent — safe to
 * call on every save (we wipe + rebuild inside one transaction).
 *
 * Site-work line items expand each EstimatorState into per-row entries via
 * buildActiveSnapshot. Discount lines are written verbatim from the snapshot
 * (DiscountsPanel already resolves them against the live catalog before
 * persisting).
 *
 * Catalog reference: we don't FK to SiteWorkPreset because ProposalLineItem
 * still points at the legacy WorkItem table. The catalog item id is preserved
 * in `appliesTo.itemId` for downstream reconciliation.
 */
export async function materializeProposal(
    proposalId: string,
    snapshot: ProposalSnapshot,
    siteWorkCatalog?: SiteWorkCatalogData,
): Promise<{ lineItems: number; discounts: number }> {
    const categories: SiteWorkCategory[] = siteWorkCatalog && siteWorkCatalog.categories.length > 0
        ? catalogToSiteWorkCategories(siteWorkCatalog)
        : await loadSiteWorkCategoriesFromDb();

    // ── Site-work line items ─────────────────────────────────────────────────
    type LineRow = {
        proposalId: string;
        kind: LineItemKind;
        title: string;
        category: string | null;
        unitLabel: string | null;
        quantity: number;
        internalCost: number;
        markupType: MarkupType;
        markupValue: number;
        unitPrice: number;
        computedPrice: number;
        finalPrice: number;
        appliesTo: { aduId: string; catId: string; itemId: string };
    };
    const lineItems: LineRow[] = [];
    for (const [aduId, state] of Object.entries(snapshot.estimatorByAduId ?? {})) {
        const snap = buildActiveSnapshot(state, categories);
        for (const item of snap) {
            lineItems.push({
                proposalId,
                kind: item.isCustom ? LineItemKind.CUSTOM : LineItemKind.SITE_WORK,
                title: item.label,
                category: item.catLabel ?? null,
                unitLabel: item.unit ?? null,
                quantity: item.qty,
                internalCost: Math.round(item.beCost),
                // Our model is "be cost × markup multiplier"; the schema's
                // markupType doesn't have a direct match for a multiplier, so
                // record it as FIXED markupValue for forensics. Customer-facing
                // *price* fields are authoritative.
                markupType: MarkupType.FIXED,
                markupValue: item.markup,
                unitPrice: Math.round(item.unitPrice),
                computedPrice: Math.round(item.customerTotal),
                finalPrice: Math.round(item.customerTotal),
                appliesTo: { aduId, catId: item.catId, itemId: item.itemId },
            });
        }
    }

    // ── Discount rows ────────────────────────────────────────────────────────
    type DiscountRow = {
        proposalId: string;
        discountType: DiscountType;
        name: string;
        amountOff: number;
        appliesTo: { aduId: string };
    };
    const discounts: DiscountRow[] = [];
    for (const [aduId, lines] of Object.entries(snapshot.discountLinesByAduId ?? {})) {
        for (const line of lines) {
            if (!line || line.amount <= 0) continue;
            discounts.push({
                proposalId,
                discountType: DiscountType.FIXED,
                name: line.label,
                amountOff: Math.round(line.amount),
                appliesTo: { aduId },
            });
        }
    }

    // Wipe + rebuild in one transaction — keeps the materialized view
    // consistent with the snapshot at all times.
    await prisma.$transaction([
        prisma.proposalLineItem.deleteMany({ where: { proposalId } }),
        prisma.proposalDiscount.deleteMany({ where: { proposalId } }),
        ...(lineItems.length > 0
            ? [prisma.proposalLineItem.createMany({ data: lineItems })]
            : []),
        ...(discounts.length > 0
            ? [prisma.proposalDiscount.createMany({ data: discounts })]
            : []),
    ]);

    return { lineItems: lineItems.length, discounts: discounts.length };
}
