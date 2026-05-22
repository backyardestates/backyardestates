// POST /api/access-request
//
// Called by the "Request Access" button on /access-denied. Sends an email to
// the admin (edgar@) with full context about who's asking, where they tried
// to go, and what role they're missing — so the admin can decide whether to
// promote them via the one-click links in the email.
//
// The endpoint is signed-in-required (we need to know who's asking). Anyone
// who's signed in to Clerk can call it — there's no role gate, by design.

import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { Resend } from "resend";
import { buildRoleLink } from "@/lib/auth/signedRoleLink";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RequestBody {
    /** Pathname they tried to access, for context only. */
    from?: string;
    /** Comma-joined role names the gate refused them — used only in the
     *  internal email, never echoed back to the requester. */
    need?: string;
    /** Optional free-text note the requester typed. */
    message?: string;
}

export async function POST(req: Request) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    }

    let body: RequestBody;
    try {
        body = (await req.json()) as RequestBody;
    } catch {
        body = {};
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        console.warn("[access-request] RESEND_API_KEY missing — request not sent");
        return NextResponse.json({ ok: true }, { status: 200 });
    }

    // Same defaults as the signup notification for consistency.
    const overrideRaw = (process.env.SIGNUP_NOTIFY_EMAILS ?? "").trim();
    const recipients = overrideRaw
        ? overrideRaw.split(",").map((s) => s.trim()).filter(Boolean)
        : ["edgar@backyardestates.com"];
    const from = process.env.SIGNUP_NOTIFY_FROM ?? "Backyard Estates <noreply@backyardestates.com>";

    const clerkUser = await currentUser();
    const email = clerkUser?.emailAddresses[0]?.emailAddress ?? null;
    const phone = clerkUser?.phoneNumbers[0]?.phoneNumber ?? null;
    const fullName = [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(" ").trim() || "(no name)";

    // Best-guess: if they were blocked by /tools/fpa they probably want
    // architect; otherwise admin. We don't echo this back to the user,
    // we just pre-render the most-likely button as the primary.
    const probableRole: "ADMIN" | "ARCHITECT" = body.from?.startsWith("/tools/fpa") ? "ARCHITECT" : "ADMIN";

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://backyardestates.com";

    let primaryUrl = "";
    let secondaryUrl = "";
    try {
        primaryUrl = buildRoleLink({ baseUrl, userId, role: probableRole });
        secondaryUrl = buildRoleLink({
            baseUrl,
            userId,
            role: probableRole === "ADMIN" ? "ARCHITECT" : "ADMIN",
        });
    } catch (err) {
        console.warn("[access-request] Could not build role-link buttons:", err);
    }

    const btn = (href: string, label: string, bg: string) => href
        ? `<a href="${href}" style="display:inline-block;padding:10px 18px;background:${bg};color:#fff;text-decoration:none;border-radius:6px;font-weight:600;margin:0 6px 6px 0;">${label}</a>`
        : "";

    const safeMessage = body.message
        ? body.message.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c] ?? c)).slice(0, 1000)
        : "";

    const subject = `Access requested — ${email ?? fullName}`;

    const html = `
        <div style="font-family: system-ui, -apple-system, sans-serif; color: #1a1a1a; line-height: 1.5; max-width: 540px;">
            <h2 style="margin: 0 0 12px; font-size: 18px;">${fullName} requested access</h2>
            <table style="border-collapse: collapse; margin: 8px 0 20px;">
                <tr><td style="padding: 4px 12px 4px 0; color: #666;">Name</td><td style="padding: 4px 0;"><strong>${fullName}</strong></td></tr>
                <tr><td style="padding: 4px 12px 4px 0; color: #666;">Email</td><td style="padding: 4px 0;">${email ?? "—"}</td></tr>
                <tr><td style="padding: 4px 12px 4px 0; color: #666;">Phone</td><td style="padding: 4px 0;">${phone ?? "—"}</td></tr>
                <tr><td style="padding: 4px 12px 4px 0; color: #666;">Was trying to reach</td><td style="padding: 4px 0; font-family: ui-monospace, monospace; font-size: 12px;">${body.from ?? "—"}</td></tr>
                <tr><td style="padding: 4px 12px 4px 0; color: #666;">Currently denied by</td><td style="padding: 4px 0; color: #888;">need ${body.need ?? "—"}</td></tr>
                <tr><td style="padding: 4px 12px 4px 0; color: #666;">Clerk ID</td><td style="padding: 4px 0; font-family: ui-monospace, monospace; font-size: 12px; color: #666;">${userId}</td></tr>
            </table>

            ${safeMessage ? `<blockquote style="margin: 0 0 16px; padding: 10px 14px; border-left: 3px solid #c9a96e; background: #faf8f3; color: #444; font-size: 14px; white-space: pre-wrap;">${safeMessage}</blockquote>` : ""}

            <p style="margin: 0 0 8px; color: #444; font-size: 14px;">Grant access in one click:</p>
            <p style="margin: 0 0 18px;">
                ${btn(primaryUrl, `Make ${probableRole === "ADMIN" ? "Admin" : "Architect"}`, probableRole === "ADMIN" ? "#2a7a52" : "#386da0")}
                ${btn(secondaryUrl, `Make ${probableRole === "ADMIN" ? "Architect" : "Admin"}`, probableRole === "ADMIN" ? "#386da0" : "#2a7a52")}
            </p>

            <p style="margin: 16px 0 0; color: #888; font-size: 12px;">
                Quick-action links expire in 7 days.
            </p>
        </div>
    `;

    try {
        const resend = new Resend(apiKey);
        await resend.emails.send({ from, to: recipients, subject, html });
    } catch (err) {
        console.error("[access-request] Resend failed", err);
        return NextResponse.json({ error: "Notification failed" }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
}
