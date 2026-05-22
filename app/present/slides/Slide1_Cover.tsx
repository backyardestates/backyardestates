"use client";

import React from "react";
import { usePresentationStore } from "@/lib/store/presentationStore";
import s from "./Slide1.module.css";
import { BeHouseLogo } from "./_shared/ProposalFooter";

export function Slide1_Cover() {
    const { propertyAddress, propertyPhotoUrl, customerName } = usePresentationStore();

    return (
        <div className={s.slide}>
            <div className={s.banner}>
                <h1 className={s.title}>Backyard Estates ADU Proposal</h1>
            </div>

            <div className={s.body}>
                <div className={s.photoFrame}>
                    {propertyPhotoUrl ? (
                        <img src={propertyPhotoUrl} alt={propertyAddress || "Property"} className={s.photo} />
                    ) : (
                        <div className={s.photoEmpty}>Property photo</div>
                    )}
                </div>

                {(customerName || propertyAddress) && (
                    <div className={s.preparedFor}>
                        <span className={s.preparedEyebrow}>Prepared for</span>
                        {customerName && <span className={s.preparedName}>{customerName}</span>}
                        {propertyAddress && <span className={s.preparedAddress}>{propertyAddress}</span>}
                    </div>
                )}
            </div>

            <div className={s.footer}>
                <div className={s.footerInner}>
                    <BeHouseLogo size={32} color="var(--p-cream)" />
                    <span className={s.footerBrand}>Backyard Estates</span>
                </div>
            </div>
        </div>
    );
}
