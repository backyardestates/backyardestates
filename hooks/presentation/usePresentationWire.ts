"use client";

import { useEffect } from "react";
import { usePresentationStore, type CustomerMotivation } from "@/lib/store/presentationStore";
import { broadcastAdminState, startAdminResponder } from "@/lib/sync/presentationSync";
import { getCompanionScope, scopedCompanionKey } from "@/lib/admin/companionKeys";
import { calculatePaymentSchedule } from "@/lib/investment/paymentSchedule";
import type { Scenario } from "@/lib/investment/types";
import type { Floorplan, RentalListing } from "@/lib/rentcast/types";
import type { SanityFloorplan } from "@/lib/store/presentationStore";
import type { ActiveLineItem } from "@/lib/investment/siteWorkItems";
import {
    computeDiscountTotal,
    createEmptyDiscountState,
    getDiscountLines,
    catalogToPresets,
    PRESETS,
    type DiscountState,
    type PresetLike,
    type DiscountsCatalogSummary,
} from "@/lib/investment/discounts";
import type { FeaturedRental, ProjectTimeline, ExclusionItem } from "@/lib/store/presentationStore";
import type { ProposalPaymentSchedule } from "@/lib/investment/proposalPaymentSchedule";

interface WireInput {
    customerName: string;
    propertyAddress: string;
    aduType: "detached" | "attached" | "garage" | "";
    propertyPhotoUrl: string | null;
    customerMotivation: CustomerMotivation;
    comparedUnitIds: string[];
    // Per-unit overrides for ADU type / beds / baths. Empty = use floorplan defaults.
    aduTypeByUnitId: Record<string, "detached" | "attached" | "garage">;
    bedsByUnitId: Record<string, number>;
    bathsByUnitId: Record<string, number>;
    // Optional custom tag per unit (e.g. "Hillside") shown after the name on slides.
    labelByUnitId?: Record<string, string>;
    // Full admin floorplan list (Sanity + admin-added custom units). The wire
    // filters out the custom ones and broadcasts them so the presenter can
    // merge them into its floorplans state.
    floorplans: Floorplan[];
    featuredPropertyIds: string[];
    featuredStoryIds: string[];
    featuredRentals: FeaturedRental[];
    slideOrder: number[];
    projectTimeline: ProjectTimeline | null;
    proposalPaymentSchedule: ProposalPaymentSchedule | null;
    proposalPaymentSchedulesByAduId: Record<string, ProposalPaymentSchedule>;
    scenarios: Scenario[];
    rentalComps: RentalListing[];
    rentByUnitId: Record<string, string>;
    activeSnapshotByAduId?: Record<string, ActiveLineItem[]>;
    discountLinesByAduId?: Record<string, { label: string; amount: number }[]>;
    discountsCatalog?: DiscountsCatalogSummary;
    /** Proposal-wide exclusions (name + price + note) — drives the comparison
     *  slide's "Not included" block and the agreement bullets. */
    exclusions?: ExclusionItem[];
}

// Convert an admin-shape Floorplan into the SanityFloorplan shape the presenter
// uses. Optional Sanity-only fields (slug, images, videoID, etc.) are
// synthesized or left undefined.
//
// For custom units: if the admin provided an imageUrl, use it. Otherwise look
// up the nearest-sqft Sanity floorplan that has imagery and inherit its image
// so the slide doesn't render a blank placeholder.
function adminFpToSanityFp(fp: Floorplan, allFloorplans: Floorplan[]): SanityFloorplan {
    const isCustom = fp._id.startsWith("custom_");

    let imageUrl: string | undefined = fp.imageUrl;
    if (!imageUrl && isCustom) {
        imageUrl = nearestSanityImage(fp.sqft, allFloorplans);
    }

    return {
        _id: fp._id,
        name: fp.name,
        slug: { current: fp._id },
        sqft: fp.sqft,
        bed: fp.beds,
        bath: fp.baths,
        price: fp.price,
        floorPlanUrl: imageUrl,
        images: imageUrl ? [imageUrl] : undefined,
    };
}

/**
 * Find the floorPlanUrl of the non-custom Sanity floorplan whose sqft is
 * closest to the target. Returns undefined when there are no usable candidates.
 *
 * Note: the admin tool already projects Sanity floorplans into the admin
 * `Floorplan` shape, so we read from `allFloorplans` here (not the original
 * SanityFloorplan list). The Sanity `floorPlanUrl` should already be carried
 * across — when it isn't, this returns undefined and the slide renders blank.
 */
function nearestSanityImage(
    targetSqft: number,
    allFloorplans: Floorplan[]
): string | undefined {
    const candidates = allFloorplans.filter(
        (f) =>
            !f._id.startsWith("custom_") &&
            // Be defensive — only consider floorplans that actually have an image
            (("floorPlanUrl" in f && (f as any).floorPlanUrl) || f.imageUrl)
    );
    if (candidates.length === 0) return undefined;

    let best = candidates[0];
    let bestDiff = Math.abs((best.sqft ?? 0) - targetSqft);
    for (const c of candidates.slice(1)) {
        const diff = Math.abs((c.sqft ?? 0) - targetSqft);
        if (diff < bestDiff) {
            best = c;
            bestDiff = diff;
        }
    }
    return (best as any).floorPlanUrl ?? best.imageUrl;
}

export function usePresentationWire({
    customerName,
    propertyAddress,
    aduType,
    propertyPhotoUrl,
    customerMotivation,
    comparedUnitIds,
    aduTypeByUnitId,
    bedsByUnitId,
    bathsByUnitId,
    labelByUnitId,
    floorplans,
    featuredPropertyIds,
    featuredStoryIds,
    featuredRentals,
    slideOrder,
    projectTimeline,
    proposalPaymentSchedule,
    proposalPaymentSchedulesByAduId,
    scenarios,
    rentalComps,
    rentByUnitId,
    activeSnapshotByAduId,
    discountLinesByAduId,
    discountsCatalog,
    exclusions,
}: WireInput) {
    // Answer "I just connected" requests from presenter / export windows by
    // replaying the latest payload, so they render immediately on open instead
    // of waiting for the next edit-triggered broadcast.
    useEffect(() => startAdminResponder(), []);

    useEffect(() => {
        // Resolve presets from the DB catalog when available; otherwise fall
        // back to the legacy hardcoded PRESETS so totals stay correct even
        // when the catalog hasn't loaded.
        const resolvedPresets: PresetLike[] =
            discountsCatalog && discountsCatalog.items.length > 0
                ? (catalogToPresets(discountsCatalog.items).length > 0
                    ? catalogToPresets(discountsCatalog.items)
                    : PRESETS)
                : PRESETS;
        const rentNums: Record<string, number> = {};
        for (const [id, raw] of Object.entries(rentByUnitId)) {
            const n = parseFloat(raw);
            if (!isNaN(n) && n > 0) rentNums[id] = n;
        }

        const paymentSchedules: Record<string, ReturnType<typeof calculatePaymentSchedule>> = {};

        // Discount lines come straight from React state — the same source the
        // totals and scenarios use — so a discount edit (including the auto solar
        // discount, which lives outside the dp_master/dp_custom keys) broadcasts
        // live, exactly like site work's activeSnapshotByAduId. Fall back to
        // localStorage only when the prop is empty (e.g. a presenter window that
        // opened before the panel ever computed).
        // Per-unit discount line items. Prefer the live React-state lines (so an
        // edit — including the auto solar discount, which lives outside the
        // dp_master/dp_custom keys — broadcasts immediately), and fall back to
        // localStorage per unit only when the prop has nothing for that unit.
        const propDiscountLines = discountLinesByAduId ?? {};
        let lsMaster: DiscountState | null = null;
        let lsCustom: Record<string, DiscountState | null> = {};
        try {
            lsMaster = JSON.parse(localStorage.getItem(scopedCompanionKey("dp_master")) ?? "null");
            lsCustom = JSON.parse(localStorage.getItem(scopedCompanionKey("dp_custom")) ?? "null") ?? {};
        } catch { /* malformed localStorage */ }
        const discountLinesByUnitId: Record<string, { label: string; amount: number }[]> = {};
        for (const unitId of comparedUnitIds) {
            const fromProp = propDiscountLines[unitId];
            if (fromProp && fromProp.length > 0) {
                discountLinesByUnitId[unitId] = fromProp;
            } else {
                const effective = lsCustom[unitId] ?? lsMaster ?? createEmptyDiscountState();
                discountLinesByUnitId[unitId] = getDiscountLines(effective, resolvedPresets);
            }
        }

        // Strip the debug field — it contains React.ReactNode which is not structured-clone-safe
        // (BroadcastChannel.postMessage uses structured clone and throws DataCloneError on Symbol keys).
        // Keep the scenario's own line items (built from React state, incl. solar)
        // when present; only fall back to the resolved per-unit lines when empty.
        const serializableScenarios = scenarios.map(({ debug: _debug, ...rest }) => {
            const sc = rest as typeof scenarios[0];
            if (sc.kind === "adu") {
                const unitId = sc.key.replace(/^adu_/, "");
                const lines =
                    sc.discountLines && sc.discountLines.length > 0
                        ? sc.discountLines
                        : discountLinesByUnitId[unitId] ?? [];
                return { ...sc, discountLines: lines };
            }
            return sc;
        });
        for (const sc of serializableScenarios) {
            if (sc.kind === "adu" && sc.purchasePrice) {
                paymentSchedules[sc.key] = calculatePaymentSchedule(sc.purchasePrice);
            }
        }

        // Derive site work data per unit
        const siteWorkTagsByUnitId: Record<string, string[]> = {};
        const siteWorkByUnitId: Record<string, { label: string; category: string; total: number }[]> = {};
        if (activeSnapshotByAduId) {
            for (const [unitId, items] of Object.entries(activeSnapshotByAduId)) {
                siteWorkTagsByUnitId[unitId] = items.map((item) => item.label);
                siteWorkByUnitId[unitId] = items.map((item) => ({
                    label: item.label,
                    category: item.catLabel,
                    total: item.customerTotal,
                }));
            }
        }

        // Pluck the admin-added custom units and convert to the presenter's
        // SanityFloorplan shape; the store merges these into its floorplans list.
        // Pass the full floorplan list so custom units can inherit the
        // nearest-sqft image when no override URL is set.
        const customFloorplans = floorplans
            .filter((fp) => fp._id.startsWith("custom_"))
            .map((fp) => adminFpToSanityFp(fp, floorplans));

        const data = {
            customerName,
            propertyAddress,
            aduType,
            propertyPhotoUrl,
            customerMotivation,
            comparedUnitIds,
            aduTypeByUnitId,
            bedsByUnitId,
            bathsByUnitId,
            labelByUnitId: labelByUnitId ?? {},
            customFloorplans,
            featuredPropertyIds,
            featuredStoryIds,
            featuredRentals,
            slideOrder,
            projectTimeline,
            proposalPaymentSchedule,
            proposalPaymentSchedulesByAduId,
            scenarios: serializableScenarios,
            rentalComps,
            rentByUnitId: rentNums,
            paymentSchedules,
            siteWorkTagsByUnitId,
            siteWorkByUnitId,
            discountLinesByUnitId,
            exclusions: exclusions ?? [],
        };

        // Sync local store (same-tab presenter state)
        usePresentationStore.getState().syncFromAdmin(data);

        // Directly broadcast to presenter window — bypasses the fragile Zustand
        // subscription chain which breaks under React StrictMode's double-invoke
        broadcastAdminState(data);
    }, [customerName, propertyAddress, aduType, propertyPhotoUrl, customerMotivation, comparedUnitIds, aduTypeByUnitId, bedsByUnitId, bathsByUnitId, labelByUnitId, floorplans, featuredPropertyIds, featuredStoryIds, featuredRentals, slideOrder, projectTimeline, proposalPaymentSchedule, proposalPaymentSchedulesByAduId, scenarios, rentalComps, rentByUnitId, activeSnapshotByAduId, discountLinesByAduId, discountsCatalog, exclusions]);
}

export type PresenterVariant = "original" | "v2";

export function openPresenterWindow(variant: PresenterVariant = "original") {
    const path = variant === "v2" ? "/present-v2" : "/present";
    const name = variant === "v2" ? "be_presenter_v2" : "be_presenter";
    // Carry this proposal's scope so the presenter reads the same per-proposal
    // companion keys + sync channel the admin tab writes to.
    const url = `${path}?scope=${encodeURIComponent(getCompanionScope())}`;
    window.open(url, name, "noopener");
}
