// Editable agreement preview. Opened from the admin tool's "Edit Agreement"
// button, which first commits the proposal and passes its id via ?proposalId.
// With an id we hydrate the agreement inputs from the proposal record (so the
// preview is deterministic and the Save-PDF / Send-for-signature actions work);
// without one we fall back to the localStorage handoff the admin tab wrote.

import { prisma } from "@/lib/prisma";
import type { AgreementBuildInput } from "@/lib/agreement/buildAgreementData";
import { AgreementPreviewClient } from "./AgreementPreviewClient";

export const dynamic = "force-dynamic";

export default async function AgreementPreviewPage({
    searchParams,
}: {
    searchParams: Promise<{ proposalId?: string }>;
}) {
    const { proposalId } = await searchParams;

    let initialInput: AgreementBuildInput | undefined;
    let initialEmail: string | undefined;
    if (proposalId) {
        const p = await prisma.proposal
            .findFirst({
                where: { OR: [{ id: proposalId }, { shareToken: proposalId }] },
                select: {
                    agreementInput: true,
                    customerEmail: true,
                    engagement: { select: { customerEmail: true } },
                },
            })
            .catch(() => null);
        if (p?.agreementInput) {
            initialInput = p.agreementInput as unknown as AgreementBuildInput;
        }
        initialEmail =
            p?.customerEmail?.trim() || p?.engagement?.customerEmail?.trim() || undefined;
    }

    return (
        <AgreementPreviewClient
            proposalId={proposalId}
            initialInput={initialInput}
            initialEmail={initialEmail}
        />
    );
}
