export const ROLES = ["CUSTOMER", "ARCHITECT", "ADMIN"] as const;
export type AppRole = (typeof ROLES)[number];

export function normalizeRole(input?: unknown): AppRole {
    const r = String(input || "CUSTOMER").toUpperCase();
    if (r === "ADMIN" || r === "ARCHITECT" || r === "CUSTOMER") return r;
    return "CUSTOMER";
}
