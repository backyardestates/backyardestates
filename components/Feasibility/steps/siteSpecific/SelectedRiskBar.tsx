"use client";

import { POTENTIAL_SITE_SPECIFIC } from "@/lib/IncludedScope";
import { useAnswersStore } from "@/lib/feasibility/stores/answers.store";

export default function SelectedRiskBar() {
    const selected = useAnswersStore((s) => (s.answers.riskFlags as string[] | undefined) ?? []);
    const setAnswer = useAnswersStore((s) => s.setAnswer);

    const items = POTENTIAL_SITE_SPECIFIC.filter((x) => selected.includes(x.id));

    if (!items.length) return null;

    const remove = (id: string) => {
        setAnswer("riskFlags", selected.filter((x) => x !== id));
    };

    return (
        <div
            style={{
                border: "1px solid var(--color-brand-beige-A040)",
                background: "var(--color-brand-beige-subtle)",
                borderRadius: "var(--radius)",
                padding: "1rem",
            }}
        >
            <div style={{ fontWeight: 900, color: "var(--color-brand-dark-blue)", marginBottom: ".5rem" }}>
                Selected potential site-specific work
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: ".5rem" }}>
                {items.map((item) => (
                    <button
                        key={item.id}
                        type="button"
                        onClick={() => remove(item.id)}
                        style={{
                            padding: ".35rem .6rem",
                            borderRadius: 999,
                            border: "1px solid var(--color-brand-beige-A040)",
                            background: "#fff",
                            color: "var(--color-brand-dark-blue)",
                            fontWeight: 800,
                            cursor: "pointer",
                        }}
                        aria-label={`Remove ${item.title}`}
                        title="Click to remove"
                    >
                        {item.title} ✕
                    </button>
                ))}
            </div>
        </div>
    );
}
