import { NextResponse } from "next/server";
import { ProposalStatus, EngagementStage, EngagementEventType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ensureProposalContext } from "@/lib/db/ensureProposalContext";
import { isDropboxSignConfigured, sendSignatureRequest } from "@/lib/esign/dropboxSign";
import { transitionEngagementStage } from "@/lib/engagement/stage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/proposals/[id]/send-for-signature
// Body: multipart/form-data with the agreement document as `file`. Sends it to
// the customer via Dropbox Sign and advances the engagement to AGREEMENT_SENT.
export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { userId } = await ensureProposalContext();
        const { id } = await params;

        if (!isDropboxSignConfigured()) {
            return NextResponse.json(
                { error: "DROPBOX_SIGN_API_KEY is not configured." },
                { status: 503 },
            );
        }

        const proposal = await prisma.proposal.findUnique({
            where: { id },
            select: {
                id: true,
                customerName: true,
                customerEmail: true,
                engagementId: true,
                engagement: { select: { customerEmail: true, customerName: true } },
            },
        });
        if (!proposal) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        const signerEmail =
            proposal.customerEmail?.trim() || proposal.engagement?.customerEmail?.trim() || "";
        const signerName =
            proposal.customerName?.trim() || proposal.engagement?.customerName?.trim() || "Customer";
        if (!signerEmail) {
            return NextResponse.json(
                { error: "No customer email on file to send the agreement to." },
                { status: 400 },
            );
        }

        const form = await req.formData();
        const file = form.get("file");
        if (!(file instanceof File)) {
            return NextResponse.json({ error: "Missing agreement file" }, { status: 400 });
        }
        const buffer = Buffer.from(await file.arrayBuffer());

        const { signatureRequestId } = await sendSignatureRequest({
            file: buffer,
            fileName: file.name || "agreement.docx",
            fileType: file.type || "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            signerEmail,
            signerName,
            title: "Backyard Estates — ADU Agreement",
            subject: "Your Backyard Estates agreement is ready to sign",
            message: "Please review and sign your ADU agreement. Reach out with any questions.",
            metadata: { proposalId: proposal.id },
        });

        await prisma.proposal.update({
            where: { id },
            data: { signatureRequestId, status: ProposalStatus.SENT },
        });

        if (proposal.engagementId) {
            await transitionEngagementStage({
                engagementId: proposal.engagementId,
                toStage: EngagementStage.AGREEMENT_SENT,
                actorId: userId,
                eventType: EngagementEventType.NOTE,
                message: `Agreement sent for signature to ${signerName}.`,
            });
        }

        return NextResponse.json({ ok: true, signatureRequestId });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg === "UNAUTHORIZED") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        console.error("[POST /api/proposals/[id]/send-for-signature]", err);
        return NextResponse.json({ error: msg }, { status: 502 });
    }
}
