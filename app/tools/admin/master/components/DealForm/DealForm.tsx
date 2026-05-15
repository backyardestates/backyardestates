// app/admin/_components/admin/DealForm.tsx
"use client";

import React, { useRef } from "react";
import type { Floorplan } from "@/lib/rentcast/types";
import type { CustomerMotivation } from "@/lib/store/presentationStore";
import df from "./DealForm.module.css";

type Motivation = NonNullable<CustomerMotivation>;

const MOTIVATIONS: { value: Motivation; label: string }[] = [
    { value: "family",     label: "🏠 Family" },
    { value: "income",     label: "🏦 Income" },
    { value: "investment", label: "📈 Investment" },
];

export function DealForm(props: {
    styles: any;
    AddressAutocomplete: React.ComponentType<any>;
    customerName: string;
    setCustomerName: (v: string) => void;
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
    propertyPhotoUrl: string | null;
    setPropertyPhotoUrl: (url: string | null) => void;
    customerMotivation: CustomerMotivation;
    setCustomerMotivation: (m: CustomerMotivation) => void;
    aduType: "detached" | "attached" | "garage" | "";
    setAduType: (v: "detached" | "attached" | "garage" | "") => void;
}) {
    const {
        styles,
        AddressAutocomplete,
        customerName,
        setCustomerName,
        address,
        setAddress,
        owed,
        setOwed,
        floorplans,
        floorplanId,
        setFloorplanId,
        loading,
        error,
        onSubmit,
        currentFirstPmtMonthly,
        setCurrentFirstPmtMonthly,
        propertyPhotoUrl,
        setPropertyPhotoUrl,
        customerMotivation,
        setCustomerMotivation,
        aduType,
        setAduType,
    } = props;

    const fileInputRef = useRef<HTMLInputElement>(null);

    function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        // Use FileReader to get a base64 data URL — blob: URLs are tab-scoped
        // and cannot be transferred via BroadcastChannel to the presenter window.
        const reader = new FileReader();
        reader.onload = (ev) => {
            const result = ev.target?.result;
            if (typeof result === "string") setPropertyPhotoUrl(result);
        };
        reader.readAsDataURL(file);
    }

    return (
        <div>
            <form
                className={styles.form}
                onSubmit={(e) => { e.preventDefault(); onSubmit(); }}
            >
                <div className={styles.formGrid}>
                    {/* Customer name */}
                    <div className={styles.field}>
                        <label className={styles.label}>Customer Name</label>
                        <input
                            className={styles.input}
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            placeholder="Ray & Bonnie Shouse"
                        />
                    </div>

                    {/* Address */}
                    <div className={`${styles.field} ${styles.addressField}`}>
                        <AddressAutocomplete
                            value={address}
                            onChange={(v: string) => setAddress(v)}
                            onResolved={(d: any) => { setAddress(d.formattedAddress); }}
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
                                <option key={fp._id} value={fp._id}>{fp.name} — {fp.sqft} sqft</option>
                            ))}
                        </select>
                    </div>

                    {/* ADU Type */}
                    <div className={styles.field} style={{ gridColumn: "1 / -1" }}>
                        <label className={styles.label}>ADU Type</label>
                        <div className={df.motivPills}>
                            {(["detached", "attached", "garage"] as const).map((t) => (
                                <button
                                    key={t}
                                    type="button"
                                    className={`${df.motivPill} ${aduType === t ? df.motivPillActive : ""}`}
                                    onClick={() => setAduType(aduType === t ? "" : t)}
                                >
                                    {t === "detached" ? "🏠 Detached" : t === "attached" ? "🏘 Attached" : "🚗 Garage"}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Property photo upload */}
                    <div className={styles.field} style={{ gridColumn: "1 / -1" }}>
                        <label className={styles.label}>Property Photo <span className={df.optional}>(optional — aerial or street view)</span></label>
                        <div className={df.photoUpload} onClick={() => fileInputRef.current?.click()}>
                            {propertyPhotoUrl ? (
                                <div className={df.photoPreview}>
                                    <img src={propertyPhotoUrl} alt="Property" className={df.photoThumb} />
                                    <div className={df.photoMeta}>
                                        <span className={df.photoLabel}>Photo uploaded</span>
                                        <button
                                            type="button"
                                            className={df.removeBtn}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setPropertyPhotoUrl(null);
                                                if (fileInputRef.current) fileInputRef.current.value = "";
                                            }}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className={df.photoPlaceholder}>
                                    <span className={df.photoIcon}>📷</span>
                                    <span className={df.photoHint}>Click to upload or drag and drop</span>
                                </div>
                            )}
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            style={{ display: "none" }}
                            onChange={handlePhotoChange}
                        />
                    </div>

                    {/* Customer motivation */}
                    <div className={styles.field} style={{ gridColumn: "1 / -1" }}>
                        <label className={styles.label}>Primary Motivation</label>
                        <div className={df.motivPills}>
                            {MOTIVATIONS.map((m) => (
                                <button
                                    key={m.value}
                                    type="button"
                                    className={`${df.motivPill} ${customerMotivation === m.value ? df.motivPillActive : ""}`}
                                    onClick={() => setCustomerMotivation(customerMotivation === m.value ? null : m.value)}
                                >
                                    {m.label}
                                </button>
                            ))}
                        </div>
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
