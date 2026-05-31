"use client";

import React, { useMemo } from "react";
import type { Floorplan, RentalListing } from "@/lib/rentcast/types";
import { unitNameParts } from "@/lib/units/displayName";
import s from "./RentHero.module.css";

function median(nums: number[]): number | undefined {
    if (!nums.length) return undefined;
    const sorted = [...nums].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function fmtMoney(n: number) {
    return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

/**
 * The hero of the Rental Market step — the monthly rent the rep assigns to each
 * Estate unit is the single value that drives the whole investment return, so it
 * gets the spotlight: a large editable amount, the annualized figure, and a
 * one-tap "use the market median" suggestion derived from the comps below.
 */
export function RentHero({
    units,
    rentByAduId,
    setRentByAduId,
    rentals,
    labelByUnitId,
}: {
    units: Floorplan[];
    rentByAduId: Record<string, string>;
    setRentByAduId: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    rentals?: RentalListing[];
    labelByUnitId?: Record<string, string>;
}) {
    const medianRent = useMemo(() => {
        const prices = (rentals ?? [])
            .map((r) => r.price)
            .filter((p): p is number => typeof p === "number" && p > 0);
        return median(prices);
    }, [rentals]);

    // Always present smallest → largest unit, left to right.
    const orderedUnits = useMemo(
        () => [...units].sort((a, b) => (a.sqft ?? 0) - (b.sqft ?? 0)),
        [units],
    );

    function setRent(id: string, value: string) {
        setRentByAduId((prev) => ({ ...prev, [id]: value }));
    }

    return (
        <section className={s.hero}>
            <header className={s.head}>
                <span className={s.eyebrow}>Rental income</span>
                <h3 className={s.title}>What will these ADUs rent for?</h3>
                <p className={s.sub}>
                    Fully editable. This monthly rent drives the entire investment return your client sees.
                </p>
            </header>

            <div className={s.grid}>
                {orderedUnits.map((fp, i) => {
                    const raw = rentByAduId[fp._id] ?? "";
                    const rent = Number(raw) || 0;
                    const annual = rent * 12;
                    const filled = rent > 0;
                    const nm = unitNameParts(fp.name, labelByUnitId?.[fp._id]);
                    return (
                        <div
                            key={fp._id}
                            className={`${s.card} ${filled ? s.cardFilled : ""}`}
                            style={{ animationDelay: `${i * 60}ms` }}
                        >
                            <div className={s.cardName}>
                                {nm.base}
                                {nm.tag ? (
                                    <span className={s.cardTag}> · {nm.tag}</span>
                                ) : nm.dupNum ? (
                                    ` (${nm.dupNum})`
                                ) : null}
                            </div>

                            <label className={s.amountRow}>
                                <span className={s.currency}>$</span>
                                <input
                                    className={s.amountInput}
                                    type="number"
                                    inputMode="numeric"
                                    min={0}
                                    step={50}
                                    placeholder="0"
                                    value={raw}
                                    onChange={(e) => setRent(fp._id, e.target.value)}
                                    aria-label={`Monthly rent for ${fp.name}`}
                                />
                            </label>

                            <div className={s.annual}>
                                {filled ? (
                                    <>
                                        per month · <strong>{fmtMoney(annual)}</strong> / year
                                    </>
                                ) : (
                                    "Enter the expected monthly rent"
                                )}
                            </div>

                            {medianRent != null && (
                                <button
                                    type="button"
                                    className={s.suggest}
                                    onClick={() => setRent(fp._id, String(Math.round(medianRent)))}
                                    title="Use the median rent from the comps below"
                                >
                                    <span className={s.suggestLabel}>Median comp</span>
                                    <span className={s.suggestValue}>{fmtMoney(medianRent)}</span>
                                    <span className={s.suggestApply}>Use</span>
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
