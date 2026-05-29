import Link from "next/link";
import { notFound } from "next/navigation";
import { ConsultationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { guardPagePermission, can } from "@/lib/rbac/getPermissions";
import { ensureProposalContext } from "@/lib/db/ensureProposalContext";
import { canAccessEngagement } from "@/lib/engagement/access";
import { ConsultationClient } from "./ConsultationClient";
import s from "../../engagements.module.css";

export const dynamic = "force-dynamic";

export default async function ConsultationPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    await guardPagePermission("consultation.run", "/tools/engagements");
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

    // Resume the most recent in-progress consultation (transcript saved but not
    // yet summarized/sent) so a page reload never loses captured words.
    const draft = await prisma.consultation.findFirst({
        where: {
            engagementId: engagement.id,
            status: {
                in: [
                    ConsultationStatus.DRAFT,
                    ConsultationStatus.TRANSCRIBING,
                    ConsultationStatus.TRANSCRIBED,
                    ConsultationStatus.FAILED,
                ],
            },
        },
        orderBy: { createdAt: "desc" },
        select: { id: true, transcript: true },
    });

    return (
        <div className={s.shell}>
            <Link href={`/tools/engagements/${id}`} className={s.backLink}>
                ← Back to engagement
            </Link>
            <header className={s.header}>
                <div>
                    <h1 className={s.title}>Consultation</h1>
                    <p className={s.subtitle}>
                        {engagement.customerName || "(no name)"} — record or paste the meeting,
                        then review the AI notes and next-steps email.
                    </p>
                </div>
            </header>

            <ConsultationClient
                engagementId={engagement.id}
                customerName={engagement.customerName}
                customerEmail={engagement.customerEmail}
                existingConsultationId={draft?.id ?? null}
                existingTranscript={draft?.transcript ?? null}
            />
        </div>
    );
}
