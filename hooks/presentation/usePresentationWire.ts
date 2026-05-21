"use client";

import { useEffect } from "react";
import { usePresentationStore, type CustomerMotivation } from "@/lib/store/presentationStore";
import { broadcastAdminState } from "@/lib/sync/presentationSync";
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
import type { FeaturedRental, ProjectTimeline } from "@/lib/store/presentationStore";
import type { ProposalPaymentSchedule } from "@/lib/investment/proposalPaymentSchedule";

interface WireInput {
    customerName: string;
    propertyAddress: string;
    aduType: "detached" | "attached" | "garage" | "";
    propertyPhotoUrl: string | null;
    customerMotivation: CustomerMotivation;
    comparedUnitIds: string[];
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
}: WireInput) {
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
        // Read discount lines from localStorage so discountLines in each scenario is always current,
        // regardless of whether DiscountsPanel is currently mounted or the React state chain has resolved.
        let lsDiscountLinesByUnitId: Record<string, { label: string; amount: number }[]> = {};
        try {
            const dpMaster: DiscountState = JSON.parse(localStorage.getItem("dp_master") ?? "null") ?? createEmptyDiscountState();
            const dpCustom: Record<string, DiscountState | null> = JSON.parse(localStorage.getItem("dp_custom") ?? "null") ?? {};
            for (const unitId of comparedUnitIds) {
                const effective = dpCustom[unitId] ?? dpMaster;
                lsDiscountLinesByUnitId[unitId] = getDiscountLines(effective, resolvedPresets);
            }
        } catch { /* malformed localStorage */ }

        // Strip the debug field — it contains React.ReactNode which is not structured-clone-safe
        // (BroadcastChannel.postMessage uses structured clone and throws DataCloneError on Symbol keys)
        const serializableScenarios = scenarios.map(({ debug: _debug, ...rest }) => {
            const sc = rest as typeof scenarios[0];
            if (sc.kind === "adu") {
                const unitId = sc.key.replace(/^adu_/, "");
                return { ...sc, discountLines: lsDiscountLinesByUnitId[unitId] ?? sc.discountLines ?? [] };
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

        // Read discount lines directly from localStorage (same keys DiscountsPanel uses)
        // so the data is always current regardless of which step is active/mounted.
        const discountLinesByUnitId: Record<string, { label: string; amount: number }[]> = {};
        try {
            const dpMaster: DiscountState = JSON.parse(localStorage.getItem("dp_master") ?? "null") ?? createEmptyDiscountState();
            const dpCustom: Record<string, DiscountState | null> = JSON.parse(localStorage.getItem("dp_custom") ?? "null") ?? {};
            for (const unitId of comparedUnitIds) {
                const effective = dpCustom[unitId] ?? dpMaster;
                discountLinesByUnitId[unitId] = getDiscountLines(effective, resolvedPresets);
            }
        } catch { /* malformed localStorage — leave empty */ }

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
        };

        // Sync local store (same-tab presenter state)
        usePresentationStore.getState().syncFromAdmin(data);

        // Directly broadcast to presenter window — bypasses the fragile Zustand
        // subscription chain which breaks under React StrictMode's double-invoke
        broadcastAdminState(data);
    }, [customerName, propertyAddress, aduType, propertyPhotoUrl, customerMotivation, comparedUnitIds, floorplans, featuredPropertyIds, featuredStoryIds, featuredRentals, slideOrder, projectTimeline, proposalPaymentSchedule, proposalPaymentSchedulesByAduId, scenarios, rentalComps, rentByUnitId, activeSnapshotByAduId, discountLinesByAduId, discountsCatalog]);
}

export type PresenterVariant = "original" | "v2";

export function openPresenterWindow(variant: PresenterVariant = "original") {
    const path = variant === "v2" ? "/present-v2" : "/present";
    const name = variant === "v2" ? "be_presenter_v2" : "be_presenter";
    window.open(path, name, "noopener");
}
