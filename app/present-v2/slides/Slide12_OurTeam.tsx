"use client";

import React from "react";
import { usePresentationStore } from "@/lib/store/presentationStore";
import { teamWithPortraits } from "@/lib/team";
import s from "./Slide12_OurTeam.module.css";

function lastNameFromFull(full?: string) {
    if (!full) return "";
    const parts = full.trim().split(/\s+/);
    return parts[parts.length - 1] ?? "";
}

function cityFromAddress(addr: string) {
    const parts = addr.split(",");
    return parts.length >= 2 ? parts[parts.length - 2].trim() : addr;
}

export function Slide12_OurTeam() {
    const { customerName, propertyAddress } = usePresentationStore();
    const lastName = lastNameFromFull(customerName);
    const city = propertyAddress ? cityFromAddress(propertyAddress) : "—";

    // Filter: only show team members with a portrait. The omission rule is
    // enforced here, not in the data file, so the team list stays canonical.
    const team = teamWithPortraits();

    const gridClass = [
        s.grid,
        team.length === 1 ? s.gridCols1 : "",
        team.length === 2 ? s.gridCols2 : "",
        team.length === 4 ? s.gridCols4 : "",
    ]
        .filter(Boolean)
        .join(" ");

    return (
        <div className={s.slide}>
            <div className="running-header rh-dark">
                <span className="running-header-left">{lastName} · {city}</span>
                <span className="running-header-center">Our Team</span>
                <span className="running-header-right">
                    <span className="running-header-num">12</span> / 14
                </span>
            </div>

            <div className={s.headRow}>
                <div className={s.headLeft}>
                    <h2 className="section-title on-dark">
                        The people <em>behind your build.</em>
                    </h2>
                    <span className={s.headSubhead}>
                        Decades of construction, design, and finance — all under one roof.
                    </span>
                </div>
                <span className={s.eyebrow}>Backyard Estates · Leadership</span>
            </div>

            {team.length === 0 ? (
                <div className={s.emptyState}>Team roster coming soon.</div>
            ) : (
                <div className={gridClass}>
                    {team.map((m) => (
                        <div key={m.name} className={s.card}>
                            <div className={s.portraitFrame}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={`/portraits/${m.portrait}`}
                                    alt={`${m.name} — ${m.title}`}
                                    className={s.portraitImg}
                                    loading="lazy"
                                />
                            </div>
                            <span className={s.name}>{m.name}</span>
                            <span className={s.title}>{m.title}</span>
                        </div>
                    ))}
                </div>
            )}

            <div className={s.footer}>
                <span className={s.footerNote}>
                    Combined: 100+ years of construction & design experience.
                </span>
                <span className={s.tagline}>We build for you.</span>
            </div>
        </div>
    );
}
