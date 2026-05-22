"use client";

import React, { useState } from "react";

// Slide titles keyed by the slide's CANONICAL number (matches PresentClient
// SLIDE_NAMES). Update this if the deck structure changes.
const SLIDE_TITLES: Record<number, string> = {
    1:  "Cover",
    2:  "Your Property",
    3:  "What's Included",
    4:  "Your Options",
    5:  "Completed Builds",
    6:  "Customer Stories",
    7:  "How It Works",
    8:  "ROI Comparison",
    9:  "ADU vs House",
    10: "Rental Analysis",
    11: "Payment Schedule",
    12: "Tax Topics",
    13: "Our Team",
    14: "What's Next",
    15: "Why Backyard Estates",
};

type SaveState =
    | { kind: "idle" }
    | { kind: "saving" }
    | { kind: "saved"; at: number }
    | { kind: "error"; message: string };

interface Props {
    initialOrder: number[];
    slideCount: number;
    naturalOrder: number[];
}

export function DefaultSlideOrderForm({ initialOrder, slideCount, naturalOrder }: Props) {
    const [order, setOrder] = useState<number[]>(initialOrder.length === 0 ? naturalOrder : initialOrder);
    const [dragIndex, setDragIndex] = useState<number | null>(null);
    const [save, setSave] = useState<SaveState>({ kind: "idle" });

    function move(from: number, to: number) {
        if (from === to) return;
        setOrder((prev) => {
            const next = [...prev];
            const [item] = next.splice(from, 1);
            next.splice(to, 0, item);
            return next;
        });
        setSave({ kind: "idle" });
    }

    function moveUp(i: number) { if (i > 0) move(i, i - 1); }
    function moveDown(i: number) { if (i < order.length - 1) move(i, i + 1); }

    function resetToNatural() {
        setOrder(naturalOrder);
        setSave({ kind: "idle" });
    }

    async function handleSave() {
        setSave({ kind: "saving" });
        try {
            const res = await fetch("/api/admin/settings/slide-order", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ order }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`);
            setOrder(data.order);
            setSave({ kind: "saved", at: Date.now() });
        } catch (err) {
            setSave({ kind: "error", message: err instanceof Error ? err.message : String(err) });
        }
    }

    const isComplete = order.length === slideCount;

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Status / toolbar */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span
                    style={{
                        fontSize: 13,
                        color: save.kind === "error" ? "#b8503e" : save.kind === "saved" ? "#1f7a4f" : "#8A8278",
                    }}
                >
                    {save.kind === "saving" && "Saving…"}
                    {save.kind === "saved" && `Saved at ${new Date(save.at).toLocaleTimeString()}`}
                    {save.kind === "error" && `Error: ${save.message}`}
                    {save.kind === "idle" && `${order.length} of ${slideCount} slides in order`}
                </span>
                {!isComplete && (
                    <span style={{ fontSize: 12, color: "#b8503e", fontStyle: "italic" }}>
                        Missing {slideCount - order.length} slide{slideCount - order.length === 1 ? "" : "s"}
                    </span>
                )}
            </div>

            {/* Reorderable list */}
            <ol
                style={{
                    listStyle: "none",
                    margin: 0,
                    padding: 0,
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                }}
            >
                {order.map((slideNum, i) => {
                    const title = SLIDE_TITLES[slideNum] ?? `Slide ${slideNum}`;
                    return (
                        <li
                            key={slideNum}
                            draggable
                            onDragStart={() => setDragIndex(i)}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={() => {
                                if (dragIndex !== null) move(dragIndex, i);
                                setDragIndex(null);
                            }}
                            onDragEnd={() => setDragIndex(null)}
                            style={{
                                display: "grid",
                                gridTemplateColumns: "auto 1fr auto auto auto",
                                alignItems: "center",
                                gap: 12,
                                padding: "12px 14px",
                                background: dragIndex === i ? "#fff8eb" : "#fff",
                                border: "1px solid #e5e1d8",
                                borderRadius: 8,
                                cursor: "grab",
                                userSelect: "none",
                            }}
                        >
                            <span
                                style={{
                                    width: 36,
                                    textAlign: "center",
                                    fontVariantNumeric: "tabular-nums",
                                    color: "#B8954A",
                                    fontWeight: 700,
                                    fontSize: 14,
                                }}
                            >
                                {i + 1}
                            </span>
                            <span style={{ fontSize: 14, color: "#14302F", fontWeight: 500 }}>
                                {title}
                                <span style={{ fontSize: 11, color: "#8A8278", marginLeft: 10, letterSpacing: "0.06em" }}>
                                    slide #{slideNum}
                                </span>
                            </span>
                            <button onClick={() => moveUp(i)} disabled={i === 0} style={btnSm}>↑</button>
                            <button onClick={() => moveDown(i)} disabled={i === order.length - 1} style={btnSm}>↓</button>
                            <span style={{ color: "#8A8278", fontSize: 18, paddingLeft: 6 }}>⋮⋮</span>
                        </li>
                    );
                })}
            </ol>

            {/* Actions */}
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginTop: 8 }}>
                <button onClick={resetToNatural} style={btnSecondary}>
                    Reset to natural order (1 → {slideCount})
                </button>
                <button
                    onClick={handleSave}
                    disabled={save.kind === "saving" || !isComplete}
                    style={{ ...btnPrimary, opacity: save.kind === "saving" || !isComplete ? 0.6 : 1 }}
                >
                    Save default order
                </button>
            </div>
        </div>
    );
}

const btnSm: React.CSSProperties = {
    padding: "4px 8px",
    background: "#fff",
    color: "#14302F",
    border: "1px solid #d4c4a0",
    borderRadius: 4,
    fontSize: 13,
    cursor: "pointer",
};

const btnPrimary: React.CSSProperties = {
    padding: "10px 22px",
    background: "#14302F",
    color: "#F7F5F0",
    border: 0,
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: "0.04em",
    cursor: "pointer",
};

const btnSecondary: React.CSSProperties = {
    padding: "10px 18px",
    background: "#fff",
    color: "#5A5550",
    border: "1px solid #d4c4a0",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
};
