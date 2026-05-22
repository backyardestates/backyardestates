import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { requireDbRole } from "@/lib/auth";
import { listMilestones, createMilestone, type MilestoneUpsertInput } from "@/lib/db/paymentMilestones";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
    try {
        await requireDbRole([Role.ADMIN, Role.ARCHITECT]);
        const milestones = await listMilestones();
        return NextResponse.json({ milestones });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        if (msg === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        console.error("[GET payment-milestones]", err);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const dbUser = await requireDbRole([Role.ADMIN]);
        const body = (await req.json()) as Partial<MilestoneUpsertInput>;
        if (!body.label || !body.trigger) {
            return NextResponse.json({ error: "Missing label or trigger" }, { status: 400 });
        }
        const milestone = await createMilestone(
            {
                label: body.label,
                slug: body.slug,
                trigger: body.trigger,
                sortOrder: body.sortOrder !== undefined ? Number(body.sortOrder) : 0,
                weight: Number(body.weight ?? 0),
                fixedAmount: body.fixedAmount == null ? null : Number(body.fixedAmount),
                active: body.active ?? true,
                notes: body.notes ?? null,
            },
            dbUser.id
        );
        return NextResponse.json({ milestone });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        if (msg === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        console.error("[POST payment-milestone]", err);
        return NextResponse.json({ error: msg }, { status: 400 });
    }
}
