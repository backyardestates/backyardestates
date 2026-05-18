"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePresentationStore } from "@/lib/store/presentationStore";
import { RunningHeader } from "./_shared/RunningHeader";
import { RunningFooter } from "./_shared/RunningFooter";
import s from "./Slide8.module.css";

function fmt$(n: number) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function useCountUp(target: number, active: boolean, delay = 0, duration = 900) {
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

function AnimVal({ n, active, delay = 0 }: { n: number; active: boolean; delay?: number }) {
    const v = useCountUp(Math.abs(n), active, delay);
    return <>{fmt$(v)}</>;
}

export function Slide8_TheReturn() {
    const { scenarios, currentSlide } = usePresentationStore();
    const active = currentSlide === 8;

    const houseScenario = scenarios.find((sc) => sc.kind === "house");
    const aduScenarios = scenarios.filter((sc) => sc.kind === "adu");
    const aduSc = aduScenarios.reduce<typeof aduScenarios[0] | null>((best, sc) => {
        if (!best) return sc;
        return (sc.cashflowMonthly ?? -Infinity) > (best.cashflowMonthly ?? -Infinity) ? sc : best;
    }, null);

    const avgEquity = aduSc
        ? Math.round((aduSc.year1EquityBoost + aduSc.year5EquityBoost + aduSc.year10EquityBoost) / 3)
        : 0;
    const hcf = houseScenario?.cashflowMonthly ?? 0;
    const acf = aduSc?.cashflowMonthly ?? 0;

    // Anchor number: 10-yr cashflow advantage + equity delta vs house down payment
    const tenYearAdvantage = aduSc
        ? Math.round((aduSc.cashflowAnnual * 10) + (aduSc.year10EquityBoost ?? 0) - (houseScenario?.downPayment ?? 0))
        : 0;

    return (
        <div className={s.slide}>
            <RunningHeader slideNumber={8} topic="ADU vs. buying a house" theme="light" />

            <div className={s.titleRow}>
                <h2 className={s.titleText}>ADU vs. buying a house.</h2>
            </div>

            {/* Anchor banner */}
            {tenYearAdvantage > 0 && (
                <div className={s.anchorBanner}>
                    <div className={s.anchorLeft}>
                        <span className={s.anchorLeftSub}>10-year advantage in your favor</span>
                        10 years of owning an ADU vs.<br />carrying a starter home.
                    </div>
                    <div className={s.anchorCenter}>
                        An ADU keeps your cash in your pocket and pays you back, while a starter house drains it.
                    </div>
                    <div className={s.anchorRight}>
                        <div className={s.anchorNum}>
                            +<AnimVal n={tenYearAdvantage} active={active} delay={0} />
                        </div>
                        <div className={s.anchorNumSub}>Illustrative</div>
                    </div>
                </div>
            )}

            {/* Comparison table */}
            <div className={s.tableWrap}>
                <div className={s.thead}>
                    <div className={`${s.th} ${s.thCosts}`}>Line item</div>
                    <div className={`${s.th} ${s.thHouse}`}>House</div>
                    <div className={`${s.th} ${s.thAdu}`}>Your ADU</div>
                </div>
                <div className={s.tbody}>
                    <div className={s.row}>
                        <div className={s.cellLabel}>Purchase Price</div>
                        <div className={s.cellVal}><AnimVal n={houseScenario?.purchasePrice ?? 0} active={active} delay={40} /></div>
                        <div className={s.cellVal}><AnimVal n={aduSc?.finalAduPrice ?? aduSc?.purchasePrice ?? 0} active={active} delay={60} /></div>
                    </div>
                    <div className={s.row}>
                        <div className={s.cellLabel}>Down Payment</div>
                        <div className={s.cellVal}><AnimVal n={houseScenario?.downPayment ?? 0} active={active} delay={80} /></div>
                        <div className={`${s.cellVal} ${s.cellValPos} ${s.cellValBold}`}>$0</div>
                    </div>
                    <div className={s.row}>
                        <div className={s.cellLabel}>Remodel</div>
                        <div className={`${s.cellVal} ${s.cellValMuted}`}>$0</div>
                        <div className={`${s.cellVal} ${s.cellValMuted}`}>$0</div>
                    </div>
                    <div className={`${s.row} ${s.rowDark}`}>
                        <div className={`${s.cellLabel} ${s.cellLabelBold}`}>Cost Out of Pocket</div>
                        <div className={`${s.cellVal} ${s.cellValNeg} ${s.cellValBold}`}><AnimVal n={houseScenario?.downPayment ?? 0} active={active} delay={120} /></div>
                        <div className={`${s.cellVal} ${s.cellValPos} ${s.cellValBold}`}>$0</div>
                    </div>
                    <div className={s.row}>
                        <div className={s.cellLabel}>Monthly Payment</div>
                        <div className={s.cellVal}><AnimVal n={houseScenario?.mtgPaymentMonthly ?? 0} active={active} delay={160} /></div>
                        <div className={s.cellVal}><AnimVal n={aduSc?.mtgPaymentMonthly ?? 0} active={active} delay={180} /></div>
                    </div>
                    <div className={s.row}>
                        <div className={s.cellLabel}>Property Tax</div>
                        <div className={s.cellVal}><AnimVal n={houseScenario?.propertyTaxMonthly ?? 0} active={active} delay={200} /></div>
                        <div className={s.cellVal}><AnimVal n={aduSc?.propertyTaxMonthly ?? 0} active={active} delay={220} /></div>
                    </div>
                    <div className={s.row}>
                        <div className={s.cellLabel}>Insurance</div>
                        <div className={s.cellVal}><AnimVal n={houseScenario?.insuranceMonthly ?? 0} active={active} delay={240} /></div>
                        <div className={s.cellVal}><AnimVal n={aduSc?.insuranceMonthly ?? 0} active={active} delay={260} /></div>
                    </div>
                    <div className={s.row}>
                        <div className={s.cellLabel}>Maintenance</div>
                        <div className={s.cellVal}><AnimVal n={houseScenario?.maintenanceMonthly ?? 0} active={active} delay={280} /></div>
                        <div className={s.cellVal}><AnimVal n={aduSc?.maintenanceMonthly ?? 0} active={active} delay={300} /></div>
                    </div>
                    <div className={`${s.row} ${s.rowDark}`}>
                        <div className={`${s.cellLabel} ${s.cellLabelBold}`}>Monthly Cost</div>
                        <div className={`${s.cellVal} ${s.cellValNeg} ${s.cellValBold}`}><AnimVal n={houseScenario?.monthlyCost ?? 0} active={active} delay={320} /></div>
                        <div className={`${s.cellVal} ${s.cellValPos} ${s.cellValBold}`}><AnimVal n={aduSc?.monthlyCost ?? 0} active={active} delay={340} /></div>
                    </div>
                    <div className={s.row}>
                        <div className={s.cellLabel}>Rent Collected</div>
                        <div className={`${s.cellVal} ${s.cellValMuted}`}>—</div>
                        <div className={s.cellVal}><AnimVal n={aduSc?.rentMonthly ?? 0} active={active} delay={360} /></div>
                    </div>
                    <div className={`${s.row} ${s.rowCashflow}`}>
                        <div className={`${s.cellLabel} ${s.cellLabelCashflow}`}>Monthly Cashflow</div>
                        <div className={s.cellValCfNeg}>↓ <AnimVal n={Math.abs(hcf)} active={active} delay={400} /></div>
                        <div className={s.cellValCfPos}>↑ <AnimVal n={Math.abs(acf)} active={active} delay={420} /></div>
                    </div>
                    <div className={s.row}>
                        <div className={s.cellLabel}>AVG Equity Boost</div>
                        <div className={`${s.cellVal} ${s.cellValMuted}`}>—</div>
                        <div className={`${s.cellVal} ${s.cellValPos} ${s.cellValBold}`}><AnimVal n={avgEquity} active={active} delay={460} /></div>
                    </div>
                </div>
            </div>

            <RunningFooter
                theme="light"
                left={<span className={s.disclaimer}>Backyard Estates does not guarantee rental income or long-term value. Illustrative — for comparison purposes only.</span>}
            />
        </div>
    );
}
