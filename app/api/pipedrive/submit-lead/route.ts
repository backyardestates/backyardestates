import { NextResponse } from "next/server";
import { pipedriveFetch, PipedriveApiError, PipedriveConfigError } from "@/lib/pipedrive/client";

export const runtime = "nodejs";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const data = await pipedriveFetch("deals", { method: "POST", body: body.submittedLead });
        return NextResponse.json({ success: true, data }, { status: 200 });
    } catch (err) {
        if (err instanceof PipedriveConfigError) {
            return NextResponse.json({ error: err.message }, { status: 500 });
        }
        if (err instanceof PipedriveApiError) {
            return NextResponse.json({ error: err.message, details: err.body }, { status: err.status });
        }
        return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
    }
}
