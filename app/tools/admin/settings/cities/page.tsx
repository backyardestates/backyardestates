import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { requireDbRole } from "@/lib/auth";
import { listCities } from "@/lib/db/cities";
import { CitiesAdmin } from "./CitiesAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function CitiesAdminPage() {
    try {
        await requireDbRole([Role.ADMIN]);
    } catch {
        redirect("/sign-in");
    }

    const cities = await listCities();

    return (
        <main style={{ padding: "32px 40px", maxWidth: 1100, margin: "0 auto" }}>
            <header style={{ marginBottom: 28 }}>
                <h1 style={{ fontSize: 28, fontWeight: 300, color: "#14302F", margin: 0 }}>
                    Cities & timelines
                </h1>
                <p style={{ fontSize: 14, color: "#5A5550", marginTop: 8, maxWidth: 720 }}>
                    Each row holds the Backyard Estates timeline (always known, days)
                    and the local city's average (numeric when known, or a free-text
                    label when it isn't). Slide 7 picks the row whose name appears in
                    the proposal's address; new proposals freeze that row's values onto
                    their snapshot at save time.
                </p>
            </header>

            <CitiesAdmin initialCities={cities} />
        </main>
    );
}
