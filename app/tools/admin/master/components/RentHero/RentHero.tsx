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
    houseRentOverride,
    setHouseRentOverride,
    houseRentAuto,
}: {
    units: Floorplan[];
    rentByAduId: Record<string, string>;
    setRentByAduId: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    rentals?: RentalListing[];
    labelByUnitId?: Record<string, string>;
    /** Main-house monthly rent override ("" = automatic). Shown on the
     *  "ADU vs buying a house" slide as the house's rental value. */
    houseRentOverride?: string;
    setHouseRentOverride?: (value: string) => void;
    /** The automatic estimate (Zillow rentZestimate → median-scaled fallback)
     *  shown as the placeholder / reset target while overriding. */
    houseRentAuto?: number;
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

                {/* Main house rent — the house column of the "ADU vs buying a
                    house" slide. Auto-estimated (Zillow → median-scaled), but
                    fully editable here just like the ADU rents. */}
                {setHouseRentOverride && (
                    (() => {
                        const overrideNum = Number(houseRentOverride ?? "") || 0;
                        const overriding = (houseRentOverride ?? "").trim() !== "" && overrideNum > 0;
                        const effective = overriding ? overrideNum : Math.round(houseRentAuto ?? 0);
                        return (
                            <div
                                className={`${s.card} ${s.cardHouse} ${effective > 0 ? s.cardFilled : ""}`}
                                style={{ animationDelay: `${orderedUnits.length * 60}ms` }}
                            >
                                <div className={s.cardName}>
                                    Main house
                                    <span className={s.cardTag}> · ADU vs. buying slide</span>
                                </div>

                                <label className={s.amountRow}>
                                    <span className={s.currency}>$</span>
                                    <input
                                        className={s.amountInput}
                                        type="number"
                                        inputMode="numeric"
                                        min={0}
                                        step={50}
                                        placeholder={houseRentAuto ? String(Math.round(houseRentAuto)) : "0"}
                                        value={houseRentOverride ?? ""}
                                        onChange={(e) => setHouseRentOverride(e.target.value)}
                                        aria-label="Monthly rent for the customer's main house"
                                    />
                                </label>

                                <div className={s.annual}>
                                    {overriding ? (
                                        <>
                                            per month · <strong>{fmtMoney(overrideNum * 12)}</strong> / year · custom
                                        </>
                                    ) : houseRentAuto ? (
                                        <>
                                            auto estimate · <strong>{fmtMoney(Math.round(houseRentAuto))}</strong> / mo
                                        </>
                                    ) : (
                                        "Enter the main house's market rent"
                                    )}
                                </div>

                                {overriding && houseRentAuto != null && (
                                    <button
                                        type="button"
                                        className={s.suggest}
                                        onClick={() => setHouseRentOverride("")}
                                        title="Clear the override and go back to the automatic estimate"
                                    >
                                        <span className={s.suggestLabel}>Auto estimate</span>
                                        <span className={s.suggestValue}>{fmtMoney(Math.round(houseRentAuto))}</span>
                                        <span className={s.suggestApply}>Reset</span>
                                    </button>
                                )}
                            </div>
                        );
                    })()
                )}
            </div>
        </section>
    );
}
