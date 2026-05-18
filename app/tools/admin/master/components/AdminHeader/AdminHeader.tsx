"use client";

import React, { useEffect, useRef, useState } from "react";
import { SignOutButton } from "@clerk/nextjs";
import styles from "./AdminHeader.module.css";
import type { PresenterVariant } from "@/hooks/presentation/usePresentationWire";

interface AdminHeaderProps {
    onOpenPresenter?: (variant: PresenterVariant) => void;
}

export function AdminHeader({ onOpenPresenter }: AdminHeaderProps) {
    const [open, setOpen] = useState(false);
    const wrapRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!open) return;
        function onDocClick(e: MouseEvent) {
            if (!wrapRef.current) return;
            if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
        }
        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape") setOpen(false);
        }
        document.addEventListener("mousedown", onDocClick);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onDocClick);
            document.removeEventListener("keydown", onKey);
        };
    }, [open]);

    function pick(variant: PresenterVariant) {
        setOpen(false);
        onOpenPresenter?.(variant);
    }

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
                    <div className={styles.presentWrap} ref={wrapRef}>
                        <button
                            type="button"
                            className={styles.presentBtn}
                            onClick={() => setOpen((v) => !v)}
                            aria-haspopup="menu"
                            aria-expanded={open}
                        >
                            <span className={styles.presentIcon}>▶</span>
                            Present
                            <span className={styles.caret} aria-hidden>▾</span>
                        </button>

                        {open && (
                            <div className={styles.menu} role="menu">
                                <button
                                    type="button"
                                    role="menuitem"
                                    className={styles.menuItem}
                                    onClick={() => pick("original")}
                                >
                                    <span className={styles.menuLabel}>Original</span>
                                    <span className={styles.menuHint}>Proposal-style deck</span>
                                </button>
                                <button
                                    type="button"
                                    role="menuitem"
                                    className={styles.menuItem}
                                    onClick={() => pick("v2")}
                                >
                                    <span className={styles.menuLabel}>v.2</span>
                                    <span className={styles.menuHint}>Previous deck</span>
                                </button>
                            </div>
                        )}
                    </div>
                )}
                <SignOutButton>
                    <button className={styles.signOutBtn}>Sign out</button>
                </SignOutButton>
            </div>
        </header>
    );
}
