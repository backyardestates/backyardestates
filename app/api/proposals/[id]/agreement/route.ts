import { NextResponse } from "next/server";
import { Prisma, Role } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { ensureProposalContext } from "@/lib/db/ensureProposalContext";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/proposals/[id]/agreement
// Body: { agreementInput: object }
//
// Persists the agreement's rebuild inputs (AgreementBuildInput) on the proposal
// so the agreement can be reopened, sent for signature, and rendered by id —
// independent of the admin tab's localStorage handoff. Mints a shareToken if the
// proposal doesn't have one yet.
export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { userId, role } = await ensureProposalContext();
        const { id } = await params;

        let body: { agreementInput?: unknown };
        try {
            body = await req.json();
        } catch {
            return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
        }
        if (body.agreementInput === undefined) {
            return NextResponse.json({ error: "Missing agreementInput" }, { status: 400 });
        }

        const existing = await prisma.proposal.findUnique({
            where: { id },
            select: { id: true, createdById: true, shareToken: true },
        });
        if (!existing) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }
        if (role !== Role.ADMIN && existing.createdById !== userId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const shareToken = existing.shareToken ?? randomUUID();
        await prisma.proposal.update({
            where: { id },
            data: {
                shareToken,
                agreementInput: body.agreementInput as Prisma.InputJsonValue,
            },
        });

        return NextResponse.json({ ok: true, id, shareToken });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg === "UNAUTHORIZED") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        console.error("[POST /api/proposals/[id]/agreement]", err);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
