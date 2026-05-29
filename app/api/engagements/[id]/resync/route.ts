import { NextResponse } from "next/server";
import { EngagementEventType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ensureProposalContext } from "@/lib/db/ensureProposalContext";
import { canAccessEngagement } from "@/lib/engagement/access";
import { logEngagementEvent } from "@/lib/engagement/stage";
import { normalizeAddress } from "@/lib/proposalSnapshot";
import { isPipedriveConfigured } from "@/lib/pipedrive/client";
import { fetchPipedriveContact } from "@/lib/pipedrive/contact";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/engagements/[id]/resync
// Re-pull the customer's contact + address from Pipedrive into this engagement.
// Used to backfill engagements created before enrichment, or to pick up CRM
// edits. Pipedrive values win where present; existing values are kept where
// Pipedrive has nothing (so a missing field never wipes saved data).
export async function POST(
    _req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { userId, role } = await ensureProposalContext();
        const { id } = await params;

        const engagement = await prisma.engagement.findUnique({
            where: { id },
            select: {
                id: true,
                repId: true,
                architectId: true,
                pipedrivePersonId: true,
                pipedriveDealId: true,
                customerName: true,
                customerEmail: true,
                customerPhone: true,
                addressLine1: true,
                city: true,
                state: true,
                zip: true,
                addressKey: true,
            },
        });
        if (!engagement) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }
        if (!canAccessEngagement(engagement, userId, role)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        if (!isPipedriveConfigured()) {
            return NextResponse.json(
                { error: "Pipedrive is not configured on this server." },
                { status: 503 },
            );
        }
        if (!engagement.pipedrivePersonId && !engagement.pipedriveDealId) {
            return NextResponse.json(
                { error: "This engagement isn't linked to a Pipedrive person or deal." },
                { status: 400 },
            );
        }

        const contact = await fetchPipedriveContact({
            personId: engagement.pipedrivePersonId
                ? Number(engagement.pipedrivePersonId)
                : null,
            dealId: engagement.pipedriveDealId ? Number(engagement.pipedriveDealId) : null,
        });

        const addressForKey = contact.address || null;
        const updated = await prisma.engagement.update({
            where: { id },
            data: {
                customerName: contact.customerName || engagement.customerName,
                customerEmail: contact.customerEmail || engagement.customerEmail,
                customerPhone: contact.customerPhone || engagement.customerPhone,
                addressLine1: contact.addressLine1 || engagement.addressLine1,
                city: contact.city || engagement.city,
                state: contact.state || engagement.state,
                zip: contact.zip || engagement.zip,
                pipedrivePersonId:
                    engagement.pipedrivePersonId ??
                    (contact.personId ? String(contact.personId) : null),
                ...(addressForKey ? { addressKey: normalizeAddress(addressForKey) } : {}),
            },
        });

        await logEngagementEvent({
            engagementId: id,
            type: EngagementEventType.NOTE,
            actorId: userId,
            message: "Contact details re-synced from Pipedrive.",
        });

        return NextResponse.json({ engagement: updated });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg === "UNAUTHORIZED") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        console.error("[POST /api/engagements/[id]/resync]", err);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
