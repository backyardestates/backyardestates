// lib/feasibility/pdf/FeasibilityPdf.tsx
import React from "react";
import {
    Document,
    Page,
    Text,
    View,
    Image,
    StyleSheet,
    Link,
    // Font,
} from "@react-pdf/renderer";

import { FeasibilityStoreData } from "./types";
import { computeFeasibility } from "./compute";
import { palette } from "./palette";
import { formatDate, money, moneyRange, pct } from "./format";
import { buildValueSections } from "./valueWeBring";
import { INCLUDED_BASE } from "@/lib/IncludedScope";
/**
 * ✅ IMPORTANT
 * This PDF expects you to pass assets into `data.assets`:
 * data.assets.reportAssets.gallery[] -> from REPORT_ASSETS query
 * data.assets.testimonials[]         -> from CUSTOMER_STORIES_QUERY (must include portraitUrl, quote, etc.)
 * data.assets.comparables[]          -> from RELATED_PROPERTIES_QUERY (ideally includes photoUrl)
 */
const BEFORE_AFTER_DEFAULT = [
    { left: "Assumptions", right: "Verified facts" },
    { left: "Budget swings", right: "Locked cost ranges" },
    { left: "City delays", right: "Clear permit strategy" },
    { left: "Surprise upgrades", right: "Known site triggers" },
    { left: "Stress", right: "Confidence and control" },
];


// -----------------------------
// Robust image source helpers
// -----------------------------
function isHttpUrl(v: any) {
    return typeof v === "string" && /^https?:\/\//i.test(v);
}

/**
 * Returns a plain URL or null.
 */
function safeSrc(input: any): string | null {
    if (!input) return null;
    if (isHttpUrl(input)) return input;

    const candidates = [
        input?.url,
        input?.imageUrl,
        input?.secure_url,
        input?.asset?.url,
        input?.image?.asset?.url,
        input?.image?.url,
        input?.portraitUrl,
        input?.portrait?.asset?.url,
        input?.portrait?.url,
        input?.photoUrl,
        input?.photo?.asset?.url,
        input?.photo?.url,
        input?.coverUrl,
        input?.logoUrl,
    ];

    for (const c of candidates) if (isHttpUrl(c)) return c;
    return null;
}

function groupByCategory(items: any[]) {
    const m: Record<string, any[]> = {};
    items.forEach((it) => {
        const key = it.category ?? "other";
        if (!m[key]) m[key] = [];
        m[key].push(it);
    });
    return m;
}

const CATEGORY_LABELS: Record<string, string> = {
    design: "Design & Planning",
    permits: "Permits & Coordination",
    construction: "Construction",
    project_management: "Project Management",
    design_finish_features: "Our Included Finishes",
};

type Props = { data: FeasibilityStoreData };

export function FeasibilityPdf({ data }: Props) {
    const c = computeFeasibility(data);

    const brandName = data.brand?.brandName ?? "Backyard Estates";
    const bannerUrl = "https://res.cloudinary.com/backyardestates/image/upload/v1770305303/Team/ADUSeminar_fgfzda.png";
    const wideLogoUrl = "https://res.cloudinary.com/backyardestates/image/upload/v1770304856/Team/full_black_long_logo-2_ldkn23.png";
    const logoUrl = "https://res.cloudinary.com/backyardestates/image/upload/v1770306239/Team/Logo_Black_-_Edited_yevij8.png"

    const contact = data.contact;
    const addressLine = data.property?.address ?? "";
    const cityLine = data.property?.city ? `, ${data.property.city}` : "";

    const floorplanDrawing = safeSrc(data.selections?.floorplan?.drawing?.url) ?? null;

    const reportDate = formatDate(data.generatedAt);

    const value = buildValueSections({
        optionalUpgrades: data.selections?.optionalUpgrades ?? null,
        siteSpecific: data.selections?.siteSpecific ?? null,
    });

    // ✅ Expect these to be populated by your route handler
    const testimonials = data.assets?.testimonials ?? [];
    const comparables = data.assets?.comparables ?? [];

    const includedItems = value.includedHighlights ?? [];
    const useTwoCol = includedItems.length > 6; // tweak threshold
    const mid = Math.ceil(includedItems.length / 2);
    const left = useTwoCol ? includedItems.slice(0, mid) : includedItems;
    const right = useTwoCol ? includedItems.slice(mid) : [];
    const beforeAfter =
        data.copy?.beforeAfter?.rows?.length
            ? data.copy.beforeAfter.rows
            : BEFORE_AFTER_DEFAULT;

    const beforeAfterTitle =
        data.copy?.beforeAfter?.title ?? "Before / After Reality";

    const includedBaseGrouped = groupByCategory(INCLUDED_BASE);

    const baseBuildCategories = ["design", "permits", "construction", "project_management"];

    const finishes = includedBaseGrouped["design_finish_features"] ?? [];

    const ctaUrl = data?.ctaUrl ?? "https://calendly.com/d/cr86-j2b-gcj/onsite-visit-fpa";
    const ctaLabel = data?.ctaLabel ?? "Book your Formal Property Analysis";

    return (
        <Document title={`Feasibility Report - ${contact.name}`}>
            {/* 1) COVER */}
            <Page size="LETTER" style={styles.page}>
                <View style={styles.coverWrap}>
                    <View style={styles.coverTop}>
                        <View style={styles.brandRow}>
                            {wideLogoUrl ? (
                                <Image src={wideLogoUrl} style={styles.logo} />
                            ) : (
                                <View style={styles.logoFallback}>
                                    <Text style={styles.logoFallbackText}>{brandName}</Text>
                                </View>
                            )}

                        </View>
                        {/* <View style={styles.coverHero}> */}
                        <Image src={bannerUrl} style={styles.coverImage} />
                        {/* </View> */}
                        <View>
                            <Text style={styles.coverTitle}>Your ADU Feasibility Report</Text>
                            <Text style={styles.metaValue}>{contact.name}</Text>
                            <Text style={styles.overlayTitle}>
                                {addressLine}
                                {cityLine}
                            </Text>
                            <Text style={styles.metaMuted}>{reportDate}</Text>
                        </View>

                    </View>

                </View>
            </Page>

            {/* 2) SELECTED FLOORPLAN */}
            <Page size="LETTER" style={styles.page}>
                <View style={styles.brandRow}>
                    {wideLogoUrl ? (
                        <Image src={wideLogoUrl} style={styles.logo} />
                    ) : (
                        <View style={styles.logoFallback}>
                            <Text style={styles.logoFallbackText}>{brandName}</Text>
                        </View>
                    )}

                </View>
                <Card title="Selected Floorplan">
                    {floorplanDrawing ? (
                        <Image src={floorplanDrawing} style={styles.drawing} />
                    ) : (
                        <View style={styles.drawingFallback}>
                            <Text style={styles.microMuted}>Floorplan drawing not available.</Text>
                        </View>
                    )}
                    <View style={styles.overlayRow}>
                        <View style={styles.pill}>
                            <Text style={styles.pillText}>{c.floorplanName}</Text>
                        </View>
                        <View style={styles.pillSoft}>
                            <Text style={styles.pillTextSoft}>
                                {c.bed} Bed • {c.bath} Bath • {c.sqft} sqft
                            </Text>
                        </View>
                    </View>
                    <View style={styles.priceBlock}>
                        <Text style={styles.bigLabel}>Base Build Price</Text>
                        <Text style={styles.bigNumberSmall}>{money(c.basePrice, { round: "1000" })}</Text>
                        <Text style={styles.microMuted}>Base build includes standard finishes and typical scope for this plan.</Text>
                    </View>
                    <Divider />
                    <Text style={styles.label}>Included</Text>
                    <View style={styles.chipsRow}>
                        <Chip text="Design + Permits" />
                        <Chip text="City Fees" />
                        <Chip text="Construction" />
                        <Chip text="Project Management" />
                        <Chip text="Standard finishes package" />
                        <Chip text="Quality inspections" />
                    </View>

                    <Text style={styles.microMuted}>
                        Exact inclusions and exclusions are finalized after the Formal Property Analysis.
                    </Text>
                </Card>
                {/* <Card title="Where You Are in the Process">
                    <View style={styles.stack}>
                        <ProcessRow label="Vision & Floorplan" state="done" />
                        <ProcessRow label="Preliminary Feasibility" state="done" />
                        <ProcessRow label="Formal Property Analysis" state="current" />
                        <ProcessRow label="Verified Proposal" state="todo" />
                        <ProcessRow label="Permits & Build" state="todo" />
                    </View>
                    <Divider />
                    <Text style={styles.microMuted}>
                        You are not starting from zero. You are one smart step away from certainty.
                    </Text>
                </Card> */}
                <Card title="What’s Still Unverified">
                    <Text style={styles.microMuted}>These numbers reflect ideal conditions only.</Text>
                    <Text style={styles.microMuted}>
                        Key items such as utilities, setbacks, drainage, and site constraints have not yet been confirmed for your property.
                    </Text>
                    <Text style={styles.microMuted}>
                        Most homeowners discover $15k–$45k in unexpected site work after this stage.
                    </Text>
                    <Divider />
                    <Text style={styles.microMuted}>
                        The Formal Property Analysis exists so this doesn’t happen to you.
                    </Text>
                </Card>
            </Page>

            {/* 3) PROJECT SUMMARY TABLE */}
            <Page size="LETTER" style={styles.page}>
                <Header brandName={brandName} logoUrl={logoUrl} title="Project Summary" subtitle="Base build + estimated site work + selected upgrades + available discounts" />

                <Card title="Investment Summary (Preliminary)">
                    <SummaryTable
                        rows={[
                            { label: "Base Build (Selected Plan)", value: money(c.basePrice, { round: "1000" }) },
                            { label: "Estimated Site Work (Range)", value: moneyRange(c.site.subtotal.min, c.site.subtotal.max, { round: "1000", plus: true }) },
                            { label: "Selected Upgrades (Range)", value: moneyRange(c.upgrades.subtotal.min, c.upgrades.subtotal.max, { round: "1000" }) },
                            { label: "Applied Discounts", value: c.discounts.appliedTotal ? `−${money(c.discounts.appliedTotal)}` : "—" },
                        ]}
                        totalLabel="Total Estimated Range"
                        totalValue={moneyRange(c.totals.totalMin, c.totals.totalMax, { round: "1000", plus: true })}
                    />
                    <Text style={styles.microMuted}>
                        This summary is not a final quote. Formal Property Analysis validates triggers and produces a detailed proposal with a verified scope, budget, and schedule.
                    </Text>
                </Card>

                <Card title="Your Realistic Timeline (If Verified)">
                    <Text style={styles.label}>Why many homeowners lose an extra 3–6+ months</Text>
                    <Text style={styles.microMuted}>• Incomplete site data</Text>
                    <Text style={styles.microMuted}>• Utility assumptions that change mid-process</Text>
                    <Text style={styles.microMuted}>• City rejections from missing constraints</Text>
                    <Divider />
                    <Text style={styles.label}>How Backyard Estates is different</Text>
                    <Text style={styles.microMuted}>We verify everything before plans and permits begin.</Text>
                    <Text style={styles.microMuted}>
                        What this means for you: You can plan around real dates—not delays, redesigns, or guesswork.
                    </Text>
                    <View style={styles.timelineRow}>
                        {c.timeline.phases.map((p, i) => (
                            <View key={i} style={styles.timelineBlock}>
                                <Text style={styles.timelineTitle}>{p.title}</Text>
                                <Text style={styles.timelineValue}>
                                    {p.weeksRange.min}–{p.weeksRange.max} weeks
                                </Text>
                                {p.notes.map((n, j) => (
                                    <Text key={j} style={styles.microMuted}>• {n}</Text>
                                ))}
                            </View>
                        ))}
                    </View>
                    <Divider />
                    <Text style={styles.kvKey}>Total Estimated Timeline</Text>
                    <Text style={styles.kvVal}>
                        {c.timeline.totalMonthsRange.min}–{c.timeline.totalMonthsRange.max} months (average)
                    </Text>
                    <Text style={styles.microMuted}>
                        City review cycles and site triggers can shift schedules. Formal Property Analysis reduces uncertainty and builds a verified plan.
                    </Text>
                </Card>
                <Card title="Why Our Customers Trust Us">
                    <Text style={styles.microMuted}>
                        Backyard Estates has designed and built ADUs across Southern California, navigating 100+ unique city permitting paths.
                    </Text>
                    <Text style={styles.microMuted}>
                        Our process is built from real-world experience—because we’ve seen where projects go wrong and how to prevent it.
                    </Text>
                </Card>
            </Page>

            {/* 4) VALUE WE BRING */}
            <Page size="LETTER" style={styles.page}>
                <Header brandName={brandName} logoUrl={logoUrl} title="The Value We Bring" subtitle="This is why our process works" />

                <Card title="What’s Included (Base Build)">
                    <Text style={styles.microMuted}>
                        Each step exists to protect your budget and keep your project on track.
                    </Text>
                    <Divider />
                    <View style={{ display: "flex", flexDirection: "row", flexWrap: "wrap", gap: 6, justifyContent: "space-between" }}>
                        {baseBuildCategories.map((catKey) => {
                            const items = includedBaseGrouped[catKey] ?? [];
                            if (!items.length) return null;

                            return (
                                <View key={catKey} style={{ marginBottom: 12, width: "22%" }}>
                                    <Text style={styles.timelineTitle}>{CATEGORY_LABELS[catKey] ?? catKey}</Text>
                                    <View style={{ marginTop: 6 }}>
                                        {items.map((it: any, i: number) => (
                                            <Text key={i} style={styles.microMuted}>• {it.title}</Text>
                                        ))}
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                </Card>

                <Card title="Our Included Finishes">
                    {/* Pull from INCLUDED_BASE where category === "design_finish_features" */}
                    {finishes.length ? (
                        <View style={styles.chipsRow}>
                            {finishes.map((f: any, i: number) => (
                                <Chip key={i} text={f.title} />
                            ))}
                        </View>
                    ) : (
                        <Text style={styles.microMuted}>Finish package items not available.</Text>
                    )}
                </Card>
                <Card title="Examples of Site Characteristics We Verify">
                    <View style={{ display: "flex", flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "space-between" }}>

                        <View style={{ width: "32%" }}>
                            <Text style={styles.timelineTitle}>Utilities & Infrastructure</Text>
                            <Text style={styles.microMuted}>• Sewer, water, electrical upgrades</Text>
                            <Text style={styles.microMuted}>• Longer utility runs</Text>
                            <Text style={styles.microMuted}>• Water meters, fire sprinklers</Text>
                        </View>

                        <View style={{ width: "32%" }}>
                            <Text style={styles.timelineTitle}>Structural & Grading</Text>
                            <Text style={styles.microMuted}>• Taller foundations, deeper footings</Text>
                            <Text style={styles.microMuted}>• Retaining walls, drainage, soil reports</Text>
                        </View>
                        <View style={{ width: "32%" }}>
                            <Text style={styles.timelineTitle}>Design & Code Conflicts</Text>
                            <Text style={styles.microMuted}>• Roof types, ceiling heights</Text>
                            <Text style={styles.microMuted}>• Setbacks, easements, fire code</Text>
                        </View>
                    </View>

                    <Divider />
                    <Text style={styles.microMuted}>
                        What this means for you: You avoid redesigns, stalled permits, and last-minute construction changes.
                    </Text>
                </Card>
                <View style={styles.sectionGrid2}>
                    <View style={styles.col}>
                        <Card title="What Typically Delays Projects">
                            <Bullet text="Unexpected utility upgrades or re-routes." tone="warn" />
                            <Bullet text="Easements/setbacks requiring plan changes." tone="warn" />
                            <Bullet text="Multiple city revision cycles or specialty requirements." tone="warn" />
                        </Card>
                    </View>
                    <View style={styles.col}>

                        <Card title="How We Speed This Up">
                            <Bullet text="Fast utility verification and clear access routes." tone="good" />
                            <Bullet text="Quick responses to plan check comments." tone="good" />
                            <Bullet text="Decisions on finishes and upgrades early." tone="good" />
                        </Card>
                    </View>

                </View>

            </Page>

            {/* 5) SITE SPECIFIC WORK */}
            {value.siteFlagged.length ? (<Page size="LETTER" style={styles.page}>
                <Header brandName={brandName} logoUrl={logoUrl} title="Potential Site-Specific Work" subtitle="This is why our feasibility work reduces risk and protects your budget" />

                <View style={styles.sectionGrid2}>
                    <View style={{ width: "100%" }}>
                        <Card title="Potential Site Work (How We Assess Upfront)">
                            <View style={{ display: "flex", flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "space-between" }}>
                                {value.siteFlagged.length ? (
                                    value.siteFlagged.slice(0, 6).map((x: any, i: number) => (
                                        <View style={{ marginBottom: 12, width: "49%" }} key={i}>
                                            <View style={styles.rowBetween}>
                                                <Text style={styles.kvKey}>{x.store.title}</Text>
                                                <PillStatus status={x.store.status} />
                                            </View>

                                            <Text style={styles.microMuted}>
                                                Est. Cost: {x.meta?.modal?.estCost?.display ?? x.store.cost?.display ?? "—"}
                                            </Text>

                                            {!!x.meta?.modal?.whyItMatters && (
                                                <Text style={styles.microMuted}>Why it matters: {x.meta.modal.whyItMatters}</Text>
                                            )}

                                            {!!x.meta?.modal?.howWeAssess?.length && (
                                                <View style={{ marginTop: 6 }}>
                                                    <Text style={styles.label}>How we assess</Text>
                                                    {x.meta.modal.howWeAssess.slice(0, 3).map((s: string, j: number) => (
                                                        <Text key={j} style={styles.microMuted}>• {s}</Text>
                                                    ))}
                                                </View>
                                            )}

                                            {!!x.meta?.modal?.triggers?.length && (
                                                <View style={{ marginTop: 6 }}>
                                                    <Text style={styles.label}>Common triggers</Text>
                                                    <View style={styles.chipsRow}>
                                                        {x.meta.modal.triggers.slice(0, 4).map((t: any, j: number) => (
                                                            <Chip key={j} text={t.title} />
                                                        ))}
                                                    </View>
                                                </View>
                                            )}

                                            <View style={styles.dividerThin} />
                                        </View>
                                    ))
                                ) : (
                                    <Text style={styles.microMuted}>No site items flagged.</Text>
                                )}
                            </View>


                            <Text style={styles.microMuted}>
                                The Formal Property Analysis verifies these items using city policy checks, utility confirmations, and site validation.
                            </Text>
                        </Card>
                    </View>

                </View>
                {value.upgradesSelected.length ? (
                    <View style={{ width: "100%" }}>
                        <Card title="Optional Upgrades (What You Chose)">
                            <View style={{ marginBottom: 12, display: "flex", flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "space-between" }}>
                                {value.upgradesSelected.length ? (
                                    value.upgradesSelected.map((x: any, i: number) => (
                                        <View style={{ width: "30%" }} key={i}>
                                            <View style={styles.rowBetween}>
                                                <Text style={styles.kvKey}>{x.store.title}</Text>
                                                <Text style={styles.kvVal}>{x.meta?.modal?.estCost?.display ?? x.store.cost?.display ?? "—"}</Text>
                                            </View>
                                            {!!x.meta?.modal?.overview && <Text style={styles.microMuted}>{x.meta.modal.overview}</Text>}
                                        </View>
                                    ))
                                ) : (
                                    <Text style={styles.microMuted}>No optional upgrades selected.</Text>
                                )}
                            </View>
                        </Card>
                    </View>
                ) : null}

            </Page>) : null}

            {/* 7) RENTAL ANALYSIS */}
            <Page size="LETTER" style={styles.page}>
                <Header brandName={brandName} logoUrl={logoUrl} title="ROI & Cashflow" subtitle="How the numbers can look based on your finance inputs" />

                <Card title="Payment Estimate">
                    <KeyValueRow k="Financing Path" v={c.finance.path === "cash" ? "Cash" : "Financed"} />
                    <KeyValueRow k="Rate" v={`${c.finance.ratePct.toFixed(2)}%`} />
                    <KeyValueRow k="Term" v={`${c.finance.termMonths} months`} />
                    <Divider />
                    <KeyValueRow
                        k="Estimated Monthly Payment"
                        v={c.finance.path === "cash" ? "$0/mo" : `${money(Math.round(c.finance.monthlyPayment), { round: "1" })}/mo`}
                        strong
                    />
                    <Text style={styles.microMuted}>
                        Payment uses the midpoint of your project range (for planning). Formal Property Analysis refines the total and can model multiple financing options.
                    </Text>
                </Card>
                <Card title="Estimated Rent (Monthly)">
                    <Text style={styles.bigNumberSmall}>{money(c.rent.estimatedMonthly, { round: "1" })}/mo</Text>
                    <Text style={styles.muted}>
                        Range: {money(c.rent.range.min, { round: "1" })}–{money(c.rent.range.max, { round: "1" })}/mo
                    </Text>
                    <Divider />
                    <Text style={styles.microMuted}>{c.rent.disclaimer}</Text>
                </Card>

                <Card title="Monthly Cashflow (Guideline)">
                    <KeyValueRow k="Estimated Rent (Min)" v={`${money(c.rent.range.min, { round: "1" })}/mo`} />
                    <KeyValueRow k="Estimated Rent (Max)" v={`${money(c.rent.range.max, { round: "1" })}/mo`} />
                    <Divider />
                    <KeyValueRow
                        k="Estimated Cashflow (Min)"
                        v={`${money(Math.round(c.roi.monthlyCashflowMin), { round: "1" })}/mo`}
                        tone={c.roi.monthlyCashflowMin >= 0 ? "good" : "risk"}
                        strong
                    />
                    <KeyValueRow
                        k="Estimated Cashflow (Max)"
                        v={`${money(Math.round(c.roi.monthlyCashflowMax), { round: "1" })}/mo`}
                        tone={c.roi.monthlyCashflowMax >= 0 ? "good" : "warn"}
                        strong
                    />
                </Card>

                {!!c.equityBoost?.enabled && (
                    <Card title="Equity Boost (Year 1 / 5 / 10)">
                        <View style={styles.sectionGrid3}>
                            <StatCard label="Year 1" value={money(c.equityBoost.year1, { round: "1000" })} />
                            <StatCard label="Year 5" value={money(c.equityBoost.year5, { round: "1000" })} />
                            <StatCard label="Year 10" value={money(c.equityBoost.year10, { round: "1000" })} />
                        </View>
                        <Text style={styles.microMuted}>{c.equityBoost.methodNote}</Text>
                        <Text style={styles.microMuted}>{c.equityBoost.disclaimer}</Text>
                    </Card>
                )}


            </Page>

            {/* 8) COMPARABLE BUILDS */}
            <Page size="LETTER" style={styles.page}>
                <Header brandName={brandName} logoUrl={logoUrl} title="What We Deliver" subtitle="Recent projects to help you visualize outcomes" />



                {comparables.length ? (
                    <View style={styles.compGrid}>
                        {comparables.slice(0, 4).map((p: any, i: number) => {
                            // ✅ Best practice: make your query return "photoUrl": photos[0].asset->url
                            const img =
                                safeSrc(p?.photos.url) ||
                                safeSrc(p?.photos?.[0]) ||
                                safeSrc(p?.photos?.[0]?.asset) ||
                                safeSrc(p?.photos?.[0]?.url) ||
                                null;

                            const title = p?.name ?? "Project";
                            const fpName = p?.floorplan?.name ?? "";
                            const sqft = p?.sqft ?? p?.floorplan?.sqft ?? "";
                            const bed = p?.bed ?? p?.floorplan?.bed ?? "";
                            const bath = p?.bath ?? p?.floorplan?.bath ?? "";

                            return (
                                <View key={i} style={styles.compCard}>
                                    {img ? (
                                        <Image src={img} style={styles.compImg} />
                                    ) : (
                                        <View style={styles.compImgFallback}>
                                            <Text style={styles.microMuted}>Photo</Text>
                                        </View>
                                    )}
                                    <Text style={styles.compTitle}>{title}</Text>
                                    <Text style={styles.microMuted}>
                                        {fpName ? `${fpName} • ` : ""}
                                        {sqft ? `${sqft} sqft • ` : ""}
                                        {bed ? `${bed} bd • ` : ""}
                                        {bath ? `${bath} ba` : ""}
                                    </Text>
                                </View>
                            );
                        })}
                    </View>
                ) : null}

                {testimonials.length ? (
                    testimonials.slice(0, 6).map((t: any, i: number) => {
                        const portraitSrc = safeSrc(t?.portrait.url) || safeSrc(t?.portrait);
                        return (
                            <View key={i} style={styles.testimonialRow}>
                                {portraitSrc ? (
                                    <Image src={portraitSrc} style={styles.portrait} />
                                ) : (
                                    <View style={styles.portraitFallback}>
                                        <Text style={styles.microMuted}>Portrait</Text>
                                    </View>
                                )}

                                <View style={{ flex: 1 }}>
                                    <Text style={styles.quote}>“{t.quote ?? "Great experience — quality work and strong communication."}”</Text>
                                    <Divider />
                                    <Text style={styles.h2}>{t.names ?? "Client"}</Text>
                                    <Text style={styles.muted}>
                                        {t.property?.floorplan?.name ? `${t.property.floorplan.name} • ` : ""}
                                        {t.property?.sqft ? `${t.property.sqft} sqft • ` : ""}
                                        {t.property?.bed ? `${t.property.bed} bed • ` : ""}
                                        {t.property?.bath ? `${t.property.bath} bath` : ""}
                                    </Text>
                                </View>
                            </View>
                        );
                    })
                ) : null}
            </Page>

            {/* 9) WHAT’S NEXT */}
            <Page size="LETTER" style={styles.page}>
                <Header brandName={brandName} logoUrl={logoUrl} title="What’s Next" subtitle="The clearest path to a verified proposal and timeline" />
                <Card title="Recommended Path (Next Steps)">
                    <StepRow n="1" t="Formal Property Analysis" d="Site verification + refined scope, cost, and schedule." />
                    <StepRow n="2" t="Proposal + timeline" d="You receive a verified proposal with milestones." />
                    <StepRow n="3" t="Design & permitting" d="We finalize plans and submit to the city." />
                    <StepRow n="4" t="Construction" d="Construction begins with a managed weekly cadence." />
                    <StepRow n="5" t="Move-in" d="You receive the keys to your new home." />
                </Card>
                <View style={styles.sectionGrid2}>
                    <Card title="Formal Property Analysis (Recommended)">
                        <Text style={styles.h2}>Turn feasibility into certainty.</Text>
                        <Text style={styles.muted}>
                            The Formal Property Analysis is where we validate assumptions and produce a detailed, accurate proposal with real timelines and verified site requirements.
                        </Text>

                        <Divider />
                        <Card title="Before & After">
                            <BeforeAfterTable rows={beforeAfter} />
                        </Card>

                        {/* <Divider /> */}

                        {/* <Card title="What We Verify">
                            <Bullet text="Utility locations & upgrade requirements (water / sewer / electrical)" />
                            <Bullet text="Setbacks, easements, access, grading and constraints" />
                            <Bullet text="City requirements and permit strategy for your address" />
                            <Bullet text="A refined scope, cost, and schedule based on real conditions" />
                        </Card>
                        <Card title="What We Deliver">
                            <Bullet text="Verified project budget + timeline" />
                            <Bullet text="Detailed proposal and next milestones" />
                            <Bullet text="Answers to your highest-impact questions" />
                        </Card> */}
                    </Card>
                </View>




                <Card title="Get Clarity">
                    <Text style={styles.h2}>Book your Formal Property Analysis</Text>
                    <Text style={styles.microMuted}>
                        and lock in your verified path forward.
                    </Text>

                    <Divider />

                    <Link src={ctaUrl} style={styles.ctaLink}>
                        {ctaLabel}
                    </Link>

                    <Text style={styles.microMuted}>{ctaUrl}</Text>
                </Card>

            </Page>
        </Document>
    );
}

/* =========================
   Reusable Components
========================= */

function Header({
    brandName,
    logoUrl,
    title,
    subtitle,
}: {
    brandName: string;
    logoUrl: string | null;
    title: string;
    subtitle?: string;
}) {
    return (
        <View style={styles.header}>
            <View style={styles.headerLeft}>
                {logoUrl ? (
                    <Image src={logoUrl} style={styles.headerLogo} />
                ) : (
                    <View style={styles.headerLogoFallback}>
                        <Text style={styles.headerLogoFallbackText}>{brandName}</Text>
                    </View>
                )}
            </View>
            <View style={{ flex: 1 }}>
                <Text style={styles.headerTitle}>{title}</Text>
                {!!subtitle && <Text style={styles.headerSubtitle}>{subtitle}</Text>}
            </View>
        </View>
    );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <View style={styles.card}>
            <Text style={styles.cardTitle}>{title}</Text>
            <View style={styles.cardBody}>{children}</View>
        </View>
    );
}

function Divider() {
    return <View style={styles.divider} />;
}

function KeyValueRow({
    k,
    v,
    strong,
    tone,
}: {
    k: string;
    v: string;
    strong?: boolean;
    tone?: "good" | "warn" | "risk";
}) {
    const toneStyle =
        tone === "good" ? styles.toneGood : tone === "warn" ? styles.toneWarn : tone === "risk" ? styles.toneRisk : null;

    return (
        <View style={styles.kvRow}>
            <Text style={[styles.kvKey]}>{k}</Text>
            <Text style={[styles.kvVal, strong ? styles.kvValStrong : styles.kvVal]}>{v}</Text>
        </View>
    );
}

function Bullet({ text, tone }: { text: string; tone?: "good" | "warn" | "risk" }) {
    const dot = tone === "good" ? palette.good : tone === "warn" ? palette.warn : tone === "risk" ? palette.risk : palette.brand2;
    return (
        <View style={styles.bulletRow}>
            <View style={[styles.bulletDot, { backgroundColor: dot }]} />
            <Text style={styles.bulletText}>{text}</Text>
        </View>
    );
}

function Chip({ text }: { text: string }) {
    return (
        <View style={styles.chip}>
            <Text style={styles.chipText}>{text}</Text>
        </View>
    );
}

function PillStatus({ status }: { status: string }) {
    const { bg, fg } = statusTone(status);
    return (
        <View style={[styles.statusPill, { backgroundColor: bg }]}>
            <Text style={[styles.statusText, { color: fg }]}>{prettyStatus(status)}</Text>
        </View>
    );
}

function statusTone(status: string) {
    if (status === "selected") return { bg: "#E8F7EF", fg: palette.good };
    if (status === "not_apply") return { bg: "#EEF2F8", fg: palette.muted };
    if (status === "might_apply") return { bg: "#FFF1E0", fg: palette.warn };
    return { bg: "#EEF2F8", fg: palette.muted };
}

function StepRow({ n, t, d }: { n: string; t: string; d: string }) {
    return (
        <View style={styles.stepRow}>
            <View style={styles.stepNum}>
                <Text style={styles.stepNumText}>{n}</Text>
            </View>
            <View style={{ flex: 1 }}>
                <Text style={styles.stepTitle}>{t}</Text>
                <Text style={styles.microMuted}>{d}</Text>
            </View>
        </View>
    );
}

function SummaryTable({
    rows,
    totalLabel,
    totalValue,
}: {
    rows: Array<{ label: string; value: string }>;
    totalLabel: string;
    totalValue: string;
}) {
    return (
        <View style={styles.table}>
            {rows.map((r, i) => (
                <View key={i} style={styles.tableRow}>
                    <Text style={styles.tableLeft}>{r.label}</Text>
                    <Text style={styles.tableRight}>{r.value}</Text>
                </View>
            ))}
            <View style={styles.tableDivider} />
            <View style={styles.tableRow}>
                <Text style={[styles.tableLeft, styles.tableTotalLeft]}>{totalLabel}</Text>
                <Text style={[styles.tableRight, styles.tableTotalRight]}>{totalValue}</Text>
            </View>
        </View>
    );
}

function StatCard({ label, value }: { label: string; value: string }) {
    return (
        <View style={styles.statCard}>
            <Text style={styles.statLabel}>{label}</Text>
            <Text style={styles.statValue}>{value}</Text>
        </View>
    );
}

function prettyAduType(t?: string | null) {
    if (!t) return "—";
    const s = t.toLowerCase();
    if (s.includes("garage")) return "Garage Conversion ADU";
    if (s.includes("attached")) return "Attached ADU";
    if (s.includes("detached")) return "Detached ADU";
    return t;
}

function prettyTimeframe(tf?: string | null) {
    if (!tf) return "—";
    if (tf === "0to3") return "0–3 months";
    if (tf === "3to6") return "3–6 months";
    if (tf === "6to12") return "6–12 months";
    if (tf === "12plus") return "12+ months";
    return tf;
}

function prettyMotivation(m?: string | null) {
    if (!m) return "—";
    if (m === "family") return "Family / Multi-gen living";
    if (m === "rental") return "Rental income";
    if (m === "value") return "Increase property value";
    return m;
}

function prettyStatus(s: string) {
    if (s === "selected") return "Selected";
    if (s === "might_apply") return "Might apply";
    if (s === "not_apply") return "Does not apply";
    return "Unknown";
}

function ProcessRow({
    label,
    state,
}: {
    label: string;
    state: "done" | "current" | "todo";
}) {
    const left =
        state === "done" ? "✓" : state === "current" ? "← You are here" : "";
    const tone =
        state === "current" ? styles.kvValStrong : state === "done" ? styles.kvVal : styles.microMuted;

    return (
        <View style={styles.rowBetween}>
            <Text style={tone}>{label}</Text>
            <Text style={tone}>{left}</Text>
        </View>
    );
}

function BeforeAfterTable({ rows }: { rows: { left: string; right: string }[] }) {
    return (
        <View>
            <View style={[styles.rowBetween, { marginBottom: 8 }]}>
                <Text style={styles.label}>Without FPA</Text>
                <Text style={styles.label}>With FPA</Text>
            </View>

            {rows.map((r, i) => (
                <View key={i} style={styles.rowBetween}>
                    <Text style={styles.kvKey}>{r.left}</Text>
                    <Text style={styles.kvValStrong}>{r.right}</Text>
                </View>
            ))}
        </View>
    );
}

const PAGE_PAD = 24;
const R = 16;

const styles = StyleSheet.create({
    /* =========================
       Tone helpers
    ========================= */
    toneGood: { color: palette.good },
    toneWarn: { color: palette.warn },
    toneRisk: { color: palette.risk },

    /* =========================
       Page
    ========================= */
    page: {
        paddingTop: PAGE_PAD,
        paddingBottom: PAGE_PAD,
        paddingHorizontal: PAGE_PAD,
        backgroundColor: palette.bg,
        color: palette.ink,
        fontSize: 10.5,
        lineHeight: 1.32,
    },

    /* =========================
       Cover
    ========================= */
    coverWrap: { flex: 1 },
    coverTop: { marginBottom: 2 },

    brandRow: { flexDirection: "row", alignItems: "center" },

    logo: { width: "100%", height: 44, objectFit: "contain" },
    logoFallback: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: palette.card,
        borderWidth: 1,
        borderColor: palette.line,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    logoFallbackText: { fontSize: 7.5, color: palette.muted, textAlign: "center" },

    coverTitle: { fontSize: 19, fontWeight: 900, color: palette.ink, lineHeight: 1.08 },
    coverSubtitle: { fontSize: 10, color: palette.muted, marginTop: 2, lineHeight: 1.25 },
    microMuted: { color: palette.muted, fontSize: 9, lineHeight: 1.33 },
    muted: { color: palette.muted, fontSize: 10, lineHeight: 1.33 },

    coverHero: { flexDirection: "column" },
    coverImage: { width: "auto", height: "100%", borderRadius: 12, marginBottom: 8, objectFit: "contain", maxHeight: 600 },

    metaValue: { fontSize: 10.5, fontWeight: 800, marginTop: 8 },
    metaMuted: { fontSize: 9, color: palette.muted, marginTop: 3 },

    overlayEyebrow: { fontSize: 9, color: palette.faint, marginTop: 8 },
    overlayTitle: { fontSize: 13, fontWeight: 900, marginTop: 3, lineHeight: 1.18 },

    overlayRow: { flexDirection: "row", flexWrap: "wrap", marginTop: 8 },

    pill: {
        backgroundColor: palette.brand,
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 999,
        marginRight: 6,
        marginBottom: 6,
    },
    pillText: { fontSize: 9.25, color: "#fff", fontWeight: 900 },

    pillSoft: {
        backgroundColor: "#EEF2FF",
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 999,
        marginRight: 6,
        marginBottom: 6,
    },
    pillTextSoft: { fontSize: 9.25, color: palette.brand, fontWeight: 900 },

    drawing: {
        width: "100%",
        height: 260,
        borderRadius: 14,
        objectFit: "contain",
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: palette.line,
    },
    drawingFallback: {
        height: 260,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: palette.line,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#fff",
    },

    priceBlock: {
        marginTop: 8,
        backgroundColor: "#F3F6FF",
        borderRadius: 14,
        padding: 11,
        borderWidth: 1,
        borderColor: "#E1E8FF",
    },

    /* =========================
       Header
    ========================= */
    header: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
    },
    headerLeft: { width: 42, marginRight: 10 },
    headerLogo: { width: 32, height: 32, objectFit: "contain" },
    headerLogoFallback: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: palette.card,
        borderWidth: 1,
        borderColor: palette.line,
        alignItems: "center",
        justifyContent: "center",
    },
    headerLogoFallbackText: { fontSize: 7, color: palette.muted, textAlign: "center" },
    headerTitle: { fontSize: 17, fontWeight: 900, color: palette.ink, lineHeight: 1.1 },
    headerSubtitle: { fontSize: 10, color: palette.muted, marginTop: 3, lineHeight: 1.25 },

    /* =========================
       Layout grids
       (tight + predictable widths)
    ========================= */
    sectionGrid2: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginTop: 8,
    },
    col: { width: "49%" },

    sectionGrid3: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginTop: 8,
    },
    col3: { width: "32.3%" },

    /* A generic tight stack (use instead of `gap`) */
    stack: { flexDirection: "column" },
    stackTightItem: { marginBottom: 6 },
    stackTighterItem: { marginBottom: 4 },

    /* =========================
       Cards
       (tightened padding + consistent rhythm)
    ========================= */
    card: {
        backgroundColor: palette.card,
        borderRadius: R,
        borderWidth: 1,
        borderColor: palette.line,
        padding: 12,
        marginBottom: 10,
    },
    cardSoft: {
        backgroundColor: "#FBFCFF",
        borderRadius: R,
        borderWidth: 1,
        borderColor: palette.line,
        padding: 12,
        marginBottom: 10,
    },
    cardWarn: {
        backgroundColor: "#FFF8ED",
        borderRadius: R,
        borderWidth: 1,
        borderColor: "#F2D7A7",
        padding: 12,
        marginBottom: 10,
    },

    cardTitle: {
        fontSize: 9.5,
        color: palette.faint,
        fontWeight: 900,
        marginBottom: 8,
        letterSpacing: 0.35,
        textTransform: "uppercase",
    },
    cardBody: {},

    /* =========================
       Typography
    ========================= */
    h2: { fontSize: 13.5, fontWeight: 900, marginBottom: 5, lineHeight: 1.15 },
    label: { fontSize: 10, fontWeight: 900, color: palette.ink, marginBottom: 5 },

    note: { marginTop: 8, fontSize: 9, color: palette.muted, lineHeight: 1.33 },

    bigLabel: { fontSize: 9, color: palette.faint },
    bigNumber: { fontSize: 19, fontWeight: 900, marginTop: 3, color: palette.ink, lineHeight: 1.1 },
    bigNumberSmall: { fontSize: 15.5, fontWeight: 900, marginTop: 3, color: palette.ink, lineHeight: 1.1 },

    /* =========================
       Divider
    ========================= */
    divider: { height: 1, backgroundColor: palette.line, marginVertical: 8 },
    dividerThin: { height: 1, backgroundColor: palette.line, marginTop: 8 },

    /* =========================
       KV rows + tables
    ========================= */
    kvRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 5,
    },
    kvKey: { fontSize: 10, color: palette.muted, width: "67%" },
    kvVal: { fontSize: 10, color: palette.ink, textAlign: "right", width: "33%" },
    kvValStrong: { fontSize: 10, color: palette.ink, textAlign: "right", width: "33%", fontWeight: 900 },

    rowBetween: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 6,
    },

    table: {
        borderWidth: 1,
        borderColor: palette.line,
        borderRadius: 14,
        overflow: "hidden",
        marginTop: 8,
    },
    tableRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 8,
        paddingHorizontal: 11,
        borderBottomWidth: 1,
        borderBottomColor: palette.line,
    },
    tableLeft: { fontSize: 10, color: palette.muted, width: "72%" },
    tableRight: { fontSize: 10, color: palette.ink, fontWeight: 900, textAlign: "right", width: "28%" },
    tableDivider: { height: 1, backgroundColor: palette.line },
    tableTotalLeft: { color: palette.ink, fontWeight: 900 },
    tableTotalRight: { color: palette.brand, fontWeight: 900 },

    /* =========================
       Chips + bullets + status
    ========================= */
    chipsRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        marginTop: 6,
    },
    chip: {
        borderWidth: 1,
        borderColor: palette.line,
        backgroundColor: "#FAFBFF",
        borderRadius: 999,
        paddingVertical: 3.5,
        paddingHorizontal: 8,
        marginRight: 6,
        marginBottom: 6,
    },
    chipText: { fontSize: 9, color: palette.muted, lineHeight: 1.1 },

    bulletRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 5 },
    bulletDot: { width: 7, height: 7, borderRadius: 999, marginTop: 4, marginRight: 8 },
    bulletText: { flex: 1, fontSize: 10, color: palette.ink, lineHeight: 1.33 },

    statusPill: { paddingVertical: 3.5, paddingHorizontal: 10, borderRadius: 999 },
    statusText: { fontSize: 9, fontWeight: 900 },

    /* =========================
       Steps
    ========================= */
    stepRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 8 },
    stepNum: {
        width: 22,
        height: 22,
        borderRadius: 999,
        backgroundColor: palette.brand,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 10,
        marginTop: 1,
    },
    stepNumText: { color: "#fff", fontSize: 10, fontWeight: 900 },
    stepTitle: { fontSize: 10.5, fontWeight: 900, marginBottom: 2 },

    /* =========================
       Testimonials + comps
    ========================= */
    testimonialRow: { flexDirection: "row", marginBottom: 10 },
    portrait: {
        width: 88,
        height: 88,
        borderRadius: "50",
        objectFit: "cover",
        borderWidth: 1,
        borderColor: palette.line,
        marginRight: 12,
    },
    portraitFallback: {
        width: 88,
        height: 88,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: palette.line,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
        backgroundColor: "#fff",
    },
    quote: { fontSize: 10.75, lineHeight: 1.42, color: palette.ink, fontWeight: 800, marginTop: 6 },

    compGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        marginTop: 8,
    },
    compCard: {
        width: "49%",
        backgroundColor: "#FBFCFF",
        borderWidth: 1,
        borderColor: palette.line,
        borderRadius: 14,
        padding: 10,
        marginBottom: 10,
    },
    compImg: {
        width: "100%",
        height: 132,
        borderRadius: 12,
        objectFit: "cover",
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: palette.line,
    },
    compImgFallback: {
        width: "100%",
        height: 132,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: palette.line,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#fff",
    },
    compTitle: { marginTop: 7, fontSize: 10.5, fontWeight: 900, color: palette.ink },

    /* =========================
       Timeline blocks
    ========================= */
    timelineRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
    timelineBlock: {
        width: "32.3%",
        backgroundColor: "#FBFCFF",
        borderWidth: 1,
        borderColor: palette.line,
        borderRadius: 14,
        padding: 11,
    },
    timelineTitle: { fontSize: 10.25, fontWeight: 900, color: palette.ink },
    timelineValue: { marginTop: 5, fontSize: 11.25, fontWeight: 900, color: palette.brand },

    /* =========================
       Stat cards
    ========================= */
    statCard: {
        flex: 1,
        backgroundColor: "#FBFCFF",
        borderWidth: 1,
        borderColor: palette.line,
        borderRadius: 14,
        padding: 11,
    },
    statLabel: { fontSize: 9, color: palette.faint, fontWeight: 900 },
    statValue: { marginTop: 5, fontSize: 12, fontWeight: 900, color: palette.ink },

    /* =========================
       CTA
    ========================= */
    ctaLink: {
        fontSize: 12,
        textDecoration: "underline",
        color: palette.brand,
        fontWeight: 900,
        marginTop: 6,
    },
});
