import { headers } from "next/headers";
import { Webhook } from "svix";
import { prisma } from "@/lib/prisma";
import { normalizeRole } from "types/roles";

type ClerkEvent = {
    type: string;
    data: any;
};

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
    }

    return new Response("OK", { status: 200 });
}

