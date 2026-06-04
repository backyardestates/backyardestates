import crypto from "crypto";

// Server-side signed Cloudinary uploads (REST, no SDK dependency) — the same
// pattern as lib/agreement/uploadAgreementPdf.ts, generalized for images.
//
// Why: proposal snapshots used to embed photos as base64 data URLs, which
// bloated every 1.5s autosave POST (and could blow past the serverless body
// limit → 413 → silent data loss). Uploading once to Cloudinary and storing
// the URL keeps snapshots small and the image durable across devices.

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

export function cloudinaryUploadConfigured(): boolean {
    return !!(CLOUD_NAME && API_KEY && API_SECRET);
}

/**
 * Upload an image to Cloudinary and return its secure URL.
 *
 * `file` may be:
 *  - a Blob (raw bytes from a FormData upload)
 *  - a string: an https:// remote URL (Cloudinary fetches it server-side —
 *    used to persist expiring Zillow CDN photos) or a data: URL.
 */
export async function uploadImageToCloudinary(
    file: Blob | string,
    opts: { folder: string; publicId?: string },
): Promise<string> {
    if (!cloudinaryUploadConfigured()) {
        throw new Error(
            "Cloudinary is not configured (need NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET).",
        );
    }

    const timestamp = Math.floor(Date.now() / 1000);

    // Params included in the signature — alphabetical order, excluding
    // file/api_key/resource_type/cloud_name per Cloudinary's signing rules.
    const signedParams: Record<string, string> = { folder: opts.folder, timestamp: String(timestamp) };
    if (opts.publicId) {
        signedParams.overwrite = "true";
        signedParams.public_id = opts.publicId;
    }
    const toSign = Object.keys(signedParams)
        .sort()
        .map((k) => `${k}=${signedParams[k]}`)
        .join("&");
    const signature = crypto.createHash("sha1").update(`${toSign}${API_SECRET}`).digest("hex");

    const form = new FormData();
    form.append("file", file);
    form.append("api_key", API_KEY as string);
    for (const [k, v] of Object.entries(signedParams)) form.append(k, v);
    form.append("signature", signature);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: "POST",
        body: form,
    });
    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Cloudinary image upload failed (${res.status}): ${text.slice(0, 300)}`);
    }
    const data = (await res.json()) as { secure_url?: string; url?: string };
    const url = data.secure_url ?? data.url;
    if (!url) throw new Error("Cloudinary upload returned no URL");
    return url;
}
