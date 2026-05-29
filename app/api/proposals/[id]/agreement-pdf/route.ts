import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ensureProposalContext } from "@/lib/db/ensureProposalContext";
import { uploadAgreementPdf } from "@/lib/agreement/uploadAgreementPdf";
import { isPipedriveConfigured, pipedriveFetch } from "@/lib/pipedrive/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/proposals/[id]/agreement-pdf
// Body: multipart/form-data with the generated agreement PDF as `file`.
// Stores it (Cloudinary → Sanity fallback), saves the URL + timestamp on the
// proposal, and logs a dated note to the linked Pipedrive deal/person.
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

        // Best-effort dated note to Pipedrive so the deal record carries the
        // latest agreement link. Prefer the proposal's own ids, fall back to the
        // engagement's.
        const personId = proposal.pipedrivePersonId || proposal.engagement?.pipedrivePersonId || null;
        const dealId = proposal.pipedriveDealId || proposal.engagement?.pipedriveDealId || null;
        if (isPipedriveConfigured() && (personId || dealId)) {
            const dateStr = generatedAt.toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
            });
            const content = `Agreement PDF saved (${dateStr}) for ${proposal.customerName || "this customer"}: ${url}`;
            const body: Record<string, unknown> = { content };
            if (personId) body.person_id = Number(personId);
            if (dealId) body.deal_id = Number(dealId);
            void pipedriveFetch("notes", { method: "POST", body }).catch((err) =>
                console.error("[agreement-pdf] pipedrive note failed", err),
            );
        }

        return NextResponse.json({ ok: true, pdfUrl: url, pdfGeneratedAt: generatedAt.toISOString() });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg === "UNAUTHORIZED") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        console.error("[POST /api/proposals/[id]/agreement-pdf]", err);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
