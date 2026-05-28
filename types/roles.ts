export const ROLES = ["CUSTOMER", "ARCHITECT", "SALES_REP", "STAFF", "ADMIN"] as const;
export type AppRole = (typeof ROLES)[number];

/** Internal (staff-tier) roles — everyone except CUSTOMER. */
export const STAFF_ROLES: AppRole[] = ["ARCHITECT", "SALES_REP", "STAFF", "ADMIN"];

export const ROLE_LABELS: Record<AppRole, string> = {
    CUSTOMER: "Customer",
    ARCHITECT: "Architect",
    SALES_REP: "Sales rep",
    STAFF: "Staff",
    ADMIN: "Admin",
};

export function normalizeRole(input?: unknown): AppRole {
    const r = String(input || "CUSTOMER").toUpperCase();
    return (ROLES as readonly string[]).includes(r) ? (r as AppRole) : "CUSTOMER";
}
