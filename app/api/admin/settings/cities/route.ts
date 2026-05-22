import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { requireDbRole } from "@/lib/auth";
import { listCities, createCity, type CityUpsertInput } from "@/lib/db/cities";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ── GET /api/admin/settings/cities ──────────────────────────────────────────
export async function GET() {
    try {
        await requireDbRole([Role.ADMIN, Role.ARCHITECT]);
        const cities = await listCities();
        return NextResponse.json({ cities });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        if (msg === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        console.error("[GET cities]", err);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}

// ── POST /api/admin/settings/cities — create a new city ─────────────────────
export async function POST(req: Request) {
    try {
        const dbUser = await requireDbRole([Role.ADMIN]);
        const body = (await req.json()) as Partial<CityUpsertInput>;

        if (!body.name) {
            return NextResponse.json({ error: "Missing name" }, { status: 400 });
        }

        const payload: CityUpsertInput = {
            name: body.name,
            slug: body.slug ?? "",
            bePlansDays: Number(body.bePlansDays ?? 25),
            bePermitsDays: Number(body.bePermitsDays ?? 130),
            beBuildDays: Number(body.beBuildDays ?? 40),
            cityPlansDays: body.cityPlansDays != null ? Number(body.cityPlansDays) : null,
            cityPermitsDays: body.cityPermitsDays != null ? Number(body.cityPermitsDays) : null,
            cityBuildDays: body.cityBuildDays != null ? Number(body.cityBuildDays) : null,
            cityPlansLabel: body.cityPlansLabel ?? null,
            cityPermitsLabel: body.cityPermitsLabel ?? null,
            cityBuildLabel: body.cityBuildLabel ?? null,
            notes: body.notes ?? null,
            active: body.active ?? true,
            sortOrder: Number(body.sortOrder ?? 0),
        };

        const city = await createCity(payload, dbUser.id);
        return NextResponse.json({ city });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        if (msg === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        console.error("[POST cities]", err);
        return NextResponse.json({ error: msg }, { status: 400 });
    }
}
