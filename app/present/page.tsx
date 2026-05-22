import { client } from "@/sanity/client";
import {
    PRESENTER_COMPLETED_PROPERTIES_QUERY,
    PRESENTER_ALL_FLOORPLANS_QUERY,
    PRESENTER_STORIES_QUERY,
} from "@/sanity/queries";
import type { SanityFloorplan, SanityStory, SanityProperty } from "@/lib/store/presentationStore";
import { PresentClient } from "./PresentClient";

export type { SanityFloorplan, SanityStory, SanityProperty };

export default async function PresentPage() {
    const [floorplans, stories, completedProperties] = await Promise.all([
        client.fetch<SanityFloorplan[]>(PRESENTER_ALL_FLOORPLANS_QUERY).catch(() => []),
        client.fetch<SanityStory[]>(PRESENTER_STORIES_QUERY).catch(() => []),
        client.fetch<SanityProperty[]>(PRESENTER_COMPLETED_PROPERTIES_QUERY).catch(() => []),
    ]);

    return (
        <PresentClient
            floorplans={floorplans}
            stories={stories}
            completedProperties={completedProperties}
        />
    );
}
