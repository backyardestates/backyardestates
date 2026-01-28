"use client";

import styles from "./SiteSpecificWork.module.css";
import IncludedPills from "@/components/IncludedPills/IncludedPills";
import { OPTIONAL_UPGRADES } from "@/lib/IncludedScope";
import { useAnswersStore, MoneyRange } from "@/lib/feasibility/stores/answers.store";
import SiteSpecificShell from "./SiteSpecificShell";

export default function OptionalUpgrades({ onJump }: { onJump: (tab: 0 | 1 | 2) => void }) {
    const optionalUpgrades = useAnswersStore((s) => s.answers.optionalUpgrades);

    const setUpgradeSelected = useAnswersStore((s) => s.setUpgradeSelected);
    const clearUpgrade = useAnswersStore((s) => s.clearUpgrade);

    const getUpgradeCost = (item: any): MoneyRange | undefined => {
        const c = item?.modal?.estCost;
        if (!c) return undefined;
        return { min: c.min, max: c.max, display: c.display };
    };

    return (
        <SiteSpecificShell
            active={1}
            onTab={onJump}
            title="Optional Upgrades"
            helper="Tap an upgrade to see details. These are optional enhancements you can add."
        >
            <div className={styles.questionGrid}>
                <IncludedPills
                    mode="item"
                    heading="Optional Upgrades"
                    subheading="Tap an upgrade to view details, then add or remove it."
                    items={OPTIONAL_UPGRADES.map((item) => ({ ...item, group: "optional_upgrades" }))}
                    tone="upgrade"
                    getState={(item) => (optionalUpgrades[item.id]?.selected ? "selected" : "not_selected")}
                    onSetState={(item, next) => {
                        if (next === "not_selected") return clearUpgrade(item.id);

                        // next === "selected"
                        setUpgradeSelected(item.id, true, getUpgradeCost(item));
                    }}
                />
            </div>
        </SiteSpecificShell>
    );
}
