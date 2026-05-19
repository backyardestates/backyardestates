"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePresentationStore } from "@/lib/store/presentationStore";
import { proxiedImage } from "@/lib/cloudinary";
import s from "./Slide10.module.css";

function useCountUp(target: number, active: boolean, delay = 0, duration = 1400) {
    const [value, setValue] = useState(0);
    const rafRef = useRef<number | null>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        if (timerRef.current) clearTimeout(timerRef.current);
        if (!active) { setValue(0); return; }
        timerRef.current = setTimeout(() => {
            const start = performance.now();
            const tick = (now: number) => {
                const t = Math.min((now - start) / duration, 1);
                setValue(Math.round((1 - Math.pow(1 - t, 3)) * target));
                if (t < 1) rafRef.current = requestAnimationFrame(tick);
            };
            rafRef.current = requestAnimationFrame(tick);
        }, delay);
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [target, active, delay, duration]);
    return value;
}

function AnimRent({ n, active, delay = 0 }: { n: number; active: boolean; delay?: number }) {
    const v = useCountUp(n, active, delay);
    return <>${v.toLocaleString()}</>;
}

function lastNameFromFull(full?: string) {
    if (!full) return "";
    const parts = full.trim().split(/\s+/);
    return parts[parts.length - 1] ?? "";
}

function cityFromAddress(addr: string) {
    const parts = addr.split(",");
    return parts.length >= 2 ? parts[parts.length - 2].trim() : addr;
}

export function Slide10_RentalAnalysis() {
    const { comparedUnitIds, floorplans, rentalComps, featuredRentals, rentByUnitId, customerName, propertyAddress, currentSlide } = usePresentationStore();
    const active = currentSlide === 10;

    const comparedUnits = floorplans.filter((fp) => comparedUnitIds.includes(fp._id));
    const displayUnits = comparedUnits.length > 0 ? comparedUnits : floorplans.slice(0, 1);

    const hasRentData = displayUnits.some((fp) => (rentByUnitId[fp._id] ?? 0) > 0);
    const hasComps = rentalComps.length > 0 || featuredRentals.length > 0;
    const showEmpty = !hasRentData && !hasComps;

    // If the admin curated rentals in Step 9, show those (with images).
    // Otherwise, fall back to the first 4 raw RentCast comps.
    const usingCurated = featuredRentals.length > 0;
    const displayComps = usingCurated ? featuredRentals : rentalComps.slice(0, 4);
    const lastName = lastNameFromFull(customerName);
    const city = propertyAddress ? cityFromAddress(propertyAddress) : "—";

    return (
        <div className={s.slide}>
            {/* Running header */}
            <div className="running-header rh-dark">
                <span className="running-header-left">{lastName} · {city}</span>
                <span className="running-header-center">Rental Market</span>
                <span className="running-header-right">
                    <span className="running-header-num">10</span> / 14
                </span>
            </div>

            {/* Headline */}
            <div className={s.headRow}>
                <div className={s.headLeft}>
                    <h2 className="section-title on-dark">
                        The <em>rental market.</em>
                    </h2>
                    <span className={s.headSubhead}>{city ? `Within 1 mile of ${city}` : "Local comparable rentals"}</span>
                </div>
                <span className={s.sourceChip}>Powered by RentCast</span>
            </div>

            {showEmpty ? (
                <div className={s.emptyState}>
                    Rental market data will appear after the admin enters rental comps.
                </div>
            ) : (
                <>
                    {/* Comparable rentals — now on top, centered */}
                    {hasComps && (
                        <div className={s.compsSection}>
                            <div className={s.compsHead}>
                                <h3 className={s.compsTitle}>Market <em>comparables</em></h3>
                                <span className={s.compsSub}>Within 1 mi · last 90 days</span>
                            </div>
                            <div className={`${s.compsGrid} ${usingCurated ? s.compsGridCurated : ""}`}>
                                {displayComps.map((comp, i) => {
                                    const imageUrl = usingCurated ? (comp as typeof featuredRentals[number]).imageUrl : undefined;
                                    const specs = [
                                        comp.bedrooms != null ? `${comp.bedrooms} bd` : null,
                                        comp.bathrooms != null ? `${comp.bathrooms} ba` : null,
                                        comp.squareFootage != null ? `${comp.squareFootage.toLocaleString()} sqft` : null,
                                    ].filter(Boolean).join(" · ");

                                    if (usingCurated) {
                                        return (
                                            <div key={i} className={`${s.compCard} ${s.compCardCurated}`}>
                                                <div className={s.compImage}>
                                                    <img
                                                        src={imageUrl ? proxiedImage(imageUrl) : "/images/rental-placeholder.svg"}
                                                        alt={comp.formattedAddress ?? "Listing photo unavailable"}
                                                        className={s.compImageImg}
                                                        referrerPolicy="no-referrer"
                                                        onError={(e) => {
                                                            const img = e.currentTarget as HTMLImageElement;
                                                            if (img.src.endsWith("/images/rental-placeholder.svg")) return;
                                                            img.src = "/images/rental-placeholder.svg";
                                                        }}
                                                    />
                                                </div>
                                                <div className={s.compBody}>
                                                    <div className={s.compPrice}>
                                                        ${(comp.price ?? 0).toLocaleString()}<span className={s.compMo}> / mo</span>
                                                    </div>
                                                    <div className={s.compAddress}>{comp.formattedAddress ?? ""}</div>
                                                    <div className={s.compSpecs}>{specs}</div>
                                                </div>
                                            </div>
                                        );
                                    }
                                    return (
                                        <div key={i} className={s.compCard}>
                                            <div className={s.compPrice}>
                                                ${(comp.price ?? 0).toLocaleString()}<span className={s.compMo}> / mo</span>
                                            </div>
                                            <div className={s.compAddress}>{comp.formattedAddress ?? ""}</div>
                                            <div className={s.compSpecs}>{specs}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Rent hero — per unit, below the comps */}
                    <div
                        className={s.rentHeroGrid}
                        style={{ gridTemplateColumns: `repeat(${displayUnits.length}, 1fr)` }}
                    >
                        {displayUnits.map((fp, i) => {
                            const rent = rentByUnitId[fp._id] ?? 0;
                            return (
                                <div key={fp._id} className={s.rentHeroCard}>
                                    <span className={s.rentEyebrow}>The Plan</span>
                                    <div className={s.rentUnitName}>{fp.name}</div>
                                    {fp.sqft && <div className={s.rentSqft}>{fp.sqft.toLocaleString()} sqft</div>}

                                    <div className={s.rentValRow}>
                                        <span className={s.rentVal}>
                                            <AnimRent n={rent} active={active} delay={i * 80} />
                                        </span>
                                        <span className={s.rentMo}>/ mo</span>
                                    </div>
                                    <span className={s.rentSub}>Estimated Monthly Rent</span>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

            {/* Footer */}
            <div className={s.footer}>
                <span className={s.disclaimer}>Rental estimates from RentCast. Not guaranteed. Market conditions vary.</span>
                <span className={s.tagline}>We build for you.</span>
            </div>
        </div>
    );
}
