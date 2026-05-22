import { NextResponse } from "next/server";
import { ensureProposalContext } from "@/lib/db/ensureProposalContext";
import {
    pipedriveFetch,
    PipedriveApiError,
    PipedriveConfigError,
    isPipedriveConfigured,
} from "@/lib/pipedrive/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/pipedrive/post-note
 * Body: { personId?: string; dealId?: string; content: string }
 *
 * Posts a note to a Pipedrive person and/or deal. At least one of personId
 * or dealId must be provided. Content can include simple HTML.
 *
 * The admin tool's handleSave calls this after a successful save so the
 * CRM record gets a "proposal updated" note with a deep link back to the
 * proposal in the tool. Fire-and-forget on the caller side — failures
 * surface in server logs but never block the save.
 */
export async function POST(req: Request) {
    try {
        await ensureProposalContext();
    } catch {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isPipedriveConfigured()) {
        return NextResponse.json(
            { error: "Pipedrive is not configured on this server." },
            { status: 503 },
        );
    }

    let body: { personId?: string; dealId?: string; content?: string };
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const personId = body.personId?.trim() || null;
    const dealId = body.dealId?.trim() || null;
    const content = body.content?.trim();

    if (!personId && !dealId) {
        return NextResponse.json(
            { error: "Need at least one of personId or dealId." },
            { status: 400 },
        );
    }
    if (!content) {
        return NextResponse.json({ error: "Empty note content." }, { status: 400 });
    }

    // Pipedrive's /v1/notes accepts both person_id and deal_id on the same
    // note — saves us from making two calls in the dual-link case.
    const payload: Record<string, unknown> = { content };
    if (personId) payload.person_id = Number(personId);
    if (dealId) payload.deal_id = Number(dealId);

    try {
        const data = await pipedriveFetch("notes", { method: "POST", body: payload });
        return NextResponse.json({ success: true, data });
    } catch (err) {
        if (err instanceof PipedriveConfigError) {
            return NextResponse.json({ error: err.message }, { status: 500 });
        }
        if (err instanceof PipedriveApiError) {
            return NextResponse.json(
                { error: err.message, details: err.body },
                { status: err.status },
            );
        }
        console.error("[POST /api/pipedrive/post-note]", err);
        return NextResponse.json(
            { error: err instanceof Error ? err.message : String(err) },
            { status: 500 },
        );
    }
}
