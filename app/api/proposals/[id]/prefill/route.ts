import { NextResponse } from "next/server";
import { Prisma, Role, AnalysisStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ensureProposalContext } from "@/lib/db/ensureProposalContext";
import { isAnthropicConfigured } from "@/lib/ai/claude";
import { buildProposalPrefill, type FlagLike } from "@/lib/ai/proposalPrefill";
import { client as sanity } from "@/sanity/client";
import { PRESENTER_STORIES_QUERY, PRESENTER_COMPLETED_PROPERTIES_QUERY } from "@/sanity/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface PrefillBody {
    units?: { id: string; name?: string | null; bed?: number | null; bath?: number | null; sqft?: number | null }[];
}
interface SanityStory {
    _id: string;
    names?: string;
    purpose?: string;
    quote?: string;
}
interface SanityProperty {
    _id: string;
    name?: string;
    sqft?: number;
    bed?: number;
    bath?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/proposals/[id]/prefill
//   - default: build (or return cached) the consultation+FPA → proposal prefill
//     plan. ?refresh=1 forces a rebuild.
//   - ?apply=1: mark the proposal's prefill as applied so the popup won't reopen.
// Fail-safe: returns { plan: null } with 200 if there's nothing to prefill or AI
// is unavailable, so the proposal tool never blocks.
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { userId, role } = await ensureProposalContext();
        const { id } = await params;
        const url = new URL(req.url);

        const proposal = await prisma.proposal.findUnique({
            where: { id },
            select: {
                id: true,
                createdById: true,
                engagementId: true,
                addressKey: true,
                customerName: true,
                customerEmail: true,
                customerPhone: true,
                pipedrivePersonId: true,
                pipedriveDealId: true,
                prefillJson: true,
            },
        });
        if (!proposal) return NextResponse.json({ error: "Not found" }, { status: 404 });
        if (role !== Role.ADMIN && proposal.createdById !== userId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Mark-applied mode.
        if (url.searchParams.get("apply") === "1") {
            await prisma.proposal.update({
                where: { id },
                data: { prefillAppliedAt: new Date() },
            });
            return NextResponse.json({ ok: true });
        }

        // Always rebuild so the plan reflects the CURRENT consultation + FPA
        // (the architect may have edited the analysis after the last open). The
        // result is still persisted to prefillJson for record/debugging.
        if (!isAnthropicConfigured()) {
            return NextResponse.json({ plan: null, error: "AI not configured" });
        }

        // Resolve the engagement (by link, else by address) and pull the latest
        // consultation + COMPLETE FPA.
        const engagement = proposal.engagementId
            ? await prisma.engagement.findUnique({ where: { id: proposal.engagementId }, select: engSelect() })
            : proposal.addressKey
              ? await prisma.engagement.findFirst({
                    where: { addressKey: proposal.addressKey },
                    orderBy: { updatedAt: "desc" },
                    select: engSelect(),
                })
              : null;

        const consultation = engagement?.consultations?.[0] ?? null;
        const fpa = engagement?.formalAnalyses?.[0] ?? null;
        if (!consultation && !fpa) {
            return NextResponse.json({ plan: null, hasConsultation: false, hasFpa: false });
        }

        const body = (await req.json().catch(() => ({}))) as PrefillBody;
        const [stories, properties] = await Promise.all([
            sanity.fetch<SanityStory[]>(PRESENTER_STORIES_QUERY).catch(() => [] as SanityStory[]),
            sanity.fetch<SanityProperty[]>(PRESENTER_COMPLETED_PROPERTIES_QUERY).catch(() => [] as SanityProperty[]),
        ]);

        let plan;
        try {
            plan = await buildProposalPrefill({
                customerName: proposal.customerName || engagement?.customerName || null,
                customerProfile: {
                    name: proposal.customerName || engagement?.customerName || null,
                    email: proposal.customerEmail || engagement?.customerEmail || null,
                    phone: proposal.customerPhone || engagement?.customerPhone || null,
                    pipedrivePersonId: proposal.pipedrivePersonId || engagement?.pipedrivePersonId || null,
                    pipedriveDealId: proposal.pipedriveDealId || engagement?.pipedriveDealId || null,
                },
                consultation: {
                    summary: consultation?.summary ?? null,
                    transcript: consultation?.transcript ?? null,
                    aiSummary: consultation?.aiSummaryJson ?? null,
                },
                fpa: {
                    siteVisit: (fpa?.siteVisitJson as Record<string, unknown> | null) ?? {},
                    cityInfo: (fpa?.cityInfoJson as Record<string, unknown> | null) ?? {},
                    flags: Array.isArray(fpa?.flagsJson) ? (fpa!.flagsJson as FlagLike[]) : [],
                },
                availableUnits: body.units ?? [],
                stories: stories.slice(0, 14).map((s) => ({ id: s._id, names: s.names, purpose: s.purpose, quote: s.quote })),
                properties: properties.slice(0, 24).map((p) => ({ id: p._id, name: p.name, bed: p.bed, bath: p.bath, sqft: p.sqft })),
            });
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            console.error("[proposals/prefill] build failed", err);
            return NextResponse.json({ plan: null, error: msg });
        }

        await prisma.proposal
            .update({ where: { id }, data: { prefillJson: plan as unknown as Prisma.InputJsonValue } })
            .catch((err) => console.error("[proposals/prefill] cache write failed", err));

        return NextResponse.json({ plan, hasConsultation: !!consultation, hasFpa: !!fpa });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg === "UNAUTHORIZED") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        console.error("[POST /api/proposals/[id]/prefill]", err);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}

function engSelect() {
    return {
        id: true,
        customerName: true,
        customerEmail: true,
        customerPhone: true,
        pipedrivePersonId: true,
        pipedriveDealId: true,
        consultations: {
            orderBy: { createdAt: "desc" as const },
            take: 1,
            select: { summary: true, transcript: true, aiSummaryJson: true },
        },
        formalAnalyses: {
            where: { status: AnalysisStatus.COMPLETE },
            orderBy: { completedAt: "desc" as const },
            take: 1,
            select: { siteVisitJson: true, cityInfoJson: true, flagsJson: true },
        },
    };
}
