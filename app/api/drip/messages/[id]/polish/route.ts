import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDripMessageAccess, dripErrorResponse } from "@/lib/drip/access";
import { client as sanity } from "@/sanity/client";
import {
    PRESENTER_STORIES_QUERY,
    PRESENTER_COMPLETED_PROPERTIES_QUERY,
    PRESENTER_ALL_FLOORPLANS_QUERY,
} from "@/sanity/queries";
import { isAnthropicConfigured } from "@/lib/ai/claude";
import { polishDripMessage } from "@/lib/ai/dripPolish";
import { buildDripContent, sanitizeEmailLinks } from "@/lib/drip/links";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Claude calls can run long; raise the serverless budget so the function isn't
// killed mid-request (which returns a non-JSON page the client can't parse).
export const maxDuration = 300;

interface PolishBody {
    instruction?: string;
    // Allow the client to send the in-progress (unsaved) draft so polish acts
    // on what the rep currently sees, not just the persisted version.
    subject?: string;
    body?: string;
}

type SanitySlug = string | { current?: string | null } | null;
interface SanityStory {
    _id: string;
    names?: string;
    purpose?: string;
    quote?: string;
    slug?: SanitySlug;
}
interface SanityProperty {
    _id: string;
    name?: string;
    sqft?: number;
    bed?: number;
    bath?: number;
    slug?: SanitySlug;
}
interface SanityFloorplan {
    _id: string;
    name?: string;
    sqft?: number;
    bed?: number;
    bath?: number;
    slug?: SanitySlug;
}

// POST /api/drip/messages/[id]/polish
// AI-rewrite one email per the rep's instruction, grounded in the prospect's
// consultation context + Sanity content. Returns a draft; it is NOT saved.
export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;
        const { message } = await requireDripMessageAccess(id);

        if (!isAnthropicConfigured()) {
            return NextResponse.json(
                { error: "ANTHROPIC_API_KEY is not configured on this server." },
                { status: 503 },
            );
        }

        let body: PolishBody;
        try {
            body = (await req.json()) as PolishBody;
        } catch {
            return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
        }
        const instruction = body.instruction?.trim();
        if (!instruction) {
            return NextResponse.json(
                { error: "Tell the AI how you'd like this email changed." },
                { status: 400 },
            );
        }

        // Prospect context from the latest consultation analysis.
        const consult = await prisma.consultation.findFirst({
            where: { engagementId: message.enrollment.engagementId },
            orderBy: { createdAt: "desc" },
            select: { aiSummaryJson: true },
        });
        const ai = (consult?.aiSummaryJson ?? null) as {
            bulletPoints?: string[];
            intent?: { primaryMotivation?: string; readiness?: string; concerns?: string[] };
        } | null;

        const [stories, properties, floorplans] = await Promise.all([
            sanity.fetch<SanityStory[]>(PRESENTER_STORIES_QUERY).catch(() => []),
            sanity.fetch<SanityProperty[]>(PRESENTER_COMPLETED_PROPERTIES_QUERY).catch(() => []),
            sanity.fetch<SanityFloorplan[]>(PRESENTER_ALL_FLOORPLANS_QUERY).catch(() => []),
        ]);

        const content = buildDripContent({
            stories: stories.slice(0, 12),
            properties: properties.slice(0, 12),
            floorplans: floorplans.slice(0, 12),
        });

        const result = await polishDripMessage({
            currentSubject: body.subject?.trim() || message.subject,
            currentBody: body.body?.trim() || message.body,
            instruction,
            customerName: message.enrollment.engagement.customerName,
            motivation: ai?.intent?.primaryMotivation ?? null,
            readiness: ai?.intent?.readiness ?? null,
            concerns: ai?.intent?.concerns ?? [],
            bulletPoints: ai?.bulletPoints ?? [],
            stories: content.stories,
            properties: content.properties,
            floorplans: content.floorplans,
        });

        // Guarantee the rewrite only contains real, known-good links.
        result.body = sanitizeEmailLinks(result.body, content.allowed);

        return NextResponse.json({ draft: result });
    } catch (err) {
        const mapped = dripErrorResponse(err);
        if (mapped) return mapped;
        console.error("[POST /api/drip/messages/[id]/polish]", err);
        return NextResponse.json(
            { error: err instanceof Error ? err.message : String(err) },
            { status: 502 },
        );
    }
}
