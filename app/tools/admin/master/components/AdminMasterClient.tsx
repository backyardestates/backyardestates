// app/admin/AdminMasterClient.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import styles from "./AdminMasterClient.module.css";
import { AddressAutocomplete } from "./address/AddressAutocomplete";

import { AdminHeader } from "../components/AdminHeader/AdminHeader";
import { DealForm } from "../components/DealForm/DealForm";
import { ResultsSection } from "../components/ResultsSection/ResultsSection";

import { InvestmentSection } from "../components/Investment/InvestmentSection";

import type { Floorplan } from "@/lib/rentcast/types";
import { useRentcastData } from "@/hooks/rentcast/useRentcastData";

import { FinancingTable } from "../components/Financing/FinancingTable";


export default function AdminMasterClient({ initialFloorplans }: { initialFloorplans: Floorplan[] }) {
    const [address, setAddress] = useState("");
    const [owed, setOwed] = useState("");

    const [floorplans, setFloorplans] = useState<Floorplan[]>(initialFloorplans);
    const [floorplanId, setFloorplanId] = useState<string>(initialFloorplans?.[0]?._id ?? "");

    const [currentFirstPmtMonthly, setCurrentFirstPmtMonthly] = useState("");


    useEffect(() => {
        setFloorplans(initialFloorplans);
        setFloorplanId((prev) => prev || initialFloorplans?.[0]?._id || "");
    }, [initialFloorplans]);

    const selectedFloorplan = useMemo(
        () => floorplans.find((fp) => fp._id === floorplanId) ?? null,
        [floorplans, floorplanId]
    );


    const { loading, error, property, avm, rentals, getApiData } = useRentcastData();

    const cityState = useMemo(() => {
        const city = avm?.subjectProperty?.city ?? property?.city;
        const state = avm?.subjectProperty?.state ?? property?.state;
        return city && state ? `${city}, ${state}` : "—";
    }, [avm, property]);

    function pickCompareIdsWindow(input: {
        allFloorplans: Floorplan[];
        selected: Floorplan | null;
        max: number;
    }) {
        const { allFloorplans, selected, max } = input;
        if (!selected) return [];
        const k = Math.max(1, Math.min(max, allFloorplans.length));

        const sorted = [...allFloorplans].sort((a, b) => {
            const da = (a.sqft ?? 0) - (b.sqft ?? 0);
            if (da !== 0) return da;
            return (a.name ?? "").localeCompare(b.name ?? "");
        });

        const idx = sorted.findIndex((fp) => fp._id === selected._id);
        if (idx === -1) return sorted.slice(0, k).map((x) => x._id);

        let start = idx - Math.floor(k / 2);
        start = Math.max(0, Math.min(start, sorted.length - k));
        return sorted.slice(start, start + k).map((x) => x._id);
    }

    const maxAduComparisons = 3; // or store as state if you want it editable

    const [aduCompareIds, setAduCompareIds] = useState<string[]>(() => {
        const seed: string[] = [];
        if (selectedFloorplan?._id) seed.push(selectedFloorplan._id);

        const sortedByNearest =
            selectedFloorplan
                ? [...floorplans]
                    .filter((fp) => fp._id !== selectedFloorplan._id)
                    .sort(
                        (a, b) =>
                            Math.abs((a.sqft ?? 0) - (selectedFloorplan.sqft ?? 0)) -
                            Math.abs((b.sqft ?? 0) - (selectedFloorplan.sqft ?? 0))
                    )
                : [];

        for (const fp of sortedByNearest.slice(0, Math.max(0, maxAduComparisons - seed.length))) {
            seed.push(fp._id);
        }
        return seed.slice(0, maxAduComparisons);
    });

    const lastSelectedIdRef = React.useRef<string | null>(null);

    useEffect(() => {
        const selectedId = selectedFloorplan?._id ?? null;
        if (lastSelectedIdRef.current === selectedId) return;
        lastSelectedIdRef.current = selectedId;

        const nextIds = pickCompareIdsWindow({
            allFloorplans: floorplans,
            selected: selectedFloorplan,
            max: maxAduComparisons,
        });

        setAduCompareIds(nextIds);
    }, [selectedFloorplan?._id, floorplans, maxAduComparisons]);

    const selectedAdus = useMemo(() => {
        const map = new Map(floorplans.map((f) => [f._id, f]));
        return aduCompareIds.map((id) => map.get(id)).filter(Boolean) as Floorplan[];
    }, [aduCompareIds, floorplans]);

    return (
        <div className={styles.page}>
            <AdminHeader />

            <DealForm
                styles={styles}
                AddressAutocomplete={AddressAutocomplete}
                address={address}
                setAddress={setAddress}
                owed={owed}
                setOwed={setOwed}
                floorplans={floorplans}
                floorplanId={floorplanId}
                setFloorplanId={setFloorplanId}
                selectedFloorplan={selectedFloorplan}
                loading={loading}
                error={error}
                onSubmit={() => getApiData({ address, selectedFloorplan })}
                currentFirstPmtMonthly={currentFirstPmtMonthly}
                setCurrentFirstPmtMonthly={setCurrentFirstPmtMonthly}
            />

            <InvestmentSection
                property={property}
                avm={avm}
                rentals={rentals}
                owed={owed}
                selectedFloorplan={selectedFloorplan}
                allFloorplans={floorplans}

                aduCompareIds={aduCompareIds}
                setAduCompareIds={setAduCompareIds}
                maxAduComparisons={maxAduComparisons}
                currentFirstPmtMonthly={currentFirstPmtMonthly}
                setCurrentFirstPmtMonthly={setCurrentFirstPmtMonthly}
            />

            <ResultsSection
                styles={styles}
                address={address}
                owed={owed}
                selectedFloorplan={selectedFloorplan}
                property={property}
                avm={avm}
                rentals={rentals}
                cityState={cityState}
            />
        </div>
    );
}
