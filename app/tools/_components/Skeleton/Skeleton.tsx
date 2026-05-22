import s from "./Skeleton.module.css";

interface Props {
    /** Tailwind-style width: a number is treated as %; pass strings like "120px" for fixed. */
    width?: number | string;
    /** Tailwind-style height; default 14px (one line of small text). */
    height?: number | string;
    /** Render as a circle of the given diameter. Overrides width/height. */
    circle?: number;
    /** Border-radius override; default 6px (4 for inline, full for circle). */
    radius?: number | string;
    /** Extra inline style — handy for grid-cell hints, etc. */
    style?: React.CSSProperties;
    className?: string;
}

/** Generic shimmer block used by loading.tsx files across dashboards. */
export function Skeleton({ width, height = 14, circle, radius, style, className }: Props) {
    const w = circle ?? width ?? "100%";
    const h = circle ?? height;
    const r = circle ? "50%" : radius ?? 6;
    return (
        <span
            aria-hidden
            className={`${s.skel} ${className ?? ""}`}
            style={{
                width: typeof w === "number" ? `${w}px` : w,
                height: typeof h === "number" ? `${h}px` : h,
                borderRadius: typeof r === "number" ? `${r}px` : r,
                ...style,
            }}
        />
    );
}

/** Multi-line text skeleton; last line is shorter so it looks natural. */
export function SkeletonText({
    lines = 2,
    lineHeight = 12,
    gap = 8,
}: {
    lines?: number;
    lineHeight?: number;
    gap?: number;
}) {
    return (
        <span className={s.skelText} style={{ gap }} aria-hidden>
            {Array.from({ length: lines }, (_, i) => (
                <Skeleton
                    key={i}
                    height={lineHeight}
                    width={i === lines - 1 ? "70%" : "100%"}
                />
            ))}
        </span>
    );
}
