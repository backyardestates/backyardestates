import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { requireDbRole } from "@/lib/auth";
import { getTaxTopic, updateTaxTopic, deleteTaxTopic, type TaxTopicUpsertInput } from "@/lib/db/taxTopics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await requireDbRole([Role.ADMIN, Role.ARCHITECT]);
        const { id } = await params;
        const topic = await getTaxTopic(id);
        if (!topic) return NextResponse.json({ topic: null }, { status: 404 });
        return NextResponse.json({ topic });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        if (msg === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        console.error("[GET tax-topic]", err);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const dbUser = await requireDbRole([Role.ADMIN]);
        const { id } = await params;
        const body = (await req.json()) as Partial<TaxTopicUpsertInput>;
        const patch: Partial<TaxTopicUpsertInput> = {};
        if (body.name !== undefined) patch.name = body.name;
        if (body.note !== undefined) patch.note = body.note;
        if (body.slug !== undefined) patch.slug = body.slug;
        if (body.sortOrder !== undefined) patch.sortOrder = Number(body.sortOrder);
        if (body.active !== undefined) patch.active = !!body.active;
        const topic = await updateTaxTopic(id, patch, dbUser.id);
        return NextResponse.json({ topic });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        if (msg === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        console.error("[PUT tax-topic]", err);
        return NextResponse.json({ error: msg }, { status: 400 });
    }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await requireDbRole([Role.ADMIN]);
        const { id } = await params;
        await deleteTaxTopic(id);
        return NextResponse.json({ deleted: true });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        if (msg === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        console.error("[DELETE tax-topic]", err);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
