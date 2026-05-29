"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import s from "./detail.module.css";

export function DripCancelButton({ engagementId }: { engagementId: string }) {
    const router = useRouter();
    const [busy, setBusy] = useState(false);

    async function cancel() {
        if (!window.confirm("Stop the drip for this prospect? Pending messages won't send.")) return;
        setBusy(true);
        try {
            await fetch(`/api/engagements/${engagementId}/drip/cancel`, { method: "POST" });
            router.refresh();
        } finally {
            setBusy(false);
        }
    }

    return (
        <button className={s.btnGhost} onClick={cancel} disabled={busy}>
            {busy ? "Stopping…" : "Stop drip"}
        </button>
    );
}
