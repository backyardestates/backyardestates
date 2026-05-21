import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { requireDbRole } from "@/lib/auth";
import { listInclusions, getSidebarConfig } from "@/lib/db/inclusions";
import { InclusionsAdmin } from "./InclusionsAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function InclusionsAdminPage() {
    try {
        await requireDbRole([Role.ADMIN]);
    } catch {
        redirect("/sign-in");
    }

    const [categories, sidebar] = await Promise.all([listInclusions(), getSidebarConfig()]);

    return (
        <main style={{ padding: "32px 40px", maxWidth: 1180, margin: "0 auto" }}>
            <header style={{ marginBottom: 28 }}>
                <h1 style={{ fontSize: 28, fontWeight: 300, color: "#14302F", margin: 0 }}>
                    What's Included (Slide 4)
                </h1>
                <p style={{ fontSize: 14, color: "#5A5550", marginTop: 8, maxWidth: 760 }}>
                    Two pieces of content live here: the <strong>inclusion categories</strong> (the
                    6-card spec sheet) and the <strong>sidebar</strong> (city department pills + fee
                    bullets). Edits flow to Slide 4 the next time the presenter loads — no deploy.
                </p>
            </header>

            <InclusionsAdmin initialCategories={categories} initialSidebar={sidebar} />
        </main>
    );
}
