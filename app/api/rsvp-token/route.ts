import { NextResponse } from "next/server";
import { generateRsvpToken } from "@/utils/generateRSVPToken";

export async function POST(req: Request) {
    const { dealId, email } = await req.json();
    if (!dealId || !email) {
        return NextResponse.json({ error: "Missing dealId or email" }, { status: 400 });
    }

    const token = generateRsvpToken(dealId, email);
    return NextResponse.json({ token });
}