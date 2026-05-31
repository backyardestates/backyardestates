import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ensureProposalContext } from "@/lib/db/ensureProposalContext";
import { uploadAgreementPdf } from "@/lib/agreement/uploadAgreementPdf";
import { isPipedriveConfigured, pipedriveFetch } from "@/lib/pipedrive/client";
import { buildProposalNote } from "@/lib/pipedrive/proposalNote";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/proposals/[id]/proposal-pdf
// Body: multipart/form-data with the exported proposal-deck PDF as `file`.
// Stores it (Cloudinary → Sanity fallback) under a DECK-specific id (so it
// never overwrites the separate *agreement* PDF), then logs a detailed note to
// the linked Pipedrive deal/person. Mirrors the agreement-pdf route, minus the
// agreement-only DB columns (pdfUrl/pdfStatus belong to the agreement PDF).
export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { userId, role } = await ensureProposalContext();
        const { id } = await params;

        const proposal = await prisma.proposal.findFirst({
            where: { OR: [{ id }, { shareToken: id }] },
            select: {
                id: true,
                createdById: true,
                customerName: true,
                addressLine1: true,
                city: true,
                state: true,
                zip: true,
                agreementInput: true,
                pipedrivePersonId: true,
                pipedriveDealId: true,
                engagement: { select: { pipedrivePersonId: true, pipedriveDealId: true } },
            },
        });
        if (!proposal) return NextResponse.json({ error: "Not found" }, { status: 404 });
        if (role !== Role.ADMIN && proposal.createdById !== userId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const form = await req.formData();
        const file = form.get("file");
        if (!(file instanceof File)) {
            return NextResponse.json({ error: "Missing PDF file" }, { status: 400 });
        }
        const bytes = Buffer.from(await file.arrayBuffer());
        const filename = file.name || `BackyardEstates-Proposal-${proposal.id}.pdf`;

        // Upload under a deck-specific public id so it doesn't clobber the
        // agreement PDF (which uses `proposal-<id>`). `deck-<id>` → `proposal-deck-<id>`.
        let url: string;
        try {
            const result = await uploadAgreementPdf(bytes, {
                proposalId: `deck-${proposal.id}`,
                filename,
            });
            url = result.url;
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            console.error("[proposal-pdf] upload failed", err);
            return NextResponse.json({ error: msg }, { status: 502 });
        }

        const generatedAt = new Date();

        // Detailed Pipedrive note so the deal record carries the proposal deck
        // link + enough context to identify it at a glance. Awaited so the UI
        // can report whether it landed.
        const personId = proposal.pipedrivePersonId || proposal.engagement?.pipedrivePersonId || null;
        const dealId = proposal.pipedriveDealId || proposal.engagement?.pipedriveDealId || null;

        let pipedriveNote: "posted" | "no-link" | "not-configured" | "failed" = "no-link";
        if (!isPipedriveConfigured()) {
            pipedriveNote = "not-configured";
        } else if (personId || dealId) {
            const dateStr = generatedAt.toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
            });
            const content = buildProposalNote(
                {
                    agreementInput: proposal.agreementInput,
                    customerName: proposal.customerName,
                    addressLine1: proposal.addressLine1,
                    city: proposal.city,
                    state: proposal.state,
                    zip: proposal.zip,
                },
                {
                    kind: "proposal",
                    pdfUrl: url,
                    // Reliable deep link: the by-id deck export resolves from the
                    // proposal id (the master tool only loads by normalized
                    // address, which we can't reconstruct here).
                    toolUrl: `${new URL(req.url).origin}/present-v2/${proposal.id}/print`,
                    date: dateStr,
                },
            );

            const body: Record<string, unknown> = { content };
            if (personId) body.person_id = Number(personId);
            if (dealId) body.deal_id = Number(dealId);
            try {
                await pipedriveFetch("notes", { method: "POST", body });
                pipedriveNote = "posted";
            } catch (err) {
                console.error("[proposal-pdf] pipedrive note failed", err);
                pipedriveNote = "failed";
            }
        }

        return NextResponse.json({
            ok: true,
            pdfUrl: url,
            generatedAt: generatedAt.toISOString(),
            pipedriveNote,
        });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg === "UNAUTHORIZED") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        console.error("[POST /api/proposals/[id]/proposal-pdf]", err);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
