import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { requireDbRole } from "@/lib/auth";
import {
    listInclusions,
    getSidebarConfig,
    createInclusionCategory,
} from "@/lib/db/inclusions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET — returns both the inclusions tree and the sidebar config in one call.
export async function GET() {
    try {
        await requireDbRole([Role.ADMIN, Role.ARCHITECT]);
        const [categories, sidebar] = await Promise.all([listInclusions(), getSidebarConfig()]);
        return NextResponse.json({ categories, sidebar });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        if (msg === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        console.error("[GET inclusions]", err);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}

// POST — create a new inclusion category.
export async function POST(req: Request) {
    try {
        await requireDbRole([Role.ADMIN]);
        const body = (await req.json()) as { name?: string; slug?: string; sortOrder?: number };
        if (!body.name) return NextResponse.json({ error: "Missing name" }, { status: 400 });
        const category = await createInclusionCategory({
            name: body.name,
            slug: body.slug,
            sortOrder: body.sortOrder !== undefined ? Number(body.sortOrder) : 0,
        });
        return NextResponse.json({ category });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        if (msg === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        console.error("[POST inclusion-category]", err);
        return NextResponse.json({ error: msg }, { status: 400 });
    }
}
