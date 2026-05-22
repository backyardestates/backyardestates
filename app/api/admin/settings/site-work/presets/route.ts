import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { requireDbRole } from "@/lib/auth";
import { createPreset, type PresetUpsertInput } from "@/lib/db/siteWork";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ── POST /api/admin/settings/site-work/presets — create a new preset item ──
export async function POST(req: Request) {
    try {
        const dbUser = await requireDbRole([Role.ADMIN]);
        const body = (await req.json()) as Partial<PresetUpsertInput>;
        if (!body.categoryId || !body.label || !body.unit) {
            return NextResponse.json({ error: "Missing categoryId, label, or unit" }, { status: 400 });
        }
        const preset = await createPreset(
            {
                categoryId: body.categoryId,
                slug: body.slug,
                label: body.label,
                unit: body.unit,
                beCost: Number(body.beCost ?? 0),
                markup: Number(body.markup ?? 1),
                sortOrder: body.sortOrder !== undefined ? Number(body.sortOrder) : 0,
                active: body.active ?? true,
                notes: body.notes ?? null,
            },
            dbUser.id
        );
        return NextResponse.json({ preset });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        if (msg === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        console.error("[POST site-work preset]", err);
        return NextResponse.json({ error: msg }, { status: 400 });
    }
}
