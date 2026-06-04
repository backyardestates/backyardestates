import { unstable_cache } from "next/cache";
import { client } from "@/sanity/client";
import {
    PRESENTER_ALL_FLOORPLANS_QUERY,
    PRESENTER_STORIES_QUERY,
    PRESENTER_COMPLETED_PROPERTIES_QUERY,
} from "@/sanity/queries";
import type { SanityFloorplan, SanityStory, SanityProperty } from "@/lib/store/presentationStore";

/**
 * Shared, request-cache-backed fetch of the presenter deck's Sanity catalog
 * (floorplans / stories / completed properties). Five presenter pages used to
 * fire these three uncached Sanity round-trips on EVERY render (the pages are
 * force-dynamic for the proposal payload) — a noticeable chunk of the "export
 * PDF takes forever" complaint. The catalog is marketing content that changes
 * rarely; 5 minutes of staleness is invisible, the latency win is not.
 */
export const getPresenterSanityCatalog = unstable_cache(
    async () => {
        const [floorplans, stories, completedProperties] = await Promise.all([
            client
                .fetch<SanityFloorplan[]>(PRESENTER_ALL_FLOORPLANS_QUERY)
                .catch(() => [] as SanityFloorplan[]),
            client.fetch<SanityStory[]>(PRESENTER_STORIES_QUERY).catch(() => [] as SanityStory[]),
            client
                .fetch<SanityProperty[]>(PRESENTER_COMPLETED_PROPERTIES_QUERY)
                .catch(() => [] as SanityProperty[]),
        ]);
        return { floorplans, stories, completedProperties };
    },
    ["presenter-sanity-catalog"],
    { revalidate: 300 },
);
