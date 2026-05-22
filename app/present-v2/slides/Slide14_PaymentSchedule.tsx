"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePresentationStore } from "@/lib/store/presentationStore";
import { AduTypeBadge } from "../_components/AduTypeBadge";
import type { ProposalPaymentSchedule } from "@/lib/investment/proposalPaymentSchedule";
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

/** Same title split as Slide 8 — dark prefix + gold number accent + dark
 *  duplicate suffix. Keeps "The Estate 1200 (1)" reading as one piece. */
function splitTitle(name: string) {
    const dupMatch = name.match(/^(.*?)\s*(\(\d+\))\s*$/);
    const baseName = dupMatch ? dupMatch[1].trim() : name;
    const dupSuffix = dupMatch ? ` ${dupMatch[2]}` : "";
    const lastSpace = baseName.lastIndexOf(" ");
    const titlePrefix = lastSpace > 0 ? baseName.slice(0, lastSpace) : "";
    const titleAccent = lastSpace > 0 ? baseName.slice(lastSpace + 1) : baseName;
    return { titlePrefix, titleAccent, dupSuffix };
}

type AduColumn = {
    id: string;
    name: string;
    schedule: ProposalPaymentSchedule;
};

export function Slide14_PaymentSchedule() {
    const {
        customerName,
        propertyAddress,
        proposalPaymentSchedulesByAduId,
        comparedUnitIds,
        floorplans,
        currentSlide,
        isPrintMode,
        aduType,
        aduTypeByUnitId,
    } = usePresentationStore();

    const active = currentSlide === 11 || isPrintMode;

    const lastName = lastNameFromFull(customerName);
    const city = propertyAddress ? cityFromAddress(propertyAddress) : "—";

    // Order columns matching Slide 4 / Slide 8 — iterate floorplans filtered
    // by comparedUnitIds, then map each one to its schedule.
    const orderedUnits = floorplans.filter((fp) => comparedUnitIds.includes(fp._id));

    const allColumns: AduColumn[] = orderedUnits
        .map((fp) => ({
            id: fp._id,
            name: fp.name,
            schedule: proposalPaymentSchedulesByAduId[fp._id],
        }))
        .filter((c): c is AduColumn => Boolean(c.schedule));

    // Dedupe duplicates whose schedules are identical to their source — same
    // base name + same total + same entry amounts. Diverged duplicates (rep
    // edited the schedule) and unique custom units keep their own columns.
    const seenSignatures = new Set<string>();
    const columns = allColumns.filter((c) => {
        const baseName = c.name.replace(/\s*\(\d+\)\s*$/, "").trim();
        const sig = [
            baseName,
            Math.round(c.schedule.totalPrice),
            c.schedule.entries.map((e) => Math.round(e.amount)).join(","),
        ].join("|");
        if (seenSignatures.has(sig)) return false;
        seenSignatures.add(sig);
        return true;
    });

    // Milestone definitions come from the first column — all schedules share
    // the same milestone catalog.
    const milestoneRows = columns[0]?.schedule.entries ?? [];

    if (columns.length === 0 || milestoneRows.length === 0) {
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

    // Grid template: fixed cols (# / Milestone / Trigger) then 1fr per ADU.
    const gridTemplate = `60px minmax(220px, 1.4fr) minmax(200px, 1.2fr) repeat(${columns.length}, minmax(160px, 1fr))`;

    return (
        <div className={s.slide}>
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

            {/* Multi-column schedule grid */}
            <div className={s.tableWrap}>
                <div className={s.tableGrid} style={{ gridTemplateColumns: gridTemplate }}>
                    {/* Header row */}
                    <div className={`${s.cell} ${s.thLabel}`}>#</div>
                    <div className={`${s.cell} ${s.thCol}`}>Milestone</div>
                    <div className={`${s.cell} ${s.thCol} ${s.thTrigger}`}>Trigger</div>
                    {columns.map((col) => {
                        const { titlePrefix, titleAccent, dupSuffix } = splitTitle(col.name);
                        return (
                            <div key={col.id} className={`${s.cell} ${s.thCol} ${s.thAmount}`}>
                                {/* Type badge above the plan name. The total
                                    used to live here too but it's already
                                    shown in the "Total contract" row at the
                                    bottom of the table — redundant. */}
                                <AduTypeBadge
                                    type={aduTypeByUnitId?.[col.id] ?? aduType}
                                    variant="light"
                                />
                                <div className={s.thAduName}>
                                    The {titlePrefix && <>{titlePrefix} </>}
                                    <span className={s.thAduAccent}>{titleAccent}</span>
                                    {dupSuffix}
                                </div>
                            </div>
                        );
                    })}

                    {/* Milestone rows */}
                    {milestoneRows.map((row, i) => (
                        <React.Fragment key={row.id}>
                            <div className={`${s.cell} ${s.rowNum}`}>{i + 1}</div>
                            <div className={`${s.cell} ${s.rowLabel}`}>{row.label}</div>
                            <div className={`${s.cell} ${s.rowTrigger}`}>{row.trigger}</div>
                            {columns.map((col) => {
                                const entry = col.schedule.entries[i];
                                if (!entry) {
                                    return (
                                        <div key={col.id} className={`${s.cell} ${s.rowAmount} ${s.rowAmountMissing}`}>
                                            —
                                        </div>
                                    );
                                }
                                return (
                                    <div key={col.id} className={`${s.cell} ${s.rowAmount}`}>
                                        <AnimDollar
                                            n={entry.amount}
                                            active={active}
                                            delay={i * 60}
                                        />
                                    </div>
                                );
                            })}
                        </React.Fragment>
                    ))}

                    {/* Total row — per column */}
                    <div className={`${s.cell} ${s.totalCell}`} />
                    <div className={`${s.cell} ${s.totalCell} ${s.totalLabel}`}>Total contract</div>
                    <div className={`${s.cell} ${s.totalCell} ${s.totalTrigger}`}>Locked at signing</div>
                    {columns.map((col) => (
                        <div key={col.id} className={`${s.cell} ${s.totalCell} ${s.totalAmount}`}>
                            {fmt$(col.schedule.totalPrice)}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
