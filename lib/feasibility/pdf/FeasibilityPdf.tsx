// lib/feasibility/pdf/FeasibilityPdf.tsx
import React from "react";
import {
    Document,
    Page,
    Text,
    View,
    Image,
    StyleSheet,
    // Font,
} from "@react-pdf/renderer";

import { FeasibilityStoreData } from "./types";
import { computeFeasibility } from "./compute";
import { palette } from "./palette";
import { formatDate, money, moneyRange, pct } from "./format";
import { buildValueSections } from "./valueWeBring";
import { Columns2 } from "lucide-react";

/**
 * ✅ IMPORTANT
 * This PDF expects you to pass assets into `data.assets`:
 * data.assets.reportAssets.gallery[] -> from REPORT_ASSETS query
 * data.assets.testimonials[]         -> from CUSTOMER_STORIES_QUERY (must include portraitUrl, quote, etc.)
 * data.assets.comparables[]          -> from RELATED_PROPERTIES_QUERY (ideally includes photoUrl)
 */

// -----------------------------
// Robust image source helpers
// -----------------------------
function isHttpUrl(v: any) {
    return typeof v === "string" && /^https?:\/\//i.test(v);
}

/**
 * Returns a plain URL or null.
 * Supports common shapes:
 * - "https://..."
 * - { url: "https://..." }
 * - { asset: { url: "https://..." } }
 * - { image: { asset: { url: "https://..." } } }
 * - { secure_url: "https://..." }  (cloudinary)
 * - { portraitUrl: "https://..." }
 * - { photoUrl: "https://..." }
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

type Props = { data: FeasibilityStoreData };

export function FeasibilityPdf({ data }: Props) {
    const c = computeFeasibility(data);

    const brandName = data.brand?.brandName ?? "Backyard Estates";
    const tagline = data.brand?.tagline ?? "Feasibility & Investment Snapshot";
    const logoUrl = safeSrc(data.brand?.logoUrl) ?? null;
    const coverUrl = safeSrc(data.brand?.coverUrl) ?? null;

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
    const gallery = data.assets?.reportAssets?.gallery ?? [];
    const testimonials = data.assets?.testimonials ?? [];
    const comparables = data.assets?.comparables ?? [];

    return (
        <Document title={`Feasibility Report - ${contact.name}`}>
            {/* 1) COVER */}
            <Page size="LETTER" style={styles.page}>
                <View style={styles.coverWrap}>
                    <View style={styles.coverTop}>
                        <View style={styles.brandRow}>
                            {logoUrl ? (
                                <Image src={logoUrl} style={styles.logo} />
                            ) : (
                                <View style={styles.logoFallback}>
                                    <Text style={styles.logoFallbackText}>{brandName}</Text>
                                </View>
                            )}

                            <View style={{ flex: 1 }}>
                                <Text style={styles.coverTitle}>Feasibility Report</Text>
                            </View>
                        </View>
                    </View>


                    <View style={styles.coverHero}>
                        <Text style={styles.metaValue}>{contact.name}</Text>
                        <Text style={styles.overlayEyebrow}>Property</Text>
                        <Text style={styles.overlayTitle}>
                            {addressLine}
                            {cityLine}
                        </Text>
                        <Text style={styles.metaMuted}>{reportDate}</Text>

                        {/* <View style={styles.bigNumberRow}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.bigLabel}>Estimated Project Range</Text>
                                    <Text style={styles.bigNumber}>
                                        {moneyRange(c.totals.totalMin, c.totals.totalMax, {
                                            round: "1000",
                                            plus: true,
                                        })}
                                    </Text>
                                    <Text style={styles.bigNote}>
                                        Preliminary estimates. Formal Property Analysis verifies site triggers and finalizes a proposal.
                                    </Text>
                                </View>
                            </View> */}
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

                    </View>

                    {/* <View style={styles.footerBar}>
                        <Text style={styles.footerText}>
                            Contact: {contact.phone} • {contact.email}
                        </Text>
                        <Text style={styles.footerTextMuted}>This report is a planning tool — not a contract or final bid.</Text>
                    </View> */}
                </View>
            </Page>

            {/* 2) PROJECT SUMMARY TABLE */}
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

                {/* <Card title="Project Snapshot">
                    <KeyValueRow k="ADU Type" v={prettyAduType(data.project.aduType)} />
                    <KeyValueRow k="Floorplan" v={c.floorplanName} />
                    <KeyValueRow k="Layout" v={`${c.bed} bed / ${c.bath} bath`} />
                    <KeyValueRow k="Size" v={`${c.sqft} sqft`} />
                    <KeyValueRow k="Timeframe" v={prettyTimeframe(data.project.timeframe)} />
                    <KeyValueRow k="Motivation" v={prettyMotivation(data.project.motivation)} />
                </Card> */}

                <View style={styles.sectionGrid2}>
                    <Card title="Estimated Site Work (Details)">
                        {c.site.items.length ? (
                            c.site.items.map((it, i) => (
                                <View key={i} style={{ marginBottom: 10 }}>
                                    <View style={styles.rowBetween}>
                                        <Text style={styles.kvKey}>{it.title}</Text>
                                        <Text style={styles.kvVal}>
                                            {it.cost?.display ?? moneyRange(it.costMin, it.costMax, { round: "1000", plus: true })}
                                        </Text>
                                    </View>
                                    <Text style={styles.microMuted}>Status: {prettyStatus(it.status)} • Verified in Formal Property Analysis</Text>
                                </View>
                            ))
                        ) : (
                            <Text style={styles.microMuted}>No site items selected.</Text>
                        )}
                    </Card>

                    <Card title="Selected Upgrades (Details)">
                        {c.upgrades.items.length ? (
                            c.upgrades.items.map((it, i) => (
                                <View key={i} style={{ marginBottom: 10 }}>
                                    <View style={styles.rowBetween}>
                                        <Text style={styles.kvKey}>{it.title}</Text>
                                        <Text style={styles.kvVal}>
                                            {it.cost?.display ?? moneyRange(it.costMin, it.costMax, { round: "100" })}
                                        </Text>
                                    </View>
                                    <Text style={styles.microMuted}>Selected</Text>
                                </View>
                            ))
                        ) : (
                            <Text style={styles.microMuted}>No optional upgrades selected.</Text>
                        )}
                    </Card>
                </View>

                <Card title="Average Timeline (Estimate)">
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
            </Page>

            {/* 3) VALUE WE BRING */}
            <Page size="LETTER" style={styles.page}>
                <Header brandName={brandName} logoUrl={logoUrl} title="The Value We Bring" subtitle="This is why our process works" />

                <View style={styles.sectionGrid2}>
                    <Card title="What’s Included (Base Build)">
                        <Text style={styles.microMuted}>
                            These are the core deliverables we include — the reason our builds stay organized, code-compliant, and predictable.
                        </Text>
                        <Divider />
                        <View style={styles.column}>
                            {value.includedHighlights.map((it, i) => (
                                <View key={i}>
                                    <Text style={styles.kvValStrong}>{it.title}</Text>
                                    <Text style={styles.microMuted}>{it.description}</Text>
                                    {!!it.modal?.whyItMatters && <Text style={styles.microMuted}>Why it matters: {it.modal.whyItMatters}</Text>}
                                </View>
                            ))}
                        </View>
                    </Card>
                </View>

                {/* <Card title="How We Reduce Surprises">
                    <Bullet tone="good" text="We identify site triggers early — before permits and before construction begins." />
                    <Bullet tone="good" text="We model cost ranges transparently so you can plan with confidence." />
                    <Bullet tone="good" text="We guide decisions (layout, access, utilities) to prevent late-stage redesign." />
                    <Divider />
                    <Text style={styles.microMuted}>
                        The Formal Property Analysis is where we verify each risk item and lock the proposal to real conditions.
                    </Text>
                </Card> */}
            </Page>

            {/* 4) SITE SPECIFIC WORK */}
            <Page size="LETTER" style={styles.page}>
                <Header brandName={brandName} logoUrl={logoUrl} title="Potential Site-Specific Work" subtitle="This is why our feasibility work reduces risk and protects your budget" />

                <View style={styles.sectionGrid2}>

                    <Card title="Potential Site Work (How We Assess Upfront)">
                        {value.siteFlagged.length ? (
                            value.siteFlagged.slice(0, 6).map((x: any, i: number) => (
                                <View key={i} style={{ marginBottom: 12 }}>
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

                        <Text style={styles.microMuted}>
                            The Formal Property Analysis verifies these items using city policy checks, utility confirmations, and site validation.
                        </Text>
                    </Card>
                    {value.upgradesSelected.length ? (
                        <Card title="Selected Upgrades (What You Chose)">
                            {value.upgradesSelected.length ? (
                                value.upgradesSelected.map((x: any, i: number) => (
                                    <View key={i} style={{ marginBottom: 12 }}>
                                        <View style={styles.rowBetween}>
                                            <Text style={styles.kvKey}>{x.store.title}</Text>
                                            <Text style={styles.kvVal}>{x.meta?.modal?.estCost?.display ?? x.store.cost?.display ?? "—"}</Text>
                                        </View>
                                        {!!x.meta?.modal?.overview && <Text style={styles.microMuted}>{x.meta.modal.overview}</Text>}
                                        {!!x.meta?.modal?.whyItMatters && <Text style={styles.microMuted}>Why it matters: {x.meta.modal.whyItMatters}</Text>}
                                    </View>
                                ))
                            ) : (
                                <Text style={styles.microMuted}>No optional upgrades selected.</Text>
                            )}
                        </Card>
                    ) : null}
                </View>
                <View style={styles.sectionGrid2}>
                    <Card title="What Speeds This Up">
                        <Bullet text="Fast utility verification and clear access routes." tone="good" />
                        <Bullet text="Quick responses to plan check comments." tone="good" />
                        <Bullet text="Decisions on finishes and upgrades early." tone="good" />
                    </Card>
                    <Card title="What Typically Delays Projects">
                        <Bullet text="Unexpected utility upgrades or re-routes." tone="warn" />
                        <Bullet text="Easements/setbacks requiring plan changes." tone="warn" />
                        <Bullet text="Multiple city revision cycles or specialty requirements." tone="warn" />
                    </Card>
                </View>
            </Page>

            {/* 5) RENTAL ANALYSIS */}
            <Page size="LETTER" style={styles.page}>
                <Header brandName={brandName} logoUrl={logoUrl} title="Rental Analysis" subtitle="Guideline estimates to understand cashflow potential" />

                <View style={styles.sectionGrid2}>
                    <Card title="Estimated Rent (Monthly)">
                        <Text style={styles.bigNumberSmall}>{money(c.rent.estimatedMonthly, { round: "1" })}/mo</Text>
                        <Text style={styles.muted}>
                            Range: {money(c.rent.range.min, { round: "1" })}–{money(c.rent.range.max, { round: "1" })}/mo
                        </Text>
                        <Divider />
                        <Text style={styles.microMuted}>{c.rent.methodNote}</Text>
                        <Text style={styles.microMuted}>{c.rent.disclaimer}</Text>
                    </Card>

                    {/* <Card title="Rental Comps (If Provided)">
                        {c.rent.comps?.length ? (
                            c.rent.comps.slice(0, 6).map((comp: any, i: number) => (
                                <View key={i} style={styles.compRow}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.kvKey}>{comp.label ?? `Comparable ${i + 1}`}</Text>
                                        <Text style={styles.microMuted}>
                                            {(comp.beds ?? "—")} bd • {(comp.baths ?? "—")} ba • {(comp.sqft ?? "—")} sqft
                                        </Text>
                                        {!!comp.notes && <Text style={styles.microMuted}>{comp.notes}</Text>}
                                    </View>
                                    <Text style={styles.kvVal}>{money(comp.rentMonthly, { round: "1" })}/mo</Text>
                                </View>
                            ))
                        ) : (
                            <Text style={styles.microMuted}>
                                No comps were provided in this submission. If you want us to use verified real-time comps, the Formal Property Analysis includes that research.
                            </Text>
                        )}
                    </Card> */}
                </View>
                <Header brandName={brandName} logoUrl={logoUrl} title="ROI & Cashflow" subtitle="How the numbers can look based on your finance inputs" />

                <View style={styles.sectionGrid2}>
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
                        <Divider />
                        <KeyValueRow k="Simple Annual ROI Range" v={`${pct(c.roi.simpleRoiMin, 1)}–${pct(c.roi.simpleRoiMax, 1)}`} />
                        <Text style={styles.microMuted}>
                            ROI is a simplified planning metric (cashflow ÷ cash out-of-pocket). Real ROI depends on taxes, operating costs, vacancy, and financing structure.
                        </Text>
                    </Card>
                </View>

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

            {/* 7) COMPARABLE BUILDS */}
            <Page size="LETTER" style={styles.page}>
                <Header brandName={brandName} logoUrl={logoUrl} title="What We Deliver" subtitle="Recent projects to help you visualize outcomes" />

                {testimonials.length ? (
                    testimonials.slice(0, 2).map((t: any, i: number) => {
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
                                    <Text style={styles.h2}>{t.names ?? "Client"}</Text>
                                    <Text style={styles.muted}>
                                        {t.property?.floorplan?.name ? `Floorplan: ${t.property.floorplan.name} • ` : ""}
                                        {t.property?.sqft ? `${t.property.sqft} sqft • ` : ""}
                                        {t.property?.bed ? `${t.property.bed} bed • ` : ""}
                                        {t.property?.bath ? `${t.property.bath} bath` : ""}
                                    </Text>

                                    <Divider />

                                    <Text style={styles.quote}>“{t.quote ?? "Great experience — quality work and strong communication."}”</Text>
                                </View>
                            </View>
                        );
                    })
                ) : null}

                <Card title="Comparable Projects">
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
                </Card>
            </Page>

            {/* 8) WHAT’S NEXT */}
            <Page size="LETTER" style={styles.page}>
                <Header brandName={brandName} logoUrl={logoUrl} title="What’s Next" subtitle="The clearest path to a verified proposal and timeline" />

                <View style={styles.sectionGrid2}>
                    <Card title="Formal Property Analysis (Recommended)">
                        <Text style={styles.h2}>Turn feasibility into certainty.</Text>
                        <Text style={styles.muted}>
                            The Formal Property Analysis is where we validate assumptions and produce a detailed, accurate proposal with real timelines and verified site requirements.
                        </Text>

                        <Divider />

                        <Text style={styles.label}>What we verify</Text>
                        <Bullet text="Utility locations & upgrade requirements (water / sewer / electrical)" />
                        <Bullet text="Setbacks, easements, access, grading and constraints" />
                        <Bullet text="City requirements and permit strategy for your address" />
                        <Bullet text="A refined scope, cost, and schedule based on real conditions" />

                        <Divider />

                        <Text style={styles.label}>Deliverables</Text>
                        <Bullet text="Verified project budget + timeline" tone="good" />
                        <Bullet text="Detailed proposal and next milestones" tone="good" />
                        <Bullet text="Answers to your highest-impact questions" tone="good" />
                    </Card>

                    {/* <Card title="Your Report Snapshot">
                        <KeyValueRow k="Selected Plan" v={c.floorplanName} />
                        <KeyValueRow k="Base Build" v={money(c.basePrice, { round: "1000" })} />
                        <KeyValueRow
                            k="Total Range"
                            v={moneyRange(c.totals.totalMin, c.totals.totalMax, { round: "1000", plus: true })}
                            strong
                        />
                        <Divider />
                        <Text style={styles.label}>Top items to verify</Text>
                        {c.bullets.topUnknowns.map((x, i) => (
                            <Bullet key={i} text={x} tone="warn" />
                        ))}
                    </Card> */}
                </View>

                {/* ✅ We keep this short here; the full timeline is on the Timeline page */}
                <View style={styles.sectionGrid2}>
                    <Card title="Fastest Path (Next Steps)">
                        <StepRow n="1" t="Formal Property Analysis" d="Site verification + refined scope, cost, and schedule." />
                        <StepRow n="2" t="Proposal + timeline" d="You receive a verified proposal with milestones." />
                        <StepRow n="3" t="Design & permitting" d="We finalize plans and submit to the city." />
                        <StepRow n="4" t="Construction" d="Construction begins with a managed weekly cadence." />
                        <StepRow n="5" t="Move-in" d="You receive the keys to your new home." />
                    </Card>
                </View>

                <Card title="Ready to Move Forward?">
                    <Text style={styles.h2}>Schedule your next step</Text>
                    <Text style={styles.muted}>
                        Reply to this report email or book an office visit to confirm feasibility and start the Formal Property Analysis.
                    </Text>

                    <View style={styles.signature}>
                        <Text style={styles.signatureName}>{data.brand?.signatureName ?? "Backyard Estates Team"}</Text>
                        <Text style={styles.signatureTitle}>{data.brand?.signatureTitle ?? "Design • Permits • Build"}</Text>
                        <Text style={styles.microMuted}>
                            {contact.phone} • {contact.email}
                        </Text>
                    </View>
                </Card>

            </Page>

            {/* 9) QUALITY & STANDARD FINISHES */}
            {/* <Page size="LETTER" style={styles.page}>
                <Header brandName={brandName} logoUrl={logoUrl} title="Quality & Standard Finishes" subtitle="What’s included in your base build — designed to feel premium" />

                <Card title="Our Standard Finish Package">
                    <Text style={styles.muted}>
                        We standardize a high-quality finish level so your ADU feels modern, durable, and move-in ready — without surprises.
                    </Text>
                    <View style={styles.chipsRow}>
                        <Chip text="Quartz counters" />
                        <Chip text="Shaker cabinets" />
                        <Chip text="Luxury vinyl plank" />
                        <Chip text="Mini-split HVAC" />
                        <Chip text="Stainless appliances" />
                        <Chip text="Professional paint + trim" />
                    </View>
                </Card>

                <View style={{ height: 10 }} />

                <Card title="Gallery (Examples)">
                    {gallery?.length ? (
                        <View style={styles.galleryGrid}>
                            {gallery.slice(0, 6).map((g: any, i: number) => {
                                const src = safeSrc(g?.image);
                                return (
                                    <View key={i} style={styles.galleryItem}>
                                        {src ? (
                                            <Image src={src} style={styles.galleryImg} />
                                        ) : (
                                            <View style={styles.galleryFallback}>
                                                <Text style={styles.microMuted}>Image unavailable</Text>
                                            </View>
                                        )}
                                        <Text style={styles.galleryCaption}>{g?.title ?? "Standard finish"}</Text>
                                    </View>
                                );
                            })}
                        </View>
                    ) : (
                        <Text style={styles.microMuted}>
                            No gallery assets were provided. Populate `pdfReportAssets.gallery[]` in Sanity to show examples here.
                        </Text>
                    )}
                </Card>
                <Card title="Discounts We Offer">
                    {c.discounts.list.map((d, i) => (
                        <View key={i} style={styles.discountRow}>
                            <Text style={styles.discountTitle}>{d.title}</Text>
                            <Text style={styles.discountDetail}>{d.detail}</Text>
                            {!!d.amountHint && <Text style={styles.discountHint}>{d.amountHint}</Text>}
                        </View>
                    ))}
                    <Text style={styles.microMuted}>
                        Discounts depend on eligibility and active offers. We’ll review all applicable discounts during your Formal Property Analysis.
                    </Text>
                </Card>
            </Page> */}
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

function MiniBlock({ title, body }: { title: string; body: string }) {
    return (
        <View style={styles.miniBlock}>
            <Text style={styles.miniTitle}>{title}</Text>
            <Text style={styles.microMuted}>{body}</Text>
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

/* =========================
   Small formatting helpers
========================= */

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

/* =========================
   Styles
========================= */

const styles = StyleSheet.create({
    page: {
        padding: 36,
        backgroundColor: palette.bg,
        color: palette.ink,
        fontSize: 11,
        // fontFamily: "Inter",
    },

    /* Cover */
    coverWrap: { flex: 1 },
    coverTop: { marginBottom: 14 },
    brandRow: { flexDirection: "row", alignItems: "center", gap: 14 },
    logo: { width: 46, height: 46, objectFit: "contain" },
    logoFallback: {
        width: 46,
        height: 46,
        borderRadius: 12,
        backgroundColor: palette.card,
        borderWidth: 1,
        borderColor: palette.line,
        alignItems: "center",
        justifyContent: "center",
    },
    logoFallbackText: { fontSize: 8, color: palette.muted, textAlign: "center" },

    coverTitle: { fontSize: 20, fontWeight: 800, color: palette.ink },
    coverSubtitle: { fontSize: 10.5, color: palette.muted, marginTop: 2 },

    coverMeta: { width: 160, alignItems: "flex-end" },
    metaLabel: { fontSize: 9, color: palette.faint },
    metaValue: { fontSize: 10.5, fontWeight: 700, marginTop: 2 },
    metaMuted: { fontSize: 9, color: palette.muted, marginTop: 2 },

    coverHero: { position: "relative", flex: 1 },
    coverImage: { width: "100%", height: 440, borderRadius: 18, objectFit: "cover" },
    coverImageFallback: {
        width: "100%",
        height: 440,
        borderRadius: 18,
        backgroundColor: palette.beige,
        borderWidth: 1,
        borderColor: palette.line,
        alignItems: "center",
        justifyContent: "center",
    },
    coverImageFallbackText: { color: palette.muted, fontSize: 12 },

    coverOverlayCard: {
        position: "absolute",
        left: 18,
        right: 18,
        bottom: 18,
        backgroundColor: "rgba(255,255,255,0.92)",
        borderRadius: 18,
        padding: 16,
        borderWidth: 1,
        borderColor: palette.line,
    },
    overlayEyebrow: { fontSize: 9, color: palette.faint },
    overlayTitle: { fontSize: 13.5, fontWeight: 800, marginTop: 4 },
    overlayRow: { flexDirection: "row", gap: 8, marginTop: 8, flexWrap: "wrap" },
    pill: {
        backgroundColor: palette.brand,
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 999,
    },
    pillText: { fontSize: 9.5, color: "#fff", fontWeight: 700 },
    pillSoft: {
        backgroundColor: "#EEF2FF",
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 999,
    },
    pillTextSoft: { fontSize: 9.5, color: palette.brand, fontWeight: 700 },

    bigNumberRow: { marginTop: 12 },
    bigLabel: { fontSize: 9, color: palette.faint },
    bigNumber: { fontSize: 20, fontWeight: 900, marginTop: 2, color: palette.ink },
    bigNumberSmall: { fontSize: 16, fontWeight: 900, marginTop: 4, color: palette.ink },
    bigNote: { fontSize: 9, color: palette.muted, marginTop: 6, lineHeight: 1.35 },

    footerBar: { marginTop: 14, flexDirection: "row", justifyContent: "space-between" },
    footerText: { fontSize: 9, color: palette.muted },
    footerTextMuted: { fontSize: 9, color: palette.faint },

    /* Header */
    header: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        marginBottom: 14,
    },
    headerLeft: { width: 44 },
    headerLogo: { width: 34, height: 34, objectFit: "contain" },
    headerLogoFallback: {
        width: 34,
        height: 34,
        borderRadius: 10,
        backgroundColor: palette.card,
        borderWidth: 1,
        borderColor: palette.line,
        alignItems: "center",
        justifyContent: "center",
    },
    headerLogoFallbackText: { fontSize: 7, color: palette.muted, textAlign: "center" },
    headerTitle: { fontSize: 18, fontWeight: 900, color: palette.ink },
    headerSubtitle: { fontSize: 10, color: palette.muted, marginTop: 2 },

    /* Layout */
    sectionGrid2: { flexDirection: "row", gap: 12, marginBottom: 12 },
    sectionGrid3: { flexDirection: "row", gap: 10, marginTop: 10 },

    card: {
        flex: 1,
        backgroundColor: palette.card,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: palette.line,
        padding: 14,
    },
    cardTitle: { fontSize: 10, color: palette.faint, fontWeight: 700, marginBottom: 10, letterSpacing: 0.3 },
    cardBody: {},

    h2: { fontSize: 14, fontWeight: 900, marginBottom: 6 },

    muted: { color: palette.muted, fontSize: 10, lineHeight: 1.35 },
    microMuted: { color: palette.muted, fontSize: 9, lineHeight: 1.35, marginTop: 6 },

    divider: { height: 1, backgroundColor: palette.line, marginVertical: 10 },

    kvRow: { flexDirection: "row", justifyContent: "space-between", gap: 12, marginBottom: 6 },
    kvKey: { fontSize: 10, color: palette.muted },
    kvVal: { fontSize: 10, color: palette.ink, textAlign: "right" },
    kvValStrong: { fontWeight: 900 },

    toneGood: { color: palette.good },
    toneWarn: { color: palette.warn },
    toneRisk: { color: palette.risk },

    label: { fontSize: 10, fontWeight: 800, color: palette.ink, marginBottom: 6 },

    chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
    chip: { borderWidth: 1, borderColor: palette.line, backgroundColor: "#FAFBFF", borderRadius: 999, paddingVertical: 4, paddingHorizontal: 8 },
    chipText: { fontSize: 9, color: palette.muted },

    drawing: { width: "100%", height: 300, borderRadius: 14, objectFit: "contain", backgroundColor: "#fff" },
    drawingFallback: { height: 300, borderRadius: 14, borderWidth: 1, borderColor: palette.line, alignItems: "center", justifyContent: "center" },

    priceBlock: { marginTop: 10, backgroundColor: "#F3F6FF", borderRadius: 14, padding: 12, borderWidth: 1, borderColor: "#E1E8FF" },

    rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 8 },

    statusPill: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999 },
    statusText: { fontSize: 9, fontWeight: 800 },

    bulletRow: { flexDirection: "row", gap: 8, alignItems: "flex-start", marginBottom: 6 },
    bulletDot: { width: 7, height: 7, borderRadius: 999, marginTop: 4 },
    bulletText: { flex: 1, fontSize: 10, color: palette.ink, lineHeight: 1.35 },

    stepRow: { flexDirection: "row", gap: 10, alignItems: "flex-start", marginBottom: 10 },
    stepNum: { width: 22, height: 22, borderRadius: 999, backgroundColor: palette.brand, alignItems: "center", justifyContent: "center" },
    stepNumText: { color: "#fff", fontSize: 10, fontWeight: 900 },
    stepTitle: { fontSize: 10.5, fontWeight: 900 },

    threeCols: { flexDirection: "row", gap: 10, marginBottom: 10 },
    miniBlock: { flex: 1, borderWidth: 1, borderColor: palette.line, borderRadius: 14, padding: 10, backgroundColor: "#FBFCFF" },
    miniTitle: { fontSize: 10, fontWeight: 900, marginBottom: 4 },

    table: { borderWidth: 1, borderColor: palette.line, borderRadius: 14, overflow: "hidden" },
    tableRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: palette.line },
    tableLeft: { fontSize: 10, color: palette.muted },
    tableRight: { fontSize: 10, color: palette.ink, fontWeight: 800 },
    tableDivider: { height: 1, backgroundColor: palette.line },
    tableTotalLeft: { color: palette.ink, fontWeight: 900 },
    tableTotalRight: { color: palette.brand, fontWeight: 900 },

    discountRow: { marginBottom: 10, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: palette.line },
    discountTitle: { fontSize: 10.5, fontWeight: 900, color: palette.ink },
    discountDetail: { fontSize: 9.5, color: palette.muted, marginTop: 3, lineHeight: 1.35 },
    discountHint: { fontSize: 9, color: palette.faint, marginTop: 3 },

    compRow: { flexDirection: "row", gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: palette.line },

    statCard: { flex: 1, backgroundColor: "#FBFCFF", borderWidth: 1, borderColor: palette.line, borderRadius: 14, padding: 12 },
    statLabel: { fontSize: 9, color: palette.faint, fontWeight: 700 },
    statValue: { marginTop: 6, fontSize: 12.5, fontWeight: 900, color: palette.ink },

    timelineRow: { flexDirection: "row", gap: 10 },
    timelineBlock: { flex: 1, backgroundColor: "#FBFCFF", borderWidth: 1, borderColor: palette.line, borderRadius: 14, padding: 12 },
    timelineTitle: { fontSize: 10.5, fontWeight: 900, color: palette.ink },
    timelineValue: { marginTop: 6, fontSize: 11.5, fontWeight: 900, color: palette.brand },

    signature: { marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: palette.line },
    signatureName: { fontSize: 11, fontWeight: 900, color: palette.ink },
    signatureTitle: { fontSize: 9.5, color: palette.muted, marginTop: 2 },

    // ✅ Gallery styles
    galleryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    galleryItem: { width: "48%", marginBottom: 10 },
    galleryImg: { width: "100%", height: 170, borderRadius: 14, objectFit: "cover", backgroundColor: "#fff", borderWidth: 1, borderColor: palette.line },
    galleryFallback: { width: "100%", height: 170, borderRadius: 14, borderWidth: 1, borderColor: palette.line, alignItems: "center", justifyContent: "center" },
    galleryCaption: { marginTop: 6, fontSize: 9, color: palette.muted },

    // ✅ Testimonials styles
    testimonialRow: { flexDirection: "row", gap: 12 },
    portrait: { width: 92, height: 92, borderRadius: 18, objectFit: "cover", borderWidth: 1, borderColor: palette.line },
    portraitFallback: { width: 92, height: 92, borderRadius: 18, borderWidth: 1, borderColor: palette.line, alignItems: "center", justifyContent: "center" },
    quote: { fontSize: 11, lineHeight: 1.45, color: palette.ink, fontWeight: 700 },

    // ✅ Comparables styles
    compGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    compCard: { width: "48%", backgroundColor: "#FBFCFF", borderWidth: 1, borderColor: palette.line, borderRadius: 14, padding: 10 },
    compImg: { width: "100%", height: 140, borderRadius: 12, objectFit: "cover", backgroundColor: "#fff", borderWidth: 1, borderColor: palette.line },
    compImgFallback: { width: "100%", height: 140, borderRadius: 12, borderWidth: 1, borderColor: palette.line, alignItems: "center", justifyContent: "center" },
    compTitle: { marginTop: 8, fontSize: 10.5, fontWeight: 900, color: palette.ink },

    dividerThin: { height: 1, backgroundColor: palette.line, marginTop: 10 },
    column: { columnCount: 2 }
});
