"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import s from "../engagements.module.css";

export function ResyncButton({ engagementId }: { engagementId: string }) {
    const router = useRouter();
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function resync() {
        setBusy(true);
        setError(null);
        try {
            const res = await fetch(`/api/engagements/${engagementId}/resync`, {
                method: "POST",
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Re-sync failed");
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setBusy(false);
        }
    }

    return (
        <div style={{ marginTop: 12 }}>
            <button className={s.btnGhost} onClick={resync} disabled={busy}>
                {busy ? "Re-syncing…" : "Re-sync from Pipedrive"}
            </button>
            {error && <p className={s.error}>{error}</p>}
        </div>
    );
}
