"use client";

import React from "react";
import { REP_CONFIG } from "@/lib/config/repConfig";
import s from "./Slide8.module.css";
import { ProposalFooter, BeHouseLogo } from "./_shared/ProposalFooter";

type TeamMember = {
    name: string;
    role: string;
    portrait: string | null;
};

const TEAM: TeamMember[] = [
    { name: "Adam Stewart",   role: "General Manager",          portrait: "/portraits/adam-stewart.png" },
    { name: "Tom Gibson",     role: "Director of Construction", portrait: "/portraits/tom-gibson.png" },
    { name: "Dusty Gravatt",  role: "General Superintendent",   portrait: "/portraits/dusty-gravatt.png" },
    { name: "Serge Mayer",    role: "Architect",                portrait: "/portraits/serge-mayer.png" },
    { name: "Edgar Cure",     role: "Customer Success",         portrait: null },
    { name: "Jose Cervantes", role: "Project Manager",          portrait: "/portraits/jose-cervantes.png" },
    { name: "Juan Perez",     role: "Assistant Supervisor",     portrait: null },
    { name: "Hector Tomas",   role: "Accounting",               portrait: "/portraits/hector-tomas.png" },
];

const PARTNERS = ["Terra Firma", "Goldwater Bank", "Silvercrest", "Hometap"];

function formatDate(d: Date) {
    return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function getInitials(name: string) {
    return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

export function Slide8_Teamwork() {
    const today = formatDate(new Date());
    const specialist = TEAM[0];

    return (
        <div className={s.slide}>
            <div className={s.hero}>
                <img src="/images/hero-adu-optimized.webp" alt="" className={s.heroImg} />
                <div className={s.heroOverlay}>
                    <span className={s.heroEyebrow}>Backyard Estates</span>
                    <h1 className={s.heroTitle}>Teamwork</h1>
                </div>
            </div>

            <div className={s.meta}>
                <span>ADU Proposal</span>
                <span className={s.metaSep}>|</span>
                <span>Date: {today}</span>
                <span className={s.metaSep}>|</span>
                <span>{REP_CONFIG.licenseContractor}</span>
                <span className={s.metaSep}>|</span>
                <span>{REP_CONFIG.licenseDealership}</span>
            </div>

            <div className={s.body}>
                <div className={s.topRow}>
                    <div className={s.brandCol}>
                        <BeHouseLogo size={88} color="var(--p-ink)" />
                        <span className={s.brandName}>Backyard Estates</span>
                        <span className={s.brandTag}>{REP_CONFIG.tagline}</span>
                    </div>

                    <div className={s.specialistCard}>
                        <header className={s.specialistHeader}>Your Specialist</header>
                        <div className={s.specialistBody}>
                            <div className={s.specialistPhoto}>
                                {specialist.portrait ? (
                                    <img src={specialist.portrait} alt={specialist.name} />
                                ) : (
                                    <span>{getInitials(specialist.name)}</span>
                                )}
                            </div>
                            <div className={s.specialistInfo}>
                                <span className={s.specialistName}>{specialist.name}</span>
                                <span className={s.specialistContact}>{REP_CONFIG.phone}</span>
                                <span className={s.specialistContact}>{REP_CONFIG.email}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={s.teamGrid}>
                    {TEAM.map((m) => (
                        <div key={m.name} className={s.member}>
                            <header className={s.memberName}>{m.name}</header>
                            <div className={s.memberPhoto}>
                                {m.portrait ? (
                                    <img src={m.portrait} alt={m.name} />
                                ) : (
                                    <span>{getInitials(m.name)}</span>
                                )}
                            </div>
                            <footer className={s.memberRole}>{m.role}</footer>
                        </div>
                    ))}
                </div>

                <div className={s.partners}>
                    {PARTNERS.map((p) => (
                        <span key={p} className={s.partner}>{p}</span>
                    ))}
                </div>
            </div>

            <ProposalFooter pageNum={8} pageTotal={9} />
        </div>
    );
}
