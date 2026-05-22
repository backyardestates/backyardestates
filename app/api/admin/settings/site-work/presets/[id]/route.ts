import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { requireDbRole } from "@/lib/auth";
import { getPreset, updatePreset, deletePreset, type PresetUpsertInput } from "@/lib/db/siteWork";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await requireDbRole([Role.ADMIN, Role.ARCHITECT]);
        const { id } = await params;
        const preset = await getPreset(id);
        if (!preset) return NextResponse.json({ preset: null }, { status: 404 });
        return NextResponse.json({ preset });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        if (msg === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        console.error("[GET site-work preset]", err);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const dbUser = await requireDbRole([Role.ADMIN]);
        const { id } = await params;
        const body = (await req.json()) as Partial<PresetUpsertInput>;
        const patch: Partial<PresetUpsertInput> = {};
        if (body.categoryId !== undefined) patch.categoryId = body.categoryId;
        if (body.slug !== undefined) patch.slug = body.slug;
        if (body.label !== undefined) patch.label = body.label;
        if (body.unit !== undefined) patch.unit = body.unit;
        if (body.beCost !== undefined) patch.beCost = Number(body.beCost);
        if (body.markup !== undefined) patch.markup = Number(body.markup);
        if (body.sortOrder !== undefined) patch.sortOrder = Number(body.sortOrder);
        if (body.active !== undefined) patch.active = !!body.active;
        if (body.notes !== undefined) patch.notes = body.notes ?? null;

        const preset = await updatePreset(id, patch, dbUser.id);
        return NextResponse.json({ preset });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        if (msg === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        console.error("[PUT site-work preset]", err);
        return NextResponse.json({ error: msg }, { status: 400 });
    }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await requireDbRole([Role.ADMIN]);
        const { id } = await params;
        await deletePreset(id);
        return NextResponse.json({ deleted: true });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        if (msg === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        console.error("[DELETE site-work preset]", err);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
