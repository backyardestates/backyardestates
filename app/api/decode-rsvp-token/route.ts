// app/api/decode-rsvp/route.ts
import { NextResponse } from "next/server";
import { decodeRsvpToken } from "@/utils/generateRSVPToken";

export async function POST(req: Request) {
    const { token } = await req.json();
    if (!token) {
        return NextResponse.json({ success: false, error: "Missing token" }, { status: 400 });
    }

    const decoded = decodeRsvpToken(token);
    if (!decoded) {
        return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 });
    }

    return NextResponse.json({ success: true, data: decoded });
}