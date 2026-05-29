import crypto from "crypto";
import { writeClient } from "@/sanity/writeClient";

// Store a generated agreement PDF so it's retrievable from any device.
//
// Prefers Cloudinary (signed REST upload — no SDK dependency) into an
// `agreements/` folder, overwriting a stable public_id per proposal so the
// latest is always the canonical URL. Falls back to Sanity asset storage (the
// proven feasibility-PDF path) when Cloudinary creds aren't configured, so this
// works out of the box.

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;
const FOLDER = "agreements";

export interface UploadResult {
    url: string;
    provider: "cloudinary" | "sanity";
}

function cloudinaryConfigured(): boolean {
    return !!(CLOUD_NAME && API_KEY && API_SECRET);
}

async function uploadToCloudinary(bytes: Buffer, proposalId: string, filename: string): Promise<string> {
    const timestamp = Math.floor(Date.now() / 1000);
    const publicId = `proposal-${proposalId}`;
    // Signature = sha1 of sorted params (excluding file/api_key/resource_type/cloud_name) + secret.
    const toSign = `folder=${FOLDER}&overwrite=true&public_id=${publicId}&timestamp=${timestamp}`;
    const signature = crypto.createHash("sha1").update(`${toSign}${API_SECRET}`).digest("hex");

    const form = new FormData();
    form.append("file", new Blob([new Uint8Array(bytes)], { type: "application/pdf" }), filename);
    form.append("api_key", API_KEY as string);
    form.append("timestamp", String(timestamp));
    form.append("folder", FOLDER);
    form.append("public_id", publicId);
    form.append("overwrite", "true");
    form.append("signature", signature);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`, {
        method: "POST",
        body: form,
    });
    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Cloudinary upload failed (${res.status}): ${text.slice(0, 300)}`);
    }
    const data = (await res.json()) as { secure_url?: string; url?: string };
    const url = data.secure_url ?? data.url;
    if (!url) throw new Error("Cloudinary upload returned no URL");
    return url;
}

async function uploadToSanity(bytes: Buffer, filename: string): Promise<string> {
    const asset = await writeClient.assets.upload("file", bytes, {
        filename,
        contentType: "application/pdf",
    });
    return asset.url;
}

export async function uploadAgreementPdf(
    bytes: Buffer,
    opts: { proposalId: string; filename: string },
): Promise<UploadResult> {
    if (cloudinaryConfigured()) {
        const url = await uploadToCloudinary(bytes, opts.proposalId, opts.filename);
        return { url, provider: "cloudinary" };
    }
    const url = await uploadToSanity(bytes, opts.filename);
    return { url, provider: "sanity" };
}
