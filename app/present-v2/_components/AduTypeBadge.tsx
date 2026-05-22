"use client";

import s from "./AduTypeBadge.module.css";

export type AduTypeKind = "detached" | "attached" | "garage";

const LABEL: Record<AduTypeKind, string> = {
    detached: "Detached",
    attached: "Attached",
    garage: "Garage conversion",
};

interface Props {
    /** The per-unit ADU type. Pass "" / null / undefined to render nothing
     *  (lets callers `<AduTypeBadge type={aduTypeByUnitId[id] ?? aduType} />`
     *  without a guard). */
    type: AduTypeKind | "" | null | undefined;
    /** "light" = light pill for dark backgrounds (Slide 3 etc.).
     *  "dark"  = dark pill for light/paper backgrounds (Slide 6, 10 etc.). */
    variant?: "light" | "dark";
    /** Absolute-positions the badge into a corner of the nearest
     *  `position: relative` ancestor. Use this so the badge doesn't push
     *  card content downward and risk clipping totals at the bottom.
     *  Omit to render inline (default). */
    corner?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
    /** Optional inline style hook from callers (e.g. margin tweaks). */
    className?: string;
}

/**
 * Compact label that confirms whether a selected unit is a detached ADU,
 * attached ADU, or garage conversion. Lives on every presenter slide that
 * lists selected units so a glance disambiguates them without crowding the
 * headline.
 */
export function AduTypeBadge({ type, variant = "light", corner, className }: Props) {
    if (!type) return null;
    const t = type as AduTypeKind;
    const cornerClass = corner ? s[`corner_${corner.replace("-", "_")}`] : "";
    return (
        <span
            className={`${s.badge} ${s[variant]} ${s[`type_${t}`] ?? ""} ${cornerClass} ${className ?? ""}`}
            aria-label={`${LABEL[t]} ADU`}
        >
            {LABEL[t]}
        </span>
    );
}
