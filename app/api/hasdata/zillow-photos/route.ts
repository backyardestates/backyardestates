import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/requireRole";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// HasData Zillow endpoints. Auth: x-api-key header.
// Docs: https://docs.hasdata.com/apis/zillow
const HASDATA_LISTING_ENDPOINT = "https://api.hasdata.com/scrape/zillow/listing";
const HASDATA_PROPERTY_ENDPOINT = "https://api.hasdata.com/scrape/zillow/property";

function constructZillowUrl(address: string): string {
    // Zillow's address-deep-link pattern: spaces → hyphens, commas preserved.
    // Zillow redirects this to the canonical /homedetails/ page.
    const slug = address.trim().replace(/\s+/g, "-");
    return `https://www.zillow.com/homes/${encodeURI(slug)}_rb/`;
}

type ListingHit = {
    images: string[];
    listingUrl?: string;
    address?: string;
    price?: number;
    raw?: unknown;
};

// Defensive extractor — HasData mirrors Zillow's internal model, but the exact
// field names can drift. Look in a few likely places and fall through gracefully.
function extractListings(payload: any): any[] {
    if (!payload || typeof payload !== "object") return [];
    return (
        payload.properties ??
        payload.results ??
        payload.listings ??
        payload.data ??
        payload.searchResults?.mapResults ??
        []
    );
}

function extractImages(item: any): string[] {
    if (!item) return [];
    const imgs: string[] = [];

    // Singular fields
    for (const key of ["imgSrc", "image", "imageUrl", "thumbnail", "photo"]) {
        const v = item[key];
        if (typeof v === "string" && v.startsWith("http")) imgs.push(v);
    }

    // Array fields (Zillow Property uses `originalPhotos`, `responsivePhotos`, `carouselPhotos`)
    for (const key of [
        "images",
        "photos",
        "hugePhotos",
        "carouselPhotos",
        "originalPhotos",
        "responsivePhotos",
    ]) {
        const arr = item[key];
        if (Array.isArray(arr)) {
            for (const entry of arr) {
                if (typeof entry === "string" && entry.startsWith("http")) imgs.push(entry);
                else if (entry && typeof entry === "object") {
                    const url =
                        entry.url ??
                        entry.imgSrc ??
                        entry.image ??
                        entry.src ??
                        entry.large ??
                        // Zillow's `mixedSources` shape — pick the largest JPEG
                        entry.mixedSources?.jpeg?.slice(-1)?.[0]?.url ??
                        entry.mixedSources?.jpeg?.[0]?.url ??
                        entry.mixedSources?.webp?.slice(-1)?.[0]?.url;
                    if (typeof url === "string" && url.startsWith("http")) imgs.push(url);
                }
            }
        }
    }

    // Dedupe while preserving order
    return Array.from(new Set(imgs));
}

function extractPropertyImages(payload: any): string[] {
    if (!payload || typeof payload !== "object") return [];
    // Property payloads usually wrap the data under `property` or are flat.
    const candidates = [payload, payload.property, payload.data, payload.result].filter(Boolean);
    const all: string[] = [];
    for (const c of candidates) {
        all.push(...extractImages(c));
    }
    return Array.from(new Set(all));
}

function extractListingUrl(item: any): string | undefined {
    if (!item) return undefined;
    const u = item.detailUrl ?? item.url ?? item.listingUrl ?? item.hdpUrl;
    if (typeof u !== "string") return undefined;
    if (u.startsWith("http")) return u;
    if (u.startsWith("/")) return `https://www.zillow.com${u}`;
    return undefined;
}

async function searchOnce(args: {
    apiKey: string;
    address: string;
    type: string;
}): Promise<{
    ok: boolean;
    status: number;
    upstreamUrl: string;
    error?: string;
    rawData?: any;
    items: any[];
}> {
    const { apiKey, address, type } = args;
    const url = new URL(HASDATA_LISTING_ENDPOINT);
    url.searchParams.set("keyword", address);
    url.searchParams.set("type", type);

    const upstream = await fetch(url.toString(), {
        method: "GET",
        headers: {
            Accept: "application/json",
            "x-api-key": apiKey,
        },
        signal: AbortSignal.timeout(20_000),
    });

    if (!upstream.ok) {
        const text = await upstream.text().catch(() => "");
        return {
            ok: false,
            status: upstream.status,
            upstreamUrl: url.toString(),
            error: text.slice(0, 500),
            items: [],
        };
    }

    const data = await upstream.json();
    const items = extractListings(data);
    return {
        ok: true,
        status: 200,
        upstreamUrl: url.toString(),
        rawData: data,
        items,
    };
}

async function fetchProperty(args: {
    apiKey: string;
    propertyUrl: string;
}): Promise<{
    ok: boolean;
    status: number;
    upstreamUrl: string;
    error?: string;
    rawData?: any;
    images: string[];
}> {
    const { apiKey, propertyUrl } = args;
    const url = new URL(HASDATA_PROPERTY_ENDPOINT);
    url.searchParams.set("url", propertyUrl);

    const upstream = await fetch(url.toString(), {
        method: "GET",
        headers: {
            Accept: "application/json",
            "x-api-key": apiKey,
        },
        signal: AbortSignal.timeout(25_000),
    });

    if (!upstream.ok) {
        const text = await upstream.text().catch(() => "");
        return {
            ok: false,
            status: upstream.status,
            upstreamUrl: url.toString(),
            error: text.slice(0, 500),
            images: [],
        };
    }

    const data = await upstream.json();
    const images = extractPropertyImages(data);
    return {
        ok: true,
        status: 200,
        upstreamUrl: url.toString(),
        rawData: data,
        images,
    };
}

export async function GET(req: Request) {
    // HasData bills per call — keep this admin/architect only.
    const guard = await requireRole(["ADMIN", "ARCHITECT"]);
    if (guard) return guard;

    const { searchParams } = new URL(req.url);
    const address = searchParams.get("address");
    const directUrl = searchParams.get("url");
    const debug = searchParams.get("debug") === "1";
    const skipSearch = searchParams.get("skipSearch") === "1";

    // Search-API fallback chain. Used only if Property API yields no images.
    const typeChain = (searchParams.get("types") ?? "forRent,forSale,recentlySold")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

    if (!address && !directUrl) {
        return NextResponse.json({ error: "Missing address or url" }, { status: 400 });
    }

    const apiKey = process.env.HASDATA_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: "Missing HASDATA_API_KEY" }, { status: 500 });
    }

    type Attempt =
        | { kind: "property"; url: string; upstreamUrl: string; imageCount: number; status: number; error?: string }
        | { kind: "search"; type: string; upstreamUrl: string; upstreamCount: number; status: number; error?: string };
    const attempts: Attempt[] = [];

    try {
        let winningSource: "property" | "search" | null = null;
        let winningType: string | null = null;
        let winningImages: string[] = [];
        let winningItems: any[] = [];
        let lastData: any = null;

        // ── 1) Property API: use user-provided URL, or construct from address ──
        const propertyUrlsToTry = [
            directUrl ?? "",
            address ? constructZillowUrl(address) : "",
        ].filter(Boolean);

        for (const pUrl of propertyUrlsToTry) {
            const result = await fetchProperty({ apiKey, propertyUrl: pUrl });
            attempts.push({
                kind: "property",
                url: pUrl,
                upstreamUrl: result.upstreamUrl,
                imageCount: result.images.length,
                status: result.status,
                error: result.error,
            });
            lastData = result.rawData ?? lastData;
            if (result.ok && result.images.length > 0) {
                winningSource = "property";
                winningImages = result.images;
                break;
            }
        }

        // ── 2) Listing search fallback (only if address is known and Property missed) ──
        if (winningImages.length === 0 && address && !skipSearch) {
            for (const type of typeChain) {
                const result = await searchOnce({ apiKey, address, type });
                attempts.push({
                    kind: "search",
                    type,
                    upstreamUrl: result.upstreamUrl,
                    upstreamCount: result.items.length,
                    status: result.status,
                    error: result.error,
                });
                lastData = result.rawData ?? lastData;
                if (!result.ok) continue;
                if (result.items.length > 0) {
                    winningSource = "search";
                    winningType = type;
                    winningItems = result.items;
                    winningImages = Array.from(
                        new Set(result.items.flatMap((item: any) => extractImages(item)))
                    );
                    if (winningImages.length > 0) break;
                }
            }
        }

        const hits: ListingHit[] = winningItems.slice(0, 5).map((item: any) => ({
            images: extractImages(item),
            listingUrl: extractListingUrl(item),
            address: item.address ?? item.formattedAddress ?? undefined,
            price:
                typeof item.price === "number"
                    ? item.price
                    : typeof item.unformattedPrice === "number"
                    ? item.unformattedPrice
                    : undefined,
        }));

        const allImages = winningImages.slice(0, 12);

        const debugBlock =
            debug || allImages.length === 0
                ? {
                      attempts,
                      topLevelKeys: lastData ? Object.keys(lastData) : [],
                      firstItemKeys: winningItems[0] ? Object.keys(winningItems[0]) : [],
                      firstItemSample: winningItems[0] ?? null,
                      rawPayloadSample: debug ? lastData : undefined,
                  }
                : undefined;

        return NextResponse.json({
            address,
            source: winningSource,
            matchedType: winningType,
            hits,
            images: allImages,
            meta: { attempts },
            debug: debugBlock,
        });
    } catch (err) {
        return NextResponse.json(
            { error: "HasData request error", details: err instanceof Error ? err.message : String(err), attempts },
            { status: 502 }
        );
    }
}
