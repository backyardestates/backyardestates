"use client";

import React, { useMemo, useState } from "react";
import s from "./SlideOrderPanel.module.css";

const SLIDE_TITLES: Record<number, string> = {
    1: "Cover",
    2: "Your Property",
    3: "Your Options",
    4: "What's Included",
    5: "Completed Builds",
    6: "Customer Stories",
    7: "How It Works",
    8: "ROI Comparison",
    9: "ADU vs House",
    10: "Rental Analysis",
    11: "What's Next",
    12: "Tax Benefits",
    13: "Why Backyard Estates",
};

const SLIDE_COUNT = 13;

interface Props {
    /** Custom slide order. Empty array = use natural 1..N order. */
    value: number[];
    onChange: (next: number[]) => void;
}

function defaultOrder(): number[] {
    return Array.from({ length: SLIDE_COUNT }, (_, i) => i + 1);
}

function arraysEqual(a: number[], b: number[]): boolean {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
}

export function SlideOrderPanel({ value, onChange }: Props) {
    // Internal working order — fall back to the natural order when empty.
    const order = useMemo(() => {
        if (!Array.isArray(value) || value.length === 0) return defaultOrder();
        return value;
    }, [value]);

    const isCustom = !arraysEqual(order, defaultOrder());

    const [dragIndex, setDragIndex] = useState<number | null>(null);
    const [dropIndex, setDropIndex] = useState<number | null>(null);
    const [dropPosition, setDropPosition] = useState<"above" | "below" | null>(null);

    function commit(next: number[]) {
        // Persist natural order as [] so the presenter falls back cleanly.
        if (arraysEqual(next, defaultOrder())) onChange([]);
        else onChange(next);
    }

    function move(from: number, to: number) {
        if (from === to) return;
        const copy = order.slice();
        const [item] = copy.splice(from, 1);
        copy.splice(to, 0, item);
        commit(copy);
    }

    function moveBy(i: number, delta: -1 | 1) {
        const next = i + delta;
        if (next < 0 || next >= order.length) return;
        move(i, next);
    }

    function onDragStart(e: React.DragEvent<HTMLDivElement>, i: number) {
        setDragIndex(i);
        e.dataTransfer.effectAllowed = "move";
        // Some browsers require data to be set to allow drag.
        try {
            e.dataTransfer.setData("text/plain", String(i));
        } catch {
            /* ignore */
        }
    }

    function onDragOver(e: React.DragEvent<HTMLDivElement>, i: number) {
        if (dragIndex == null || dragIndex === i) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
        const midpoint = rect.top + rect.height / 2;
        setDropIndex(i);
        setDropPosition(e.clientY < midpoint ? "above" : "below");
    }

    function onDrop(e: React.DragEvent<HTMLDivElement>) {
        e.preventDefault();
        if (dragIndex == null || dropIndex == null) {
            resetDragState();
            return;
        }
        let target = dropIndex + (dropPosition === "below" ? 1 : 0);
        // When dragging down, the source removal shifts indices left by 1.
        if (dragIndex < target) target -= 1;
        move(dragIndex, target);
        resetDragState();
    }

    function onDragEnd() {
        resetDragState();
    }

    function resetDragState() {
        setDragIndex(null);
        setDropIndex(null);
        setDropPosition(null);
    }

    function handleReset() {
        commit(defaultOrder());
    }

    return (
        <div className={s.panel}>
            <div className={s.header}>
                <span className={s.headerLabel}>
                    Drag to reorder · arrow keys also work
                    {isCustom && <span className={s.customBadge}>Custom order</span>}
                </span>
                <button
                    type="button"
                    className={s.resetBtn}
                    onClick={handleReset}
                    disabled={!isCustom}
                >
                    Reset to default
                </button>
            </div>

            <div className={s.list} onDrop={onDrop}>
                {order.map((slideNum, i) => {
                    const isDragging = dragIndex === i;
                    const isDropTarget = dropIndex === i && dragIndex !== i;
                    const rowClass = [
                        s.row,
                        isDragging ? s.rowDragging : "",
                        isDropTarget && dropPosition === "above" ? s.rowDropTargetAbove : "",
                        isDropTarget && dropPosition === "below" ? s.rowDropTargetBelow : "",
                    ]
                        .filter(Boolean)
                        .join(" ");

                    return (
                        <div
                            key={slideNum}
                            className={rowClass}
                            draggable
                            onDragStart={(e) => onDragStart(e, i)}
                            onDragOver={(e) => onDragOver(e, i)}
                            onDragEnd={onDragEnd}
                            onDrop={onDrop}
                        >
                            <span className={s.handle} aria-hidden>⋮⋮</span>
                            <span className={s.position}>{String(i + 1).padStart(2, "0")}</span>
                            <div className={s.titles}>
                                <span className={s.title}>{SLIDE_TITLES[slideNum] ?? `Slide ${slideNum}`}</span>
                                <span className={s.sub}>Original slide № {String(slideNum).padStart(2, "0")}</span>
                            </div>
                            <div className={s.arrowGroup}>
                                <button
                                    type="button"
                                    className={s.arrowBtn}
                                    onClick={() => moveBy(i, -1)}
                                    disabled={i === 0}
                                    aria-label="Move up"
                                    title="Move up"
                                >
                                    ↑
                                </button>
                                <button
                                    type="button"
                                    className={s.arrowBtn}
                                    onClick={() => moveBy(i, 1)}
                                    disabled={i === order.length - 1}
                                    aria-label="Move down"
                                    title="Move down"
                                >
                                    ↓
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className={s.toolbar}>
                <span className={s.toolbarHint}>
                    Arrow keys → / ← in the presenter walk this order.
                </span>
            </div>
        </div>
    );
}
