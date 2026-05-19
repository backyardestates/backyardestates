import AdminMasterClient from "./components/AdminMasterClient";
import { client } from "@/sanity/client";
import { FLOORPLANS_QUERY, PRESENTER_COMPLETED_PROPERTIES_QUERY, PRESENTER_STORIES_QUERY } from "@/sanity/queries";

export default async function AdminMasterPage() {
    const [floorplans, completedProperties, stories] = await Promise.all([
        client.fetch(FLOORPLANS_QUERY),
        client.fetch(PRESENTER_COMPLETED_PROPERTIES_QUERY),
        client.fetch(PRESENTER_STORIES_QUERY),
    ]);

    return (
        <AdminMasterClient
            initialFloorplans={floorplans ?? []}
            initialCompletedProperties={completedProperties ?? []}
            initialStories={stories ?? []}
        />
    );
}
