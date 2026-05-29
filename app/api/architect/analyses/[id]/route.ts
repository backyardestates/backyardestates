import { NextResponse } from "next/server";
import { Prisma, Role, AnalysisStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ensureProposalContext } from "@/lib/db/ensureProposalContext";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface PatchBody {
    siteVisit?: Record<string, unknown>;
    cityInfo?: Record<string, unknown>;
    flags?: {
        label?: string;
        flagType?: string;
        flagNote?: string;
        estCostImpact?: number | null;
        /** Set when the flag is tied to a specific template field (inline flag). */
        fieldKey?: string;
        /** Which tab the flagged field lives on ("siteVisit" | "cityInfo"). */
        tab?: string;
    }[];
}

// PATCH /api/architect/analyses/[id]
// Save the architect's Site Visit / City Info answers and the estimate flags.
// Each field is optional — only the provided tabs/flags are written.
export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { userId, role } = await ensureProposalContext();
        const { id } = await params;

        const analysis = await prisma.formalAnalysis.findUnique({
            where: { id },
            select: { id: true, architectId: true, status: true },
        });
        if (!analysis) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }
        if (role !== Role.ADMIN && analysis.architectId !== userId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        if (analysis.status === AnalysisStatus.COMPLETE) {
            return NextResponse.json(
                { error: "This analysis was already submitted." },
                { status: 409 },
            );
        }

        let body: PatchBody;
        try {
            body = (await req.json()) as PatchBody;
        } catch {
            return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
        }

        await prisma.formalAnalysis.update({
            where: { id },
            data: {
                ...(body.siteVisit !== undefined
                    ? { siteVisitJson: body.siteVisit as Prisma.InputJsonValue }
                    : {}),
                ...(body.cityInfo !== undefined
                    ? { cityInfoJson: body.cityInfo as Prisma.InputJsonValue }
                    : {}),
                ...(body.flags !== undefined
                    ? { flagsJson: body.flags as unknown as Prisma.InputJsonValue }
                    : {}),
                status:
                    analysis.status === AnalysisStatus.PENDING
                        ? AnalysisStatus.IN_PROGRESS
                        : analysis.status,
                startedAt: analysis.status === AnalysisStatus.PENDING ? new Date() : undefined,
            },
        });

        return NextResponse.json({ ok: true });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg === "UNAUTHORIZED") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        console.error("[PATCH /api/architect/analyses/[id]]", err);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
