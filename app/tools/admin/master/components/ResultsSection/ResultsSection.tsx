// app/admin/_components/admin/ResultsSection.tsx
"use client";

import React from "react";
import type { AvmValue, Floorplan, PropertyRecord, RentalListing } from "@/lib/rentcast/types";
import { Card } from "../Card/Card";
import { Row } from "../Row/Row";
import { RentalsPanel } from "../RentalsPanel/RentalsPanel";

function money(n?: number) {
    if (typeof n !== "number") return "—";
    return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}
function num(n?: number) {
    return typeof n === "number" ? n.toLocaleString() : "—";
}

export function ResultsSection(props: {
    styles: any; // AdminMasterClient.module.css
    address: string;
    owed: string;
    selectedFloorplan: Floorplan | null;
    property: PropertyRecord | null;
    avm: AvmValue | null;
    rentals: RentalListing[];
    cityState: string;
}) {
    const { styles, address, owed, selectedFloorplan, property, avm, rentals, cityState } = props;

    return (
        <section className={styles.results}>
            <div style={{ display: "grid", gap: 14 }}>
                <Card styles={styles} title="Deal Inputs">
                    <div className={styles.cardBody}>
                        <Row styles={styles} label="Address" value={(property?.formattedAddress ?? address) || "—"} />
                        <Row styles={styles} label="Owed" value={owed || "—"} />
                        <Row
                            styles={styles}
                            label="Floorplan sqft"
                            value={selectedFloorplan ? `${selectedFloorplan.sqft} sqft` : "—"}
                        />
                        <Row styles={styles} label="City/State" value={cityState} />
                    </div>
                </Card>

                <Card styles={styles} title="Property Record">
                    <div className={styles.cardBody}>
                        <Row styles={styles} label="Type" value={property?.propertyType ?? "—"} />
                        <Row
                            styles={styles}
                            label="Beds/Baths"
                            value={
                                property?.bedrooms != null || property?.bathrooms != null
                                    ? `${property?.bedrooms ?? "—"} / ${property?.bathrooms ?? "—"}`
                                    : "—"
                            }
                        />
                        <Row
                            styles={styles}
                            label="Main sqft"
                            value={property?.squareFootage ? `${num(property.squareFootage)} sqft` : "—"}
                        />
                        <Row styles={styles} label="Lot size" value={property?.lotSize ? `${num(property.lotSize)} sqft` : "—"} />
                        <Row styles={styles} label="Year built" value={property?.yearBuilt ? String(property.yearBuilt) : "—"} />
                        <Row styles={styles} label="Zoning" value={property?.zoning ?? "—"} />
                        <Row
                            styles={styles}
                            label="Last sale"
                            value={property?.lastSaleDate ? new Date(property.lastSaleDate).toLocaleDateString() : "—"}
                        />
                        <Row styles={styles} label="Last sale price" value={money(property?.lastSalePrice)} />
                    </div>
                </Card>
            </div>

            <div style={{ display: "grid", gap: 14 }}>
                <Card styles={styles} title="Value Estimate (AVM)">
                    <div className={styles.cardBody}>
                        <Row styles={styles} label="Estimated value" value={money(avm?.price)} />
                        <Row
                            styles={styles}
                            label="Range"
                            value={
                                avm?.priceRangeLow != null && avm?.priceRangeHigh != null
                                    ? `${money(avm.priceRangeLow)} – ${money(avm.priceRangeHigh)}`
                                    : "—"
                            }
                        />
                        <Row
                            styles={styles}
                            label="Subject sqft"
                            value={avm?.subjectProperty?.squareFootage ? `${num(avm.subjectProperty.squareFootage)} sqft` : "—"}
                        />
                        <Row styles={styles} label="Subject type" value={avm?.subjectProperty?.propertyType ?? "—"} />
                    </div>
                </Card>

                <Card styles={styles} title="Top Comparables">
                    <div className={styles.blockList}>
                        {(avm?.comparables ?? []).slice(0, 5).map((c, i) => (
                            <div key={i} className={styles.block}>
                                <p className={styles.blockTitle}>{c.formattedAddress ?? "Comparable"}</p>

                                <div className={styles.metaGrid}>
                                    <div className={styles.metaItem}>
                                        Price: <span className={styles.metaValue}>{money(c.price)}</span>
                                    </div>
                                    <div className={styles.metaItem}>
                                        Sqft: <span className={styles.metaValue}>{c.squareFootage ? num(c.squareFootage) : "—"}</span>
                                    </div>
                                    <div className={styles.metaItem}>
                                        Dist:{" "}
                                        <span className={styles.metaValue}>
                                            {typeof c.distance === "number" ? `${c.distance.toFixed(2)} mi` : "—"}
                                        </span>
                                    </div>
                                    <div className={styles.metaItem}>
                                        Match:{" "}
                                        <span className={styles.metaValue}>
                                            {typeof c.correlation === "number" ? c.correlation.toFixed(2) : "—"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {!avm?.comparables?.length ? <div className={styles.empty}>No comparables returned.</div> : null}
                    </div>
                </Card>
            </div>

            <div>
                <Card styles={styles} title={`Rentals in ${cityState}`}>
                    <RentalsPanel styles={styles} rentals={rentals} />
                </Card>
            </div>
        </section>
    );
}
