import { NextResponse } from "next/server";
import { DripMessageStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireDripMessageAccess, dripErrorResponse } from "@/lib/drip/access";
import { parseAttachments } from "@/lib/drip/send";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface PatchBody {
    subject?: string;
    body?: string;
    scheduledFor?: string; // ISO date-time
    attachments?: { filename?: string; url?: string }[];
}

// PATCH /api/drip/messages/[id]
// Edit a scheduled drip email's subject/body and/or reschedule it. Only
// SCHEDULED messages can be edited (sent ones are immutable).
export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;
        const { message } = await requireDripMessageAccess(id);

        if (message.status !== DripMessageStatus.SCHEDULED) {
            return NextResponse.json(
                { error: "Only a scheduled email can be edited." },
                { status: 409 },
            );
        }

        let body: PatchBody;
        try {
            body = (await req.json()) as PatchBody;
        } catch {
            return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
        }

        const data: {
            subject?: string;
            body?: string;
            scheduledFor?: Date;
            attachmentsJson?: Prisma.InputJsonValue;
        } = {};
        if (typeof body.subject === "string") {
            if (!body.subject.trim()) {
                return NextResponse.json({ error: "Subject can't be empty." }, { status: 400 });
            }
            data.subject = body.subject.trim();
        }
        if (typeof body.body === "string") {
            if (!body.body.trim()) {
                return NextResponse.json({ error: "Body can't be empty." }, { status: 400 });
            }
            data.body = body.body.trim();
        }
        if (body.scheduledFor !== undefined) {
            const when = new Date(body.scheduledFor);
            if (Number.isNaN(when.getTime())) {
                return NextResponse.json({ error: "Invalid date." }, { status: 400 });
            }
            data.scheduledFor = when;
        }
        if (body.attachments !== undefined) {
            // parseAttachments drops anything without a filename + https URL.
            data.attachmentsJson = parseAttachments(body.attachments) as unknown as Prisma.InputJsonValue;
        }
        if (Object.keys(data).length === 0) {
            return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
        }

        const updated = await prisma.dripMessage.update({
            where: { id },
            data,
            select: {
                id: true,
                subject: true,
                body: true,
                scheduledFor: true,
                status: true,
                stepIndex: true,
                contentRef: true,
                attachmentsJson: true,
            },
        });
        return NextResponse.json({ message: updated });
    } catch (err) {
        const mapped = dripErrorResponse(err);
        if (mapped) return mapped;
        console.error("[PATCH /api/drip/messages/[id]]", err);
        return NextResponse.json(
            { error: err instanceof Error ? err.message : String(err) },
            { status: 500 },
        );
    }
}
