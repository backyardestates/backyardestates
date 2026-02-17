// app/admin/_components/admin/DealForm.tsx
"use client";

import React from "react";
import type { Floorplan } from "@/lib/rentcast/types";

export function DealForm(props: {
    styles: any; // (your CSS module)
    AddressAutocomplete: React.ComponentType<any>;
    address: string;
    setAddress: (v: string) => void;
    owed: string;
    setOwed: (v: string) => void;
    floorplans: Floorplan[];
    floorplanId: string;
    setFloorplanId: (v: string) => void;
    selectedFloorplan: Floorplan | null;
    loading: boolean;
    error: string | null;
    onSubmit: () => void;
    currentFirstPmtMonthly: string;
    setCurrentFirstPmtMonthly: (v: string) => void;
}) {
    const {
        styles,
        AddressAutocomplete,
        address,
        setAddress,
        owed,
        setOwed,
        floorplans,
        floorplanId,
        setFloorplanId,
        selectedFloorplan,
        loading,
        error,
        onSubmit,
        currentFirstPmtMonthly,
        setCurrentFirstPmtMonthly,
    } = props;

    return (
        <div>
            <form
                className={styles.form}
                onSubmit={(e) => {
                    e.preventDefault();
                    onSubmit();
                }}
            >
                <div className={styles.formGrid}>
                    <div className={`${styles.field} ${styles.addressField}`}>
                        <AddressAutocomplete
                            value={address}
                            onChange={(v: string) => setAddress(v)}
                            onResolved={(d: any) => {
                                setAddress(d.formattedAddress);
                            }}
                        />
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label}>How much is owed</label>
                        <input className={styles.input} value={owed} onChange={(e) => setOwed(e.target.value)} placeholder="$250,000" />
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label}>Current Monthly Payment</label>
                        <input className={styles.input} value={currentFirstPmtMonthly} onChange={(e) => setCurrentFirstPmtMonthly(e.target.value)} placeholder="$1,000" />
                    </div>

                    <div className={styles.field} style={{ gridColumn: "1 / -1" }}>
                        <label className={styles.label}>Floorplan</label>
                        <select className={styles.select} value={floorplanId} onChange={(e) => setFloorplanId(e.target.value)}>
                            {floorplans.map((fp) => (
                                <option key={fp._id} value={fp._id}>
                                    {fp.name} — {fp.sqft} sqft
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className={styles.actions}>
                    <button className={styles.button} type="submit" disabled={loading}>
                        {loading ? "Loading…" : "Submit"}
                    </button>

                    {error ? <div className={styles.error}>{error}</div> : null}
                </div>
            </form>
        </div>
    );
}
