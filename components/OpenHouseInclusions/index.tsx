"use client";

import { useState } from "react";
import styles from "./OpenHouseInclusions.module.css";
import { ChevronRight, ChevronDown } from "lucide-react";

interface ItemSection {
    title: string;
    description?: string;
    items: string[];
}

interface IncludedItemsProps {
    sections: ItemSection[];
}

export default function IncludedItems({ sections }: IncludedItemsProps) {

    // track which sections are open
    const [openSections, setOpenSections] = useState<boolean[]>(sections.map(() => false));

    const toggleSection = (index: number) => {
        const newOpenSections = [...openSections];
        newOpenSections[index] = !newOpenSections[index];
        setOpenSections(newOpenSections);
    };

    return (
        <div className={styles.container}>
            {sections.map((section, idx) => (
                <div key={idx} className={styles.section}>
                    {/* Section Header */}
                    <div
                        className={styles.sectionHeader}
                        onClick={() => toggleSection(idx)}
                    >
                        <h3 className={styles.sectionTitle}>{section.title}</h3>
                        {openSections[idx] ? (
                            <ChevronDown size={20} className={styles.toggleIcon} />
                        ) : (
                            <ChevronRight size={20} className={styles.toggleIcon} />
                        )}
                    </div>

                    {/* Section Description */}
                    {section.description && openSections[idx] && (
                        <p className={styles.description}>{section.description}</p>
                    )}

                    {/* Section Items */}
                    {openSections[idx] && (
                        <ul className={styles.list}>
                            {section.items.map((item, i) => (
                                <li key={i} className={styles.listItem}>
                                    <ChevronRight className={styles.icon} size={16} />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            ))}
        </div>
    );
}
