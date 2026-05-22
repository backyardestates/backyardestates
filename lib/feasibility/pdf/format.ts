export function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n));
}

export function money(n: number, opts?: { round?: "100" | "1000" | "1"; prefix?: string }) {
    const round = opts?.round ?? "100";
    const prefix = opts?.prefix ?? "$";

    let v = n;
    if (round === "100") v = Math.round(v / 100) * 100;
    if (round === "1000") v = Math.round(v / 1000) * 1000;

    // No Intl in some server runtimes is rare, but generally safe in Node.
    return `${prefix}${v.toLocaleString("en-US")}`;
}

export function moneyRange(min: number, max: number, opts?: { round?: "100" | "1000" | "1"; plus?: boolean }) {
    const a = money(min, { round: opts?.round ?? "100" });
    const b = money(max, { round: opts?.round ?? "100" });
    return `${a}–${b}${opts?.plus ? "+" : ""}`;
}

export function pct(n: number, digits = 1) {
    return `${(n * 100).toFixed(digits)}%`;
}

export function safeNumber(n: any, fallback = 0): number {
    const v = typeof n === "number" && Number.isFinite(n) ? n : Number(n);
    return Number.isFinite(v) ? v : fallback;
}

export function formatDate(iso?: string) {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "2-digit" });
}
