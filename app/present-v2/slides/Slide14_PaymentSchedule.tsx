"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePresentationStore } from "@/lib/store/presentationStore";
import s from "./Slide14.module.css";

function fmt$(n: number) {
    if (!Number.isFinite(n)) return "—";
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
    }).format(n);
}

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

function AnimDollar({ n, active, delay = 0 }: { n: number; active: boolean; delay?: number }) {
    const v = useCountUp(Math.abs(n), active, delay);
    return <>{fmt$(v)}</>;
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

export function Slide14_PaymentSchedule() {
    const {
        customerName,
        propertyAddress,
        proposalPaymentSchedule,
        floorplans,
        currentSlide,
    } = usePresentationStore();

    // Slide is now at position 11 in the deck order — animate when that fires.
    const active = currentSlide === 11;

    const lastName = lastNameFromFull(customerName);
    const city = propertyAddress ? cityFromAddress(propertyAddress) : "—";

    const entries = proposalPaymentSchedule?.entries ?? [];
    const total   = proposalPaymentSchedule?.totalPrice ?? 0;
    const aduName = proposalPaymentSchedule
        ? floorplans.find((fp) => fp._id === proposalPaymentSchedule.aduId)?.name ?? "Your ADU"
        : "Your ADU";

    // Total animation for the anchor
    const totalCount = useCountUp(total, active, 800, 1500);

    if (entries.length === 0) {
        return (
            <div className={s.slide}>
                <div className="running-header rh-light">
                    <span className="running-header-left">{lastName} · {city}</span>
                    <span className="running-header-center">Payment Schedule</span>
                    <span className="running-header-right">
                        <span className="running-header-num">11</span> / 15
                    </span>
                </div>
                <div className={s.headRow}>
                    <div className={s.headLeft}>
                        <h2 className="section-title">
                            Payment <em>schedule.</em>
                        </h2>
                        <span className={s.headSubhead}>Locked at signing · paid as you build</span>
                    </div>
                </div>
                <div className={s.empty}>
                    Payment schedule will appear once configured in Step 12 of the admin tool.
                </div>
            </div>
        );
    }

    return (
        <div className={s.slide}>
            {/* Running header */}
            <div className="running-header rh-light">
                <span className="running-header-left">{lastName} · {city}</span>
                <span className="running-header-center">Payment Schedule</span>
                <span className="running-header-right">
                    <span className="running-header-num">11</span> / 15
                </span>
            </div>

            {/* Headline */}
            <div className={s.headRow}>
                <div className={s.headLeft}>
                    <h2 className="section-title">
                        Payment <em>schedule.</em>
                    </h2>
                    <span className={s.headSubhead}>
                        Locked at signing · paid as you build
                    </span>
                </div>
            </div>

            {/* Table + bullets */}
            <div className={s.tableRow}>
                <div className={s.tableCard}>
                    <div className={s.thead}>
                        <div className={s.thLabel}>#</div>
                        <div className={s.thCol}>Milestone</div>
                        <div className={`${s.thCol} ${s.thTrigger}`}>Trigger</div>
                        <div className={`${s.thCol} ${s.thAmount}`}>Amount</div>
                    </div>

                    <div className={s.tbody}>
                        {entries.map((entry, i) => {
                            const isFixed = i === 0 || i === entries.length - 1;
                            return (
                                <div
                                    key={entry.id}
                                    className={`${s.row} ${isFixed ? s.rowFixed : ""}`}
                                >
                                    <div className={s.rowNum}>{i + 1}</div>
                                    <div className={s.rowLabel}>{entry.label}</div>
                                    <div className={s.rowTrigger}>{entry.trigger}</div>
                                    <div className={s.rowAmount}>
                                        <AnimDollar
                                            n={entry.amount}
                                            active={active}
                                            delay={i * 60}
                                        />
                                    </div>
                                </div>
                            );
                        })}

                        {/* Total row — visual climax of the table */}
                        <div className={s.rowTotal}>
                            <div className={s.rowNum} />
                            <div className={s.rowLabel}>Total contract</div>
                            <div className={s.rowTrigger}>{aduName}</div>
                            <div className={s.rowTotalAmount}>
                                {fmt$(totalCount)}
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* Closing anchor — locked total */}
            <div className={s.anchor}>
                <div className={s.anchorLeft}>
                    <span className={s.anchorEyebrow}>Locked at signing</span>
                    <span className={s.anchorBlurb}>
                        Total contract for {aduName}
                    </span>
                </div>
                <div className={s.anchorValue}>{fmt$(totalCount)}</div>
            </div>
        </div>
    );
}
