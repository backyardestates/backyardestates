import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { requireDbRole } from "@/lib/auth";
import { getFinancialDefaults } from "@/lib/db/financialDefaults";
import { FinancialDefaultsForm } from "./FinancialDefaultsForm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function FinancialDefaultsPage() {
    try {
        await requireDbRole([Role.ADMIN]);
    } catch {
        redirect("/sign-in");
    }

    const defaults = await getFinancialDefaults();

    return (
        <main style={{ padding: "32px 40px", maxWidth: 980, margin: "0 auto" }}>
            <header style={{ marginBottom: 28 }}>
                <h1 style={{ fontSize: 28, fontWeight: 300, color: "#14302F", margin: 0 }}>
                    Financial defaults
                </h1>
                <p style={{ fontSize: 14, color: "#5A5550", marginTop: 8, maxWidth: 640 }}>
                    These values seed every <em>new</em> proposal at creation time.
                    Existing proposals keep their own frozen copy, so changes here
                    won&apos;t disturb anything already saved.
                </p>
            </header>

            <FinancialDefaultsForm initial={defaults} />
        </main>
    );
}
