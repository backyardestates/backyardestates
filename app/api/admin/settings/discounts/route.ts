import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { requireDbRole } from "@/lib/auth";
import { listAllDiscounts, createDiscount, type DiscountUpsertInput } from "@/lib/db/discounts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
    try {
        await requireDbRole([Role.ADMIN, Role.ARCHITECT]);
        const discounts = await listAllDiscounts();
        return NextResponse.json({ discounts });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        if (msg === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        console.error("[GET discounts]", err);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const dbUser = await requireDbRole([Role.ADMIN]);
        const body = (await req.json()) as Partial<DiscountUpsertInput>;
        if (!body.label || body.amount == null) {
            return NextResponse.json({ error: "Missing label or amount" }, { status: 400 });
        }
        const discount = await createDiscount(
            {
                label: body.label,
                slug: body.slug,
                amount: Number(body.amount),
                sortOrder: body.sortOrder !== undefined ? Number(body.sortOrder) : 0,
                active: body.active ?? true,
                notes: body.notes ?? null,
            },
            dbUser.id
        );
        return NextResponse.json({ discount });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        if (msg === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        console.error("[POST discount]", err);
        return NextResponse.json({ error: msg }, { status: 400 });
    }
}
