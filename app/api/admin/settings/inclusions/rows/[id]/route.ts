import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { requireDbRole } from "@/lib/auth";
import { updateInclusionRow, deleteInclusionRow, type RowUpsertInput } from "@/lib/db/inclusions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await requireDbRole([Role.ADMIN]);
        const { id } = await params;
        const body = (await req.json()) as Partial<RowUpsertInput>;
        const patch: Partial<RowUpsertInput> = {};
        if (body.categoryId !== undefined) patch.categoryId = body.categoryId;
        if (body.slug !== undefined) patch.slug = body.slug;
        if (body.label !== undefined) patch.label = body.label;
        if (body.text !== undefined) patch.text = body.text;
        if (body.sortOrder !== undefined) patch.sortOrder = Number(body.sortOrder);
        if (body.active !== undefined) patch.active = !!body.active;
        const row = await updateInclusionRow(id, patch);
        return NextResponse.json({ row });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        if (msg === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        console.error("[PUT inclusion-row]", err);
        return NextResponse.json({ error: msg }, { status: 400 });
    }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await requireDbRole([Role.ADMIN]);
        const { id } = await params;
        await deleteInclusionRow(id);
        return NextResponse.json({ deleted: true });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        if (msg === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        console.error("[DELETE inclusion-row]", err);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
