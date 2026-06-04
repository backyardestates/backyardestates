// DELETE /api/admin/users/[id]
//
// Removes a user from Clerk (identity source of truth) AND the local Prisma
// User row. Used by the admin dashboard's user list to clean up test
// accounts, departed staff, etc.
//
// Guarded rules:
//   • ADMIN only.
//   • Cannot delete yourself (would lock you out).
//   • Refuses to delete users with linked records (proposals, feasibility
//     reports, organization memberships) — would either FK-fail at the DB
//     layer or orphan business data. The admin must transfer/clean those
//     first. The response includes the counts so the UI can explain.

import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireDbRole, bustUserMemo } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const caller = await requireDbRole([Role.ADMIN]);
        const { id: targetUserId } = await params;

        if (targetUserId === caller.id) {
            return NextResponse.json(
                { error: "Cannot delete your own account from here." },
                { status: 400 }
            );
        }

        // Pre-check linked records. Without `onDelete: Cascade` in the schema,
        // attempting `prisma.user.delete` would FK-error anyway — we just give
        // a nicer error before mutating anything.
        const dbUser = await prisma.user.findUnique({
            where: { id: targetUserId },
            select: {
                _count: {
                    select: {
                        proposalsCreated: true,
                        proposalsAssigned: true,
                        feasibilityReports: true,
                        formalAnalyses: true,
                        evidenceFiles: true,
                        proposalEvents: true,
                        memberships: true,
                    },
                },
            },
        });

        if (dbUser) {
            const c = dbUser._count;
            const blockers: { field: string; count: number; label: string }[] = [];
            if (c.proposalsCreated > 0)  blockers.push({ field: "proposalsCreated",  count: c.proposalsCreated,  label: "proposal(s) they created" });
            if (c.proposalsAssigned > 0) blockers.push({ field: "proposalsAssigned", count: c.proposalsAssigned, label: "proposal(s) assigned to them" });
            if (c.feasibilityReports > 0) blockers.push({ field: "feasibilityReports", count: c.feasibilityReports, label: "feasibility report(s)" });
            if (c.formalAnalyses > 0)   blockers.push({ field: "formalAnalyses",    count: c.formalAnalyses,    label: "formal analysis assignment(s)" });
            if (c.evidenceFiles > 0)    blockers.push({ field: "evidenceFiles",     count: c.evidenceFiles,     label: "evidence file upload(s)" });
            if (c.proposalEvents > 0)   blockers.push({ field: "proposalEvents",    count: c.proposalEvents,    label: "audit log event(s)" });
            if (c.memberships > 0)      blockers.push({ field: "memberships",       count: c.memberships,       label: "organization membership(s)" });

            if (blockers.length > 0) {
                return NextResponse.json(
                    {
                        error: "User has linked records. Remove or transfer them first.",
                        blockers,
                    },
                    { status: 409 }
                );
            }
        }

        // Delete from Clerk first — it's the identity source of truth. If the
        // user still has a Clerk account when we try to nuke the Prisma row,
        // a subsequent sign-in could re-create the DB row via the webhook
        // before the admin notices. We accept "Clerk account missing" as a
        // benign case (manually pre-deleted in Clerk dashboard).
        const client = await clerkClient();
        try {
            await client.users.deleteUser(targetUserId);
        } catch (err: any) {
            // 404 = already gone, treat as success and move on
            const status = err?.status ?? err?.errors?.[0]?.code;
            if (status !== 404 && err?.errors?.[0]?.code !== "resource_not_found") {
                return NextResponse.json(
                    { error: `Clerk delete failed: ${err?.message ?? "unknown"}` },
                    { status: 502 }
                );
            }
        }

        // Then delete the Prisma row (no-op if the user only existed in Clerk,
        // i.e. signed up but never hit a protected route).
        if (dbUser) {
            await prisma.user.delete({ where: { id: targetUserId } });
        }
        bustUserMemo(targetUserId);

        return NextResponse.json({ ok: true, id: targetUserId });
    } catch (err: any) {
        // requireDbRole throws Response objects for 401/403 — pass those through.
        if (err instanceof Response) return err;
        return NextResponse.json(
            { error: err?.message ?? "Internal error" },
            { status: 500 }
        );
    }
}
