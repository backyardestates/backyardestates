import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ensureProposalContext } from "@/lib/db/ensureProposalContext";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/proposals/[id]/presenter-payload
// Body: { presenterBroadcast?: object; agreementInput?: object }
//
// Stores the computed presenter payloads for by-id rendering and mints a
// shareToken if the proposal doesn't have one yet. Called fire-and-forget by
// the admin tool right after a successful REVIEWED save — additive and fully
// isolated from the snapshot save path, so a failure here never affects the
// proposal save or the live presenting flow.
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        await ensureProposalContext();
        const { id } = await params;

        let body: { presenterBroadcast?: unknown; agreementInput?: unknown };
        try {
            body = await req.json();
        } catch {
            return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
        }

        const existing = await prisma.proposal.findUnique({
            where: { id },
            select: { id: true, shareToken: true },
        });
        if (!existing) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        const shareToken = existing.shareToken ?? randomUUID();

        await prisma.proposal.update({
            where: { id },
            data: {
                shareToken,
                ...(body.presenterBroadcast !== undefined
                    ? { presenterBroadcast: body.presenterBroadcast as Prisma.InputJsonValue }
                    : {}),
                ...(body.agreementInput !== undefined
                    ? { agreementInput: body.agreementInput as Prisma.InputJsonValue }
                    : {}),
            },
        });

        return NextResponse.json({ ok: true, id, shareToken });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg === "UNAUTHORIZED") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        console.error("[POST /api/proposals/[id]/presenter-payload]", err);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
