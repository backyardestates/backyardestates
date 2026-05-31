import {
    ProposalStatus,
    EngagementStage,
    EngagementEventType,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { verifyEventHash, downloadSignedPdf } from "@/lib/esign/dropboxSign";
import { uploadAgreementPdf } from "@/lib/agreement/uploadAgreementPdf";
import { transitionEngagementStage } from "@/lib/engagement/stage";
import { isPipedriveConfigured, pipedriveFetch } from "@/lib/pipedrive/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Dropbox Sign treats the callback as delivered only if the response body is
// exactly this string.
const ACK = "Hello API Event Received";

// POST /api/webhooks/dropbox-sign
// Dropbox Sign posts events as multipart form-data with a single `json` field.
export async function POST(req: Request) {
    let payload: {
        event?: { event_time?: string; event_type?: string; event_hash?: string };
        signature_request?: { signature_request_id?: string };
    };
    try {
        const form = await req.formData();
        const json = form.get("json");
        if (typeof json !== "string") return new Response("bad request", { status: 400 });
        payload = JSON.parse(json);
    } catch {
        return new Response("bad request", { status: 400 });
    }

    const event = payload.event ?? {};
    if (
        !verifyEventHash(
            String(event.event_time ?? ""),
            String(event.event_type ?? ""),
            String(event.event_hash ?? ""),
        )
    ) {
        return new Response("invalid signature", { status: 401 });
    }

    try {
        if (event.event_type === "signature_request_all_signed") {
            const srId = payload.signature_request?.signature_request_id;
            if (srId) {
                const proposal = await prisma.proposal.findUnique({
                    where: { signatureRequestId: srId },
                    select: {
                        id: true,
                        engagementId: true,
                        pipedriveDealId: true,
                        engagement: { select: { pipedriveDealId: true } },
                    },
                });
                if (proposal) {
                    await prisma.proposal.update({
                        where: { id: proposal.id },
                        data: { status: ProposalStatus.SIGNED },
                    });

                    // Auto-capture the executed PDF so every closed deal has its
                    // signed contract on file — no manual "Save PDF" step needed.
                    // Best-effort: a failure here must not break the webhook ack.
                    try {
                        const pdf = await downloadSignedPdf(srId);
                        const { url } = await uploadAgreementPdf(pdf, {
                            proposalId: proposal.id,
                            filename: `BackyardEstates-Agreement-signed-${proposal.id}.pdf`,
                        });
                        await prisma.proposal.update({
                            where: { id: proposal.id },
                            data: { pdfUrl: url, pdfStatus: "signed", pdfGeneratedAt: new Date() },
                        });
                    } catch (e) {
                        console.error("[dropbox-sign] signed PDF capture failed", e);
                    }

                    if (proposal.engagementId) {
                        await transitionEngagementStage({
                            engagementId: proposal.engagementId,
                            toStage: EngagementStage.SIGNED,
                            eventType: EngagementEventType.NOTE,
                            message: "Agreement signed.",
                        });
                    }

                    const dealId = proposal.pipedriveDealId ?? proposal.engagement?.pipedriveDealId;
                    if (dealId && isPipedriveConfigured()) {
                        await pipedriveFetch(`deals/${dealId}`, {
                            method: "PUT",
                            body: { status: "won" },
                        }).catch((e) => console.error("[dropbox-sign] pipedrive won failed", e));
                    }
                }
            }
        }
    } catch (err) {
        console.error("[webhooks/dropbox-sign]", err);
    }

    return new Response(ACK, { status: 200 });
}
