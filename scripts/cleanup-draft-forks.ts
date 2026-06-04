// One-time cleanup of draft "forks" created by the old addressKey-keyed
// autosave: every normalized address prefix ≥6 chars used to spawn its own
// DRAFT row while the rep was still typing ("10 drafts per proposal").
// The autosave is now id-keyed so new forks can't happen; this removes the
// historical ones.
//
// Usage:
//   npx tsx scripts/cleanup-draft-forks.ts            # dry run (default) — prints what would be deleted
//   npx tsx scripts/cleanup-draft-forks.ts --apply    # actually delete
//
// A draft is considered a fork when the SAME user has another draft whose
// addressKey strictly extends it (typing prefix), or shares the same
// Pipedrive deal with a newer draft. The newest/longest survives.

import { prisma } from "../lib/prisma";

const APPLY = process.argv.includes("--apply");

async function main() {
    const drafts = await prisma.proposal.findMany({
        where: { status: "DRAFT" },
        select: {
            id: true,
            createdById: true,
            addressKey: true,
            customerName: true,
            pipedriveDealId: true,
            updatedAt: true,
        },
        orderBy: { updatedAt: "desc" },
    });

    const byUser = new Map<string, typeof drafts>();
    for (const d of drafts) {
        const list = byUser.get(d.createdById) ?? [];
        list.push(d);
        byUser.set(d.createdById, list);
    }

    const toDelete: { id: string; reason: string; addressKey: string | null; user: string }[] = [];

    for (const [userId, userDrafts] of byUser) {
        for (const d of userDrafts) {
            if (!d.addressKey) continue;

            // Fork rule 1: another draft (same user) whose addressKey strictly
            // extends this one — this row is a typing-prefix leftover.
            const extendedBy = userDrafts.find(
                (e) =>
                    e.id !== d.id &&
                    e.addressKey &&
                    e.addressKey !== d.addressKey &&
                    e.addressKey.startsWith(d.addressKey!),
            );
            if (extendedBy) {
                toDelete.push({
                    id: d.id,
                    reason: `prefix of "${extendedBy.addressKey}"`,
                    addressKey: d.addressKey,
                    user: userId,
                });
                continue;
            }

            // Fork rule 2: same Pipedrive deal as a NEWER draft (drafts are
            // sorted newest-first, so any earlier match in the list is newer).
            if (d.pipedriveDealId) {
                const newerSameDeal = userDrafts.find(
                    (e) =>
                        e.id !== d.id &&
                        e.pipedriveDealId === d.pipedriveDealId &&
                        e.updatedAt > d.updatedAt,
                );
                if (newerSameDeal) {
                    toDelete.push({
                        id: d.id,
                        reason: `older draft for deal ${d.pipedriveDealId} (newer: "${newerSameDeal.addressKey}")`,
                        addressKey: d.addressKey,
                        user: userId,
                    });
                }
            }
        }
    }

    console.log(`Scanned ${drafts.length} drafts across ${byUser.size} users.`);
    if (toDelete.length === 0) {
        console.log("No fork drafts found. Nothing to do.");
        return;
    }

    console.log(`\n${APPLY ? "Deleting" : "Would delete"} ${toDelete.length} fork draft(s):\n`);
    for (const d of toDelete) {
        console.log(`  - [${d.user}] "${d.addressKey}" (${d.id}) — ${d.reason}`);
    }

    if (!APPLY) {
        console.log("\nDry run only. Re-run with --apply to delete these rows.");
        return;
    }

    const result = await prisma.proposal.deleteMany({
        where: { id: { in: toDelete.map((d) => d.id) } },
    });
    console.log(`\nDeleted ${result.count} draft row(s).`);
}

main()
    .catch((err) => {
        console.error(err);
        process.exitCode = 1;
    })
    .finally(() => void prisma.$disconnect());
