"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import s from "../engagements.module.css";

// Advances the engagement to ESTIMATING (only from FPA_SUBMITTED, so it never
// moves a deal backwards) and opens the proposal builder for this address.
export function StartEstimateButton({
    engagementId,
    addressKey,
    currentStage,
}: {
    engagementId: string;
    addressKey: string | null;
    currentStage: string;
}) {
    const router = useRouter();
    const [busy, setBusy] = useState(false);

    async function go() {
        setBusy(true);
        try {
            if (currentStage === "FPA_SUBMITTED") {
                await fetch(`/api/engagements/${engagementId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ toStage: "ESTIMATING", message: "Started estimate" }),
                }).catch(() => {});
            }
        } finally {
            const url = addressKey
                ? `/tools/admin/master?address=${encodeURIComponent(addressKey)}`
                : "/tools/admin/master";
            window.open(url, "_blank", "noopener");
            setBusy(false);
            router.refresh();
        }
    }

    return (
        <button className={s.primaryAction} onClick={go} disabled={busy}>
            {busy ? "Opening…" : "Start estimate → proposal"}
        </button>
    );
}
