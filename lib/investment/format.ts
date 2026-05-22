// lib/investment/format.ts

export function asNumber(v: any): number | undefined {
    const n = typeof v === "string" ? Number(v.replace(/[^0-9.]/g, "")) : Number(v);
    return Number.isFinite(n) ? n : undefined;
}

export function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n));
}

export function median(nums: number[]) {
    const arr = nums.filter((n) => Number.isFinite(n)).sort((a, b) => a - b);
    if (!arr.length) return undefined;
    const mid = Math.floor(arr.length / 2);
    return arr.length % 2 ? arr[mid] : (arr[mid - 1] + arr[mid]) / 2;
}

export function money(n?: number) {
    if (typeof n !== "number" || !Number.isFinite(n)) return "—";
    return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export function num(n?: number) {
    if (typeof n !== "number" || !Number.isFinite(n)) return "—";
    return n.toLocaleString("en-US");
}

export function pct(n?: number) {
    if (typeof n !== "number" || !Number.isFinite(n)) return "—";
    return `${(n * 100).toFixed(2)}%`;
}

export function pmt(annualRate: number, termYears: number, principal: number) {
    const r = annualRate / 12;
    const n = termYears * 12;
    if (!Number.isFinite(principal) || principal <= 0) return 0;
    if (r === 0) return principal / n;
    return (principal * r) / (1 - Math.pow(1 + r, -n));
}
