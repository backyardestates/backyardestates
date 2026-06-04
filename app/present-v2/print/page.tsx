import { getPresenterSanityCatalog } from "@/lib/presenter/sanityCatalog";
import { PrintClient } from "./PrintClient";

export const dynamic = "force-dynamic";

export default async function PresentPrintPage() {
    // Cached (5 min) — see lib/presenter/sanityCatalog.ts.
    const { floorplans, stories, completedProperties } = await getPresenterSanityCatalog();

    return (
        <PrintClient
            floorplans={floorplans}
            stories={stories}
            completedProperties={completedProperties}
        />
    );
}
