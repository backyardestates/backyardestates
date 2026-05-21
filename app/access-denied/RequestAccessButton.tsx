"use client";

import { useState, useTransition } from "react";
import s from "./access-denied.module.css";

interface Props {
    from: string | null;
    need: string | null;
}

type Phase = "idle" | "sent" | "error";

export function RequestAccessButton({ from, need }: Props) {
    const [phase, setPhase] = useState<Phase>("idle");
    const [pending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    function onClick() {
        startTransition(async () => {
            try {
                const res = await fetch("/api/access-request", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ from, need }),
                });
                if (!res.ok) {
                    const data = await res.json().catch(() => ({} as { error?: string }));
                    throw new Error(data.error ?? `Request failed (${res.status})`);
                }
                setPhase("sent");
                setError(null);
            } catch (err) {
                setPhase("error");
                setError(err instanceof Error ? err.message : "Send failed");
            }
        });
    }

    if (phase === "sent") {
        return (
            <div className={s.requestSent} role="status" aria-live="polite">
                ✓ Request sent. Someone will follow up soon.
            </div>
        );
    }

    return (
        <div>
            <button
                type="button"
                className={s.primaryAction}
                onClick={onClick}
                disabled={pending}
            >
                {pending ? "Sending…" : "Request Access"}
            </button>
            {phase === "error" && (
                <p className={s.requestError}>
                    Couldn&apos;t send your request: {error}. You can also email{" "}
                    <a href="mailto:edgar@backyardestates.com" className={s.helpLink}>edgar@backyardestates.com</a>.
                </p>
            )}
        </div>
    );
}
