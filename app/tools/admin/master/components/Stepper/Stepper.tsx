// Accessible numeric stepper — [−] value [+].
//
// Replaces tiny type=number inputs for small counts (beds, baths, max units).
// Click the −/+ buttons or focus the control and use ↑/↓ arrows. The group
// itself is the ARIA spinbutton (announces value/min/max); the −/+ buttons are
// mouse affordances. Supports fractional steps (0.5 for baths) without float
// drift, and disables the relevant button at the min/max bound.

"use client";

import React from "react";
import s from "./Stepper.module.css";

interface StepperProps {
    value: number;
    onChange: (next: number) => void;
    min?: number;
    max?: number;
    step?: number;
    /** Accessible name, e.g. "Estate 520 bedrooms". */
    ariaLabel: string;
    /** Visual density. "sm" for inline header use. */
    size?: "sm" | "md";
    /** Format the displayed value (default: 1 → "1", 1.5 → "1.5"). */
    format?: (v: number) => string;
}

/** Round to the step's precision so 0.5 increments don't accrue float error. */
function roundToStep(v: number, step: number): number {
    const inv = 1 / step;
    return Math.round(v * inv) / inv;
}

export function Stepper({
    value,
    onChange,
    min = 0,
    max = Number.POSITIVE_INFINITY,
    step = 1,
    ariaLabel,
    size = "md",
    format,
}: StepperProps) {
    const set = (n: number) =>
        onChange(Math.min(max, Math.max(min, roundToStep(n, step))));

    const atMin = value <= min;
    const atMax = value >= max;
    const display = format ? format(value) : String(value);

    function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
        if (e.key === "ArrowUp" || e.key === "ArrowRight") {
            e.preventDefault();
            set(value + step);
        } else if (e.key === "ArrowDown" || e.key === "ArrowLeft") {
            e.preventDefault();
            set(value - step);
        } else if (e.key === "Home" && Number.isFinite(min)) {
            e.preventDefault();
            set(min);
        } else if (e.key === "End" && Number.isFinite(max)) {
            e.preventDefault();
            set(max);
        }
    }

    return (
        <div
            className={`${s.group} ${size === "sm" ? s.sm : ""}`}
            role="spinbutton"
            tabIndex={0}
            aria-label={ariaLabel}
            aria-valuenow={value}
            aria-valuemin={Number.isFinite(min) ? min : undefined}
            aria-valuemax={Number.isFinite(max) ? max : undefined}
            aria-valuetext={display}
            onKeyDown={onKeyDown}
        >
            <button
                type="button"
                className={s.btn}
                onClick={() => set(value - step)}
                disabled={atMin}
                tabIndex={-1}
                aria-hidden="true"
            >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                    <path d="M3 7h8" />
                </svg>
            </button>

            <span className={s.value}>{display}</span>

            <button
                type="button"
                className={s.btn}
                onClick={() => set(value + step)}
                disabled={atMax}
                tabIndex={-1}
                aria-hidden="true"
            >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                    <path d="M7 3v8M3 7h8" />
                </svg>
            </button>
        </div>
    );
}
