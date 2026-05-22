// app/admin/_components/admin/Card.tsx
"use client";

import React from "react";

export function Card({ styles, title, children }: { styles: any; title: string; children: React.ReactNode }) {
    return (
        <div className={styles.card}>
            <h2 className={styles.cardTitle}>{title}</h2>
            {children}
        </div>
    );
}
