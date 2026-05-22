import { headers } from "next/headers";
import { Webhook } from "svix";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { normalizeRole } from "types/roles";
import { buildRoleLink } from "@/lib/auth/signedRoleLink";

type ClerkEvent = {
    type: string;
    data: any;
};

/**
 * Send an email to every address in SIGNUP_NOTIFY_EMAILS when a new Clerk
 * account is created. Best-effort — failures are logged but never break the
 * webhook (Clerk would retry the whole event otherwise, which would also
 * retry the Prisma upsert and possibly send duplicate emails).
 */
async function notifyNewSignup(args: {
    clerkUserId: string;
    email: string | null;
    phone: string | null;
    firstName?: string | null;
    lastName?: string | null;
    role: string;
}) {
    // Default to edgar@ only. Override-able if we ever add more admins.
    const defaultRecipients = ["edgar@backyardestates.com"];
    const overrideRaw = (process.env.SIGNUP_NOTIFY_EMAILS ?? "").trim();
    const recipients = overrideRaw
        ? overrideRaw.split(",").map((s) => s.trim()).filter(Boolean)
        : defaultRecipients;

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        console.warn("[clerk webhook] RESEND_API_KEY missing — skipping signup notification");
        return;
    }

    const from = process.env.SIGNUP_NOTIFY_FROM ?? "Backyard Estates <noreply@backyardestates.com>";
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://backyardestates.com";
    const usersUrl = `${baseUrl.replace(/\/$/, "")}/tools/admin/dashboard/users`;

    const fullName = [args.firstName, args.lastName].filter(Boolean).join(" ").trim() || "(no name)";
    const subject = `New signup — ${args.email ?? fullName}`;

    // Build the three one-click role-assignment links. The HMAC lives in the
    // URL so the recipient doesn't need to be signed in to act.
    let adminUrl = "";
    let architectUrl = "";
    let customerUrl = "";
    try {
        adminUrl = buildRoleLink({ baseUrl, userId: args.clerkUserId, role: "ADMIN" });
        architectUrl = buildRoleLink({ baseUrl, userId: args.clerkUserId, role: "ARCHITECT" });
        customerUrl = buildRoleLink({ baseUrl, userId: args.clerkUserId, role: "CUSTOMER" });
    } catch (err) {
        // Missing secret. The links column just won't render — user can still
        // click the "Open user management" fallback.
        console.warn("[clerk webhook] Could not build role-link buttons:", err);
    }

    const btn = (href: string, label: string, bg: string) => href
        ? `<a href="${href}" style="display: inline-block; padding: 10px 18px; background: ${bg}; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 0 6px 6px 0;">${label}</a>`
        : "";

    const html = `
        <div style="font-family: system-ui, -apple-system, sans-serif; color: #1a1a1a; line-height: 1.5; max-width: 540px;">
            <h2 style="margin: 0 0 12px; font-size: 18px;">A new user just signed up.</h2>
            <table style="border-collapse: collapse; margin: 8px 0 20px;">
                <tr><td style="padding: 4px 12px 4px 0; color: #666;">Name</td><td style="padding: 4px 0;"><strong>${fullName}</strong></td></tr>
                <tr><td style="padding: 4px 12px 4px 0; color: #666;">Email</td><td style="padding: 4px 0;">${args.email ?? "—"}</td></tr>
                <tr><td style="padding: 4px 12px 4px 0; color: #666;">Phone</td><td style="padding: 4px 0;">${args.phone ?? "—"}</td></tr>
                <tr><td style="padding: 4px 12px 4px 0; color: #666;">Default role</td><td style="padding: 4px 0;">${args.role}</td></tr>
                <tr><td style="padding: 4px 12px 4px 0; color: #666;">Clerk ID</td><td style="padding: 4px 0; font-family: ui-monospace, monospace; font-size: 12px; color: #666;">${args.clerkUserId}</td></tr>
            </table>

            <p style="margin: 0 0 8px; color: #444; font-size: 14px;">One-click role assignment:</p>
            <p style="margin: 0 0 18px;">
                ${btn(adminUrl, "Make Admin", "#2a7a52")}
                ${btn(architectUrl, "Make Architect", "#386da0")}
                ${btn(customerUrl, "Make Customer", "#7a6a4a")}
            </p>

            <p style="margin: 0 0 16px; font-size: 13px; color: #555;">
                Or <a href="${usersUrl}" style="color: #2a7a52; font-weight: 600;">open user management</a> to assign manually.
            </p>
            <p style="margin: 16px 0 0; color: #888; font-size: 12px;">
                Quick-action links expire in 7 days. Auth is via HMAC, not a session, so you can act straight from your inbox.
            </p>
        </div>
    `;

    try {
        const resend = new Resend(apiKey);
        await resend.emails.send({ from, to: recipients, subject, html });
    } catch (err) {
        console.error("[clerk webhook] Failed to send signup notification", err);
    }
}

export async function POST(req: Request) {
    const secret = process.env.CLERK_WEBHOOK_SECRET;
    if (!secret) return new Response("Missing CLERK_WEBHOOK_SECRET", { status: 500 });

    const payload = await req.text();
    const hdrs = await headers();

    const svix_id = hdrs.get("svix-id");
    const svix_timestamp = hdrs.get("svix-timestamp");
    const svix_signature = hdrs.get("svix-signature");

    if (!svix_id || !svix_timestamp || !svix_signature) {
        return new Response("Missing Svix headers", { status: 400 });
    }

    let evt: ClerkEvent;

    try {
        const wh = new Webhook(secret);
        evt = wh.verify(payload, {
            "svix-id": svix_id,
            "svix-timestamp": svix_timestamp,
            "svix-signature": svix_signature,
        }) as ClerkEvent;
    } catch (err) {
        return new Response("Webhook signature invalid", { status: 400 });
    }

    const { type, data } = evt;

    // Only handle what you need
    if (type === "user.created" || type === "user.updated") {
        const clerkUserId = data.id as string;

        const email =
            data.email_addresses?.find((e: any) => e.id === data.primary_email_address_id)?.email_address ??
            data.email_addresses?.[0]?.email_address ??
            null;

        const phone =
            data.phone_numbers?.find((p: any) => p.id === data.primary_phone_number_id)?.phone_number ??
            data.phone_numbers?.[0]?.phone_number ??
            null;

        // Optional: role from Clerk metadata (if set)
        const metadataRole = (data.public_metadata?.role as string | undefined)?.toUpperCase();
        const role = normalizeRole(metadataRole);

        await prisma.user.upsert({
            where: { id: clerkUserId },
            update: { email: email ?? undefined, phone: phone ?? undefined, role },
            create: { id: clerkUserId, email: email ?? undefined, phone: phone ?? undefined, role },
        });

        // Notify the team only on first-time creation, not on every profile
        // edit (user.updated also flows through this branch).
        if (type === "user.created") {
            await notifyNewSignup({
                clerkUserId,
                email,
                phone,
                firstName: data.first_name ?? null,
                lastName: data.last_name ?? null,
                role,
            });
        }
    }

    return new Response("OK", { status: 200 });
}

