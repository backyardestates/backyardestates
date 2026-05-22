// lib/pills/categoryConfigs.ts
import type { CategoryDefinition } from "./categoryRollUp";

export const INCLUDED_CATEGORY_DEFS: CategoryDefinition[] = [
    {
        id: "cat_design",
        category: "design",
        title: "Design",
        description: "Plans, engineering, and energy compliance.",
        tone: "included",
        order: 1,
    },
    {
        id: "cat_permits",
        category: "permits",
        title: "Permits",
        description: "Submittals, expediting, and approvals.",
        tone: "included",
        order: 2,
    },
    {
        id: "cat_construction",
        category: "construction",
        title: "Construction",
        description: "Core build phases from foundation to finish.",
        tone: "included",
        order: 3,
    },
    {
        id: "cat_pm",
        category: "project_management",
        title: "Project Management",
        description: "Site supervision, scheduling, and cleanup.",
        tone: "included",
        order: 4,
    },
    {
        id: "cat_finishes",
        category: "design_finish_features",
        title: "Standard Finishes",
        description: "Quartz, LVP, shaker cabinets, HVAC, and more.",
        tone: "included",
        order: 5,
    },
];

export const UPGRADE_CATEGORY_DEFS: CategoryDefinition[] = [
    {
        id: "cat_upgrades",
        category: "optional_upgrades",
        title: "Upgrades",
        description: "Optional enhancements beyond standard finishes.",
        tone: "upgrade",
        order: 1,
    },
];

export const SITE_CATEGORY_DEFS: CategoryDefinition[] = [
    {
        id: "cat_site",
        category: "site_specific",
        title: "Site-Specific Work",
        description: "Property-dependent items we verify upfront.",
        tone: "site",
        order: 1,
    },
];
