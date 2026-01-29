"use client";

import styles from "./SiteSpecificWork.module.css";
import IncludedPills from "@/components/IncludedPills/IncludedPills";
import { POTENTIAL_SITE_SPECIFIC, OPTIONAL_UPGRADES } from "@/lib/IncludedScope";
import { useAnswersStore, MoneyRange } from "@/lib/feasibility/stores/answers.store";
import SiteSpecificShell from "./SiteSpecificShell";

export default function SiteSpecificWorkStep({ onJump }: { onJump: (tab: 0 | 1 | 2) => void }) {
    const siteSpecific = useAnswersStore((s) => s.answers.siteSpecific);

    const setSiteSpecificStatus = useAnswersStore((s) => s.setSiteSpecificStatus);
    const clearSiteSpecific = useAnswersStore((s) => s.clearSiteSpecific);


    const getSiteCost = (item: any): MoneyRange | undefined => {
        const c = item?.modal?.estCost;
        if (!c) return undefined;
        return { min: c.min, max: c.max, display: c.display };
    };

    return (
        <SiteSpecificShell
            active={2}
            onTab={onJump}
            title="Additional Site-Specific Work"
            helper="Tap an item to learn how we assess it upfront, then mark anything that might apply."
        >
            <div className={styles.questionGrid}>
                {/* ✅ SITE SPECIFIC */}
                <IncludedPills
                    mode="item"
                    heading="Potential Site-Specific Work"
                    subheading="Tap an item to see how we assess it upfront."
                    items={POTENTIAL_SITE_SPECIFIC.map((item) => ({ ...item, group: "site_specific" }))}
                    tone="site"
                    getState={(item) => siteSpecific[item.id]?.status ?? "unknown"}
                    onSetState={(item, next) => {
                        if (next === "unknown") return clearSiteSpecific(item.id);
                        setSiteSpecificStatus(item.id, next as any, getSiteCost(item), item.title);
                    }}
                />
            </div>
        </SiteSpecificShell>
    );
}
