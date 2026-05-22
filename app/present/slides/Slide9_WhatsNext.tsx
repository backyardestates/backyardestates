"use client";

import React from "react";
import { usePresentationStore } from "@/lib/store/presentationStore";
import s from "./Slide9.module.css";
import { BeHouseLogo } from "./_shared/ProposalFooter";

const NEXT_STEPS = [
    "Sign your ADU Agreement",
    "Pay your Initial Deposit",
    "Official Site Plan & Floor plan for sign off",
    "Preliminary Submittal",
];

function firstName(full: string) {
    return full.trim().split(/\s+/)[0] ?? "";
}

export function Slide9_WhatsNext() {
    const { customerName } = usePresentationStore();
    const first = firstName(customerName);

    return (
        <div className={s.slide}>
            <div className={s.banner}>
                <h1 className={s.bannerTitle}>Whats Next</h1>
            </div>

            <div className={s.body}>
                <div className={s.intro}>
                    {first ? (
                        <p className={s.introText}>
                            {first}, if you are interested in moving forward,
                            <br />here are the next steps!
                        </p>
                    ) : (
                        <p className={s.introText}>
                            If you are interested in moving forward,
                            <br />here are the next steps!
                        </p>
                    )}
                </div>

                <div className={s.stepsBlock}>
                    <h2 className={s.stepsTitle}>NEXT STEPS</h2>
                    <ol className={s.stepsList}>
                        {NEXT_STEPS.map((step, i) => (
                            <li key={step}>
                                <span className={s.stepNum}>{i + 1}.</span>
                                <span className={s.stepText}>{step}</span>
                            </li>
                        ))}
                    </ol>
                </div>
            </div>

            <div className={s.congrats}>
                <p className={s.congratsText}>
                    Congratulations! You are on your way to having a<br />
                    Backyard Estate ADU!
                </p>
            </div>

            <div className={s.footerStrip}>
                <span className={s.footerPage}>Page 9 / 9</span>
                <BeHouseLogo size={32} color="var(--p-cream)" />
            </div>
        </div>
    );
}
