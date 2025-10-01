// app/api/schedule-link/route.ts
import { NextResponse } from "next/server";
import { decodeRsvpToken } from "@/utils/generateRSVPToken";

const PIPELINE_ID = "7"; // your pipeline ID
const API_TOKEN = process.env.NEXT_PUBLIC_PIPEDRIVE_API_TOKEN;
const DOMAIN = process.env.NEXT_PUBLIC_PIPEDRIVE_DOMAIN;

export async function POST(req: Request) {
    try {
        const { token } = await req.json();
        if (!token) {
            return NextResponse.json({ success: false, error: "Missing token" }, { status: 400 });
        }

        // ✅ Decode RSVP Token
        const decoded = decodeRsvpToken(token);
        if (!decoded || !decoded.personId) {
            return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 });
        }

        // ✅ Fetch Pipedrive Person
        const personRes = await fetch(
            `https://${DOMAIN}.pipedrive.com/v1/persons/${decoded.personId}?api_token=${API_TOKEN}`
        );
        const personData = await personRes.json();
        if (!personData.success) {
            throw new Error("Failed to fetch person");
        }

        // ✅ Fetch Deals for that person
        const dealsRes = await fetch(
            `https://${DOMAIN}.pipedrive.com/v1/persons/${decoded.personId}/deals?api_token=${API_TOKEN}`
        );
        const dealsData = await dealsRes.json();
        if (!dealsData.success || !dealsData.data?.length) {
            throw new Error("No deals found for person");
        }

        const deal = dealsData.data[0]; // you can pick the first or filter by pipeline
        const dealTitle = deal.title;

        // ✅ Build Calendly URL
        const calendlyUrl = `https://calendly.com/backyard-estates/new-meeting?name=${encodeURIComponent(dealTitle)}&email=${encodeURIComponent(
            decoded.email[0].value
        )}`

        return NextResponse.json({ success: true, url: calendlyUrl });
    } catch (err: any) {
        console.error("Error building Calendly link:", err);
        return NextResponse.json(
            { success: false, error: err.message || "Internal error" },
            { status: 500 }
        );
    }
}
