// lib/rentcast/useRentcastData.ts
"use client";

import { useState } from "react";
import type { PropertyRecord, AvmValue, RentalListing, Floorplan } from "@/lib/rentcast/types";

export type RentcastMarketStats = {
    id?: string;
    zipCode?: string;
    rentalData?: {
        lastUpdatedDate?: string;
        averageRent?: number;
        medianRent?: number;
        minRent?: number;
        maxRent?: number;
        averageRentPerSquareFoot?: number;
        medianRentPerSquareFoot?: number;
        minRentPerSquareFoot?: number;
        maxRentPerSquareFoot?: number;
        // ... (you can expand later)
        dataByBedrooms?: Array<{
            bedrooms: number;
            averageRent?: number;
            medianRent?: number;
            averageRentPerSquareFoot?: number;
            medianRentPerSquareFoot?: number;
        }>;
        history?: Record<
            string,
            {
                date?: string;
                averageRent?: number;
                medianRent?: number;
                averageRentPerSquareFoot?: number;
                medianRentPerSquareFoot?: number;
                totalListings?: number;
                newListings?: number;
            }
        >;
    };
};

export function useRentcastData() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [property, setProperty] = useState<PropertyRecord | null>(null);
    const [avm, setAvm] = useState<AvmValue | null>(null);
    const [rentals, setRentals] = useState<RentalListing[]>([]);
    const [market, setMarket] = useState<RentcastMarketStats | null>(null);

    async function getApiData(input: { address: string; selectedFloorplan: Floorplan | null }) {
        setLoading(true);
        setError(null);
        setProperty(null);
        setAvm(null);
        setRentals([]);
        setMarket(null);

        try {
            const a = input.address.trim();
            if (!a) throw new Error("Please enter an address.");
            if (!input.selectedFloorplan?.sqft) throw new Error("Please select a floorplan.");

            const propRes = await fetch(`/api/rentcast/properties?address=${encodeURIComponent(a)}`, { cache: "no-store" });
            const propJson = await propRes.json();
            if (!propRes.ok) throw new Error(propJson?.error ?? "Failed to fetch property record.");
            setProperty(propJson.record ?? null);

            const avmRes = await fetch(`/api/rentcast/avm?address=${encodeURIComponent(a)}`, { cache: "no-store" });
            const avmJson = await avmRes.json();
            if (!avmRes.ok) throw new Error(avmJson?.error ?? "Failed to fetch AVM.");
            setAvm(avmJson);

            const city = avmJson?.subjectProperty?.city ?? propJson?.record?.city;
            const state = avmJson?.subjectProperty?.state ?? propJson?.record?.state;
            const zipCode = avmJson?.subjectProperty?.zipCode ?? propJson?.record?.zipCode;

            if (!city || !state) throw new Error("Could not determine city/state from the property data.");

            // ✅ Get rentals (comps)
            const rentalsRes = await fetch(
                `/api/rentcast/rentals?city=${encodeURIComponent(city)}&state=${encodeURIComponent(state)}`,
                { cache: "no-store" }
            );
            const rentalsJson = await rentalsRes.json();
            if (!rentalsRes.ok) throw new Error(rentalsJson?.error ?? "Failed to fetch rentals.");
            setRentals(rentalsJson.listings ?? []);

            if (zipCode && /^\d{5}$/.test(zipCode)) {
                const mRes = await fetch(`/api/rentcast/markets?zipCode=${encodeURIComponent(zipCode)}&dataType=Rental&historyRange=12`, {
                    cache: "no-store",
                });
                const mJson = await mRes.json();
                if (mRes.ok) setMarket(mJson);
            }
        } catch (e: any) {
            setError(e?.message ?? "Something went wrong.");
        } finally {
            setLoading(false);
        }
    }

    return { loading, error, property, avm, rentals, market, getApiData };
}
