// app/api/rentcast/markets/route.ts
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const zipCode = searchParams.get("zipCode")?.trim();
    const dataType = searchParams.get("dataType") ?? "Rental";
    const historyRange = searchParams.get("historyRange") ?? "12";

    if (!zipCode || !/^\d{5}$/.test(zipCode)) {
        return NextResponse.json({ error: "zipCode is required (5 digits)." }, { status: 400 });
    }

    const apiKey = process.env.RENTCAST_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: "Missing RENTCAST_API_KEY." }, { status: 500 });
    }

    const url = new URL("https://api.rentcast.io/v1/markets");
    url.searchParams.set("zipCode", zipCode);
    url.searchParams.set("dataType", dataType); // "All" | "Sale" | "Rental"
    url.searchParams.set("historyRange", historyRange);

    const res = await fetch(url.toString(), {
        headers: {
            "X-Api-Key": apiKey,
            "Content-Type": "application/json",
        },
        cache: "no-store",
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
        return NextResponse.json({ error: json?.error ?? "Failed to fetch market stats." }, { status: res.status });
    }

    return NextResponse.json(json);
}
