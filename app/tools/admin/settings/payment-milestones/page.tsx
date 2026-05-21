import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { requireDbRole } from "@/lib/auth";
import { listMilestones } from "@/lib/db/paymentMilestones";
import { PaymentMilestonesAdmin } from "./PaymentMilestonesAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function PaymentMilestonesAdminPage() {
    try {
        await requireDbRole([Role.ADMIN]);
    } catch {
        redirect("/sign-in");
    }

    const milestones = await listMilestones();

    return (
        <main style={{ padding: "32px 40px", maxWidth: 1100, margin: "0 auto" }}>
            <header style={{ marginBottom: 28 }}>
                <h1 style={{ fontSize: 28, fontWeight: 300, color: "#14302F", margin: 0 }}>
                    Payment milestones
                </h1>
                <p style={{ fontSize: 14, color: "#5A5550", marginTop: 8, maxWidth: 760 }}>
                    Each row is one contract milestone. <strong>Fixed-amount</strong> milestones
                    (typically signing + final inspection) are locked to a dollar value;
                    the rest receive a share of the remaining balance proportional to their <strong>weight</strong>.
                    Weights don&apos;t need to sum to anything — they&apos;re normalized at calc time.
                </p>
            </header>

            <PaymentMilestonesAdmin initialMilestones={milestones} />
        </main>
    );
}
