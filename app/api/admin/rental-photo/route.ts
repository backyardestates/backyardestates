import { NextResponse } from "next/server";
import { ensureProposalContext } from "@/lib/db/ensureProposalContext";
import { uploadImageToCloudinary, cloudinaryUploadConfigured } from "@/lib/cloudinary/serverUpload";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/admin/rental-photo
// Body: { url: string }  — a remote listing photo (typically Zillow CDN).
// Re-hosts the image on Cloudinary and returns the permanent { url }.
//
// Why: Zillow CDN URLs expire/rot, so featured-rental photos saved in a
// proposal snapshot were broken by the time the proposal was reopened weeks
// later. Cloudinary fetches the remote URL server-side and stores a durable
// copy.
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(req: Request) {
    try {
        await ensureProposalContext();

        if (!cloudinaryUploadConfigured()) {
            return NextResponse.json(
                { error: "Image storage not configured (Cloudinary env vars missing)." },
                { status: 503 },
            );
        }

        let body: { url?: unknown };
        try {
            body = await req.json();
        } catch {
            return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
        }
        const url = typeof body.url === "string" ? body.url.trim() : "";
        if (!/^https?:\/\//i.test(url)) {
            return NextResponse.json({ error: "Provide an http(s) image URL" }, { status: 400 });
        }
        // Already durable — nothing to do.
        if (url.includes("res.cloudinary.com")) {
            return NextResponse.json({ url });
        }

        const hosted = await uploadImageToCloudinary(url, { folder: "rental-photos" });
        return NextResponse.json({ url: hosted });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg === "UNAUTHORIZED") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        console.error("[POST /api/admin/rental-photo]", err);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
