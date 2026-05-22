import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { requireDbRole } from "@/lib/auth";
import { getFinancialDefaults, setFinancialDefaults } from "@/lib/db/financialDefaults";
import { DEFAULTS, type Defaults } from "@/lib/investment/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// All field names of Defaults — used to filter unexpected request keys.
const DEFAULT_KEYS = Object.keys(DEFAULTS) as (keyof Defaults)[];

function pickDefaults(input: Record<string, unknown>): Defaults {
    const next: Partial<Defaults> = {};
    for (const k of DEFAULT_KEYS) {
        const raw = input[k];
        const v = typeof raw === "string" ? Number(raw) : raw;
        if (typeof v !== "number" || !Number.isFinite(v)) {
            throw new Error(`Invalid value for "${k}"`);
        }
        (next as Record<string, number>)[k] = v;
    }
    return next as Defaults;
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/settings/financial-defaults
// Returns the canonical Defaults. Any signed-in admin / architect can read.
// ─────────────────────────────────────────────────────────────────────────────
export async function GET() {
    try {
        await requireDbRole([Role.ADMIN, Role.ARCHITECT]);
        const defaults = await getFinancialDefaults();
        return NextResponse.json({ defaults });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        if (msg === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        console.error("[GET financial-defaults]", err);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/admin/settings/financial-defaults
// Replaces the canonical Defaults. Admin-only.
// Body: Partial<Defaults> — missing keys default to current row.
// ─────────────────────────────────────────────────────────────────────────────
export async function PUT(req: Request) {
    try {
        const dbUser = await requireDbRole([Role.ADMIN]);
        const body = (await req.json()) as Record<string, unknown>;

        // Merge with existing so partial updates are safe.
        const current = await getFinancialDefaults();
        const merged = { ...current, ...body };
        const next = pickDefaults(merged as Record<string, unknown>);

        const saved = await setFinancialDefaults(next, dbUser.id);
        return NextResponse.json({ defaults: saved });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        if (msg === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        console.error("[PUT financial-defaults]", err);
        return NextResponse.json({ error: msg }, { status: 400 });
    }
}
