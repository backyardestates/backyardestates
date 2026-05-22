"use client";

type Props = {
    name: string;
    prefix?: string;
    theme?: "dark" | "light";
    className?: string;
};

export function PlanName({ name, prefix = "The", theme = "dark", className }: Props) {
    const goldColor = theme === "dark" ? "var(--p-gold-bright)" : "var(--p-gold)";
    return (
        <span className={className} style={{ fontFamily: "var(--p-font-display)", fontWeight: 300 }}>
            {prefix}{" "}
            <em style={{ fontStyle: "italic", color: goldColor }}>{name}</em>
        </span>
    );
}
