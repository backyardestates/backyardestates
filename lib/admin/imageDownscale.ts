// Client-side image downscaling for admin photo uploads.
//
// Site photos and custom unit images are stored in the proposal snapshot as
// self-contained base64 data URLs (so the BroadcastChannel wire can ship them
// to the presenter tab and so a saved snapshot is portable). A raw phone photo
// is several MB, which inflates the snapshot past Vercel's 4.5 MB serverless
// body limit and makes the save POST fail with 413 FUNCTION_PAYLOAD_TOO_LARGE.
//
// Downscaling to a presentation-sized JPEG (max 1600px, ~0.82 quality) brings a
// typical photo down to a few hundred KB while staying crisp on a projector.

const DEFAULT_MAX_DIM = 1600;
const DEFAULT_QUALITY = 0.82;

function readAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
            const result = ev.target?.result;
            if (typeof result === "string") resolve(result);
            else reject(new Error("Unexpected FileReader result"));
        };
        reader.onerror = () => reject(reader.error ?? new Error("FileReader failed"));
        reader.readAsDataURL(file);
    });
}

function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("Image decode failed"));
        img.src = src;
    });
}

/**
 * Read an image File and return a downscaled, JPEG-compressed base64 data URL.
 *
 * - Only raster formats are re-encoded; GIF/SVG (animation/vector) are returned
 *   untouched to avoid flattening them.
 * - Transparent PNGs are composited onto white so they don't go black as JPEG.
 * - Any failure (decode error, no canvas) falls back to the original data URL,
 *   so an upload never silently drops.
 */
export async function fileToDownscaledDataUrl(
    file: File,
    opts: { maxDim?: number; quality?: number } = {}
): Promise<string> {
    const maxDim = opts.maxDim ?? DEFAULT_MAX_DIM;
    const quality = opts.quality ?? DEFAULT_QUALITY;

    const original = await readAsDataUrl(file);

    // Re-encoding only makes sense for raster formats a canvas can rasterize
    // losslessly enough; leave animated/vector sources alone.
    if (!/^image\/(jpeg|jpg|png|webp|bmp)\b/i.test(file.type)) return original;

    try {
        const img = await loadImage(original);
        const { width, height } = img;
        if (!width || !height) return original;

        const scale = Math.min(1, maxDim / Math.max(width, height));
        const targetW = Math.max(1, Math.round(width * scale));
        const targetH = Math.max(1, Math.round(height * scale));

        const canvas = document.createElement("canvas");
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext("2d");
        if (!ctx) return original;

        // White backdrop so transparent PNGs don't render black under JPEG.
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, targetW, targetH);
        ctx.drawImage(img, 0, 0, targetW, targetH);

        const out = canvas.toDataURL("image/jpeg", quality);
        // Guard against the rare case where re-encoding grew the payload
        // (e.g. an already-tiny, highly-compressed source).
        return out.length < original.length ? out : original;
    } catch {
        return original;
    }
}
