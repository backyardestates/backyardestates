import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { requireDbRole } from "@/lib/auth";
import { createInclusionRow, type RowUpsertInput } from "@/lib/db/inclusions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
    try {
        await requireDbRole([Role.ADMIN]);
        const body = (await req.json()) as Partial<RowUpsertInput>;
        if (!body.categoryId || !body.label || body.text == null) {
            return NextResponse.json({ error: "Missing categoryId, label, or text" }, { status: 400 });
        }
        const row = await createInclusionRow({
            categoryId: body.categoryId,
            label: body.label,
            text: body.text,
            slug: body.slug,
            sortOrder: body.sortOrder !== undefined ? Number(body.sortOrder) : 0,
            active: body.active ?? true,
        });
        return NextResponse.json({ row });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        if (msg === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        console.error("[POST inclusion-row]", err);
        return NextResponse.json({ error: msg }, { status: 400 });
    }
}
