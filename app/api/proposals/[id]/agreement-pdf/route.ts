import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ensureProposalContext } from "@/lib/db/ensureProposalContext";
import { uploadAgreementPdf } from "@/lib/agreement/uploadAgreementPdf";
import { isPipedriveConfigured, pipedriveFetch } from "@/lib/pipedrive/client";
import { buildProposalNote } from "@/lib/pipedrive/proposalNote";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/proposals/[id]/agreement-pdf
// Body: multipart/form-data with the generated agreement PDF as `file`.
// Stores it (Cloudinary → Sanity fallback), saves the URL + timestamp on the
// proposal, and logs a detailed note to the linked Pipedrive deal/person.
export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { userId, role } = await ensureProposalContext();
        const { id } = await params;

        const proposal = await prisma.proposal.findUnique({
            where: { id },
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
        const filename = file.name || `BackyardEstates-Agreement-${id}.pdf`;

        await prisma.proposal.update({ where: { id }, data: { pdfStatus: "generating" } }).catch(() => {});

        let url: string;
        try {
            const result = await uploadAgreementPdf(bytes, { proposalId: id, filename });
            url = result.url;
        } catch (err) {
            await prisma.proposal.update({ where: { id }, data: { pdfStatus: "error" } }).catch(() => {});
            const msg = err instanceof Error ? err.message : String(err);
            console.error("[agreement-pdf] upload failed", err);
            return NextResponse.json({ error: msg }, { status: 502 });
        }

        const generatedAt = new Date();
        await prisma.proposal.update({
            where: { id },
            data: { pdfUrl: url, pdfStatus: "ready", pdfGeneratedAt: generatedAt },
        });

        // Detailed dated note to Pipedrive so the deal record identifies the
        // agreement at a glance (units compared + totals + links). Prefer the
        // proposal's own ids, fall back to the engagement's. Awaited so the UI
        // can report whether the note actually landed.
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
                    kind: "agreement",
                    pdfUrl: url,
                    toolUrl: `${new URL(req.url).origin}/tools/admin/master/agreement?proposalId=${proposal.id}`,
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
                console.error("[agreement-pdf] pipedrive note failed", err);
                pipedriveNote = "failed";
            }
        }

        return NextResponse.json({
            ok: true,
            pdfUrl: url,
            pdfGeneratedAt: generatedAt.toISOString(),
            pipedriveNote,
        });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg === "UNAUTHORIZED") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        console.error("[POST /api/proposals/[id]/agreement-pdf]", err);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
