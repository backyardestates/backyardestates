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
            />

            <FinancingTable
                owed={owed}
                propertyValue={
                    avm?.price ??
                    avm?.priceRangeHigh ??
                    avm?.priceRangeLow ??
                    property?.lastSalePrice ??
                    0
                }
                floorplans={floorplans}
                selectedFloorplanId={selectedFloorplan?._id ?? null}
                termYears={30}
                currentFirstPmtMonthly={Number(currentFirstPmtMonthly) || 0}
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
