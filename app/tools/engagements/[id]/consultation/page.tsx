import Link from "next/link";
import { notFound } from "next/navigation";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { guardPageRole } from "@/lib/auth/guardPage";
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
    await guardPageRole([Role.ADMIN, Role.ARCHITECT], "/tools/engagements");
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
    if (!canAccessEngagement(engagement, userId, role)) notFound();

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
                hasEmail={!!engagement.customerEmail}
            />
        </div>
    );
}
