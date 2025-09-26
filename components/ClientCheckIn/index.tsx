"use client";

import styles from "./ClientCheckIn.module.css";

interface ClientCheckInProps {
    dealData: {
        success: boolean;
        data: {
            id: number;
            title: string;
            stage_id: number;
            pipeline_id: number;
            [key: string]: any;
        };
    } | null;
}

export default function ClientCheckIn({ dealData }: ClientCheckInProps) {
    if (!dealData || !dealData.success) {
        return <div className={styles.card}>❌ Could not retrieve your deal information.</div>;
    }

    const deal = dealData.data;

    return (
        <div className={styles.card}>
            <div className={styles.header}>
                ✅ Welcome!
            </div>

            <div className={styles.message}>
                You are now checked in for the Open House.
            </div>

            <div className={styles.info}>

                <div className={styles.infoRow}>
                    <span className={styles.infoValue}>{deal.title}</span>
                </div>

            </div>
        </div>
    );
}
