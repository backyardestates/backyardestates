"use client";

import styles from "./SiteSpecificWork.module.css";
import {
    INCLUDED_BASE,
    OPTIONAL_UPGRADES,
    POTENTIAL_SITE_SPECIFIC,
} from "@/lib/IncludedScope";

import IncludedPills from "@/components/IncludedPills/IncludedPills";
import { buildCategoryPills } from "@/lib/pills/categoryRollUp";
import { INCLUDED_CATEGORY_DEFS } from "@/lib/pills/categoryConfigs";

export default function SiteSpecificWork() {
    const includedCategories = buildCategoryPills(INCLUDED_BASE, INCLUDED_CATEGORY_DEFS);

    return (
        <section className={styles.step}>
            <IncludedPills
                mode="category"
                heading="What’s Included"
                subheading="Tap a category to see the full breakdown."
                categories={includedCategories}
            />

            <IncludedPills
                mode="item"
                heading="Optional Upgrades"
                subheading="Tap an upgrade to see details."
                items={OPTIONAL_UPGRADES.map(item => ({ ...item, group: "optional_upgrades" }))}
                tone="upgrade"
            />

            <IncludedPills
                mode="item"
                heading="Potential Site-Specific Work"
                subheading="Tap an item to see how we assess it upfront."
                items={POTENTIAL_SITE_SPECIFIC.map(item => ({ ...item, group: "site_specific" }))}
                tone="site"
            />
        </section>
    );
}
