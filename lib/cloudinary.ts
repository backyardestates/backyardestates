export function cldOptimize(url: string, width: number): string {
    if (!url || !url.includes("res.cloudinary.com") || !url.includes("/upload/")) {
        return url;
    }
    const transform = `c_fill,w_${Math.round(width)},q_auto:best,f_auto,dpr_auto`;
    return url.replace("/upload/", `/upload/${transform}/`);
}

// Hosts that block hotlinking and require server-side proxying.
const PROXY_HOSTS = [
    "zillowstatic.com",
    "photos.zillowstatic.com",
    "zillow.com",
    "redfin.com",
    "ssl.cdn-redfin.com",
    "rdcpix.com", // realtor.com
];

/** Route an external image through our /api/image-proxy when the host is known to block hotlinking. */
export function proxiedImage(url: string | undefined | null): string {
    if (!url) return "";
    try {
        const host = new URL(url).hostname.toLowerCase();
        if (PROXY_HOSTS.some((h) => host === h || host.endsWith(`.${h}`))) {
            return `/api/image-proxy?url=${encodeURIComponent(url)}`;
        }
    } catch {
        return url;
    }
    return url;
}
