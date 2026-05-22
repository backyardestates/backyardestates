import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { requireDbRole } from "@/lib/auth";
import { listCategoriesWithItems } from "@/lib/db/siteWork";
import { SiteWorkAdmin } from "./SiteWorkAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function SiteWorkAdminPage() {
    try {
        await requireDbRole([Role.ADMIN]);
    } catch {
        redirect("/sign-in");
    }

    const categories = await listCategoriesWithItems();

    return (
        <main style={{ padding: "32px 40px", maxWidth: 1240, margin: "0 auto" }}>
            <header style={{ marginBottom: 28 }}>
                <h1 style={{ fontSize: 28, fontWeight: 300, color: "#14302F", margin: 0 }}>
                    Site work catalog
                </h1>
                <p style={{ fontSize: 14, color: "#5A5550", marginTop: 8, maxWidth: 760 }}>
                    Every site-work preset (with its internal BE cost and customer markup) lives
                    here, organized by category. Edits apply to <em>new</em> proposals from this
                    point forward; existing proposals carry their own frozen line items.
                </p>
            </header>

            <SiteWorkAdmin initialCategories={categories} />
        </main>
    );
}
