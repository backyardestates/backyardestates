import { NextResponse } from "next/server";
import { Role, EngagementStage, EngagementEventType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ensureProposalContext } from "@/lib/db/ensureProposalContext";
import { normalizeAddress } from "@/lib/proposalSnapshot";
import { logEngagementEvent } from "@/lib/engagement/stage";
import { isPipedriveConfigured } from "@/lib/pipedrive/client";
import { fetchPipedriveContact, type PipedriveContact } from "@/lib/pipedrive/contact";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/engagements?stage=CONSULTATION
// Lists engagements visible to the current user. ADMINs see the whole org;
// everyone else sees engagements where they are the rep or the architect.
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(req: Request) {
    try {
        const { userId, organizationId, role } = await ensureProposalContext();
        const { searchParams } = new URL(req.url);
        const stageParam = searchParams.get("stage");
        const stage =
            stageParam && stageParam in EngagementStage
                ? (stageParam as EngagementStage)
                : undefined;

        const rows = await prisma.engagement.findMany({
            where: {
                organizationId,
                ...(stage ? { stage } : {}),
                ...(role === Role.ADMIN
                    ? {}
                    : { OR: [{ repId: userId }, { architectId: userId }] }),
            },
            orderBy: { updatedAt: "desc" },
            include: {
                _count: {
                    select: { consultations: true, formalAnalyses: true, proposals: true },
                },
            },
        });

        return NextResponse.json({ engagements: rows });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg === "UNAUTHORIZED") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        console.error("[GET /api/engagements]", err);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}

interface CreateBody {
    pipedrivePersonId?: string;
    pipedriveDealId?: string;
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
    address?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    zip?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/engagements
// Starts a new engagement from a selected Pipedrive person/deal. The caller
// becomes the rep. Idempotent-ish: if an active engagement already exists for
// the same Pipedrive person + addressKey, it's returned instead of duplicated.
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(req: Request) {
    try {
        const { userId, organizationId } = await ensureProposalContext();

        let body: CreateBody;
        try {
            body = (await req.json()) as CreateBody;
        } catch {
            return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
        }

        const bodyPersonId = body.pipedrivePersonId?.trim() || null;
        const pipedriveDealId = body.pipedriveDealId?.trim() || null;

        if (!bodyPersonId && !pipedriveDealId && !body.customerName?.trim()) {
            return NextResponse.json(
                {
                    error: "Need a Pipedrive person or deal, or a customer name, to start an engagement.",
                },
                { status: 400 },
            );
        }

        // Clean-fetch the customer's details from Pipedrive so the rep doesn't
        // retype email / phone / address — this also resolves the linked person
        // (and thus contact info) for engagements started from a deal. Anything
        // the client already sent wins; the fetch fills in the rest.
        let contact: PipedriveContact | null = null;
        if (isPipedriveConfigured() && (bodyPersonId || pipedriveDealId)) {
            contact = await fetchPipedriveContact({
                personId: bodyPersonId ? Number(bodyPersonId) : null,
                dealId: pipedriveDealId ? Number(pipedriveDealId) : null,
            }).catch(() => null);
        }

        // A deal can supply the person, so record it even when only a deal id
        // was selected — keeps reuse + future contact lookups working.
        const pipedrivePersonId =
            bodyPersonId ?? (contact?.personId ? String(contact.personId) : null);

        const customerName = body.customerName?.trim() || contact?.customerName || null;
        const customerEmail = body.customerEmail?.trim() || contact?.customerEmail || null;
        const customerPhone = body.customerPhone?.trim() || contact?.customerPhone || null;
        const addressLine1 = body.addressLine1?.trim() || contact?.addressLine1 || null;
        const addressLine2 = body.addressLine2?.trim() || null;
        const city = body.city?.trim() || contact?.city || null;
        const state = body.state?.trim() || contact?.state || null;
        const zip = body.zip?.trim() || contact?.zip || null;
        const addressForKey = body.address?.trim() || contact?.address || null;
        const addressKey = addressForKey ? normalizeAddress(addressForKey) : null;

        // Reuse an existing active engagement for the same person + address so a
        // rep re-opening the same prospect doesn't fork the pipeline.
        if (pipedrivePersonId) {
            const existing = await prisma.engagement.findFirst({
                where: {
                    organizationId,
                    pipedrivePersonId,
                    addressKey,
                    stage: { notIn: [EngagementStage.SIGNED, EngagementStage.LOST] },
                },
                orderBy: { updatedAt: "desc" },
            });
            if (existing) {
                return NextResponse.json({ engagement: existing, reused: true });
            }
        }

        const engagement = await prisma.engagement.create({
            data: {
                organizationId,
                stage: EngagementStage.CONSULTATION,
                repId: userId,
                pipedrivePersonId,
                pipedriveDealId,
                customerName,
                customerEmail,
                customerPhone,
                addressLine1,
                addressLine2,
                city,
                state,
                zip,
                addressKey,
            },
        });

        await logEngagementEvent({
            engagementId: engagement.id,
            type: EngagementEventType.CREATED,
            actorId: userId,
            message: "Engagement created",
            metadata: { pipedrivePersonId, pipedriveDealId },
        });

        return NextResponse.json({ engagement, reused: false });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg === "UNAUTHORIZED") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        console.error("[POST /api/engagements]", err);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
