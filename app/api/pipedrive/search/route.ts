import { NextResponse } from "next/server";
import { ensureProposalContext } from "@/lib/db/ensureProposalContext";
import {
    pipedriveFetch,
    PipedriveApiError,
    PipedriveConfigError,
    isPipedriveConfigured,
} from "@/lib/pipedrive/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/pipedrive/search?q=<query>
 *
 * Fuzzy-searches Pipedrive across persons + deals using `itemSearch` (which
 * uniquely supports searching the address field too), then enriches each
 * visible result with a follow-up detail fetch so the UI can show stage,
 * pipeline, owner, expected close date, last activity, and similar
 * identifying signals that itemSearch doesn't return inline.
 *
 * Auth: any authenticated user (the rep is searching their own pipeline).
 */

type PdItemSearchResponse = {
    success: boolean;
    data: { items: { item: { id: number; type: string } }[] };
};

type PdDealDetail = {
    id: number;
    title: string;
    status: string | null;
    stage_id: number | null;
    value: number | null;
    currency: string | null;
    person_id: { value?: number; name?: string } | null;
    org_id: { value?: number; name?: string } | null;
    owner_name: string | null;
    expected_close_date: string | null;
    update_time: string | null;
    add_time: string | null;
};

type PdPersonDetail = {
    id: number;
    name: string;
    email: { value: string; primary: boolean }[] | null;
    phone: { value: string; primary: boolean }[] | null;
    org_id: { value?: number; name?: string } | null;
    postal_address: string | null;
    owner_id: { id?: number; name?: string } | null;
    last_activity_date: string | null;
    open_deals_count: number | null;
    won_deals_count: number | null;
    closed_deals_count: number | null;
    label_ids: number[] | null;
    update_time: string | null;
};

type PdStage = { id: number; name: string; pipeline_id: number };
type PdPipeline = { id: number; name: string };

export interface PipedriveSearchPerson {
    type: "person";
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    organization: string | null;
    address: string | null;
    ownerName: string | null;
    openDealCount: number;
    wonDealCount: number;
    lastActivityDate: string | null;
}

export interface PipedriveSearchDeal {
    type: "deal";
    id: number;
    title: string;
    status: string | null;
    stageName: string | null;
    pipelineName: string | null;
    value: number | null;
    currency: string | null;
    personName: string | null;
    personId: number | null;
    organizationName: string | null;
    ownerName: string | null;
    expectedCloseDate: string | null;
    updateTime: string | null;
}

export type PipedriveSearchResult = PipedriveSearchPerson | PipedriveSearchDeal;

// ── Stages cache ───────────────────────────────────────────────────────────
// Stage/pipeline definitions barely ever change. Cache them module-side for
// 5 minutes so we're not making 2 extra API calls per search.
const STAGES_TTL_MS = 5 * 60_000;
let stagesCache:
    | { stages: Map<number, { name: string; pipelineName: string }>; at: number }
    | null = null;

async function getStagesMap(): Promise<Map<number, { name: string; pipelineName: string }>> {
    if (stagesCache && Date.now() - stagesCache.at < STAGES_TTL_MS) {
        return stagesCache.stages;
    }
    const [stagesRes, pipelinesRes] = await Promise.all([
        pipedriveFetch<{ data: PdStage[] | null }>("stages"),
        pipedriveFetch<{ data: PdPipeline[] | null }>("pipelines"),
    ]);
    const pipelineMap = new Map((pipelinesRes.data ?? []).map((p) => [p.id, p.name]));
    const map = new Map<number, { name: string; pipelineName: string }>();
    for (const s of stagesRes.data ?? []) {
        map.set(s.id, {
            name: s.name,
            pipelineName: pipelineMap.get(s.pipeline_id) ?? "",
        });
    }
    stagesCache = { stages: map, at: Date.now() };
    return map;
}

export async function GET(req: Request) {
    try {
        await ensureProposalContext();
    } catch {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isPipedriveConfigured()) {
        return NextResponse.json(
            { error: "Pipedrive is not configured on this server." },
            { status: 503 },
        );
    }

    const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
    if (q.length < 2) {
        return NextResponse.json({ results: [] satisfies PipedriveSearchResult[] });
    }

    try {
        // Step 1 — fuzzy search (gives us only IDs + types we can trust).
        const search = await pipedriveFetch<PdItemSearchResponse>("itemSearch", {
            query: {
                term: q,
                item_types: "person,deal",
                fields: "name,phone,email,title,address,notes,custom_fields",
                limit: 10, // capped to keep the N+1 detail fan-out small
            },
        });

        const refs = (search?.data?.items ?? []).map((r) => ({
            id: r.item.id,
            type: r.item.type as "person" | "deal" | "organization",
        }));
        if (refs.length === 0) {
            return NextResponse.json({ results: [] });
        }

        // Step 2 — enrich. Parallel detail fetches + stages map. Each detail
        // call fails-soft so one bad ID can't kill the whole response.
        const stagesPromise = getStagesMap();
        const detailPromises = refs.map((ref) => {
            if (ref.type === "person") {
                return pipedriveFetch<{ data: PdPersonDetail }>(`persons/${ref.id}`)
                    .then((d) => ({ ref, data: d.data }))
                    .catch(() => ({ ref, data: null as PdPersonDetail | null }));
            }
            if (ref.type === "deal") {
                return pipedriveFetch<{ data: PdDealDetail }>(`deals/${ref.id}`)
                    .then((d) => ({ ref, data: d.data }))
                    .catch(() => ({ ref, data: null as PdDealDetail | null }));
            }
            return Promise.resolve({ ref, data: null });
        });

        const [stagesMap, ...details] = await Promise.all([stagesPromise, ...detailPromises]);

        const results: PipedriveSearchResult[] = [];
        for (const { ref, data } of details) {
            if (!data) continue;
            if (ref.type === "person") {
                const p = data as PdPersonDetail;
                results.push({
                    type: "person",
                    id: p.id,
                    name: p.name,
                    email: p.email?.find((e) => e.primary)?.value ?? p.email?.[0]?.value ?? null,
                    phone: p.phone?.find((e) => e.primary)?.value ?? p.phone?.[0]?.value ?? null,
                    organization: p.org_id?.name ?? null,
                    address: p.postal_address ?? null,
                    ownerName: p.owner_id?.name ?? null,
                    openDealCount: p.open_deals_count ?? 0,
                    wonDealCount: p.won_deals_count ?? 0,
                    lastActivityDate: p.last_activity_date ?? null,
                });
            } else if (ref.type === "deal") {
                const d = data as PdDealDetail;
                const stage = d.stage_id ? stagesMap.get(d.stage_id) : null;
                results.push({
                    type: "deal",
                    id: d.id,
                    title: d.title,
                    status: d.status,
                    stageName: stage?.name ?? null,
                    pipelineName: stage?.pipelineName ?? null,
                    value: d.value,
                    currency: d.currency,
                    personName: d.person_id?.name ?? null,
                    personId: d.person_id?.value ?? null,
                    organizationName: d.org_id?.name ?? null,
                    ownerName: d.owner_name,
                    expectedCloseDate: d.expected_close_date,
                    updateTime: d.update_time,
                });
            }
        }

        return NextResponse.json({ results });
    } catch (err) {
        if (err instanceof PipedriveConfigError) {
            return NextResponse.json({ error: err.message }, { status: 500 });
        }
        if (err instanceof PipedriveApiError) {
            return NextResponse.json(
                { error: err.message, details: err.body },
                { status: err.status },
            );
        }
        console.error("[GET /api/pipedrive/search]", err);
        return NextResponse.json(
            { error: err instanceof Error ? err.message : String(err) },
            { status: 500 },
        );
    }
}
