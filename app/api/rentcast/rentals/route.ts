import { NextResponse } from "next/server";

const BASE = "https://api.rentcast.io/v1";

function sqftRange(min: number, max: number) {
    const low = Math.max(0, Math.round(min));
    const high = Math.max(low, Math.round(max));
    return `${low}-${high}`;
}

function parseNum(v: string | null): number | undefined {
    if (!v) return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
}

function dedupeListings(listings: any[]) {
    // Best-effort dedupe without relying on an ID (RentCast listing IDs vary by endpoint/version).
    // Key off address + price + sqft + beds/baths.
    const seen = new Set<string>();
    const out: any[] = [];

    for (const x of listings ?? []) {
        const addr =
            (x.formattedAddress ??
                x.addressLine1 ??
                x.address ??
                x.streetAddress ??
                "")
                .toString()
                .trim()
                .toLowerCase();

        const price = Number(x.price ?? x.rent ?? "");
        const sqft = Number(x.squareFootage ?? x.sqft ?? "");
        const beds = Number(x.bedrooms ?? "");
        const baths = Number(x.bathrooms ?? "");

        const key = [
            addr || "na",
            Number.isFinite(price) ? price : "na",
            Number.isFinite(sqft) ? sqft : "na",
            Number.isFinite(beds) ? beds : "na",
            Number.isFinite(baths) ? baths : "na",
        ].join("|");

        if (seen.has(key)) continue;
        seen.add(key);
        out.push(x);
    }

    return out;
}

async function fetchBand(args: {
    apiKey: string;
    city: string;
    state: string;
    limit: number;
    minSqft?: number;
    maxSqft?: number;
}) {
    const { apiKey, city, state, limit, minSqft, maxSqft } = args;

    const url = new URL(`${BASE}/listings/rental/long-term`);
    url.searchParams.set("city", city);
    url.searchParams.set("state", state);
    url.searchParams.set("status", "Active");
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("propertyType", "Condo|Townhouse|Multi-Family|Single Family");

    if (Number.isFinite(minSqft) && Number.isFinite(maxSqft)) {
        url.searchParams.set("squareFootage", sqftRange(minSqft!, maxSqft!));
    }

    const res = await fetch(url.toString(), {
        headers: {
            Accept: "application/json",
            "X-Api-Key": apiKey,
        },
        cache: "no-store",
    });

    if (!res.ok) {
        const text = await res.text();
        return {
            ok: false as const,
            status: res.status,
            error: text,
            url: url.toString(),
            listings: [] as any[],
        };
    }

    const data = await res.json();
    return {
        ok: true as const,
        status: 200,
        url: url.toString(),
        listings: Array.isArray(data) ? data : [],
    };
}

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const city = searchParams.get("city");
    const state = searchParams.get("state");

    // sqft is OPTIONAL now
    const sqft = parseNum(searchParams.get("sqft"));

    // optional tuning knobs (still safe defaults)
    const limit = Math.min(50, Math.max(10, parseNum(searchParams.get("limit")) ?? 35));
    const buffer = Math.min(400, Math.max(50, parseNum(searchParams.get("buffer")) ?? 150));

    // wide mode knobs
    const wideMinSqft = Math.min(2000, Math.max(100, parseNum(searchParams.get("wideMinSqft")) ?? 250));
    const wideMaxSqft = Math.min(4000, Math.max(wideMinSqft + 50, parseNum(searchParams.get("wideMaxSqft")) ?? 1400));

    if (!city || !state) {
        return NextResponse.json({ error: "Missing city/state" }, { status: 400 });
    }

    const apiKey = process.env.RENTCAST_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: "Missing RENTCAST_API_KEY" }, { status: 500 });
    }

    // --- Mode A: Tight band (sqft provided)
    if (Number.isFinite(sqft)) {
        const minSqft = (sqft as number) - buffer;
        const maxSqft = (sqft as number) + buffer;

        const band = await fetchBand({
            apiKey,
            city,
            state,
            limit,
            minSqft,
            maxSqft,
        });

        if (!band.ok) {
            return NextResponse.json(
                {
                    error: "RentCast /listings/rental/long-term failed",
                    status: band.status,
                    details: band.error,
                    meta: { mode: "band", url: band.url },
                },
                { status: band.status }
            );
        }

        return NextResponse.json({
            listings: band.listings ?? [],
            meta: {
                mode: "band",
                city,
                state,
                sqft,
                buffer,
                range: sqftRange(minSqft, maxSqft),
                fetched: band.listings.length,
                limit,
            },
        });
    }

    // --- Mode B: Wide pool (sqft NOT provided)
    // We fetch multiple sqft buckets so you can estimate rent for any ADU size locally.
    // Buckets are intentionally overlapping a bit to avoid holes.
    const bands: Array<{ min: number; max: number }> = [
        { min: wideMinSqft, max: 450 },
        { min: 400, max: 700 },
        { min: 650, max: 950 },
        { min: 900, max: wideMaxSqft },
    ].filter((b) => b.max > b.min);

    const results = await Promise.all(
        bands.map((b) =>
            fetchBand({
                apiKey,
                city,
                state,
                limit,
                minSqft: b.min,
                maxSqft: b.max,
            })
        )
    );

    const failures = results.filter((r) => !r.ok);
    if (failures.length === results.length) {
        // all failed
        const first = failures[0];
        return NextResponse.json(
            {
                error: "RentCast /listings/rental/long-term failed (wide mode)",
                status: first.status,
                details: first.error,
                meta: {
                    mode: "wide",
                    city,
                    state,
                    attemptedBands: bands.map((b) => sqftRange(b.min, b.max)),
                    urls: failures.map((f) => f.url),
                },
            },
            { status: first.status }
        );
    }

    const merged = dedupeListings(results.flatMap((r) => (r.ok ? r.listings : [])));

    return NextResponse.json({
        listings: merged,
        meta: {
            mode: "wide",
            city,
            state,
            limitPerBand: limit,
            wideMinSqft,
            wideMaxSqft,
            attemptedBands: bands.map((b) => ({
                min: b.min,
                max: b.max,
                range: sqftRange(b.min, b.max),
            })),
            counts: results.map((r, i) => ({
                band: bands[i] ? sqftRange(bands[i].min, bands[i].max) : "—",
                ok: r.ok,
                fetched: r.ok ? r.listings.length : 0,
            })),
            mergedCount: merged.length,
        },
    });
}
