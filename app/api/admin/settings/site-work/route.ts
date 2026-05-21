import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { requireDbRole } from "@/lib/auth";
import { listCategoriesWithItems, createCategory } from "@/lib/db/siteWork";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ── GET /api/admin/settings/site-work ───────────────────────────────────────
// Returns the full catalog: every category with its items nested.
export async function GET() {
    try {
        await requireDbRole([Role.ADMIN, Role.ARCHITECT]);
        const categories = await listCategoriesWithItems();
        return NextResponse.json({ categories });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        if (msg === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        console.error("[GET site-work]", err);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}

// ── POST /api/admin/settings/site-work — create a new category ──────────────
export async function POST(req: Request) {
    try {
        await requireDbRole([Role.ADMIN]);
        const body = (await req.json()) as { label?: string; slug?: string; sortOrder?: number };
        if (!body.label) {
            return NextResponse.json({ error: "Missing label" }, { status: 400 });
        }
        const category = await createCategory({
            label: body.label,
            slug: body.slug,
            sortOrder: body.sortOrder,
        });
        return NextResponse.json({ category });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        if (msg === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        console.error("[POST site-work category]", err);
        return NextResponse.json({ error: msg }, { status: 400 });
    }
}
