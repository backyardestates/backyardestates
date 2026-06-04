import { prisma } from "@/lib/prisma";
import { ProposalRevisionKind, type Prisma } from "@prisma/client";

// Automatic proposal version history ("one draft with internal history").
// Revisions are a safety net: they must NEVER block or fail a save, so every
// entry point catches and logs instead of throwing.

const REVISION_CAP = 20;
const AUTOSAVE_CHECKPOINT_MS = 10 * 60_000; // at most one AUTOSAVE checkpoint per 10 min

/**
 * Record a revision for a proposal and prune beyond the cap.
 *
 * `throttle: true` (used for DRAFT autosaves) skips the write when ANY
 * revision for this proposal is newer than the checkpoint window — autosaves
 * fire every few seconds and we only want a coarse timeline, not a firehose.
 *
 * Returns true if a revision was written.
 */
export async function recordProposalRevision(opts: {
    proposalId: string;
    createdById: string;
    kind: ProposalRevisionKind;
    snapshotJson: Prisma.InputJsonValue;
    throttle?: boolean;
}): Promise<boolean> {
    try {
        if (opts.throttle) {
            const latest = await prisma.proposalRevision.findFirst({
                where: { proposalId: opts.proposalId },
                orderBy: { createdAt: "desc" },
                select: { createdAt: true },
            });
            if (latest && Date.now() - latest.createdAt.getTime() < AUTOSAVE_CHECKPOINT_MS) {
                return false;
            }
        }

        await prisma.proposalRevision.create({
            data: {
                proposalId: opts.proposalId,
                createdById: opts.createdById,
                kind: opts.kind,
                snapshotJson: opts.snapshotJson,
            },
        });

        // Prune: keep the newest REVISION_CAP per proposal.
        const overflow = await prisma.proposalRevision.findMany({
            where: { proposalId: opts.proposalId },
            orderBy: { createdAt: "desc" },
            skip: REVISION_CAP,
            select: { id: true },
        });
        if (overflow.length > 0) {
            await prisma.proposalRevision.deleteMany({
                where: { id: { in: overflow.map((r) => r.id) } },
            });
        }
        return true;
    } catch (err) {
        console.error("[proposalRevisions] record failed (save unaffected)", err);
        return false;
    }
}
