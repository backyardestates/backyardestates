"use client";

import { useEffect } from "react";
import { usePresentationStore, type CustomerMotivation } from "@/lib/store/presentationStore";
import { broadcastAdminState } from "@/lib/sync/presentationSync";
import { calculatePaymentSchedule } from "@/lib/investment/paymentSchedule";
import type { Scenario } from "@/lib/investment/types";
import type { RentalListing } from "@/lib/rentcast/types";
import type { ActiveLineItem } from "@/lib/investment/siteWorkItems";
import { computeDiscountTotal, createEmptyDiscountState, getDiscountLines, type DiscountState } from "@/lib/investment/discounts";

interface WireInput {
    customerName: string;
    propertyAddress: string;
    aduType: "detached" | "attached" | "garage" | "";
    propertyPhotoUrl: string | null;
    customerMotivation: CustomerMotivation;
    comparedUnitIds: string[];
    scenarios: Scenario[];
    rentalComps: RentalListing[];
    rentByUnitId: Record<string, string>;
    activeSnapshotByAduId?: Record<string, ActiveLineItem[]>;
    discountLinesByAduId?: Record<string, { label: string; amount: number }[]>;
}

export function usePresentationWire({
    customerName,
    propertyAddress,
    aduType,
    propertyPhotoUrl,
    customerMotivation,
    comparedUnitIds,
    scenarios,
    rentalComps,
    rentByUnitId,
    activeSnapshotByAduId,
    discountLinesByAduId,
}: WireInput) {
    useEffect(() => {
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
                lsDiscountLinesByUnitId[unitId] = getDiscountLines(effective);
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
                discountLinesByUnitId[unitId] = getDiscountLines(effective);
            }
        } catch { /* malformed localStorage — leave empty */ }

        const data = {
            customerName,
            propertyAddress,
            aduType,
            propertyPhotoUrl,
            customerMotivation,
            comparedUnitIds,
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
    }, [customerName, propertyAddress, aduType, propertyPhotoUrl, customerMotivation, comparedUnitIds, scenarios, rentalComps, rentByUnitId, activeSnapshotByAduId]);
}

export function openPresenterWindow() {
    window.open("/present", "be_presenter", "noopener");
}
