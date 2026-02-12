// app/admin/_components/admin/Row.tsx
"use client";

import React from "react";

export function Row({ styles, label, value }: { styles: any; label: string; value: string }) {
    return (
        <div className={styles.row}>
            <div className={styles.rowLabel}>{label}</div>
            <div className={styles.rowValue}>{value}</div>
        </div>
    );
}
