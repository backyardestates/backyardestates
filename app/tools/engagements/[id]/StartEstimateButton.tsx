"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import s from "./detail.module.css";

// Advances the engagement to ESTIMATING (forward-only) via the start-estimate
// route, which also creates/reuses a DRAFT proposal, then opens the proposal
// builder by id with the consultation→FPA prefill popup armed.
export function StartEstimateButton({
    engagementId,
    addressKey,
}: {
    engagementId: string;
    addressKey: string | null;
}) {
    const router = useRouter();
    const [busy, setBusy] = useState(false);

    async function go() {
        setBusy(true);
        // Server-side: advance the stage, create/reuse a DRAFT proposal linked to
        // this engagement, and hand back its id so the proposal tool can load by
        // id and arm the consultation→FPA prefill popup.
        let proposalId: string | null = null;
        let resolvedAddress: string | null = addressKey;
        try {
            const res = await fetch(`/api/engagements/${engagementId}/start-estimate`, {
                method: "POST",
            });
            if (res.ok) {
                const data = await res.json();
                proposalId = data.proposalId ?? null;
                resolvedAddress = data.addressKey ?? addressKey;
            }
        } catch {
            /* fall through to a best-effort open below */
        } finally {
            let url: string;
            if (proposalId) {
                const qs = new URLSearchParams({ proposalId, prefill: "1" });
                if (resolvedAddress) qs.set("address", resolvedAddress);
                url = `/tools/admin/master?${qs.toString()}`;
            } else if (resolvedAddress) {
                url = `/tools/admin/master?address=${encodeURIComponent(resolvedAddress)}`;
            } else {
                url = "/tools/admin/master";
            }
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
