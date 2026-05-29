import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { guardPageAnyPermission, can } from "@/lib/rbac/getPermissions";
import { ensureProposalContext } from "@/lib/db/ensureProposalContext";
import { canAccessEngagement } from "@/lib/engagement/access";
import { client as sanity } from "@/sanity/client";
import { parseAttachments } from "@/lib/drip/send";
import { DripManagerClient, type DripMessageVM } from "./DripManagerClient";

export const dynamic = "force-dynamic";

type DripStatus = "ACTIVE" | "PAUSED" | "COMPLETED" | "CANCELLED";
type MsgStatus = "SCHEDULED" | "SENT" | "SKIPPED" | "FAILED";

export default async function DripManagerPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    await guardPageAnyPermission(
        ["engagements.view_own", "engagements.view_all"],
        "/tools/engagements",
    );
    const { userId, role } = await ensureProposalContext();
    const { id } = await params;

    const engagement = await prisma.engagement.findUnique({
        where: { id },
        select: {
            id: true,
            repId: true,
            architectId: true,
            customerName: true,
            customerEmail: true,
        },
    });
    if (!engagement) notFound();
    if (
        !canAccessEngagement(engagement, userId, role) &&
        !(await can(role, "engagements.view_all"))
    ) {
        notFound();
    }

    const enrollment = await prisma.dripEnrollment.findFirst({
        where: { engagementId: id },
        orderBy: { createdAt: "desc" },
        include: { messages: { orderBy: { stepIndex: "asc" } } },
    });

    // Resolve referenced Sanity docs (stories / completed builds) to titles.
    const refIds = [
        ...new Set((enrollment?.messages ?? []).map((m) => m.contentRef).filter(Boolean)),
    ] as string[];
    let titleById = new Map<string, string>();
    if (refIds.length > 0) {
        const docs = await sanity
            .fetch<{ _id: string; title?: string }[]>(
                `*[_id in $ids]{_id, "title": coalesce(name, names, title, propertyName)}`,
                { ids: refIds },
            )
            .catch(() => [] as { _id: string; title?: string }[]);
        titleById = new Map(docs.filter((d) => d.title).map((d) => [d._id, d.title as string]));
    }

    const messages: DripMessageVM[] = (enrollment?.messages ?? []).map((m) => ({
        id: m.id,
        stepIndex: m.stepIndex,
        subject: m.subject,
        body: m.body,
        status: m.status as MsgStatus,
        scheduledFor: m.scheduledFor.toISOString(),
        sentAt: m.sentAt ? m.sentAt.toISOString() : null,
        contentTitle: m.contentRef ? (titleById.get(m.contentRef) ?? null) : null,
        attachments: parseAttachments(m.attachmentsJson),
    }));

    return (
        <DripManagerClient
            engagementId={engagement.id}
            customerName={engagement.customerName}
            hasEmail={!!engagement.customerEmail}
            enrollmentId={enrollment?.id ?? null}
            enrollmentStatus={(enrollment?.status as DripStatus | undefined) ?? null}
            messages={messages}
        />
    );
}
