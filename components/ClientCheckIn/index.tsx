"use client";

import Link from "next/link";
import styles from "./ClientCheckIn.module.css";
import formatDate from "@/utils/dates";
import { Calendar, Clock } from "lucide-react";
import formatTime from "@/utils/times";
import Button from "../Button";

interface ClientCheckInProps {
    dealData: {
        success: boolean;
        data: {
            id: number;
            title: string; // event name or slug
            stage_id: number;
            pipeline_id: number;
            [key: string]: any;
        };
    } | null;
}

export default function ClientCheckIn({ dealData }: ClientCheckInProps) {
    if (!dealData || !dealData.success) {
        return <div className={styles.card}>❌ Could not retrieve your information.</div>;
    }

    const deal = dealData.data;

    // Determine the link dynamically
    const eventSlug = deal["5b828e59d1a7df6f5ffefac982cac34de1440b49"]; // event slug
    const reservedDate = formatDate(deal["99c3c4c83c70de6cc3d999b6f2692bb4b59b2036"]); // reserved date
    const reservedTime = formatTime(deal["e37e48f6d0da66dc4e54ba571bc3796091a92be4"]); // reserved time

    const isSeminar = eventSlug === "adu-seminar";
    const eventLink = isSeminar
        ? `/events/adu-seminar`
        : `/events/open-house/${eventSlug}`;
    const eventLabel = isSeminar ? "ADU Seminar" : "Open House";

    return (
        <div className={styles.card}>
            <div className={styles.header}>
                ✅ Welcome!
            </div>

            <div className={styles.message}>
                You are now checked in for the {eventLabel}.
            </div>
            <div className={styles.eventLinkContainer}>
                <Button href={eventLink}>
                    View {eventLabel} Details
                </Button>
            </div>
            <div className={styles.info}>
                <div className={styles.infoRow}>
                    <span className={styles.infoValue}>{deal.title}</span>
                </div>
            </div>
            {/* Reserved Date & Time */}
            <div className={styles.reservedRow}>
                <Calendar></Calendar>
                <span className={styles.reservedValue}>{reservedDate}</span>
            </div>
            <div className={styles.reservedRow}>
                <Clock></Clock>
                <span className={styles.reservedValue}>{reservedTime}</span>
            </div>

        </div>
    );
}
