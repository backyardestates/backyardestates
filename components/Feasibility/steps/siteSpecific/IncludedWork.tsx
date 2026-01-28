"use client";

import styles from "./SiteSpecificWork.module.css"
import IncludedPills from "@/components/IncludedPills/IncludedPills";
import { INCLUDED_BASE } from "@/lib/IncludedScope";
import { buildCategoryPills } from "@/lib/pills/categoryRollUp";
import { INCLUDED_CATEGORY_DEFS } from "@/lib/pills/categoryConfigs";
import SiteSpecificShell from "./SiteSpecificShell";
export default function IncludedWork({
    onJump,
}: {
    onJump: (tab: 0 | 1 | 2) => void;
}) {
    const includedCategories = buildCategoryPills(INCLUDED_BASE, INCLUDED_CATEGORY_DEFS);

    return (
        <SiteSpecificShell
            active={0}
            onTab={onJump}
            title="What’s Included"
            helper="Tap a category to see the full breakdown. This is included in our base scope."
        >
            <div className={styles.questionGrid}>
                <IncludedPills
                    mode="category"
                    heading="What’s Included"
                    subheading="Tap a category to see the full breakdown."
                    categories={includedCategories}
                />
            </div>
        </SiteSpecificShell>
    );
}
