"use client";

import React from "react";
import { usePresentationStore } from "@/lib/store/presentationStore";
import s from "./Slide5.module.css";
import { ProposalFooter } from "./_shared/ProposalFooter";

function fmt$(n: number) {
    return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function cityFromAddress(addr: string) {
    const parts = addr.split(",");
    return parts.length >= 2 ? parts[parts.length - 2].trim() : addr;
}

export function Slide5_RentalAnalysis() {
    const {
        rentalComps,
        rentByUnitId,
        comparedUnitIds,
        floorplans,
        propertyAddress,
        scenarios,
    } = usePresentationStore();

    const city = propertyAddress ? cityFromAddress(propertyAddress) : "Your City";
    const displayComps = rentalComps.slice(0, 3);
    const comparedUnits = floorplans.filter((fp) => comparedUnitIds.includes(fp._id));
    const displayUnits = comparedUnits.length > 0 ? comparedUnits : floorplans.slice(0, 2);

    function rentForUnit(unitId: string): number {
        const fromMap = rentByUnitId[unitId];
        if (fromMap && fromMap > 0) return fromMap;
        const sc = scenarios.find((s) => s.kind === "adu" && s.key === `adu_${unitId}`);
        return sc?.rentMonthly ?? 0;
    }

    return (
        <div className={s.slide}>
            <div className={s.banner}>
                <h1 className={s.bannerTitle}>ADU Rental Analysis</h1>
            </div>

            <div className={s.body}>
                <h2 className={s.subtitle}>Comparable Rentals in {city}</h2>

                <div className={s.compsGrid}>
                    {displayComps.length > 0 ? (
                        displayComps.map((c, i) => (
                            <div key={i} className={s.compCard}>
                                <dl className={s.compList}>
                                    <dt>Size</dt>
                                    <dd>
                                        {c.squareFootage ? `${c.squareFootage.toLocaleString()} sqft` : "—"}
                                        {(c.bedrooms != null || c.bathrooms != null) && (
                                            <span className={s.compBb}>
                                                {c.bedrooms != null && ` · ${c.bedrooms} bd`}
                                                {c.bathrooms != null && ` · ${c.bathrooms} ba`}
                                            </span>
                                        )}
                                    </dd>
                                    <dt>Location</dt>
                                    <dd>{c.formattedAddress ?? "—"}</dd>
                                    <dt>Rent</dt>
                                    <dd className={s.compRent}>{c.price ? `${fmt$(c.price)}/mo` : "—"}</dd>
                                </dl>
                            </div>
                        ))
                    ) : (
                        <div className={s.emptyComps}>
                            Comparable rentals will appear once admin enters rental comps.
                        </div>
                    )}
                </div>

                <div
                    className={s.estimates}
                    style={{ gridTemplateColumns: `repeat(${Math.max(1, displayUnits.length)}, 1fr)` }}
                >
                    {displayUnits.length > 0 ? (
                        displayUnits.map((fp) => {
                            const rent = rentForUnit(fp._id);
                            return (
                                <div key={fp._id} className={s.estimate}>
                                    <span className={s.estimatePlan}>The {fp.name}</span>
                                    <span className={s.estimateLabel}>Estimated ADU Rent</span>
                                    <span className={s.estimateValue}>
                                        {rent ? `${fmt$(rent)}/mo` : "—"}
                                    </span>
                                </div>
                            );
                        })
                    ) : (
                        <div className={s.estimate}>
                            <span className={s.estimateLabel}>Estimated ADU Rent</span>
                            <span className={s.estimateValue}>—</span>
                        </div>
                    )}
                </div>
            </div>

            <ProposalFooter
                pageNum={5}
                pageTotal={9}
                disclaimer="Backyard Estates does not guarantee rental income or long-term property value. The homeowner is responsible for their own analysis."
            />
        </div>
    );
}
