import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { requireDbRole } from "@/lib/auth";
import { getSidebarConfig, setSidebarConfig } from "@/lib/db/inclusions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
    try {
        await requireDbRole([Role.ADMIN, Role.ARCHITECT]);
        const sidebar = await getSidebarConfig();
        return NextResponse.json({ sidebar });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        if (msg === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        console.error("[GET inclusions sidebar]", err);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const dbUser = await requireDbRole([Role.ADMIN]);
        const body = (await req.json()) as { deptPills?: unknown; feeBullets?: unknown };

        function asStringArr(v: unknown): string[] {
            if (!Array.isArray(v)) return [];
            return v.map((x) => String(x).trim()).filter((s) => s.length > 0);
        }

        const sidebar = await setSidebarConfig(
            {
                deptPills: asStringArr(body.deptPills),
                feeBullets: asStringArr(body.feeBullets),
            },
            dbUser.id
        );
        return NextResponse.json({ sidebar });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        if (msg === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        console.error("[PUT inclusions sidebar]", err);
        return NextResponse.json({ error: msg }, { status: 400 });
    }
}
