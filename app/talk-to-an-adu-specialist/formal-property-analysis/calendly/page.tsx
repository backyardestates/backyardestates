"use client";

import React, { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { InlineWidget } from "react-calendly";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/pro-solid-svg-icons";

import Logo from "@/components/Logo";
import style from "../../Form.module.css";

export default function FormalPropertyAnalysisCalendly() {
    return (
        <Suspense fallback={<div style={{ height: 1000 }} />}>
            <FormalPropertyAnalysisCalendlyInner />
        </Suspense>
    );
}

function FormalPropertyAnalysisCalendlyInner() {
    const router = useRouter();
    const sp = useSearchParams();

    const name = sp.get("name") ?? undefined;
    const email = sp.get("email") ?? undefined;
    const phone = sp.get("phone") ?? undefined;
    const address = sp.get("address") ?? undefined;
    const notes = sp.get("notes") ?? undefined;

    function goBack() {
        router.push("/");
    }

    return (
        <div className={style.page}>
            <div className={style.topBar}>
                <Logo />
                <FontAwesomeIcon
                    icon={faXmark}
                    size="xl"
                    className={style.icon}
                    onClick={goBack}
                />
            </div>

            <main className={style.root}>
                <div className={style.calendly}>
                    <div className={style.calendlyHeader}>
                        <span className={style.calendlyEyebrow}>Formal Property Analysis</span>
                        <h1 className={style.calendlyTitle}>Schedule your Formal Property Analysis</h1>
                        <p className={style.calendlySentence}>
                            Pick a time for your onsite visit. We’ll verify everything about your property before your formal proposal.
                        </p>
                        <div className={style.calendlyDivider} />
                    </div>

                    <div className={style.calendlyCard}>
                        <InlineWidget
                            url="https://calendly.com/d/cr86-j2b-gcj/onsite-visit-fpa"
                            styles={{ margin: "0px", height: "1000px" }}
                            pageSettings={{
                                backgroundColor: "ffffff",
                                hideEventTypeDetails: true,
                                hideLandingPageDetails: true,
                                primaryColor: "91744a",
                                textColor: "36484b",
                            }}
                            prefill={{
                                name,
                                email,
                                customAnswers: {
                                    a1: phone ? `1${phone}` : "",
                                    a2: address ?? "",
                                    a3: notes ?? "",
                                },
                            }}
                        />
                    </div>
                </div>
            </main>
        </div>
    );
}
