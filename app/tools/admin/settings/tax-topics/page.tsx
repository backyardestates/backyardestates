import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { requireDbRole } from "@/lib/auth";
import { listTaxTopics } from "@/lib/db/taxTopics";
import { TaxTopicsAdmin } from "./TaxTopicsAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function TaxTopicsAdminPage() {
    try {
        await requireDbRole([Role.ADMIN]);
    } catch {
        redirect("/sign-in");
    }

    const topics = await listTaxTopics();

    return (
        <main style={{ padding: "32px 40px", maxWidth: 1080, margin: "0 auto" }}>
            <header style={{ marginBottom: 28 }}>
                <h1 style={{ fontSize: 28, fontWeight: 300, color: "#14302F", margin: 0 }}>
                    Tax Topics (Slide 12)
                </h1>
                <p style={{ fontSize: 14, color: "#5A5550", marginTop: 8, maxWidth: 720 }}>
                    The 11 write-off items shown to customers as &ldquo;things to verify with your CPA.&rdquo;
                    Only items marked <em>active</em> appear on the slide. Order is controlled by
                    the sort field.
                </p>
            </header>

            <TaxTopicsAdmin initialTopics={topics} />
        </main>
    );
}
