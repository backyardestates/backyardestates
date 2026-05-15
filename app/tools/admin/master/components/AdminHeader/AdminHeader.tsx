"use client";

import React from "react";
import { SignOutButton } from "@clerk/nextjs";
import styles from "./AdminHeader.module.css";

interface AdminHeaderProps {
    onOpenPresenter?: () => void;
}

export function AdminHeader({ onOpenPresenter }: AdminHeaderProps) {
    return (
        <header className={styles.header}>
            <div className={styles.logoWrap}>
                <img
                    src="/images/logo-mobile.png"
                    alt="Backyard Estates"
                    className={styles.logo}
                />
                <span className={styles.wordmark}>Backyard Estates</span>
            </div>

            <div className={styles.center}>
                <span className={styles.toolLabel}>ADU Proposal Tool</span>
            </div>

            <div className={styles.actions}>
                {onOpenPresenter && (
                    <button className={styles.presentBtn} onClick={onOpenPresenter}>
                        <span className={styles.presentIcon}>▶</span>
                        Present
                    </button>
                )}
                <SignOutButton>
                    <button className={styles.signOutBtn}>Sign out</button>
                </SignOutButton>
            </div>
        </header>
    );
}
