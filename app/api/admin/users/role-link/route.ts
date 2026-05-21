// One-click role-assignment endpoint — auth via signed magic-link, not
// Clerk session. Used by the signup notification email so the admin can
// click a button straight from their inbox.
//
// Security model: the URL must carry a valid HMAC over (userId|role|exp)
// using the server's SIGNUP_LINK_SECRET (or CLERK_WEBHOOK_SECRET fallback).
// See lib/auth/signedRoleLink.ts. The middleware skips /api/admin/users/
// role-link because the route file lives outside the admin auth tree's
// matcher — but to be safe we also opt this route out of the admin gate.

import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";
import { verifyRoleLink } from "@/lib/auth/signedRoleLink";

export const dynamic = "force-dynamic";

function renderResultPage(args: {
    ok: boolean;
    title: string;
    detail: string;
}): Response {
    const accent = args.ok ? "#2a7a52" : "#a83333";
    const body = `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8" />
<title>${args.title}</title>
<meta name="viewport" content="width=device-width,initial-scale=1" />
<style>
    body { margin: 0; font-family: system-ui, -apple-system, sans-serif; background: #f5f3ee; color: #1a1a1a; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 24px; }
    .card { max-width: 480px; background: #fff; padding: 36px 32px; border-radius: 12px; box-shadow: 0 8px 30px rgba(0,0,0,0.08); border-top: 6px solid ${accent}; }
    h1 { font-size: 20px; margin: 0 0 12px; color: ${accent}; }
    p { font-size: 14px; line-height: 1.55; margin: 0 0 12px; color: #333; }
    a { color: #2a7a52; text-decoration: none; font-weight: 600; }
    a:hover { text-decoration: underline; }
</style></head><body>
<div class="card">
    <h1>${args.title}</h1>
    <p>${args.detail}</p>
    <p><a href="/tools/admin/dashboard/users">Open user management →</a></p>
</div>
</body></html>`;
    return new Response(body, {
        status: args.ok ? 200 : 400,
        headers: { "Content-Type": "text/html; charset=utf-8" },
    });
}

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const u = searchParams.get("u");
    const r = searchParams.get("r");
    const exp = searchParams.get("exp");
    const sig = searchParams.get("sig");

    if (!u || !r || !exp || !sig) {
        return renderResultPage({
            ok: false,
            title: "Link malformed",
            detail: "This role-assignment link is missing required parameters.",
        });
    }

    const verified = verifyRoleLink({ userId: u, role: r, exp, sig });
    if (!verified.ok) {
        return renderResultPage({
            ok: false,
            title: "Link rejected",
            detail: `Reason: ${verified.reason}. If the link is older than a week, just sign in and assign the role from the dashboard.`,
        });
    }
    const newRole = verified.role as Role;

    // Confirm the user still exists in Clerk before mutating anything.
    let client;
    try {
        client = await clerkClient();
        await client.users.getUser(u);
    } catch {
        return renderResultPage({
            ok: false,
            title: "User not found",
            detail: "That Clerk user no longer exists. They may have deleted their account.",
        });
    }

    try {
        await client.users.updateUserMetadata(u, { publicMetadata: { role: newRole } });
        const clerkUser = await client.users.getUser(u);
        const email = clerkUser.emailAddresses[0]?.emailAddress;
        const phone = clerkUser.phoneNumbers[0]?.phoneNumber;
        await prisma.user.upsert({
            where: { id: u },
            update: { role: newRole, email: email ?? undefined, phone: phone ?? undefined },
            create: { id: u, role: newRole, email: email ?? undefined, phone: phone ?? undefined },
        });
    } catch (err) {
        return renderResultPage({
            ok: false,
            title: "Could not update role",
            detail: err instanceof Error ? err.message : String(err),
        });
    }

    return renderResultPage({
        ok: true,
        title: `Role set to ${newRole}`,
        detail: "The user's role has been updated. Their next session refresh will pick up the change. (Existing sessions stay until their JWT expires — typically within an hour.)",
    });
}
