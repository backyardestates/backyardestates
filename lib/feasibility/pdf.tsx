// lib/feasibility/pdf/FeasibilityPdf.tsx
import React from "react";
import {
    Document,
    Page,
    Text,
    View,
    Image,
    StyleSheet,
    Svg,
    Rect,
} from "@react-pdf/renderer";

/* =========================
   Helpers
========================= */

function money(n?: number | null) {
    if (typeof n !== "number" || Number.isNaN(n)) return "—";
    return `$${Math.round(n).toLocaleString()}`;
}

function pct(n?: number | null) {
    if (typeof n !== "number" || Number.isNaN(n)) return "—";
    return `${n.toFixed(2)}%`;
}

function safeStr(v?: string | null) {
    return v?.trim?.() ? v.trim() : "—";
}

function prettyMotivation(v?: string) {
    const map: Record<string, string> = {
        family: "Housing for family",
        rental: "Rental income",
        office: "Home office / studio",
        guest: "Guest housing",
        value: "Increase property value",
        other: "Other",
    };
    return map[v ?? ""] ?? (v ?? "—");
}

function prettyAduType(v?: string) {
    const map: Record<string, string> = {
        detachedNew: "Detached New Construction",
        attachedNew: "Attached New Construction",
        garageConversion: "Garage Conversion",
        jadu: "JADU (≤ 500 sq ft)",
    };
    return map[v ?? ""] ?? (v ?? "—");
}

function prettyTimeframe(v?: string | null) {
    const map: Record<string, string> = {
        asap: "ASAP",
        "3to6": "3–6 months",
        "6to12": "6–12 months",
        flexible: "Flexible",
    };
    return v ? map[v] ?? v : "—";
}

type PillTone = "included" | "upgrade" | "site";

function toneLabel(t: PillTone) {
    if (t === "upgrade") return "Optional Upgrade";
    if (t === "site") return "Site-Specific";
    return "Included";
}

/** Builds a “confidence/completeness” score based on how much was provided. */
function computeCompleteness(data: any) {
    const has = (x: any) => x !== undefined && x !== null && String(x).trim() !== "";
    const points: Array<boolean> = [
        has(data?.contact?.name),
        has(data?.contact?.phone),
        has(data?.contact?.email),
        has(data?.property?.address),
        has(data?.property?.city),
        has(data?.project?.motivation),
        has(data?.project?.aduType),
        has(data?.project?.bed),
        has(data?.project?.bath),
        has(data?.project?.timeframe),
        has(data?.selections?.floorplan?.name),
        has(data?.finance?.status),
        has(data?.finance?.path),
    ];

    const score = Math.round((points.filter(Boolean).length / points.length) * 100);
    const label =
        score >= 90 ? "Excellent" : score >= 75 ? "Strong" : score >= 60 ? "Good" : "Basic";
    return { score, label };
}

/** Make “risk signals” look intentional (even with minimal data). */
function buildRiskSummary(data: any) {
    // You have BOTH: riskFlags array AND siteSpecific object.
    const riskFlags = Array.isArray(data?.riskFlags) ? data.riskFlags : [];
    const siteSpecificObj = (data?.selections?.siteSpecific ?? {}) as Record<
        string,
        { title?: string; status?: string }
    >;

    const flagged = Object.values(siteSpecificObj).filter((x) => x?.status && x.status !== "unknown");
    const mightApply = flagged.filter((x) => x?.status === "might_apply").length;
    const notApply = flagged.filter((x) => x?.status === "not_apply").length;

    const count = Math.max(riskFlags.length, flagged.length);
    const severity =
        count === 0 ? "Low" : mightApply >= 2 ? "Moderate" : mightApply === 1 ? "Focused" : "Low";

    return {
        count,
        severity,
        mightApply,
        notApply,
        list:
            flagged.length > 0
                ? flagged.map((x) => x?.title || "Site-specific item")
                : riskFlags,
    };
}

/* =========================
   Design system
========================= */

const COLORS = {
    ink: "#0B1220",
    sub: "#3B445A",
    mute: "#6B7280",
    hair: "#E6E9EF",
    paper: "#FFFFFF",
    fog: "#F7F8FB",

    brand: "#0E2B4A", // brand dark blue feel
    sand: "#F3E8D7",  // beige
    gold: "#B99764",  // warm accent
    green: "#117D4B",
    amber: "#B45309",
};

const S = StyleSheet.create({
    page: {
        paddingTop: 34,
        paddingBottom: 34,
        paddingHorizontal: 34,
        fontSize: 11,
        color: COLORS.ink,
        backgroundColor: COLORS.paper,
    },

    /* Layout */
    row: { flexDirection: "row", alignItems: "center" },
    rowTop: { flexDirection: "row", alignItems: "flex-start" },
    col: { flexDirection: "column" },
    gap8: { gap: 8 as any },
    gap12: { gap: 12 as any },
    gap16: { gap: 16 as any },
    mt8: { marginTop: 8 },
    mt12: { marginTop: 12 },
    mt16: { marginTop: 16 },
    mt20: { marginTop: 20 },
    mt24: { marginTop: 24 },

    /* Typography */
    h1: { fontSize: 22, fontWeight: 800, letterSpacing: -0.2, color: COLORS.ink },
    h2: { fontSize: 16, fontWeight: 800, letterSpacing: -0.2, color: COLORS.ink },
    h3: { fontSize: 12, fontWeight: 800, color: COLORS.brand },
    lead: { fontSize: 11, lineHeight: 1.45, color: COLORS.sub },
    small: { fontSize: 10, lineHeight: 1.4, color: COLORS.mute },

    /* Cards */
    card: {
        borderWidth: 1,
        borderColor: COLORS.hair,
        borderRadius: 14,
        padding: 14,
        backgroundColor: COLORS.paper,
    },
    softCard: {
        borderWidth: 1,
        borderColor: COLORS.hair,
        borderRadius: 14,
        padding: 14,
        backgroundColor: COLORS.fog,
    },
    divider: { height: 1, backgroundColor: COLORS.hair, marginTop: 12, marginBottom: 12 },

    /* Pills */
    pill: {
        borderWidth: 1,
        borderColor: COLORS.hair,
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 6,
        backgroundColor: COLORS.paper,
    },
    pillText: { fontSize: 10, fontWeight: 700, color: COLORS.sub },

    pillUpgrade: { backgroundColor: "#FFF7ED", borderColor: "#FED7AA" },
    pillSite: { backgroundColor: "#EFF6FF", borderColor: "#BFDBFE" },
    pillIncluded: { backgroundColor: "#ECFDF5", borderColor: "#A7F3D0" },

    /* Footer */
    footer: {
        position: "absolute",
        left: 34,
        right: 34,
        bottom: 22,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        borderTopWidth: 1,
        borderTopColor: COLORS.hair,
        paddingTop: 10,
    },

    footerLeft: { fontSize: 9, color: COLORS.mute },
    footerRight: { fontSize: 9, color: COLORS.mute },

    /* Images */
    heroImg: { width: "100%", height: 210, borderRadius: 16 },
    imgSmall: { width: "100%", height: 130, borderRadius: 14, backgroundColor: COLORS.fog },

    /* Stat blocks */
    statGrid: { flexDirection: "row", gap: 10 as any },
    stat: {
        flexGrow: 1,
        borderWidth: 1,
        borderColor: COLORS.hair,
        borderRadius: 14,
        padding: 12,
        backgroundColor: COLORS.paper,
    },
    statK: { fontSize: 9, color: COLORS.mute, fontWeight: 700, textTransform: "uppercase" },
    statV: { fontSize: 14, fontWeight: 900, color: COLORS.ink, marginTop: 6 },
    statS: { fontSize: 10, color: COLORS.sub, marginTop: 2 },

    /* CTA */
    ctaCard: {
        borderWidth: 1,
        borderColor: "#F5D8A7",
        borderRadius: 18,
        padding: 16,
        backgroundColor: COLORS.sand,
    },
    ctaTitle: { fontSize: 16, fontWeight: 900, color: COLORS.brand, letterSpacing: -0.2 },
    ctaLead: { fontSize: 11, color: COLORS.sub, lineHeight: 1.45, marginTop: 8 },
    ctaBullets: { marginTop: 10, gap: 6 as any },
    bulletRow: { flexDirection: "row", gap: 8 as any, alignItems: "flex-start" },
    bulletDot: {
        width: 6,
        height: 6,
        borderRadius: 999,
        backgroundColor: COLORS.gold,
        marginTop: 5,
    },
    bulletText: { fontSize: 11, color: COLORS.sub, lineHeight: 1.45 },

    /* Confidence bar */
    barWrap: {
        height: 10,
        borderRadius: 999,
        backgroundColor: "#EEF2F7",
        overflow: "hidden",
        borderWidth: 1,
        borderColor: COLORS.hair,
    },
    barFill: { height: "100%", backgroundColor: COLORS.gold },

    /* Table rows */
    tableRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 12 as any,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.hair,
    },
    tableKey: { fontSize: 10, color: COLORS.mute, fontWeight: 700 },
    tableVal: { fontSize: 10.5, color: COLORS.sub, fontWeight: 700, textAlign: "right" },
});

/* =========================
   Reusable components
========================= */

function Footer({ brandName, address, page }: { brandName: string; address: string; page: number }) {
    return (
        <View style={S.footer} fixed>
            <Text style={S.footerLeft}>{brandName} • {address}</Text>
            <Text style={S.footerRight}>Feasibility Report • Page {page}</Text>
        </View>
    );
}

function Pill({ tone, text }: { tone: PillTone; text: string }) {
    const toneStyle =
        tone === "upgrade" ? S.pillUpgrade : tone === "site" ? S.pillSite : S.pillIncluded;
    return (
        <View style={[S.pill, toneStyle]}>
            <Text style={S.pillText}>{text}</Text>
        </View>
    );
}

function SectionTitle({ label }: { label: string }) {
    return <Text style={S.h3}>{label}</Text>;
}

function ConfidenceBar({ score }: { score: number }) {
    return (
        <View style={S.barWrap}>
            <View style={[S.barFill, { width: `${Math.max(0, Math.min(100, score))}%` }]} />
        </View>
    );
}

/* =========================
   Main PDF
========================= */

export function FeasibilityPdf({ data }: { data: any }) {
    const brandName = safeStr(data?.brand?.brandName) !== "—" ? safeStr(data?.brand?.brandName) : "Backyard Estates";
    const tagline =
        safeStr(data?.brand?.tagline) !== "—"
            ? safeStr(data?.brand?.tagline)
            : "Real numbers. Real timeline. Zero surprises.";

    const coverUrl = data?.brand?.coverUrl || data?.brand?.logoUrl || null;

    const addressLine = `${safeStr(data?.property?.address)}, ${safeStr(data?.property?.city)}`;

    const floorplan = data?.selections?.floorplan ?? null;
    const finance = data?.finance ?? {};
    const completeness = computeCompleteness(data);
    const risk = buildRiskSummary(data);

    // Equity snapshot
    const homeValue = typeof finance?.homeValueEstimate === "number" ? finance.homeValueEstimate : null;
    const mortgage = typeof finance?.mortgageBalance === "number" ? finance.mortgageBalance : null;
    const equity = homeValue != null && mortgage != null ? Math.max(0, homeValue - mortgage) : null;

    // Optional upgrades (your stored object format)
    const upgradesObj = (data?.selections?.optionalUpgrades ?? {}) as Record<string, any>;
    const selectedUpgrades = Object.entries(upgradesObj)
        .filter(([, v]) => v?.selected === true || v?.selected === "true")
        .map(([id, v]) => ({ id, title: v?.title ?? id, cost: v?.cost ?? null }));

    // Site-specific flagged
    const siteObj = (data?.selections?.siteSpecific ?? {}) as Record<string, any>;
    const flaggedSite = Object.entries(siteObj)
        .filter(([, v]) => v?.status && v.status !== "unknown")
        .map(([id, v]) => ({ id, title: v?.title ?? id, status: v?.status, cost: v?.cost ?? null }));

    const processImgs: string[] = Array.isArray(data?.brand?.processUrls) ? data.brand.processUrls : [];
    const gallery: string[] = Array.isArray(floorplan?.galleryUrls) ? floorplan.galleryUrls : [];

    const buildSpeedClaim = "Fast-build execution with weekly updates and disciplined project management.";
    const whyFpa = [
        "Confirm site realities (utilities, setbacks, access) before budget is locked.",
        "Replace assumptions with verified scope + fixed cost ranges.",
        "Prevent late surprises that cause delays, change orders, and stress.",
    ];

    return (
        <Document>
            {/* =========================================================
          Page 1 — Cover
      ========================================================= */}
            <Page size="LETTER" style={S.page}>
                <View style={{ gap: 14 as any }}>
                    <View style={[S.rowTop, { justifyContent: "space-between", gap: 12 as any }]}>
                        <View style={{ flex: 1 }}>
                            <Text style={S.small}>ADU Feasibility & Investment Engine™</Text>
                            <Text style={S.h1}>Feasibility Report</Text>
                            <Text style={[S.lead, { marginTop: 6 }]}>{tagline}</Text>

                            <View style={[S.softCard, { marginTop: 14 }]}>
                                <Text style={S.small}>Prepared for</Text>
                                <Text style={[S.h2, { marginTop: 3 }]}>{safeStr(data?.contact?.name)}</Text>

                                <View style={[S.divider, { marginTop: 10, marginBottom: 10 }]} />

                                <Text style={S.small}>Property</Text>
                                <Text style={[S.lead, { marginTop: 2 }]}>{addressLine}</Text>

                                <View style={{ marginTop: 12 }}>
                                    <Text style={S.small}>Report readiness</Text>
                                    <View style={{ marginTop: 6 }}>
                                        <ConfidenceBar score={completeness.score} />
                                    </View>
                                    <Text style={[S.small, { marginTop: 6 }]}>
                                        Completeness: <Text style={{ fontWeight: 800 }}>{completeness.score}%</Text> • {completeness.label}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        <View style={{ width: 220, gap: 10 as any }}>
                            {data?.brand?.logoUrl ? (
                                <Image src={data.brand.logoUrl} style={{ width: 140, height: 40, objectFit: "contain" }} />
                            ) : null}

                            {coverUrl ? <Image src={coverUrl} style={S.imgSmall} /> : <View style={S.imgSmall} />}

                            <View style={S.card}>
                                <Text style={S.small}>Project snapshot</Text>
                                <View style={{ marginTop: 10 }}>
                                    <View style={S.tableRow}>
                                        <Text style={S.tableKey}>Motivation</Text>
                                        <Text style={S.tableVal}>{prettyMotivation(data?.project?.motivation)}</Text>
                                    </View>
                                    <View style={S.tableRow}>
                                        <Text style={S.tableKey}>ADU Type</Text>
                                        <Text style={S.tableVal}>{prettyAduType(data?.project?.aduType)}</Text>
                                    </View>
                                    <View style={S.tableRow}>
                                        <Text style={S.tableKey}>Layout</Text>
                                        <Text style={S.tableVal}>
                                            {data?.project?.bed ?? "—"} bd / {data?.project?.bath ?? "—"} ba
                                        </Text>
                                    </View>
                                    <View style={[S.tableRow, { borderBottomWidth: 0 }]}>
                                        <Text style={S.tableKey}>Timeframe</Text>
                                        <Text style={S.tableVal}>{prettyTimeframe(data?.project?.timeframe)}</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </View>

                    <View style={S.card}>
                        <Text style={S.h3}>What this report is (and isn’t)</Text>
                        <Text style={[S.lead, { marginTop: 6 }]}>
                            This is a high-clarity feasibility summary based on your inputs plus our plan validation approach.
                            The next step to lock real numbers is the <Text style={{ fontWeight: 900 }}>Formal Property Analysis</Text>.
                        </Text>
                    </View>
                </View>

                <Footer brandName={brandName} address={addressLine} page={1} />
            </Page>

            {/* =========================================================
          Page 2 — Executive Summary
      ========================================================= */}
            <Page size="LETTER" style={S.page}>
                <Text style={S.h1}>Executive Summary</Text>
                <Text style={[S.lead, { marginTop: 8 }]}>
                    Your feasibility outcome depends on a small number of “truths” we validate early: utilities, access, setbacks/easements,
                    and how your chosen plan fits your property. We build our process around confirming those truths before you commit.
                </Text>

                <View style={[S.statGrid, { marginTop: 16 }]}>
                    <View style={S.stat}>
                        <Text style={S.statK}>Selected floorplan</Text>
                        <Text style={S.statV}>{floorplan?.name ? floorplan.name : "—"}</Text>
                        <Text style={S.statS}>
                            {floorplan?.sqft ? `${floorplan.sqft} sqft` : "—"} • {floorplan?.bed ?? "—"} bd / {floorplan?.bath ?? "—"} ba
                        </Text>
                    </View>

                    <View style={S.stat}>
                        <Text style={S.statK}>Plan price</Text>
                        <Text style={S.statV}>{floorplan?.price ? money(floorplan.price) : "—"}</Text>
                        <Text style={S.statS}>Base plan pricing (site-dependent items verified in FPA)</Text>
                    </View>

                    <View style={S.stat}>
                        <Text style={S.statK}>Risk signals</Text>
                        <Text style={S.statV}>{risk.severity}</Text>
                        <Text style={S.statS}>{risk.count} item(s) to validate early</Text>
                    </View>
                </View>

                <View style={[S.rowTop, { marginTop: 16, gap: 12 as any }]}>
                    <View style={[S.card, { flex: 1 }]}>
                        <SectionTitle label="What we can say right now" />
                        <View style={{ marginTop: 10, gap: 8 as any }}>
                            <View style={S.bulletRow}>
                                <View style={[S.bulletDot, { backgroundColor: COLORS.green }]} />
                                <Text style={S.bulletText}>Your plan direction is clear (motivation + ADU type + layout + floorplan).</Text>
                            </View>
                            <View style={S.bulletRow}>
                                <View style={[S.bulletDot, { backgroundColor: COLORS.green }]} />
                                <Text style={S.bulletText}>We can scope a high-confidence base build approach around your selections.</Text>
                            </View>
                            <View style={S.bulletRow}>
                                <View style={[S.bulletDot, { backgroundColor: COLORS.amber }]} />
                                <Text style={S.bulletText}>
                                    Site-specific validation is required to lock final cost + schedule (utilities, access, and setbacks/easements).
                                </Text>
                            </View>
                        </View>
                    </View>

                    <View style={[S.softCard, { width: 240 }]}>
                        <SectionTitle label="Your inputs" />
                        <View style={{ marginTop: 10 }}>
                            <Text style={S.small}>Financing status</Text>
                            <Text style={[S.lead, { fontWeight: 800, marginTop: 2 }]}>{safeStr(finance?.status)}</Text>

                            <View style={S.divider} />

                            <Text style={S.small}>Financing path</Text>
                            <Text style={[S.lead, { fontWeight: 800, marginTop: 2 }]}>{safeStr(finance?.path)}</Text>

                            <View style={S.divider} />

                            <Text style={S.small}>Value boost section</Text>
                            <Text style={[S.lead, { fontWeight: 800, marginTop: 2 }]}>
                                {finance?.wantsValueBoostAnalysis === "yes" ? "Included" : finance?.wantsValueBoostAnalysis === "no" ? "Skipped" : "—"}
                            </Text>
                        </View>
                    </View>
                </View>

                <Footer brandName={brandName} address={addressLine} page={2} />
            </Page>

            {/* =========================================================
          Page 3 — Floorplan Spotlight
      ========================================================= */}
            <Page size="LETTER" style={S.page}>
                <Text style={S.h1}>Floorplan Spotlight</Text>
                <Text style={[S.lead, { marginTop: 8 }]}>
                    A good feasibility outcome starts with the right plan. Below is your selected plan and the key metrics we validate
                    during the Formal Property Analysis.
                </Text>

                <View style={[S.rowTop, { marginTop: 16, gap: 12 as any }]}>
                    <View style={{ flex: 1, gap: 10 as any }}>
                        {floorplan?.drawingUrl ? (
                            <Image src={floorplan.drawingUrl} style={S.heroImg} />
                        ) : floorplan?.heroUrl ? (
                            <Image src={floorplan.heroUrl} style={S.heroImg} />
                        ) : (
                            <View style={S.heroImg} />
                        )}

                        <View style={S.card}>
                            <Text style={S.h3}>Plan metrics</Text>
                            <View style={{ marginTop: 10 }}>
                                <View style={S.tableRow}>
                                    <Text style={S.tableKey}>Plan</Text>
                                    <Text style={S.tableVal}>{safeStr(floorplan?.name)}</Text>
                                </View>
                                <View style={S.tableRow}>
                                    <Text style={S.tableKey}>Size</Text>
                                    <Text style={S.tableVal}>{floorplan?.sqft ? `${floorplan.sqft} sqft` : "—"}</Text>
                                </View>
                                <View style={S.tableRow}>
                                    <Text style={S.tableKey}>Layout</Text>
                                    <Text style={S.tableVal}>
                                        {floorplan?.bed ?? "—"} bd / {floorplan?.bath ?? "—"} ba
                                    </Text>
                                </View>
                                <View style={[S.tableRow, { borderBottomWidth: 0 }]}>
                                    <Text style={S.tableKey}>Base plan price</Text>
                                    <Text style={S.tableVal}>{floorplan?.price ? money(floorplan.price) : "—"}</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    <View style={{ width: 240, gap: 12 as any }}>
                        <View style={S.softCard}>
                            <Text style={S.h3}>What we validate in FPA</Text>
                            <View style={{ marginTop: 10, gap: 8 as any }}>
                                {["Setbacks/easements fit", "Utility tie-in distance", "Access + equipment path", "Electrical/Water capacity"].map((t, i) => (
                                    <View key={i} style={S.bulletRow}>
                                        <View style={S.bulletDot} />
                                        <Text style={S.bulletText}>{t}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>

                        <View style={S.card}>
                            <Text style={S.h3}>Why this matters</Text>
                            <Text style={[S.lead, { marginTop: 8 }]}>
                                These checks are what separate a calm build from a stressful one. Our process is designed to surface surprises
                                early—before the budget is locked.
                            </Text>
                        </View>

                        {gallery?.[0] ? <Image src={gallery[0]} style={S.imgSmall} /> : <View style={S.imgSmall} />}
                    </View>
                </View>

                <Footer brandName={brandName} address={addressLine} page={3} />
            </Page>

            {/* =========================================================
          Page 4 — Scope Snapshot
      ========================================================= */}
            <Page size="LETTER" style={S.page}>
                <Text style={S.h1}>Scope Snapshot</Text>
                <Text style={[S.lead, { marginTop: 8 }]}>
                    We collect this level of detail upfront so your project stays predictable. This is where quality shows up:
                    clear scope, clean assumptions, and transparent upgrades.
                </Text>

                <View style={[S.rowTop, { marginTop: 16, gap: 12 as any }]}>
                    <View style={[S.card, { flex: 1 }]}>
                        <SectionTitle label="Included (base scope)" />
                        <Text style={[S.small, { marginTop: 6 }]}>
                            Your full included breakdown is available in the feasibility tool. Below is the credibility snapshot we want you to feel.
                        </Text>

                        <View style={[S.row, { flexWrap: "wrap", gap: 8 as any, marginTop: 12 }]}>
                            {[
                                "Architectural Plans",
                                "Structural Engineering",
                                "Title 24",
                                "Permit Support",
                                "Project Management",
                                "City Inspections",
                                "Turn-Key Construction",
                                "Premium Finishes",
                            ].map((t, i) => (
                                <Pill key={i} tone="included" text={t} />
                            ))}
                        </View>

                        <View style={[S.divider, { marginTop: 14, marginBottom: 12 }]} />

                        <Text style={S.h3}>What “included” means here</Text>
                        <Text style={[S.lead, { marginTop: 6 }]}>
                            Not vague marketing language—real scope coverage. We treat clarity as a feature because it prevents change orders and stress.
                        </Text>
                    </View>

                    <View style={{ width: 240, gap: 12 as any }}>
                        <View style={S.softCard}>
                            <SectionTitle label="Optional upgrades selected" />
                            <Text style={[S.small, { marginTop: 6 }]}>
                                Selected enhancements (easy to include, transparent cost impacts).
                            </Text>

                            <View style={[S.row, { flexWrap: "wrap", gap: 8 as any, marginTop: 12 }]}>
                                {selectedUpgrades.length ? (
                                    selectedUpgrades.map((u) => <Pill key={u.id} tone="upgrade" text={u.title} />)
                                ) : (
                                    <Text style={S.lead}>None selected — that’s okay.</Text>
                                )}
                            </View>
                        </View>

                        {processImgs?.[0] ? <Image src={processImgs[0]} style={S.imgSmall} /> : <View style={S.imgSmall} />}
                    </View>
                </View>

                <Footer brandName={brandName} address={addressLine} page={4} />
            </Page>

            {/* =========================================================
          Page 5 — Site-Specific Validation
      ========================================================= */}
            <Page size="LETTER" style={S.page}>
                <Text style={S.h1}>Site-Specific Validation</Text>
                <Text style={[S.lead, { marginTop: 8 }]}>
                    Site-specific items are where most surprises come from. We treat them as first-class citizens—identified early,
                    explained clearly, and verified through a Formal Property Analysis.
                </Text>

                <View style={[S.rowTop, { marginTop: 16, gap: 12 as any }]}>
                    <View style={[S.card, { flex: 1 }]}>
                        <SectionTitle label="Items flagged for your property" />
                        <Text style={[S.small, { marginTop: 6 }]}>
                            The goal isn’t to scare you—it’s to protect your budget and timeline by validating these early.
                        </Text>

                        <View style={{ marginTop: 12 }}>
                            {flaggedSite.length ? (
                                flaggedSite.map((it) => (
                                    <View key={it.id} style={[S.tableRow, { alignItems: "center" }]}>
                                        <Text style={[S.tableKey, { flex: 1 }]}>{it.title}</Text>
                                        <Text style={S.tableVal}>
                                            {it.status === "might_apply" ? "Might apply" : it.status === "not_apply" ? "Unlikely" : "—"}
                                        </Text>
                                    </View>
                                ))
                            ) : (
                                <Text style={S.lead}>No site-specific items flagged yet — the FPA confirms what’s real.</Text>
                            )}
                        </View>

                        <View style={[S.softCard, { marginTop: 14 }]}>
                            <Text style={S.h3}>What happens in the Formal Property Analysis</Text>
                            <View style={{ marginTop: 10, gap: 8 as any }}>
                                {[
                                    "We verify setbacks/easements against the chosen plan footprint.",
                                    "We confirm utility requirements (water, sewer, electrical) and upgrade triggers.",
                                    "We identify access constraints that affect excavation and staging.",
                                    "We produce a property-specific scope + cost reality check—before construction begins.",
                                ].map((t, i) => (
                                    <View key={i} style={S.bulletRow}>
                                        <View style={S.bulletDot} />
                                        <Text style={S.bulletText}>{t}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    </View>

                    <View style={{ width: 240, gap: 12 as any }}>
                        <View style={S.ctaCard}>
                            <Text style={S.ctaTitle}>This is why families book the FPA</Text>
                            <Text style={S.ctaLead}>
                                It’s the step that converts uncertainty into confidence. It’s where we earn trust—with proof.
                            </Text>

                            <View style={S.ctaBullets}>
                                {whyFpa.map((t, i) => (
                                    <View key={i} style={S.bulletRow}>
                                        <View style={S.bulletDot} />
                                        <Text style={S.bulletText}>{t}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>

                        {processImgs?.[1] ? <Image src={processImgs[1]} style={S.imgSmall} /> : <View style={S.imgSmall} />}
                    </View>
                </View>

                <Footer brandName={brandName} address={addressLine} page={5} />
            </Page>

            {/* =========================================================
          Page 6 — Financing + Value Context
      ========================================================= */}
            <Page size="LETTER" style={S.page}>
                <Text style={S.h1}>Financing Snapshot</Text>
                <Text style={[S.lead, { marginTop: 8 }]}>
                    These are your inputs—not a quote. We include them so your report language and assumptions match your reality.
                </Text>

                <View style={[S.rowTop, { marginTop: 16, gap: 12 as any }]}>
                    <View style={[S.card, { flex: 1 }]}>
                        <SectionTitle label="Your inputs" />
                        <View style={{ marginTop: 12 }}>
                            <View style={S.tableRow}>
                                <Text style={S.tableKey}>Status</Text>
                                <Text style={S.tableVal}>{safeStr(finance?.status)}</Text>
                            </View>
                            <View style={S.tableRow}>
                                <Text style={S.tableKey}>Path</Text>
                                <Text style={S.tableVal}>{safeStr(finance?.path)}</Text>
                            </View>
                            <View style={S.tableRow}>
                                <Text style={S.tableKey}>Down payment</Text>
                                <Text style={S.tableVal}>{typeof finance?.downPayment === "number" ? money(finance.downPayment) : "—"}</Text>
                            </View>
                            <View style={S.tableRow}>
                                <Text style={S.tableKey}>Loan term</Text>
                                <Text style={S.tableVal}>{finance?.termMonths ? `${Math.round(finance.termMonths / 12)} years` : "—"}</Text>
                            </View>
                            <View style={[S.tableRow, { borderBottomWidth: 0 }]}>
                                <Text style={S.tableKey}>Interest rate</Text>
                                <Text style={S.tableVal}>{typeof finance?.ratePct === "number" ? pct(finance.ratePct) : "—"}</Text>
                            </View>
                        </View>

                        <View style={[S.softCard, { marginTop: 14 }]}>
                            <Text style={S.h3}>What we do with this</Text>
                            <Text style={[S.lead, { marginTop: 6 }]}>
                                We keep assumptions realistic, explain tradeoffs clearly, and prevent “surprise financing gaps” by aligning scope
                                with your plan from day one.
                            </Text>
                        </View>
                    </View>

                    <View style={{ width: 240, gap: 12 as any }}>
                        <View style={S.card}>
                            <SectionTitle label="Property value boost" />
                            <Text style={[S.small, { marginTop: 6 }]}>
                                If included, we’ll add a value context section. The FPA is what makes it credible.
                            </Text>

                            <View style={{ marginTop: 12 }}>
                                <View style={S.tableRow}>
                                    <Text style={S.tableKey}>Included?</Text>
                                    <Text style={S.tableVal}>
                                        {finance?.wantsValueBoostAnalysis === "yes" ? "Yes" : finance?.wantsValueBoostAnalysis === "no" ? "No" : "—"}
                                    </Text>
                                </View>
                                <View style={S.tableRow}>
                                    <Text style={S.tableKey}>Home value</Text>
                                    <Text style={S.tableVal}>{homeValue != null ? money(homeValue) : "—"}</Text>
                                </View>
                                <View style={S.tableRow}>
                                    <Text style={S.tableKey}>Mortgage</Text>
                                    <Text style={S.tableVal}>{mortgage != null ? money(mortgage) : "—"}</Text>
                                </View>
                                <View style={[S.tableRow, { borderBottomWidth: 0 }]}>
                                    <Text style={S.tableKey}>Equity snapshot</Text>
                                    <Text style={S.tableVal}>{equity != null ? money(equity) : "—"}</Text>
                                </View>
                            </View>
                        </View>

                        {processImgs?.[2] ? <Image src={processImgs[2]} style={S.imgSmall} /> : <View style={S.imgSmall} />}
                    </View>
                </View>

                <Footer brandName={brandName} address={addressLine} page={6} />
            </Page>

            {/* =========================================================
          Page 7 — Process + Timeline + CTA
      ========================================================= */}
            <Page size="LETTER" style={S.page}>
                <Text style={S.h1}>How we build with speed + integrity</Text>
                <Text style={[S.lead, { marginTop: 8 }]}>
                    Speed only matters if quality stays high. Our system is built to reduce unknowns early, keep communication weekly,
                    and execute cleanly—with no games.
                </Text>

                <View style={[S.rowTop, { marginTop: 16, gap: 12 as any }]}>
                    <View style={[S.card, { flex: 1 }]}>
                        <SectionTitle label="What makes this different" />
                        <View style={{ marginTop: 10, gap: 8 as any }}>
                            {[
                                "We surface risk early instead of “discovering it” mid-build.",
                                "We document scope clearly (included vs optional vs site-specific).",
                                "We run disciplined project management with weekly updates.",
                                "We build trust by being transparent about what’s known vs what must be verified.",
                            ].map((t, i) => (
                                <View key={i} style={S.bulletRow}>
                                    <View style={S.bulletDot} />
                                    <Text style={S.bulletText}>{t}</Text>
                                </View>
                            ))}
                        </View>

                        <View style={[S.softCard, { marginTop: 14 }]}>
                            <Text style={S.h3}>Build speed (what you should expect)</Text>
                            <Text style={[S.lead, { marginTop: 6 }]}>{buildSpeedClaim}</Text>
                            <Text style={[S.small, { marginTop: 8 }]}>
                                Final timeline depends on permitting and site validation. We move fast by reducing unknowns and keeping decisions clear.
                            </Text>
                        </View>
                    </View>

                    <View style={{ width: 240, gap: 12 as any }}>
                        <View style={S.ctaCard}>
                            <Text style={S.ctaTitle}>Next step: Formal Property Analysis</Text>
                            <Text style={S.ctaLead}>
                                This is where we confirm feasibility and lock the reality: utilities, setbacks, access, and true scope.
                            </Text>

                            <View style={S.ctaBullets}>
                                {[
                                    "Property-specific feasibility confirmation",
                                    "Verified scope + cost ranges (no guesswork)",
                                    "Permit + site constraints identified early",
                                    "A plan your family can trust",
                                ].map((t, i) => (
                                    <View key={i} style={S.bulletRow}>
                                        <View style={S.bulletDot} />
                                        <Text style={S.bulletText}>{t}</Text>
                                    </View>
                                ))}
                            </View>

                            <View style={{ marginTop: 12 }}>
                                <Text style={[S.small, { color: COLORS.brand, fontWeight: 800 }]}>
                                    Recommendation
                                </Text>
                                <Text style={[S.lead, { marginTop: 4 }]}>
                                    Book your FPA to validate the {risk.count ? "flagged site-specific items" : "last unknowns"} and lock real numbers.
                                </Text>
                            </View>
                        </View>

                        {processImgs?.[3] ? <Image src={processImgs[3]} style={S.imgSmall} /> : <View style={S.imgSmall} />}
                    </View>
                </View>

                <Footer brandName={brandName} address={addressLine} page={7} />
            </Page>
        </Document>
    );
}
