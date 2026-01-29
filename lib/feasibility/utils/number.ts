export function toNumberOrUndefined(input: string): number | undefined {
    const cleaned = String(input).replace(/[^\d.]/g, "");
    if (!cleaned) return undefined;
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : undefined;
}
