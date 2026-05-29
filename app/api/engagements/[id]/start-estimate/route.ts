import { NextResponse } from "next/server";
import { ProposalStatus, EngagementStage } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ensureProposalContext } from "@/lib/db/ensureProposalContext";
import { canAccessEngagement } from "@/lib/engagement/access";
import { STAGE_ORDER, transitionEngagementStage } from "@/lib/engagement/stage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/engagements/[id]/start-estimate
//
// Called by the engagement "Start estimate → proposal" button. Server-side it:
//   1. nudges the engagement to ESTIMATING (only forward, never backward),
//   2. resolves a DRAFT Proposal linked to the engagement (reusing the existing
//      per-user DRAFT semantics, never colliding with the REVIEWED canonical),
//      seeding customer/address from the engagement,
//   3. links the latest COMPLETE FormalAnalysis,
// then returns { proposalId, addressKey } so the button can open the admin tool
// by id with the prefill popup armed.
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(
    _req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { userId, organizationId, role } = await ensureProposalContext();
        const { id } = await params;

        const engagement = await prisma.engagement.findUnique({
            where: { id },
            select: {
                id: true,
                organizationId: true,
                repId: true,
                architectId: true,
                stage: true,
                customerName: true,
                customerEmail: true,
                customerPhone: true,
                addressLine1: true,
                addressLine2: true,
                city: true,
                state: true,
                zip: true,
                addressKey: true,
                pipedrivePersonId: true,
                pipedriveDealId: true,
            },
        });
        if (!engagement || engagement.organizationId !== organizationId) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }
        if (!canAccessEngagement(engagement, userId, role)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Move forward to ESTIMATING only if we're earlier in the pipeline.
        const from = STAGE_ORDER.indexOf(engagement.stage);
        const target = STAGE_ORDER.indexOf(EngagementStage.ESTIMATING);
        if (from !== -1 && target !== -1 && from < target) {
            await transitionEngagementStage({
                engagementId: engagement.id,
                toStage: EngagementStage.ESTIMATING,
                actorId: userId,
                message: "Started estimate",
            }).catch((err) =>
                console.error("[start-estimate] stage transition failed", err),
            );
        }

        // Note: the prefill route resolves the FPA via engagementId rather than
        // Proposal.formalAnalysisId — that column is @unique, so linking it from
        // a draft could collide with an already-linked proposal.

        // Resolve the rep's DRAFT proposal for this engagement, reusing the
        // existing (createdById, addressKey, DRAFT) semantics from
        // /api/admin/proposals. Prefer an engagement-linked draft so a missing
        // addressKey never produces a duplicate.
        let proposal =
            (await prisma.proposal.findFirst({
                where: { engagementId: engagement.id, createdById: userId, status: ProposalStatus.DRAFT },
                select: { id: true, addressKey: true, engagementId: true },
            })) ??
            (engagement.addressKey
                ? await prisma.proposal.findFirst({
                      where: {
                          createdById: userId,
                          addressKey: engagement.addressKey,
                          status: ProposalStatus.DRAFT,
                      },
                      select: { id: true, addressKey: true, engagementId: true },
                  })
                : null);

        if (!proposal) {
            proposal = await prisma.proposal.create({
                data: {
                    organizationId,
                    createdById: userId,
                    status: ProposalStatus.DRAFT,
                    engagementId: engagement.id,
                    customerName: engagement.customerName ?? "",
                    customerEmail: engagement.customerEmail,
                    customerPhone: engagement.customerPhone,
                    addressLine1: engagement.addressLine1 ?? "",
                    addressLine2: engagement.addressLine2,
                    city: engagement.city ?? "",
                    state: engagement.state ?? "",
                    zip: engagement.zip ?? "",
                    addressKey: engagement.addressKey,
                    pipedrivePersonId: engagement.pipedrivePersonId,
                    pipedriveDealId: engagement.pipedriveDealId,
                },
                select: { id: true, addressKey: true, engagementId: true },
            });
        } else if (proposal.engagementId !== engagement.id) {
            // Backfill the engagement link on an existing draft so the prefill
            // route can find the consultation + FPA.
            proposal = await prisma.proposal.update({
                where: { id: proposal.id },
                data: { engagementId: engagement.id },
                select: { id: true, addressKey: true, engagementId: true },
            });
        }

        return NextResponse.json({
            proposalId: proposal.id,
            addressKey: proposal.addressKey ?? engagement.addressKey ?? null,
        });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg === "UNAUTHORIZED") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        console.error("[POST /api/engagements/[id]/start-estimate]", err);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
