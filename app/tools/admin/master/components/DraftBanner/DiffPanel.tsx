"use client";

import React from "react";
import type { DiffSection } from "@/lib/proposalDiff";
import s from "./DiffPanel.module.css";

interface Props {
    activeLabel: string;
    sections: DiffSection[];
    onClose: () => void;
}

/**
 * Side-panel comparison between the currently-edited snapshot and the
 * canonical REVIEWED. Just human-readable bullets per section — not a full
 * field-by-field diff. Empty when the two are equivalent on the fields the
 * UI cares about.
 */
export function DiffPanel({ activeLabel, sections, onClose }: Props) {
    return (
        <>
            <div className={s.overlay} onClick={onClose} aria-hidden />
            <aside className={s.panel} role="dialog" aria-label="Differences from canonical">
                <header className={s.head}>
                    <div>
                        <div className={s.eyebrow}>Comparing</div>
                        <h2 className={s.title}>{activeLabel} vs <em>canonical</em></h2>
                    </div>
                    <button className={s.close} onClick={onClose} aria-label="Close">×</button>
                </header>

                <div className={s.body}>
                    {sections.length === 0 ? (
                        <p className={s.empty}>
                            No differences detected on the fields the UI tracks.
                            (Drafts and canonical might still differ on derived fields
                            like cached rentcast data.)
                        </p>
                    ) : (
                        sections.map((section) => (
                            <section key={section.label} className={s.section}>
                                <h3 className={s.sectionTitle}>{section.label}</h3>
                                <ul className={s.list}>
                                    {section.changes.map((line, i) => (
                                        <li key={i} className={s.line}>{line}</li>
                                    ))}
                                </ul>
                            </section>
                        ))
                    )}
                </div>
            </aside>
        </>
    );
}
