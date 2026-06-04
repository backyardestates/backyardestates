import { NextResponse } from "next/server";
import { Prisma, Role } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { ensureProposalContext } from "@/lib/db/ensureProposalContext";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/proposals/[id]/agreement
// Body: { agreementInput?: object, edits?: { html, editedAt, baseFingerprint } | null }
//
// Persists the agreement's rebuild inputs (AgreementBuildInput) on the proposal
// so the agreement can be reopened, sent for signature, and rendered by id —
// independent of the admin tab's localStorage handoff. Mints a shareToken if the
// proposal doesn't have one yet.
//
// Inline-edit persistence (`__edits` key inside agreementInput):
//   - body.edits object    → store/replace the rep's inline edits
//   - body.edits === null  → clear them (explicit "regenerate from data")
//   - body.edits omitted   → PRESERVE whatever edits are already stored, even
//     when agreementInput is being rewritten. This is the guard that stops the
//     admin tool's proposal saves from wiping the rep's agreement edits.
export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { userId, role } = await ensureProposalContext();
        const { id } = await params;

        let body: { agreementInput?: unknown; edits?: unknown };
        try {
            body = await req.json();
        } catch {
            return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
        }
        if (body.agreementInput === undefined && body.edits === undefined) {
            return NextResponse.json(
                { error: "Provide agreementInput and/or edits" },
                { status: 400 },
            );
        }

        const existing = await prisma.proposal.findUnique({
            where: { id },
            select: { id: true, createdById: true, shareToken: true, agreementInput: true },
        });
        if (!existing) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }
        if (role !== Role.ADMIN && existing.createdById !== userId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const existingInput =
            existing.agreementInput && typeof existing.agreementInput === "object"
                ? (existing.agreementInput as Record<string, unknown>)
                : null;

        // Base input: the incoming one, or (edits-only call) the stored one.
        const baseInput =
            body.agreementInput !== undefined
                ? (body.agreementInput as Record<string, unknown>)
                : existingInput;
        if (!baseInput || typeof baseInput !== "object") {
            return NextResponse.json(
                { error: "No stored agreementInput to attach edits to" },
                { status: 400 },
            );
        }

        // Resolve __edits: explicit set / explicit clear / preserve existing.
        const merged: Record<string, unknown> = { ...baseInput };
        if (body.edits !== undefined) {
            if (body.edits === null) delete merged.__edits;
            else merged.__edits = body.edits;
        } else if (existingInput?.__edits !== undefined && merged.__edits === undefined) {
            merged.__edits = existingInput.__edits;
        }

        const shareToken = existing.shareToken ?? randomUUID();
        await prisma.proposal.update({
            where: { id },
            data: {
                shareToken,
                agreementInput: merged as Prisma.InputJsonValue,
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
