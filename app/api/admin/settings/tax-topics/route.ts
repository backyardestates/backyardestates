import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { requireDbRole } from "@/lib/auth";
import { listTaxTopics, createTaxTopic, type TaxTopicUpsertInput } from "@/lib/db/taxTopics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
    try {
        await requireDbRole([Role.ADMIN, Role.ARCHITECT]);
        const topics = await listTaxTopics();
        return NextResponse.json({ topics });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        if (msg === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        console.error("[GET tax-topics]", err);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const dbUser = await requireDbRole([Role.ADMIN]);
        const body = (await req.json()) as Partial<TaxTopicUpsertInput>;
        if (!body.name || body.note == null) {
            return NextResponse.json({ error: "Missing name or note" }, { status: 400 });
        }
        const topic = await createTaxTopic(
            {
                name: body.name,
                note: body.note,
                slug: body.slug,
                sortOrder: body.sortOrder !== undefined ? Number(body.sortOrder) : 0,
                active: body.active ?? true,
            },
            dbUser.id
        );
        return NextResponse.json({ topic });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        if (msg === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        console.error("[POST tax-topic]", err);
        return NextResponse.json({ error: msg }, { status: 400 });
    }
}
