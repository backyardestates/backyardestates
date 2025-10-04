"use client";

import { useEffect, useState } from "react";
import styles from "./FloatingScheduleButton.module.css";
import { Calendar1Icon } from "lucide-react";

export default function FloatingScheduleButton() {
    const [hasToken, setHasToken] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("checkinToken");
        if (token) {
            setHasToken(true);
        }
    }, []);

    if (!hasToken) return null;

    async function handleClick() {
        const token = localStorage.getItem("checkinToken");
        if (!token) return alert("No valid token found.");

        // 🔹 Open the popup immediately (inside click event) so it won’t be blocked
        const newWin = window.open("", "_blank");

        try {
            // 🔹 Ask server for Calendly link enriched with Pipedrive data
            const res = await fetch("/api/schedule-office-visit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token }),
            });

            const result = await res.json();

            if (result.success) {
                // 🔹 Redirect the already-opened popup
                if (newWin) {
                    newWin.location.href = result.url;
                }
            } else {
                if (newWin) newWin.close();
                alert("Error generating scheduling link: " + result.error);
            }
        } catch (err) {
            if (newWin) newWin.close();
            alert("Something went wrong while generating the link.");
        }
    }
    return (
        <button className={styles.floatingBtn} onClick={handleClick}>
            <Calendar1Icon /> Claim Free Office Consultation
        </button>
    );
}