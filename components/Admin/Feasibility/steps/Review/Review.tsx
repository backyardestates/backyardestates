"use client";

import { useEffect, useMemo, useState } from "react";
import { client } from "@/sanity/client";
import { useAnswersStore } from "@/lib/feasibility/stores/answers.store";
import type { FinanceData } from "@/lib/feasibility/types";
import GeneratePDFStep from "../GeneratePDF/GeneratePDF";
import styles from "./Review.module.css";

const FLOORPLAN_BY_ID = `
*[_type=="floorplan" && _id==$id][0]{
  _id,
  name,
  bed,
  bath,
  sqft,
  price
}
`;

type Floorplan = {
    _id: string;
    name: string;
    bed: number;
    bath: number;
    sqft: number;
    price: number;
};

const EMPTY_FINANCE: FinanceData = {};

function formatMoney(n?: number | null) {
    if (typeof n !== "number" || Number.isNaN(n)) return "—";
    return `$${Math.round(n).toLocaleString()}`;
}

function prettyTimeframe(v?: string) {
    if (!v) return "—";
    const map: Record<string, string> = {
        asap: "ASAP",
        "3to6": "3–6 months",
        "6to12": "6–12 months",
        flexible: "Flexible",
    };
    return map[v] ?? v;
}

function prettyMotivation(v?: string) {
    if (!v) return "—";
    const map: Record<string, string> = {
        family: "Housing for family",
        rental: "Rental income",
        office: "Home office / studio",
        guest: "Guest housing",
        value: "Increase property value",
        other: "Other",
    };
    return map[v] ?? v;
}

function prettyAduType(v?: string) {
    if (!v) return "—";
    const map: Record<string, string> = {
        detachedNew: "Detached New Construction",
        attachedNew: "Attached New Construction",
        garageConversion: "Garage Conversion",
        jadu: "JADU (≤ 500 sq ft)",
    };
    return map[v] ?? v;
}

function prettyFinanceStatus(v?: FinanceData["status"]) {
    if (!v) return "—";
    const map: Record<string, string> = {
        secured: "Financing is secured",
        exploring: "Exploring financing options",
        not_sure: "Not sure yet",
    };
    return map[v] ?? v;
}

function prettyFinancePath(v?: FinanceData["path"]) {
    if (!v) return "—";
    const map: Record<string, string> = {
        cash: "Cash / savings",
        heloc: "HELOC",
        cash_out_refi: "Cash-out refinance",
        construction_loan: "Construction / renovation loan",
        personal_loan: "Personal loan",
        other: "Other / unsure",
    };
    return map[v] ?? v;
}

type SiteSpecificEntry = {
    title?: string;
    status?: string;
    cost?: unknown;
};

type OptionalUpgradeEntry = {
    title?: string;
    selected?: string;
    cost?: unknown;
};

function getSiteSpecificList(siteSpecific: unknown) {
    const obj = (siteSpecific ?? {}) as Record<string, SiteSpecificEntry>;
    return Object.entries(obj).map(([id, entry]) => ({
        id,
        title: entry?.title ?? id,
        status: entry?.status,
        cost: entry?.cost,
    }));
}

function getOptionalUpgradesList(optionalUpgrades: unknown) {
    const obj = (optionalUpgrades ?? {}) as Record<string, OptionalUpgradeEntry>;
    // Keep only actually selected upgrades if your store sets selected=true
    // If selected is not boolean in your store, adjust here.
    return Object.entries(obj).map(([id, entry]) => ({
        id,
        title: entry?.title ?? id,
        selected: entry?.selected,
        cost: entry?.cost,
    }));
}

export default function ReviewStep() {
    const answers = useAnswersStore((s) => s.answers);
    const setAnswer = useAnswersStore((s) => s.setAnswer);

    const selectedFloorplanId = (answers.selectedFloorplanId as string | undefined) ?? null;
    const cachedFloorplan = (answers.selectedFloorplan as Floorplan | undefined) ?? null;

    const finance = useAnswersStore((s) => (s.answers.finance as FinanceData | undefined) ?? EMPTY_FINANCE);

    const [loadingFp, setLoadingFp] = useState(false);

    const siteSpecificList = useMemo(() => getSiteSpecificList(answers.siteSpecific), [answers.siteSpecific]);
    const optionalUpgrades = useMemo(() => getOptionalUpgradesList(answers.optionalUpgrades), [answers.optionalUpgrades]);

    // Fetch floorplan if not cached / mismatch
    useEffect(() => {
        let cancelled = false;

        (async () => {
            if (!selectedFloorplanId) return;

            const alreadyHaveCorrect = cachedFloorplan && cachedFloorplan._id === selectedFloorplanId;
            if (alreadyHaveCorrect) return;

            setLoadingFp(true);
            try {
                const fp = await client.fetch(FLOORPLAN_BY_ID, { id: selectedFloorplanId });
                if (cancelled) return;

                if (fp?._id) setAnswer("selectedFloorplan", fp);
                else setAnswer("selectedFloorplan", null);
            } finally {
                if (!cancelled) setLoadingFp(false);
            }
        })();

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedFloorplanId]);

    const floorplan =
        cachedFloorplan && cachedFloorplan._id === selectedFloorplanId ? cachedFloorplan : null;

    // Tiny derived statuses to improve UX
    const hasContact = Boolean(answers.name || answers.email || answers.phone);
    const hasAddress = Boolean(answers.address || answers.city);
    const hasBasics = Boolean(answers.motivation && answers.aduType && typeof answers.bed === "number" && typeof answers.bath === "number");

    return (
        <section className={styles.step}>
            {/* HERO */}
            <div className={styles.heroCard}>
                <div className={styles.heroTop}>
                    <div className={styles.heroLeft}>
                        <div className={styles.heroEyebrow}>Review</div>
                        <h2 className={styles.heroHeadline}>Confirm your inputs</h2>
                        <p className={styles.heroSubhead}>
                            Quick recap — this confirms we have everything needed to generate your feasibility report.
                        </p>
                    </div>
                </div>
                {/* GRID */}
                <div className={styles.grid}>
                    {/* CONTACT */}
                    <section className={styles.card}>
                        <header className={styles.cardHeader}>
                            <div className={styles.cardTitle}>Contact + property</div>
                            <div className={styles.cardHint}>Used to generate the report + send it to you.</div>
                        </header>

                        <dl className={styles.kvGrid}>
                            <div className={styles.kv}>
                                <dt className={styles.k}>Name</dt>
                                <dd className={styles.v}>{(answers.name as string) || "—"}</dd>
                            </div>
                            <div className={styles.kv}>
                                <dt className={styles.k}>Phone</dt>
                                <dd className={styles.v}>{(answers.phone as string) || "—"}</dd>
                            </div>
                            <div className={styles.kv}>
                                <dt className={styles.k}>Email</dt>
                                <dd className={styles.v}>{(answers.email as string) || "—"}</dd>
                            </div>

                            <div className={`${styles.kv} ${styles.kvFull}`}>
                                <dt className={styles.k}>Property address</dt>
                                <dd className={styles.v}>{(answers.address as string) || "—"}</dd>
                            </div>

                        </dl>
                    </section>

                    {/* PROJECT CHOICES */}
                    <section className={styles.card}>
                        <header className={styles.cardHeader}>
                            <div className={styles.cardTitle}>Project choices</div>
                            <div className={styles.cardHint}>Used to tailor the report and feasibility assumptions.</div>
                        </header>

                        <dl className={styles.kvGrid}>
                            <div className={styles.kv}>
                                <dt className={styles.k}>Motivation</dt>
                                <dd className={styles.v}>{prettyMotivation(answers.motivation as string | undefined)}</dd>
                            </div>

                            <div className={styles.kv}>
                                <dt className={styles.k}>ADU type</dt>
                                <dd className={styles.v}>{prettyAduType(answers.aduType as string | undefined)}</dd>
                            </div>

                            <div className={styles.kv}>
                                <dt className={styles.k}>Layout</dt>
                                <dd className={styles.v}>
                                    {typeof answers.bed === "number" ? answers.bed : "—"} bed /{" "}
                                    {typeof answers.bath === "number" ? answers.bath : "—"} bath
                                </dd>
                            </div>

                            <div className={styles.kv}>
                                <dt className={styles.k}>Timeframe</dt>
                                <dd className={styles.v}>{prettyTimeframe(answers.timeframe as string | undefined)}</dd>
                            </div>

                            <div className={`${styles.kv} ${styles.kvFull}`}>
                                <dt className={styles.k}>Selected floorplan</dt>
                                <dd className={styles.v}>
                                    {!selectedFloorplanId ? (
                                        "—"
                                    ) : loadingFp ? (
                                        <span className={styles.inlineLoading}>
                                            <span className={styles.spinner} aria-hidden="true" />
                                            Loading floorplan…
                                        </span>
                                    ) : floorplan ? (
                                        <div className={styles.floorplanRow}>
                                            <div className={styles.floorplanName}>{floorplan.name}</div>
                                            <div className={styles.floorplanMeta}>
                                                {floorplan.sqft} sqft • {floorplan.bed} bed / {floorplan.bath} bath
                                            </div>
                                            <div className={styles.floorplanPrice}>{formatMoney(floorplan.price)}</div>
                                        </div>
                                    ) : (
                                        "—"
                                    )}
                                </dd>
                            </div>
                        </dl>
                    </section>

                    {/* OPTIONAL UPGRADES */}
                    <section className={styles.card}>
                        <header className={styles.cardHeaderRow}>
                            <div>
                                <div className={styles.cardTitle}>Optional upgrades</div>
                                <div className={styles.cardHint}>Selected enhancements you may want included.</div>
                            </div>
                            <div className={styles.countPill}>{optionalUpgrades.length} selected</div>
                        </header>

                        {optionalUpgrades.length ? (
                            <div className={styles.pillWrap}>
                                {optionalUpgrades.map((u) => (
                                    <span key={u.id} className={styles.pill}>
                                        {u.title}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <div className={styles.emptyState}>
                                <div className={styles.emptyTitle}>None selected</div>
                                <div className={styles.emptySub}>That’s okay — you can always add upgrades later.</div>
                            </div>
                        )}
                    </section>

                    {/* SITE-SPECIFIC */}
                    <section className={styles.card}>
                        <header className={styles.cardHeaderRow}>
                            <div>
                                <div className={styles.cardTitle}>Potential site-specific work</div>
                                <div className={styles.cardHint}>Items that may apply depending on your property conditions.</div>
                            </div>
                            <div className={styles.countPill}>{siteSpecificList.length} flagged</div>
                        </header>

                        {siteSpecificList.length ? (
                            <div className={styles.list}>
                                {siteSpecificList.map((it) => (
                                    <div key={it.id} className={styles.listRow}>
                                        <div className={styles.listLeft}>
                                            <div className={styles.listTitle}>{it.title}</div>
                                            <div className={styles.listSub}>
                                                Marked as <b>{it.status ?? "unknown"}</b>
                                            </div>
                                        </div>

                                        <div className={styles.listRight}>
                                            <span className={styles.badge}>
                                                {it.status === "might_apply"
                                                    ? "Might apply"
                                                    : it.status === "not_apply"
                                                        ? "Not likely"
                                                        : "Not decided"}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className={styles.emptyState}>
                                <div className={styles.emptyTitle}>Nothing flagged yet</div>
                                <div className={styles.emptySub}>
                                    That’s fine — the Formal Property Analysis confirms what’s real.
                                </div>
                            </div>
                        )}
                    </section>

                    {/* FINANCE */}
                    <section className={styles.card}>
                        <header className={styles.cardHeader}>
                            <div className={styles.cardTitle}>Financing (inputs)</div>
                            <div className={styles.cardHint}>Used to tailor the report. Estimates are totally fine.</div>
                        </header>

                        <dl className={styles.kvGrid}>
                            <div className={styles.kv}>
                                <dt className={styles.k}>Status</dt>
                                <dd className={styles.v}>{prettyFinanceStatus(finance.status)}</dd>
                            </div>

                            <div className={styles.kv}>
                                <dt className={styles.k}>Path</dt>
                                <dd className={styles.v}>{prettyFinancePath(finance.path)}</dd>
                            </div>

                            <div className={styles.kv}>
                                <dt className={styles.k}>Down payment</dt>
                                <dd className={styles.v}>
                                    {typeof finance.downPayment === "number" ? formatMoney(finance.downPayment) : "—"}
                                </dd>
                            </div>

                            <div className={styles.kv}>
                                <dt className={styles.k}>Loan term</dt>
                                <dd className={styles.v}>
                                    {finance.termMonths ? `${Math.round(finance.termMonths / 12)} years` : "—"}
                                </dd>
                            </div>

                            <div className={styles.kv}>
                                <dt className={styles.k}>Interest rate</dt>
                                <dd className={styles.v}>
                                    {typeof finance.ratePct === "number" ? `${finance.ratePct.toFixed(2)}%` : "—"}
                                </dd>
                            </div>

                            <div className={`${styles.kv} ${styles.kv}`}>
                                <dt className={styles.k}>Value-boost section</dt>
                                <dd className={styles.v}>
                                    {finance.wantsValueBoostAnalysis
                                        ? finance.wantsValueBoostAnalysis === "yes"
                                            ? "Yes (include it)"
                                            : "No (skip)"
                                        : "—"}
                                </dd>
                            </div>

                            {finance.wantsValueBoostAnalysis === "yes" ? (
                                <>
                                    <div className={styles.kv}>
                                        <dt className={styles.k}>Home value estimate</dt>
                                        <dd className={styles.v}>
                                            {typeof finance.homeValueEstimate === "number" ? formatMoney(finance.homeValueEstimate) : "—"}
                                        </dd>
                                    </div>

                                    <div className={styles.kv}>
                                        <dt className={styles.k}>Mortgage balance</dt>
                                        <dd className={styles.v}>
                                            {typeof finance.mortgageBalance === "number" ? formatMoney(finance.mortgageBalance) : "—"}
                                        </dd>
                                    </div>
                                </>
                            ) : null}
                        </dl>
                    </section>
                </div>
            </div>
            <GeneratePDFStep />
        </section>
    );
}
