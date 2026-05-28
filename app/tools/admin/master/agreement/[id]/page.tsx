import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ensureProposalContext } from "@/lib/db/ensureProposalContext";
import type { AgreementBuildInput } from "@/lib/agreement/buildAgreementData";
import { AgreementPreviewClient } from "../AgreementPreviewClient";

export const dynamic = "force-dynamic";

// Standalone agreement preview by proposal id (Phase 0b). Role-gated by
// middleware (/tools/admin/master/*). Builds from the persisted agreementInput
// instead of the localStorage handoff the live "Edit Agreement" flow uses.
export default async function AgreementByIdPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    await ensureProposalContext();
    const { id } = await params;

    const proposal = await prisma.proposal
        .findUnique({ where: { id }, select: { agreementInput: true } })
        .catch(() => null);

    if (!proposal?.agreementInput) notFound();

    return (
        <AgreementPreviewClient
            initialInput={proposal.agreementInput as unknown as AgreementBuildInput}
        />
    );
}
