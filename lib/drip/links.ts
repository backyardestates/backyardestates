// Real, known-good links for drip emails. The AI never invents URLs — it only
// receives the resolved URLs built here, and sanitizeEmailLinks() strips
// anything that isn't on the allowlist, so a drip email can only ever contain
// links that map to a real page in the app router.

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.backyardestates.com").replace(
    /\/+$/,
    "",
);

type Slug = string | { current?: string | null } | null | undefined;

function slugString(slug: Slug): string | null {
    if (!slug) return null;
    const v = typeof slug === "string" ? slug : slug.current;
    const t = v?.trim();
    return t ? t : null;
}

export function floorplanUrl(slug: Slug): string | null {
    const s = slugString(slug);
    return s ? `${SITE_URL}/floorplans/${s}` : null;
}
export function storyUrl(slug: Slug): string | null {
    const s = slugString(slug);
    return s ? `${SITE_URL}/customer-stories/${s}` : null;
}
export function propertyUrl(slug: Slug): string | null {
    const s = slugString(slug);
    return s ? `${SITE_URL}/properties/${s}` : null;
}

// Evergreen pages verified to exist as routes. NOTE: there is no
// /customer-stories index page (only individual /customer-stories/[slug]), so
// it is intentionally NOT listed here — linking it would 404.
export const EVERGREEN_LINKS = {
    floorplansGallery: `${SITE_URL}/floorplans`,
    completedBuilds: `${SITE_URL}/properties`,
    bookConsultation: `${SITE_URL}/talk-to-an-adu-specialist/office-consultation`,
} as const;

interface RawStory {
    _id: string;
    names?: string;
    purpose?: string;
    quote?: string;
    slug?: Slug;
}
interface RawProperty {
    _id: string;
    name?: string;
    sqft?: number;
    bed?: number;
    bath?: number;
    slug?: Slug;
}
interface RawFloorplan {
    _id: string;
    name?: string;
    bed?: number;
    bath?: number;
    sqft?: number;
    slug?: Slug;
}

export interface LinkedStory {
    id: string;
    names?: string;
    purpose?: string;
    quote?: string;
    url: string | null;
}
export interface LinkedProperty {
    id: string;
    name?: string;
    sqft?: number;
    bed?: number;
    bath?: number;
    url: string | null;
}
export interface LinkedFloorplan {
    id: string;
    name?: string;
    bed?: number;
    bath?: number;
    sqft?: number;
    url: string | null;
}

export interface DripContent {
    stories: LinkedStory[];
    properties: LinkedProperty[];
    floorplans: LinkedFloorplan[];
    /** Every URL the AI is permitted to use (content + evergreen pages). */
    allowed: Set<string>;
}

/** Resolve Sanity content into linkable items + the URL allowlist. */
export function buildDripContent(input: {
    stories: RawStory[];
    properties: RawProperty[];
    floorplans: RawFloorplan[];
}): DripContent {
    const allowed = new Set<string>(Object.values(EVERGREEN_LINKS));

    const stories = input.stories.map((s): LinkedStory => {
        const url = storyUrl(s.slug);
        if (url) allowed.add(url);
        return { id: s._id, names: s.names, purpose: s.purpose, quote: s.quote, url };
    });
    const properties = input.properties.map((p): LinkedProperty => {
        const url = propertyUrl(p.slug);
        if (url) allowed.add(url);
        return { id: p._id, name: p.name, sqft: p.sqft, bed: p.bed, bath: p.bath, url };
    });
    const floorplans = input.floorplans.map((f): LinkedFloorplan => {
        const url = floorplanUrl(f.slug);
        if (url) allowed.add(url);
        return { id: f._id, name: f.name, bed: f.bed, bath: f.bath, sqft: f.sqft, url };
    });

    return { stories, properties, floorplans, allowed };
}

function normalizeForCompare(url: string): string {
    return url.replace(/[.,!?;:]+$/, "").replace(/\/+$/, "");
}

// Inline images may only come from our own CDNs, so an email can't carry a
// broken or third-party (tracking) image.
const ALLOWED_IMAGE_HOSTS = new Set(["res.cloudinary.com", "cdn.sanity.io"]);

export function isAllowedImageUrl(url: string): boolean {
    try {
        return ALLOWED_IMAGE_HOSTS.has(new URL(url).hostname);
    } catch {
        return false;
    }
}

/**
 * Strip every link/image that isn't trustworthy, in a single pass:
 * - markdown images ![alt](url) — kept only if the URL is on an allowed CDN host
 * - markdown links [anchor](url) — kept only if the URL is on the allowlist
 *   (else collapsed to its anchor text)
 * - bare URLs — kept only if on the allowlist (else removed)
 * This is the hard guarantee that an email can't ship a broken/invented link.
 */
export function sanitizeEmailLinks(text: string, allowed: Set<string>): string {
    const ok = new Set([...allowed].map(normalizeForCompare));

    const TOKEN =
        /!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)|\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s)\]]+)/g;

    const out = text.replace(
        TOKEN,
        (
            match: string,
            _imgAlt: string | undefined,
            imgUrl: string | undefined,
            linkAnchor: string | undefined,
            linkUrl: string | undefined,
            bareUrl: string | undefined,
        ) => {
            if (imgUrl !== undefined) {
                return isAllowedImageUrl(imgUrl) ? match : "";
            }
            if (linkUrl !== undefined) {
                return ok.has(normalizeForCompare(linkUrl)) ? match : (linkAnchor ?? "");
            }
            // bareUrl
            const raw = bareUrl ?? "";
            const trail = raw.match(/[.,!?;:]+$/)?.[0] ?? "";
            const core = trail ? raw.slice(0, -trail.length) : raw;
            return ok.has(normalizeForCompare(core)) ? raw : "";
        },
    );

    // Tidy whitespace/punctuation left behind by removed links.
    return out
        .replace(/[ \t]{2,}/g, " ")
        .replace(/ +([.,!?;:])/g, "$1")
        .replace(/\(\s*\)/g, "")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}
