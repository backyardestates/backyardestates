import { z } from "zod/v4";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { getAnthropic, CLAUDE_MODEL } from "./claude";
import { SITE_WORK_CATEGORIES } from "@/lib/investment/siteWorkItems";
import { FPA_TEMPLATE } from "@/lib/fpa/template";

// ─────────────────────────────────────────────────────────────────────────────
// Consultation + FPA → proposal prefill plan.
//
// The AI does the heavy matching: it reads EVERY answered FPA field (with its
// human label) plus the full site-work catalog, and proposes which estimator
// line items the property needs — grounding each in the specific FPA answer that
// implies it. Explicit COST_ADDER flags (which carry the architect's dollar
// estimate) are added deterministically and take precedence on overlap.
// ─────────────────────────────────────────────────────────────────────────────

export type Confidence = "high" | "medium" | "low";
export interface DerivedField<T> {
    value: T;
    confidence: Confidence;
    rationale: string;
    sourceQuote?: string;
}

export type AduTypeValue = "detached" | "attached" | "garage";

export interface PrefillCostAdder {
    catId: string;
    catLabel: string;
    itemId: string | null; // null → free-form custom item
    label: string;
    amount: number | null; // architect's $ estimate, else null (rep fills)
    source: "flag" | "answer";
    targetUnitIds: string[]; // [] = all compared units
    confidence: Confidence;
    rationale: string;
    sourceLabel?: string; // the FPA question/answer that drove this match
    sourceFieldKey?: string;
}
export interface PrefillOpenItem {
    kind: "concern" | "question";
    label: string;
    note?: string;
}
export interface PrefillTalkingPoint {
    point: string;
    sourceConcern?: string;
}

export interface CustomerProfile {
    name: string | null;
    email: string | null;
    phone: string | null;
    pipedrivePersonId: string | null;
    pipedriveDealId: string | null;
}

export interface ProposalPrefillPlan {
    customerProfile: CustomerProfile;
    motivation: DerivedField<"family" | "income" | "investment" | null>;
    aduType: DerivedField<AduTypeValue | null>;
    unitSpec: {
        sqft: DerivedField<number | null>;
        beds: DerivedField<number | null>;
        baths: DerivedField<number | null>;
        allElectric: DerivedField<boolean | null>;
    };
    suggestedUnitIds: DerivedField<string[]>;
    financials: {
        owed: DerivedField<number | null>;
        currentMortgageMonthly: DerivedField<number | null>;
    };
    costAdders: PrefillCostAdder[];
    featuredStoryIds: DerivedField<string[]>;
    featuredPropertyIds: DerivedField<string[]>;
    openItems: PrefillOpenItem[];
    talkingPoints: PrefillTalkingPoint[];
}

// ── Catalog (used by both the deterministic flag mapping and the AI) ─────────
const CAT_LABEL: Record<string, string> = Object.fromEntries(
    SITE_WORK_CATEGORIES.map((c) => [c.id, c.label]),
);
const VALID_ITEM = new Set<string>(
    SITE_WORK_CATEGORIES.flatMap((c) => c.items.map((i) => `${c.id}:${i.id}`)),
);
function presetLabel(catId: string, itemId?: string | null): string | null {
    if (!itemId) return null;
    const cat = SITE_WORK_CATEGORIES.find((c) => c.id === catId);
    return cat?.items.find((i) => i.id === itemId)?.label ?? null;
}
/** Compact catalog the AI chooses from. */
function catalogForAi() {
    return SITE_WORK_CATEGORIES.map((c) => ({
        catId: c.id,
        catLabel: c.label,
        items: c.items.map((i) => ({ itemId: i.id, label: i.label, unit: i.unit })),
    }));
}

// ── Flag fieldKey → catalog item (explicit cost flags only) ──────────────────
const PRESET_BY_FIELDKEY: Record<string, { catId: string; itemId?: string }> = {
    water_meter_upgrade: { catId: "utilities", itemId: "water_meter" },
    panel_upgrade_needed: { catId: "utilities", itemId: "rel_panel" },
    relocate_panel: { catId: "utilities", itemId: "rel_panel" },
    rel_water: { catId: "utilities", itemId: "rel_water" },
    sewer_scope_needed: { catId: "utilities", itemId: "sewer_scope" },
    ejection_pump_needed: { catId: "structure", itemId: "ejector" },
    adu_sewage_pump: { catId: "structure", itemId: "ejector" },
    retaining_walls: { catId: "structure", itemId: "stackstone" },
    need_area_drains: { catId: "structure", itemId: "drain_lines" },
    adu_foundation_out: { catId: "structure", itemId: "found_h" },
    adu_deeper_footings: { catId: "structure", itemId: "found_h" },
    need_survey: { catId: "permits", itemId: "survey" },
    perm_survey_permitting: { catId: "permits", itemId: "survey" },
    perm_soils_report: { catId: "permits", itemId: "soils" },
    grading_drainage_plans: { catId: "permits", itemId: "grading_pl" },
    perm_impact_fees: { catId: "permits", itemId: "impact" },
    electric_load_calc_needed: { catId: "permits", itemId: "elec_calcs" },
    fire_sprinklers_required: { catId: "fire", itemId: "fire_spr" },
    perm_fire_sprinklers: { catId: "fire", itemId: "fire_spr" },
    fire_flow_test: { catId: "fire", itemId: "fire_flow" },
    perm_fire_flow: { catId: "fire", itemId: "fire_flow" },
    trees_to_remove: { catId: "demo", itemId: "med_tree" },
    unpermitted_structures: { catId: "demo", itemId: "demo" },
    need_rain_gutters: { catId: "roofing", itemId: "gutters" },
    landscape_plans_when: { catId: "landscaping", itemId: "land_plans" },
};

export interface FlagLike {
    label?: string;
    flagType?: string;
    flagNote?: string;
    estCostImpact?: number | null;
    fieldKey?: string;
    tab?: string;
}

function adderKey(catId: string, itemId: string | null, label: string): string {
    return `${catId}:${itemId ?? label.toLowerCase().trim()}`;
}

/** COST_ADDER flags → cost adders (carry the architect's $ estimate). */
export function mapFlagsToCostAdders(flags: FlagLike[]): PrefillCostAdder[] {
    return flags
        .filter((f) => f.flagType === "COST_ADDER")
        .map((f) => {
            const map = (f.fieldKey && PRESET_BY_FIELDKEY[f.fieldKey]) || { catId: "permits" };
            const itemId = map.itemId ?? null;
            return {
                catId: map.catId,
                catLabel: CAT_LABEL[map.catId] ?? "Other",
                itemId,
                label: f.label || presetLabel(map.catId, itemId) || "Site-work item",
                amount: f.estCostImpact ?? null,
                source: "flag" as const,
                targetUnitIds: [],
                confidence: "high" as const,
                rationale: f.flagNote || "Flagged by the architect as a cost adder.",
                sourceLabel: f.label ? `Architect flag: ${f.label}` : "Architect cost flag",
                sourceFieldKey: f.fieldKey,
            };
        });
}

// ── FPA answers, labeled, for the AI to reason over ──────────────────────────
interface LabeledAnswer {
    tab: "siteVisit" | "cityInfo";
    key: string;
    label: string;
    value: string;
}
function isEmpty(v: unknown): boolean {
    return v == null || String(v).trim() === "";
}
/** Flatten every ANSWERED template field to {key,label,value} so the AI has the
 *  full property picture (not just a hardcoded subset). */
export function labeledFpaAnswers(
    siteVisit: Record<string, unknown>,
    cityInfo: Record<string, unknown>,
): LabeledAnswer[] {
    const out: LabeledAnswer[] = [];
    for (const tab of FPA_TEMPLATE) {
        const vals = tab.key === "siteVisit" ? siteVisit : cityInfo;
        for (const sec of tab.sections) {
            if (sec.variant === "reference" || sec.variant === "fixtureMatrix") continue;
            for (const f of sec.fields ?? []) {
                const v = vals[f.key];
                if (isEmpty(v)) continue;
                out.push({ tab: tab.key, key: f.key, label: f.label, value: String(v).slice(0, 300) });
            }
        }
    }
    return out;
}

function normalizeAduType(raw: unknown): AduTypeValue | null {
    const s = String(raw ?? "").toLowerCase();
    if (!s) return null;
    if (/garage|conversion|jadu/.test(s)) return "garage";
    if (/attach/.test(s)) return "attached";
    if (/detach|standalone|new construction/.test(s)) return "detached";
    return null;
}
function num(v: unknown): number | null {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : null;
}
function isAffirmative(v: unknown): boolean {
    if (v == null) return false;
    if (typeof v === "number") return v > 0;
    const s = String(v).trim().toLowerCase();
    if (!s || s === "no" || s === "n" || s === "n/a" || s === "na" || s === "none" || s === "false") return false;
    return true;
}

export interface AduSpecGuess {
    aduType: AduTypeValue | null;
    sqft: number | null;
    beds: number | null;
    baths: number | null;
    allElectric: boolean | null;
}
export function deriveAduSpec(siteVisit: Record<string, unknown>): AduSpecGuess {
    return {
        aduType: normalizeAduType(siteVisit.adu_type),
        sqft: num(siteVisit.sow_sqft) ?? num(siteVisit.adu_sqft),
        beds: num(siteVisit.sow_bedrooms) ?? num(siteVisit.adu_bedrooms),
        baths: num(siteVisit.sow_bathrooms) ?? num(siteVisit.adu_bathrooms),
        allElectric: isAffirmative(siteVisit.adu_all_electric) ? true : null,
    };
}

// ── AI schema ────────────────────────────────────────────────────────────────
// Flat schema — Anthropic's strict structured-output grammar blows up on deeply
// nested/optional shapes ("compiled grammar too large"). Keep this minimal and
// re-wrap into the richer DerivedField shapes in buildProposalPrefill().
const AiPrefillSchema = z.object({
    motivation: z.enum(["family", "income", "investment", "unknown"]),
    motivationReason: z.string(),
    aduType: z.enum(["detached", "attached", "garage", "unknown"]),
    aduTypeReason: z.string(),
    sqft: z.number().nullable(),
    beds: z.number().nullable(),
    baths: z.number().nullable(),
    allElectric: z.boolean().nullable(),
    suggestedUnitIds: z.array(z.string()),
    owed: z.number().nullable(),
    currentMortgageMonthly: z.number().nullable(),
    financialsQuote: z.string(),
    // The comprehensive site-work match: the AI maps FPA answers → catalog items.
    siteWork: z.array(
        z.object({
            catId: z.string(),
            itemId: z.string().nullable(),
            label: z.string(),
            sourceLabel: z.string(),
            amount: z.number().nullable(),
            rationale: z.string(),
        }),
    ),
    featuredStoryIds: z.array(z.string()),
    featuredPropertyIds: z.array(z.string()),
    talkingPoints: z.array(z.string()),
});
type AiPrefill = z.infer<typeof AiPrefillSchema>;

const SYSTEM_PROMPT = `You are a sales-operations assistant for Backyard Estates, a California ADU builder.

You receive: (1) consultation notes/transcript, (2) EVERY answered field from the architect's Formal Property Analysis (FPA) with its human label, (3) the architect's explicit flags, (4) the full site-work cost catalog, and (5) candidate floorplans, stories, and completed properties. You produce a structured prefill so a rep can review and approve it into a proposal.

Be thorough and literal — your job is to surface EVERY plausible match so the rep can approve/decline. Ground every item in the data; if something isn't supported, use "unknown"/null/empty. Never invent dollar amounts.

motivation: classify the primary reason for the ADU as "family", "income", or "investment" ("unknown" if unclear). motivationReason: one sentence.
aduType: detached / attached / garage ("unknown" if unclear). aduTypeReason: one sentence.
sqft / beds / baths / allElectric: the desired ADU spec (null when not stated).
suggestedUnitIds: from availableUnits, those within ~15% sqft and matching beds — closest first. Use only provided ids.
owed / currentMortgageMonthly: ONLY if the transcript states them; else null. financialsQuote: the exact words you used (or "").

siteWork (MOST IMPORTANT): read ALL FPA answers and map each one that implies site work to the BEST-matching catalog item.
- Choose catId + itemId from the provided catalog. itemId must be one of the catalog's items for that catId. If nothing fits, set itemId=null and give a clear custom label under the closest category.
- Interpret answers semantically, not by keyword: "Sewer scope needed: yes", "needs a scope", "line is old, recommend scoping" → the "Sewer scope" item. "Panel is 100A, needs upgrade" → relocate/upgrade panel. "Two large pines in the way" → tree removal. "Meter is undersized" → water meter upgrade. A "no"/"n/a"/blank answer is NOT a need.
- sourceLabel = the FPA question label + its answer (e.g. 'Sewer scope needed = "yes"'), so the rep sees exactly why.
- amount: only if the architect wrote a dollar figure; else null (the rep fills it).
- rationale: one sentence.
- Cover everything: water/sewer/power/gas, meters, trenching, concrete, roofing, fire, demo/trees, structural, foundation, drainage, fire sprinklers, surveys, soils, grading, impact fees, etc.
- Don't duplicate the same catalog item twice.

featuredStoryIds / featuredPropertyIds: choose ones matching motivation/concerns and unit size. Use only provided ids.
talkingPoints: one short concrete talking point string per stated concern.`;

export interface ProposalPrefillInput {
    customerName?: string | null;
    customerProfile?: CustomerProfile;
    consultation: {
        summary?: string | null;
        transcript?: string | null;
        aiSummary?: unknown;
    };
    fpa: {
        siteVisit: Record<string, unknown>;
        cityInfo: Record<string, unknown>;
        flags: FlagLike[];
    };
    availableUnits: { id: string; name?: string | null; bed?: number | null; bath?: number | null; sqft?: number | null }[];
    stories: { id: string; names?: string | null; purpose?: string | null; quote?: string | null }[];
    properties: { id: string; name?: string | null; bed?: number | null; bath?: number | null; sqft?: number | null }[];
}

const TRANSCRIPT_CAP = 14000;

/** Build the full prefill plan: AI site-work matching + deterministic flag $$. */
export async function buildProposalPrefill(
    input: ProposalPrefillInput,
): Promise<ProposalPrefillPlan> {
    const { fpa } = input;

    const flagAdders = mapFlagsToCostAdders(fpa.flags);
    const specGuess = deriveAduSpec(fpa.siteVisit);
    const labeled = labeledFpaAnswers(fpa.siteVisit, fpa.cityInfo);

    const openItems: PrefillOpenItem[] = fpa.flags
        .filter((f) => f.flagType === "CONCERN" || f.flagType === "QUESTION")
        .map((f) => ({
            kind: f.flagType === "QUESTION" ? ("question" as const) : ("concern" as const),
            label: f.label || "(item)",
            note: f.flagNote || undefined,
        }));

    const ai = await runAi(input, specGuess, labeled);

    // Merge AI-matched site work with deterministic flag adders; flags win on overlap.
    const seen = new Set(flagAdders.map((a) => adderKey(a.catId, a.itemId, a.label)));
    const aiAdders: PrefillCostAdder[] = (ai.siteWork ?? [])
        .map((w) => {
            // Keep AI's itemId only if it's a real catalog item; else custom.
            const itemId = w.itemId && VALID_ITEM.has(`${w.catId}:${w.itemId}`) ? w.itemId : null;
            const catId = CAT_LABEL[w.catId] ? w.catId : "permits";
            return {
                catId,
                catLabel: CAT_LABEL[catId] ?? "Other",
                itemId,
                label: w.label || presetLabel(catId, itemId) || "Site-work item",
                amount: w.amount ?? null,
                source: "answer" as const,
                targetUnitIds: [],
                confidence: "medium" as const,
                rationale: w.rationale,
                sourceLabel: w.sourceLabel,
            };
        })
        .filter((a) => {
            const k = adderKey(a.catId, a.itemId, a.label);
            if (seen.has(k)) return false;
            seen.add(k);
            return true;
        });

    const costAdders = [...flagAdders, ...aiAdders];

    // Re-wrap the flat AI output into the rich DerivedField shapes the UI uses.
    const mk = <T,>(value: T, rationale: string, confidence: Confidence = "medium", sourceQuote?: string): DerivedField<T> => ({
        value,
        confidence,
        rationale,
        ...(sourceQuote ? { sourceQuote } : {}),
    });

    const aiMotivation = ai.motivation === "unknown" ? null : ai.motivation;
    const aiAduType = ai.aduType === "unknown" ? null : (ai.aduType as AduTypeValue);

    return {
        customerProfile: input.customerProfile ?? {
            name: input.customerName ?? null,
            email: null,
            phone: null,
            pipedrivePersonId: null,
            pipedriveDealId: null,
        },
        motivation: mk(aiMotivation, ai.motivationReason || "—", aiMotivation ? "medium" : "low"),
        aduType: mk(
            aiAduType ?? specGuess.aduType,
            aiAduType ? ai.aduTypeReason || "—" : specGuess.aduType ? "From the FPA 'ADU type' answer." : "Not specified.",
            aiAduType || specGuess.aduType ? "medium" : "low",
        ),
        unitSpec: {
            sqft: mk(ai.sqft ?? specGuess.sqft, "Desired ADU size from the FPA / conversation."),
            beds: mk(ai.beds ?? specGuess.beds, "Desired bedrooms from the FPA / conversation."),
            baths: mk(ai.baths ?? specGuess.baths, "Desired bathrooms from the FPA / conversation."),
            allElectric: mk(ai.allElectric ?? specGuess.allElectric, "All-electric preference."),
        },
        suggestedUnitIds: mk(ai.suggestedUnitIds ?? [], "Matched by size & bedrooms to the desired unit."),
        financials: {
            owed: mk(ai.owed ?? null, "Balance owed, from the transcript.", ai.owed != null ? "medium" : "low", ai.financialsQuote || undefined),
            currentMortgageMonthly: mk(
                ai.currentMortgageMonthly ?? null,
                "Current monthly payment, from the transcript.",
                ai.currentMortgageMonthly != null ? "medium" : "low",
                ai.financialsQuote || undefined,
            ),
        },
        costAdders,
        featuredStoryIds: mk(ai.featuredStoryIds ?? [], "Stories matching the customer's motivation & concerns."),
        featuredPropertyIds: mk(ai.featuredPropertyIds ?? [], "Completed builds matching the desired unit size."),
        openItems,
        talkingPoints: (ai.talkingPoints ?? []).map((p) => ({ point: p })),
    };
}

async function runAi(
    input: ProposalPrefillInput,
    specGuess: AduSpecGuess,
    labeledAnswers: LabeledAnswer[],
): Promise<AiPrefill> {
    const client = getAnthropic();

    const transcript = (input.consultation.transcript ?? "").slice(0, TRANSCRIPT_CAP);
    const userPayload = {
        customerName: input.customerName ?? null,
        consultation: {
            summary: input.consultation.summary ?? null,
            aiSummary: input.consultation.aiSummary ?? null,
            transcript: transcript || null,
        },
        fpaAduSpecGuess: specGuess,
        fpaAnswers: labeledAnswers,
        architectFlags: input.fpa.flags.map((f) => ({
            type: f.flagType,
            label: f.label,
            note: f.flagNote,
            estCostImpact: f.estCostImpact ?? null,
        })),
        siteWorkCatalog: catalogForAi(),
        availableUnits: input.availableUnits,
        stories: input.stories,
        properties: input.properties,
    };

    const message = await client.messages.parse({
        model: CLAUDE_MODEL,
        max_tokens: 6000,
        system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
        messages: [{ role: "user", content: JSON.stringify(userPayload) }],
        output_config: { format: zodOutputFormat(AiPrefillSchema) },
    });

    const parsed = message.parsed_output;
    if (!parsed) throw new Error("Claude returned no structured output for the proposal prefill.");
    return parsed;
}
