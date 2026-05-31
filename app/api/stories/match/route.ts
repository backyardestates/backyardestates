import { NextResponse } from "next/server";
import { ensureProposalContext } from "@/lib/db/ensureProposalContext";
import { isAnthropicConfigured } from "@/lib/ai/claude";
import { matchStories, type StoryForMatch } from "@/lib/ai/storyMatch";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Claude calls can run long; raise the serverless budget so the function isn't
// killed mid-request (which returns a non-JSON page the client can't parse).
export const maxDuration = 300;

// POST /api/stories/match
// Body: { tags: string[]; stories: { id, name, quote?, purpose? }[] }
//
// Runs the testimonials through Claude and returns the ones that best match the
// rep's selected tags/themes — ranked, each with a 0–100 score + one-line reason.
export async function POST(req: Request) {
    try {
        await ensureProposalContext();

        if (!isAnthropicConfigured()) {
            return NextResponse.json(
                { error: "ANTHROPIC_API_KEY is not configured on this server." },
                { status: 503 },
            );
        }

        let body: { tags?: unknown; stories?: unknown };
        try {
            body = await req.json();
        } catch {
            return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
        }

        const tags = Array.isArray(body.tags)
            ? body.tags.filter((t): t is string => typeof t === "string")
            : [];
        const stories = Array.isArray(body.stories)
            ? (body.stories.filter(
                  (s) => s && typeof s === "object" && typeof (s as StoryForMatch).id === "string",
              ) as StoryForMatch[])
            : [];

        if (tags.length === 0) {
            return NextResponse.json({ error: "Select at least one theme to match." }, { status: 400 });
        }
        if (stories.length === 0) {
            return NextResponse.json({ matches: [] });
        }

        const matches = await matchStories({ tags, stories });
        return NextResponse.json({ matches });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg === "UNAUTHORIZED") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        console.error("[POST /api/stories/match]", err);
        return NextResponse.json({ error: msg }, { status: 502 });
    }
}
