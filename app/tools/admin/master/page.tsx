import AdminMasterClient from "./components/AdminMasterClient";
import { client } from "@/sanity/client";
import { FLOORPLANS_QUERY } from "@/sanity/queries";

export default async function AdminMasterPage() {
    const floorplans = await client.fetch(FLOORPLANS_QUERY);

    return <AdminMasterClient initialFloorplans={floorplans ?? []} />;
}
