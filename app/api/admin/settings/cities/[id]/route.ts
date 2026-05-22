import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { requireDbRole } from "@/lib/auth";
import { getCity, updateCity, deleteCity, type CityUpsertInput } from "@/lib/db/cities";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ── GET /api/admin/settings/cities/[id] ─────────────────────────────────────
export async function GET(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await requireDbRole([Role.ADMIN, Role.ARCHITECT]);
        const { id } = await params;
        const city = await getCity(id);
        if (!city) return NextResponse.json({ city: null }, { status: 404 });
        return NextResponse.json({ city });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        if (msg === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        console.error("[GET city]", err);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}

// ── PUT /api/admin/settings/cities/[id] ─────────────────────────────────────
export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const dbUser = await requireDbRole([Role.ADMIN]);
        const { id } = await params;
        const body = (await req.json()) as Partial<CityUpsertInput>;

        // Coerce numeric fields explicitly — forms send strings.
        const patch: Partial<CityUpsertInput> = {};
        if (body.name !== undefined) patch.name = body.name;
        if (body.slug !== undefined) patch.slug = body.slug;
        if (body.bePlansDays !== undefined) patch.bePlansDays = Number(body.bePlansDays);
        if (body.bePermitsDays !== undefined) patch.bePermitsDays = Number(body.bePermitsDays);
        if (body.beBuildDays !== undefined) patch.beBuildDays = Number(body.beBuildDays);
        if (body.cityPlansDays !== undefined)
            patch.cityPlansDays = body.cityPlansDays === null || body.cityPlansDays === "" as any ? null : Number(body.cityPlansDays);
        if (body.cityPermitsDays !== undefined)
            patch.cityPermitsDays = body.cityPermitsDays === null || body.cityPermitsDays === "" as any ? null : Number(body.cityPermitsDays);
        if (body.cityBuildDays !== undefined)
            patch.cityBuildDays = body.cityBuildDays === null || body.cityBuildDays === "" as any ? null : Number(body.cityBuildDays);
        if (body.cityPlansLabel !== undefined) patch.cityPlansLabel = body.cityPlansLabel ?? null;
        if (body.cityPermitsLabel !== undefined) patch.cityPermitsLabel = body.cityPermitsLabel ?? null;
        if (body.cityBuildLabel !== undefined) patch.cityBuildLabel = body.cityBuildLabel ?? null;
        if (body.notes !== undefined) patch.notes = body.notes ?? null;
        if (body.active !== undefined) patch.active = !!body.active;
        if (body.sortOrder !== undefined) patch.sortOrder = Number(body.sortOrder);

        const city = await updateCity(id, patch, dbUser.id);
        return NextResponse.json({ city });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        if (msg === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        console.error("[PUT city]", err);
        return NextResponse.json({ error: msg }, { status: 400 });
    }
}

// ── DELETE /api/admin/settings/cities/[id] ──────────────────────────────────
export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await requireDbRole([Role.ADMIN]);
        const { id } = await params;
        await deleteCity(id);
        return NextResponse.json({ deleted: true });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        if (msg === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        console.error("[DELETE city]", err);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
