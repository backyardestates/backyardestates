import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { requireDbRole } from "@/lib/auth";
import { listAllDiscounts } from "@/lib/db/discounts";
import { DiscountsAdmin } from "./DiscountsAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function DiscountsAdminPage() {
    try {
        await requireDbRole([Role.ADMIN]);
    } catch {
        redirect("/sign-in");
    }

    const discounts = await listAllDiscounts();

    return (
        <main style={{ padding: "32px 40px", maxWidth: 980, margin: "0 auto" }}>
            <header style={{ marginBottom: 28 }}>
                <h1 style={{ fontSize: 28, fontWeight: 300, color: "#14302F", margin: 0 }}>
                    Discounts catalog
                </h1>
                <p style={{ fontSize: 14, color: "#5A5550", marginTop: 8, maxWidth: 720 }}>
                    Preset discounts that show up in Step 4 of the proposal tool. One-off
                    discounts created on a specific proposal stay on that proposal —
                    they don't write back here automatically. New proposals only see
                    discounts marked <em>active</em>.
                </p>
            </header>

            <DiscountsAdmin initialDiscounts={discounts} />
        </main>
    );
}
