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

    const url = new URL(`${BASE}/avm/value`);
    url.searchParams.set("address", address);

    const res = await fetch(url.toString(), {
        headers: {
            "Accept": "application/json",
            "X-Api-Key": apiKey,
        },
        cache: "no-store",
    });

    if (!res.ok) {
        const text = await res.text();
        return NextResponse.json(
            { error: "RentCast /avm/value failed", status: res.status, details: text },
            { status: res.status }
        );
    }

    const data = await res.json();
    return NextResponse.json(data);
}
