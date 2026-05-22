import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { requireDbRole } from "@/lib/auth";
import { getDiscount, updateDiscount, deleteDiscount, type DiscountUpsertInput } from "@/lib/db/discounts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await requireDbRole([Role.ADMIN, Role.ARCHITECT]);
        const { id } = await params;
        const discount = await getDiscount(id);
        if (!discount) return NextResponse.json({ discount: null }, { status: 404 });
        return NextResponse.json({ discount });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        if (msg === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        console.error("[GET discount]", err);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const dbUser = await requireDbRole([Role.ADMIN]);
        const { id } = await params;
        const body = (await req.json()) as Partial<DiscountUpsertInput>;
        const patch: Partial<DiscountUpsertInput> = {};
        if (body.label !== undefined) patch.label = body.label;
        if (body.slug !== undefined) patch.slug = body.slug;
        if (body.amount !== undefined) patch.amount = Number(body.amount);
        if (body.sortOrder !== undefined) patch.sortOrder = Number(body.sortOrder);
        if (body.active !== undefined) patch.active = !!body.active;
        if (body.notes !== undefined) patch.notes = body.notes ?? null;
        const discount = await updateDiscount(id, patch, dbUser.id);
        return NextResponse.json({ discount });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        if (msg === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        console.error("[PUT discount]", err);
        return NextResponse.json({ error: msg }, { status: 400 });
    }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await requireDbRole([Role.ADMIN]);
        const { id } = await params;
        await deleteDiscount(id);
        return NextResponse.json({ deleted: true });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        if (msg === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        console.error("[DELETE discount]", err);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
