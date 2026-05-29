import { Role } from "@prisma/client";

// The app's capability registry. Permission keys are defined in code (the app
// owns its capabilities); only the per-role GRANTS are data (RolePermission +
// the admin matrix). Format: "<tool>.<action>". view_own vs view_all gates
// whether list queries are scoped to the user's own records or the whole org.
export interface PermissionDef {
    key: string;
    label: string;
    group: string;
}

export const PERMISSIONS: PermissionDef[] = [
    // Engagements
    { key: "engagements.view_own", label: "See own engagements", group: "Engagements" },
    { key: "engagements.view_all", label: "See all engagements", group: "Engagements" },
    { key: "engagements.start", label: "Start engagements", group: "Engagements" },
    { key: "engagements.edit", label: "Edit / move stage", group: "Engagements" },
    // Consultation
    { key: "consultation.run", label: "Run consultation + AI notes", group: "Consultation" },
    // Formal analysis
    { key: "fpa.view_assigned", label: "See assigned analyses", group: "Formal analysis" },
    { key: "fpa.view_all", label: "See all analyses", group: "Formal analysis" },
    { key: "fpa.create", label: "Start an analysis", group: "Formal analysis" },
    { key: "fpa.fill", label: "Fill on-site form", group: "Formal analysis" },
    { key: "fpa.submit", label: "Submit analysis", group: "Formal analysis" },
    // Proposals
    { key: "proposals.view_own", label: "See own proposals", group: "Proposals" },
    { key: "proposals.view_all", label: "See all proposals", group: "Proposals" },
    { key: "proposals.edit", label: "Build / edit proposals", group: "Proposals" },
    { key: "proposals.present", label: "Present", group: "Proposals" },
    { key: "proposals.agreement", label: "Generate agreement", group: "Proposals" },
    { key: "proposals.send_signature", label: "Send for e-signature", group: "Proposals" },
    // Feasibility
    { key: "feasibility.use", label: "Use feasibility tool", group: "Feasibility" },
    // Marketing
    { key: "drip.manage", label: "Manage follow-up drips", group: "Marketing" },
    // Administration
    { key: "dashboard.admin", label: "View admin dashboard", group: "Administration" },
    { key: "settings.manage", label: "Manage catalogs & settings", group: "Administration" },
    { key: "users.manage", label: "Manage users & roles", group: "Administration" },
    { key: "roles.manage", label: "Edit the permission matrix", group: "Administration" },
];

export const PERMISSION_KEYS: string[] = PERMISSIONS.map((p) => p.key);

const ALL = PERMISSION_KEYS;

// Seed defaults per role (admins tune these in the matrix afterward). These are
// only applied when seeding; runtime access always reads the RolePermission rows.
export const ROLE_PERMISSION_DEFAULTS: Record<Role, string[]> = {
    ADMIN: ALL,
    // Broad internal access (preserves what architects can reach today; admins
    // can trim in the matrix).
    ARCHITECT: [
        "fpa.view_assigned",
        "fpa.view_all",
        "fpa.create",
        "fpa.fill",
        "fpa.submit",
        "engagements.view_own",
        "engagements.edit",
        "consultation.run",
        "proposals.view_own",
        "proposals.edit",
        "proposals.present",
        "proposals.agreement",
        "proposals.send_signature",
        "feasibility.use",
    ],
    SALES_REP: [
        "engagements.view_own",
        "engagements.start",
        "engagements.edit",
        "consultation.run",
        "fpa.view_assigned",
        "proposals.view_own",
        "proposals.edit",
        "proposals.present",
        "proposals.agreement",
        "proposals.send_signature",
        "feasibility.use",
        "drip.manage",
    ],
    STAFF: ["engagements.view_all", "proposals.view_all", "fpa.view_all", "feasibility.use"],
    CUSTOMER: [],
};
