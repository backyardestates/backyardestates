// Per-proposal agreement exclusions editor. Renders inside Step 6
// (Review & Generate) so the rep can review/edit what will land in the
// contract's exclusions list right before generating.
//
// State lives in AdminMasterClient and gets persisted in the proposal
// snapshot — so each proposal carries its own exclusions instead of the
// previous design where one value in browser-global localStorage haunted
// every future agreement.

"use client";

import React from "react";
import s from "./ExclusionsPanel.module.css";

interface Props {
    value: string;
    onChange: (next: string) => void;
}

export function ExclusionsPanel({ value, onChange }: Props) {
    const lines = value
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
    const count = lines.length;

    return (
        <div className={s.root}>
            <header className={s.header}>
                <span className={s.label}>Manual exclusions</span>
                <span className={s.count}>
                    {count === 0 ? "none" : `${count} ${count === 1 ? "line" : "lines"}`}
                </span>
            </header>

            <p className={s.hint}>
                One exclusion per line. These appear at the end of the agreement&apos;s
                <em> Additional Specific Exclusions</em> list. They&apos;re separate from
                the auto-generated &ldquo;Switch to <em>other unit</em>&rdquo; bullets,
                which are computed from the comparison units automatically.
            </p>

            <textarea
                className={s.textarea}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={"Solar panels not included\nWasher / dryer not included\nBuyer to provide refrigerator"}
                spellCheck
            />

            <div className={s.footer}>
                <span className={s.preview}>
                    {count > 0
                        ? `First: "${lines[0].length > 60 ? lines[0].slice(0, 60) + "…" : lines[0]}"`
                        : "Leave blank to skip — only the auto-generated switch bullets will show."}
                </span>
                <button
                    type="button"
                    className={s.clearBtn}
                    onClick={() => onChange("")}
                    disabled={count === 0}
                    title="Remove all manual exclusion lines for this proposal"
                >
                    Clear all
                </button>
            </div>

            <p className={s.autoNote}>
                Saved with this proposal — won&apos;t carry over to other customers.
            </p>
        </div>
    );
}
