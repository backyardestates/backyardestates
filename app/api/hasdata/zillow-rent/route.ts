import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/requireRole";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// HasData Zillow Property endpoint — returns the canonical home-details payload
// including Zestimate, rentZestimate, beds/baths/sqft, photos, etc.
// Auth: x-api-key header. Docs: https://docs.hasdata.com/apis/zillow
const HASDATA_PROPERTY_ENDPOINT = "https://api.hasdata.com/scrape/zillow/property";

function constructZillowUrl(address: string): string {
    const slug = address.trim().replace(/\s+/g, "-");
    return `https://www.zillow.com/homes/${encodeURI(slug)}_rb/`;
}

// Defensive extractor — HasData mirrors Zillow's internal model; field can live at
// top level or nested under `property` / `data` / `result`.
function extractRentZestimate(payload: any): { rent: number | null; field: string | null } {
    if (!payload || typeof payload !== "object") return { rent: null, field: null };
    const candidates = [payload, payload.property, payload.data, payload.result].filter(Boolean);
    const fields = ["rentZestimate", "rent_zestimate", "rentZestimateValue", "rentEstimate"];
    for (const c of candidates) {
        for (const f of fields) {
            const v = c[f];
            if (typeof v === "number" && v > 0) return { rent: v, field: f };
        }
    }
    return { rent: null, field: null };
}

function extractZestimate(payload: any): number | null {
    if (!payload || typeof payload !== "object") return null;
    const candidates = [payload, payload.property, payload.data, payload.result].filter(Boolean);
    for (const c of candidates) {
        const v = c.zestimate ?? c.zestimateValue;
        if (typeof v === "number" && v > 0) return v;
    }
    return null;
}

export async function GET(req: Request) {
    // HasData bills per call — keep this admin/architect only.
    const guard = await requireRole(["ADMIN", "ARCHITECT", "SALES_REP", "STAFF"]);
    if (guard) return guard;

    const { searchParams } = new URL(req.url);
    const address = searchParams.get("address");
    const directUrl = searchParams.get("url");
    const debug = searchParams.get("debug") === "1";

    if (!address && !directUrl) {
        return NextResponse.json({ error: "Missing address or url" }, { status: 400 });
    }

    const apiKey = process.env.HASDATA_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: "Missing HASDATA_API_KEY" }, { status: 500 });
    }

    const propertyUrl = directUrl ?? constructZillowUrl(address!);
    const upstreamUrl = new URL(HASDATA_PROPERTY_ENDPOINT);
    upstreamUrl.searchParams.set("url", propertyUrl);

    try {
        const upstream = await fetch(upstreamUrl.toString(), {
            method: "GET",
            headers: {
                Accept: "application/json",
                "x-api-key": apiKey,
            },
            signal: AbortSignal.timeout(25_000),
        });

        if (!upstream.ok) {
            const text = await upstream.text().catch(() => "");
            return NextResponse.json(
                {
                    error: "HasData upstream error",
                    status: upstream.status,
                    details: text.slice(0, 500),
                    upstreamUrl: upstreamUrl.toString(),
                },
                { status: 502 }
            );
        }

        const data = await upstream.json();
        const { rent: rentZestimate, field: rentField } = extractRentZestimate(data);
        const zestimate = extractZestimate(data);

        return NextResponse.json({
            address,
            propertyUrl,
            rentZestimate,
            zestimate,
            rentField,
            // Only echo the raw payload when explicitly debugging
            debug: debug ? data : undefined,
        });
    } catch (err) {
        return NextResponse.json(
            {
                error: "HasData request failed",
                details: err instanceof Error ? err.message : String(err),
                upstreamUrl: upstreamUrl.toString(),
            },
            { status: 502 }
        );
    }
}
