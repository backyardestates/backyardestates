import { NextResponse } from "next/server";
import { ensureProposalContext } from "@/lib/db/ensureProposalContext";
import {
    pipedriveFetch,
    PipedriveApiError,
    PipedriveConfigError,
    isPipedriveConfigured,
} from "@/lib/pipedrive/client";
import { fetchPipedriveContact } from "@/lib/pipedrive/contact";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/pipedrive/lookup?personId=<id>&dealId=<id>
 *
 * Lightweight by-ID fetch used to rehydrate the linked-record name + deal
 * title after a saved proposal is reopened. Either parameter may be omitted.
 */

type PdPersonDetail = { id: number; name: string };
type PdDealDetail = { id: number; title: string };

export interface PipedriveLookupResponse {
    person: { id: number; name: string } | null;
    deal: { id: number; title: string } | null;
    /** Primary customer email resolved from the linked person, or — when only a
     *  deal is linked — from the deal's linked person. Null when unavailable.
     *  Used to auto-fill the proposal's customer email on link. */
    email: string | null;
}

export async function GET(req: Request) {
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

    const url = new URL(req.url);
    const personId = url.searchParams.get("personId")?.trim() || null;
    const dealId = url.searchParams.get("dealId")?.trim() || null;

    if (!personId && !dealId) {
        return NextResponse.json({ person: null, deal: null, email: null } satisfies PipedriveLookupResponse);
    }

    try {
        const [personRes, dealRes, contact] = await Promise.all([
            personId
                ? pipedriveFetch<{ data: PdPersonDetail }>(`persons/${personId}`)
                      .then((d) => d.data)
                      .catch(() => null)
                : Promise.resolve(null),
            dealId
                ? pipedriveFetch<{ data: PdDealDetail }>(`deals/${dealId}`)
                      .then((d) => d.data)
                      .catch(() => null)
                : Promise.resolve(null),
            // Resolve the primary email. fetchPipedriveContact follows a deal to
            // its linked person, so a deal-only link still yields an email.
            fetchPipedriveContact({
                personId: personId ? Number(personId) : null,
                dealId: dealId ? Number(dealId) : null,
            }).catch(() => null),
        ]);

        const body: PipedriveLookupResponse = {
            person: personRes ? { id: personRes.id, name: personRes.name } : null,
            deal: dealRes ? { id: dealRes.id, title: dealRes.title } : null,
            email: contact?.customerEmail ?? null,
        };
        return NextResponse.json(body);
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
        console.error("[GET /api/pipedrive/lookup]", err);
        return NextResponse.json(
            { error: err instanceof Error ? err.message : String(err) },
            { status: 500 },
        );
    }
}
