import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { requireDbRole } from "@/lib/auth";
import { getDefaultSlideOrder, setDefaultSlideOrder, naturalOrder } from "@/lib/db/slideOrder";
import { SLIDE_COUNT } from "@/lib/store/presentationStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
    try {
        await requireDbRole([Role.ADMIN, Role.ARCHITECT]);
        const order = await getDefaultSlideOrder();
        return NextResponse.json({ order, slideCount: SLIDE_COUNT, naturalOrder: naturalOrder() });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        if (msg === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        console.error("[GET slide-order]", err);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const dbUser = await requireDbRole([Role.ADMIN]);
        const body = (await req.json()) as { order?: unknown };

        if (!Array.isArray(body.order)) {
            return NextResponse.json({ error: "Missing or invalid 'order' array" }, { status: 400 });
        }

        // Coerce + validate: every entry must be an integer in [1, SLIDE_COUNT].
        const order: number[] = [];
        const seen = new Set<number>();
        for (const raw of body.order) {
            const n = typeof raw === "number" ? raw : Number(raw);
            if (!Number.isInteger(n) || n < 1 || n > SLIDE_COUNT) {
                return NextResponse.json(
                    { error: `Slide numbers must be integers in [1, ${SLIDE_COUNT}]; got ${raw}` },
                    { status: 400 }
                );
            }
            if (seen.has(n)) {
                return NextResponse.json({ error: `Duplicate slide number: ${n}` }, { status: 400 });
            }
            seen.add(n);
            order.push(n);
        }

        const saved = await setDefaultSlideOrder(order, dbUser.id);
        return NextResponse.json({ order: saved });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        if (msg === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        console.error("[PUT slide-order]", err);
        return NextResponse.json({ error: msg }, { status: 400 });
    }
}
