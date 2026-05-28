import { NextResponse } from "next/server";
import { AnalysisStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ensureProposalContext } from "@/lib/db/ensureProposalContext";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/architect/flags?addressKey=<normalized address>
// Returns the architect's flags from the latest COMPLETE formal analysis for
// the engagement matching this address — so the proposal builder can surface
// cost-adders / concerns / questions while the rep estimates.
export async function GET(req: Request) {
    try {
        const { organizationId } = await ensureProposalContext();
        const addressKey = new URL(req.url).searchParams.get("addressKey")?.trim();
        if (!addressKey) return NextResponse.json({ flags: [] });

        const engagement = await prisma.engagement.findFirst({
            where: { organizationId, addressKey },
            orderBy: { updatedAt: "desc" },
            select: {
                id: true,
                customerName: true,
                formalAnalyses: {
                    where: { status: AnalysisStatus.COMPLETE },
                    orderBy: { completedAt: "desc" },
                    take: 1,
                    select: { id: true, flagsJson: true, completedAt: true },
                },
            },
        });

        const analysis = engagement?.formalAnalyses?.[0] ?? null;
        const flags = Array.isArray(analysis?.flagsJson) ? analysis.flagsJson : [];

        return NextResponse.json({
            flags,
            engagementId: engagement?.id ?? null,
            customerName: engagement?.customerName ?? null,
            submittedAt: analysis?.completedAt ?? null,
        });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg === "UNAUTHORIZED") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        console.error("[GET /api/architect/flags]", err);
        return NextResponse.json({ flags: [] });
    }
}
