import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { requireDbRole } from "@/lib/auth";
import {
    getMilestone,
    updateMilestone,
    deleteMilestone,
    type MilestoneUpsertInput,
} from "@/lib/db/paymentMilestones";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await requireDbRole([Role.ADMIN, Role.ARCHITECT]);
        const { id } = await params;
        const milestone = await getMilestone(id);
        if (!milestone) return NextResponse.json({ milestone: null }, { status: 404 });
        return NextResponse.json({ milestone });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        if (msg === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        console.error("[GET payment-milestone]", err);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const dbUser = await requireDbRole([Role.ADMIN]);
        const { id } = await params;
        const body = (await req.json()) as Partial<MilestoneUpsertInput>;
        const patch: Partial<MilestoneUpsertInput> = {};
        if (body.label !== undefined) patch.label = body.label;
        if (body.slug !== undefined) patch.slug = body.slug;
        if (body.trigger !== undefined) patch.trigger = body.trigger;
        if (body.sortOrder !== undefined) patch.sortOrder = Number(body.sortOrder);
        if (body.weight !== undefined) patch.weight = Number(body.weight);
        if (body.fixedAmount !== undefined) patch.fixedAmount = body.fixedAmount == null ? null : Number(body.fixedAmount);
        if (body.active !== undefined) patch.active = !!body.active;
        if (body.notes !== undefined) patch.notes = body.notes ?? null;
        const milestone = await updateMilestone(id, patch, dbUser.id);
        return NextResponse.json({ milestone });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        if (msg === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        console.error("[PUT payment-milestone]", err);
        return NextResponse.json({ error: msg }, { status: 400 });
    }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await requireDbRole([Role.ADMIN]);
        const { id } = await params;
        await deleteMilestone(id);
        return NextResponse.json({ deleted: true });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        if (msg === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        console.error("[DELETE payment-milestone]", err);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
