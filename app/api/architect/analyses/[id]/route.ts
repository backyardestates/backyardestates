import { NextResponse } from "next/server";
import { Prisma, Role, AnalysisStatus, FlagType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ensureProposalContext } from "@/lib/db/ensureProposalContext";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface AnswerInput {
    workItemId: string;
    status?: string; // "ok" | "attention" | "na"
    notes?: string;
    flagType?: string | null; // COST_ADDER | CONCERN | QUESTION | null
    flagNote?: string;
    estCostImpact?: number | null;
}

function parseFlag(raw: string | null | undefined): FlagType | null {
    if (!raw) return null;
    return raw in FlagType ? (raw as FlagType) : null;
}

// PATCH /api/architect/analyses/[id]
// Save (upsert) the architect's answers + flags for a formal analysis.
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

        let body: { answers?: AnswerInput[] };
        try {
            body = (await req.json()) as { answers?: AnswerInput[] };
        } catch {
            return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
        }
        const answers = body.answers ?? [];

        await prisma.$transaction([
            ...answers.map((a) =>
                prisma.formalAnswer.upsert({
                    where: {
                        formalAnalysisId_workItemId: {
                            formalAnalysisId: id,
                            workItemId: a.workItemId,
                        },
                    },
                    create: {
                        formalAnalysisId: id,
                        workItemId: a.workItemId,
                        valueJson: { status: a.status ?? null } as Prisma.InputJsonValue,
                        notes: a.notes ?? null,
                        flagType: parseFlag(a.flagType),
                        flagNote: a.flagNote ?? null,
                        estCostImpact: a.estCostImpact ?? null,
                    },
                    update: {
                        valueJson: { status: a.status ?? null } as Prisma.InputJsonValue,
                        notes: a.notes ?? null,
                        flagType: parseFlag(a.flagType),
                        flagNote: a.flagNote ?? null,
                        estCostImpact: a.estCostImpact ?? null,
                    },
                }),
            ),
            prisma.formalAnalysis.update({
                where: { id },
                data: {
                    status:
                        analysis.status === AnalysisStatus.PENDING
                            ? AnalysisStatus.IN_PROGRESS
                            : analysis.status,
                    startedAt: analysis.status === AnalysisStatus.PENDING ? new Date() : undefined,
                },
            }),
        ]);

        return NextResponse.json({ ok: true, saved: answers.length });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg === "UNAUTHORIZED") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        console.error("[PATCH /api/architect/analyses/[id]]", err);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
