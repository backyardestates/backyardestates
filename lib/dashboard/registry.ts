/**
 * Dashboard / nav section registry — the single source of truth for which tools
 * a user can reach. Drives BOTH the launchpad tiles (`/tools/dashboard`) and the
 * top nav (`ToolsNav`). Keep this file PURE DATA (strings/arrays only): it is
 * imported by a client component, so no functions-as-values, components, Dates,
 * or Prisma. Live counts/queues live in the server-only `loaders.ts`, keyed by
 * the same section `key`.
 *
 * `requiredPermissions` uses OR semantics (mirrors the old ToolsNav `has(...)`):
 * a section is visible if the user holds ANY of the listed permission keys.
 * An empty array means "any signed-in user".
 */

export type DashboardGroup = "Pipeline" | "Proposals" | "Tools" | "Admin";

export interface DashboardSection {
    /** Stable id; also the key into SECTION_LOADERS + SECTION_ICONS. */
    key: string;
    /** Tile heading on the launchpad. */
    label: string;
    /** Shorter label used in the top nav. */
    navLabel: string;
    href: string;
    /** OR semantics; empty = any signed-in user. */
    requiredPermissions: string[];
    /** Key into SECTION_ICONS (lucide). Kept as a string so this file stays serializable. */
    icon: string;
    group: DashboardGroup;
    /** One-line description shown on the tile. */
    blurb: string;
    showInNav: boolean;
    showAsTile: boolean;
}

export const DASHBOARD_SECTIONS: DashboardSection[] = [
    {
        key: "engagements",
        label: "Engagements",
        navLabel: "Engagements",
        href: "/tools/engagements",
        requiredPermissions: ["engagements.view_own", "engagements.view_all"],
        icon: "engagements",
        group: "Pipeline",
        blurb: "Prospects from consultation through to a signed agreement.",
        showInNav: true,
        showAsTile: true,
    },
    {
        key: "fpa",
        label: "Formal Analysis",
        navLabel: "Formal Analysis",
        href: "/tools/fpa",
        requiredPermissions: ["fpa.view_assigned", "fpa.view_all", "fpa.fill"],
        icon: "fpa",
        group: "Pipeline",
        blurb: "On-site assessments and architect findings.",
        showInNav: true,
        showAsTile: true,
    },
    {
        key: "proposals",
        label: "Proposals",
        navLabel: "My Proposals",
        href: "/tools/proposals",
        requiredPermissions: ["proposals.view_own", "proposals.view_all", "proposals.edit"],
        icon: "proposals",
        group: "Proposals",
        blurb: "Drafts, sent estimates, and signed deals.",
        showInNav: true,
        showAsTile: true,
    },
    {
        // Nav-only: surfaced on the launchpad as the Proposals tile's CTA.
        key: "proposalBuilder",
        label: "New proposal",
        navLabel: "New / Edit Proposal",
        href: "/tools/admin/master",
        requiredPermissions: ["proposals.edit"],
        icon: "build",
        group: "Proposals",
        blurb: "Build a custom ADU proposal.",
        showInNav: true,
        showAsTile: false,
    },
    {
        key: "feasibility",
        label: "Feasibility",
        navLabel: "Feasibility",
        href: "/tools/feasibility",
        requiredPermissions: ["feasibility.use"],
        icon: "feasibility",
        group: "Tools",
        blurb: "Check whether a property qualifies for an ADU.",
        showInNav: true,
        showAsTile: true,
    },
    {
        key: "admin",
        label: "Administration",
        navLabel: "Admin Dashboard",
        href: "/tools/admin/dashboard",
        requiredPermissions: ["dashboard.admin"],
        icon: "admin",
        group: "Admin",
        blurb: "Catalogs, users, roles & access.",
        showInNav: true,
        showAsTile: true,
    },
];

/** OR-semantics permission check used by both consumers. */
export function hasAnyPermission(perms: Set<string>, required: string[]): boolean {
    if (required.length === 0) return true;
    return required.some((k) => perms.has(k));
}

/** Sections the user can reach at all (drives launchpad tiles when filtered by showAsTile). */
export function visibleSections(perms: Set<string>): DashboardSection[] {
    return DASHBOARD_SECTIONS.filter((s) => hasAnyPermission(perms, s.requiredPermissions));
}

/** Find one section by key (e.g. to read the proposalBuilder href for the CTA). */
export function sectionByKey(key: string): DashboardSection | undefined {
    return DASHBOARD_SECTIONS.find((s) => s.key === key);
}

/** Display order of tile groups on the launchpad. */
export const GROUP_ORDER: DashboardGroup[] = ["Pipeline", "Proposals", "Tools", "Admin"];
