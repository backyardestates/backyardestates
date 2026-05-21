import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { requireDbRole } from "@/lib/auth";
import { getDefaultSlideOrder, naturalOrder } from "@/lib/db/slideOrder";
import { SLIDE_COUNT } from "@/lib/store/presentationStore";
import { DefaultSlideOrderForm } from "./DefaultSlideOrderForm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function SlideOrderAdminPage() {
    try {
        await requireDbRole([Role.ADMIN]);
    } catch {
        redirect("/sign-in");
    }

    const order = await getDefaultSlideOrder();

    return (
        <main style={{ padding: "32px 40px", maxWidth: 760, margin: "0 auto" }}>
            <header style={{ marginBottom: 28 }}>
                <h1 style={{ fontSize: 28, fontWeight: 300, color: "#14302F", margin: 0 }}>
                    Default slide order
                </h1>
                <p style={{ fontSize: 14, color: "#5A5550", marginTop: 8, maxWidth: 640 }}>
                    Every new proposal inherits this order. Reps can still override it
                    per-proposal in Step 10 of the proposal tool. Existing proposals
                    keep whatever order they had when saved.
                </p>
            </header>

            <DefaultSlideOrderForm
                initialOrder={order}
                slideCount={SLIDE_COUNT}
                naturalOrder={naturalOrder()}
            />
        </main>
    );
}
