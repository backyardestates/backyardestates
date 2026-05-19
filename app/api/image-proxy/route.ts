import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Re-serves an external image so the browser doesn't leak its Referer.
// Used for hotlink-protected hosts (e.g. Zillow's photos.zillowstatic.com)
// where direct `<img src>` requests get 403'd.
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const target = searchParams.get("url");

    if (!target) {
        return NextResponse.json({ error: "Missing url" }, { status: 400 });
    }

    let parsed: URL;
    try {
        parsed = new URL(target);
    } catch {
        return NextResponse.json({ error: "Invalid url" }, { status: 400 });
    }

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        return NextResponse.json({ error: "Unsupported protocol" }, { status: 400 });
    }

    // SSRF guard: refuse private/loopback hostnames.
    const host = parsed.hostname.toLowerCase();
    if (
        host === "localhost" ||
        host.endsWith(".localhost") ||
        host.startsWith("127.") ||
        host.startsWith("10.") ||
        host.startsWith("192.168.") ||
        /^169\.254\./.test(host) ||
        /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host) ||
        host === "0.0.0.0"
    ) {
        return NextResponse.json({ error: "Forbidden host" }, { status: 400 });
    }

    try {
        const upstream = await fetch(parsed.toString(), {
            // No Referer is forwarded; some CDNs (Zillow) require this.
            redirect: "follow",
            headers: {
                // Looks like a normal browser fetch — improves success rate.
                "User-Agent":
                    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
            },
            // Reasonable timeout via AbortController
            signal: AbortSignal.timeout(10_000),
        });

        if (!upstream.ok) {
            return NextResponse.json(
                { error: "Upstream fetch failed", status: upstream.status },
                { status: 502 }
            );
        }

        const contentType = upstream.headers.get("content-type") ?? "image/jpeg";
        if (!contentType.startsWith("image/")) {
            return NextResponse.json({ error: "Not an image" }, { status: 415 });
        }

        const body = await upstream.arrayBuffer();
        return new NextResponse(body, {
            status: 200,
            headers: {
                "Content-Type": contentType,
                "Cache-Control": "public, max-age=3600, s-maxage=86400, immutable",
            },
        });
    } catch (err) {
        return NextResponse.json(
            { error: "Proxy fetch error", details: err instanceof Error ? err.message : String(err) },
            { status: 502 }
        );
    }
}
