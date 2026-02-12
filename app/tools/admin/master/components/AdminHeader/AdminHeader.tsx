"use client";

import React from "react";
import styles from "../../components/AdminMasterClient.module.css"

export function AdminHeader() {
    return (
        <header className={styles.header}>
            <h1 className={styles.h1}>Admin Master</h1>
            <p className={styles.subhead}>
                Enter address + owed amount, select floorplan (sqft only), then pull RentCast data.
            </p>
        </header>
    );
}
