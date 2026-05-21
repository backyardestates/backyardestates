import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { requireDbRole } from "@/lib/auth";
import {
    updateInclusionCategory,
    deleteInclusionCategory,
    type CategoryUpsertInput,
} from "@/lib/db/inclusions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await requireDbRole([Role.ADMIN]);
        const { id } = await params;
        const body = (await req.json()) as Partial<CategoryUpsertInput>;
        const patch: Partial<CategoryUpsertInput> = {};
        if (body.name !== undefined) patch.name = body.name;
        if (body.slug !== undefined) patch.slug = body.slug;
        if (body.sortOrder !== undefined) patch.sortOrder = Number(body.sortOrder);
        if (body.active !== undefined) patch.active = !!body.active;
        const category = await updateInclusionCategory(id, patch);
        return NextResponse.json({ category });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        if (msg === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        console.error("[PUT inclusion-category]", err);
        return NextResponse.json({ error: msg }, { status: 400 });
    }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await requireDbRole([Role.ADMIN]);
        const { id } = await params;
        await deleteInclusionCategory(id);
        return NextResponse.json({ deleted: true });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        if (msg === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        console.error("[DELETE inclusion-category]", err);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
