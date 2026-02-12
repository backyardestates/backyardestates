import { NextResponse } from "next/server";

const BASE = "https://api.rentcast.io/v1";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get("address");

    if (!address) {
        return NextResponse.json({ error: "Missing address" }, { status: 400 });
    }

    const apiKey = process.env.RENTCAST_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: "Missing RENTCAST_API_KEY" }, { status: 500 });
    }

    const url = new URL(`${BASE}/properties`);
    url.searchParams.set("address", address);
    url.searchParams.set("limit", "1");

    const res = await fetch(url.toString(), {
        headers: {
            "Accept": "application/json",
            "X-Api-Key": apiKey,
        },
        // RentCast data changes; don’t cache in Next by default for admin
        cache: "no-store",
    });

    if (!res.ok) {
        const text = await res.text();
        return NextResponse.json(
            { error: "RentCast /properties failed", status: res.status, details: text },
            { status: res.status }
        );
    }

    const data = await res.json(); // array
    return NextResponse.json({ record: data?.[0] ?? null });
}
