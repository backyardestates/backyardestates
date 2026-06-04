import { NextResponse } from "next/server";
import { ensureProposalContext } from "@/lib/db/ensureProposalContext";
import { uploadImageToCloudinary, cloudinaryUploadConfigured } from "@/lib/cloudinary/serverUpload";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/admin/site-photo
// Body: multipart FormData with `file` (image).
// Uploads the proposal site photo to Cloudinary and returns { url }.
//
// Replaces the old flow where the photo was embedded in the proposal snapshot
// as a base64 data URL — which bloated every autosave POST and could exceed
// the serverless body limit (413 → the photo silently never saved).
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

        const form = await req.formData();
        const file = form.get("file");
        if (!(file instanceof Blob) || file.size === 0) {
            return NextResponse.json({ error: "Missing image file" }, { status: 400 });
        }
        if (!file.type.startsWith("image/")) {
            return NextResponse.json({ error: "File must be an image" }, { status: 400 });
        }
        // Client downscales before upload; this is a backstop against raw
        // multi-MB originals.
        if (file.size > 8 * 1024 * 1024) {
            return NextResponse.json({ error: "Image too large (max 8MB)" }, { status: 413 });
        }

        const url = await uploadImageToCloudinary(file, { folder: "site-photos" });
        return NextResponse.json({ url });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg === "UNAUTHORIZED") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        console.error("[POST /api/admin/site-photo]", err);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
