// Redesigned Step 1 body — replaces the stacked composition of DealForm +
// PipedriveLinkPanel + InvestmentControls + UnitOverridesPanel with one
// cohesive three-section layout (Customer → Property → Units).
//
// Notable simplifications:
//   • Removed the *global* aduType chip strip from the form. It now lives
//     inside the Units section as "Default type for new units" so it's
//     contextual to where it's used — no longer a separate concern up top.
//   • Removed the explicit "base floorplan" dropdown. floorplanId is auto-
//     synced to the first compared unit, which is also what the rest of
//     the codebase already assumes the "base" unit is.
//   • Removed the property-photo uploader. Slide 1's cover image is hard-
//     pinned to office.png anyway, so the field was vestigial.
//   • PipedriveLinkPanel collapsed into a compact strip inside the Customer
//     section — no longer a section of its own.

"use client";

import React, { useRef } from "react";
import type { Floorplan } from "@/lib/rentcast/types";
import type { CustomerMotivation } from "@/lib/store/presentationStore";
import type { Defaults } from "@/lib/investment/types";
import { UnitsPanel } from "../UnitsPanel/UnitsPanel";
import { PipedriveLinkPanel } from "../PipedriveLinkPanel/PipedriveLinkPanel";
import s from "./Step1Body.module.css";

const MOTIVATIONS: { value: NonNullable<CustomerMotivation>; label: string }[] = [
    { value: "family", label: "Family" },
    { value: "income", label: "Income" },
    { value: "investment", label: "Investment" },
];

const ADU_TYPES: { value: "detached" | "attached" | "garage"; label: string }[] = [
    { value: "detached", label: "Detached" },
    { value: "attached", label: "Attached" },
    { value: "garage",   label: "Garage" },
];

interface Props {
    // Customer
    customerName: string;
    setCustomerName: (v: string) => void;
    customerMotivation: CustomerMotivation;
    setCustomerMotivation: (m: CustomerMotivation) => void;
    pipedrivePersonId: string | null;
    pipedriveDealId: string | null;
    setPipedrivePersonId: (n: string | null) => void;
    setPipedriveDealId: (n: string | null) => void;

    // Property
    AddressAutocomplete: React.ComponentType<any>;
    address: string;
    setAddress: (v: string) => void;
    owed: string;
    setOwed: (v: string) => void;
    currentFirstPmtMonthly: string;
    setCurrentFirstPmtMonthly: (v: string) => void;
    propertyPhotoUrl: string | null;
    setPropertyPhotoUrl: (url: string | null) => void;
    loading: boolean;
    error: string | null;

    // Units — picker + base + overrides
    floorplans: Floorplan[];
    selectedFloorplan: Floorplan | null;
    floorplanId: string;
    setFloorplanId: (v: string) => void;
    aduCompareIds: string[];
    aduType: "detached" | "attached" | "garage" | "";
    setAduType: (v: "detached" | "attached" | "garage" | "") => void;
    aduTypeByUnitId: Record<string, "detached" | "attached" | "garage">;
    setAduTypeByUnitId: (
        update: (prev: Record<string, "detached" | "attached" | "garage">) => Record<string, "detached" | "attached" | "garage">
    ) => void;
    bedsByUnitId: Record<string, number>;
    setBedsByUnitId: (update: (prev: Record<string, number>) => Record<string, number>) => void;
    bathsByUnitId: Record<string, number>;
    setBathsByUnitId: (update: (prev: Record<string, number>) => Record<string, number>) => void;

    defaults: Defaults;
    updateDefault: <K extends keyof Defaults>(key: K, next: Defaults[K]) => void;
    toggleAdu: (id: string) => void;
    addCustomFloorplan: (input: {
        name?: string;
        sqft: number;
        price: number;
        bedrooms?: number;
        bathrooms?: number;
        imageUrl?: string;
    }) => void;
    removeCustomFloorplan: (id: string) => void;
    duplicateFloorplan?: (id: string) => void;
    addBathroomUpcharge: (unitId: string) => void;
}

export function Step1Body(props: Props) {
    // NOTE: we deliberately do NOT sync `floorplanId` from `aduCompareIds[0]`
    // here. A previous version of this component did, but it created a
    // feedback loop with AdminMasterClient's selectedFloorplan-driven
    // `pickCompareIdsWindow` effect — every time the rep removed the first
    // unit, the window would re-seed and clobber their other selections.
    // `floorplanId` stays at whatever the snapshot / initial seed set; the
    // merged Step 1 manages comparison selection directly.

    const photoInputRef = useRef<HTMLInputElement>(null);

    function handlePhotoFile(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        // base64 (not blob:) so BroadcastChannel can ship it to the presenter tab.
        const reader = new FileReader();
        reader.onload = (ev) => {
            const result = ev.target?.result;
            if (typeof result === "string") props.setPropertyPhotoUrl(result);
        };
        reader.readAsDataURL(file);
    }

    return (
        <div className={s.root}>
            {/* ── Customer ───────────────────────────────────────────── */}
            <section className={s.section}>
                <header className={s.sectionHeader}>
                    <span className={s.sectionLabel}>Customer</span>
                </header>

                <div className={`${s.grid} ${s.grid2col}`}>
                    <div className={s.field}>
                        <label className={s.label} htmlFor="step1-name">Name</label>
                        <input
                            id="step1-name"
                            className={s.input}
                            value={props.customerName}
                            onChange={(e) => props.setCustomerName(e.target.value)}
                            placeholder="Ray & Bonnie Shouse"
                        />
                    </div>

                    <div className={s.field}>
                        <label className={s.label}>Primary motivation</label>
                        <div className={s.chips} role="radiogroup" aria-label="Customer motivation">
                            {MOTIVATIONS.map((m) => {
                                const active = props.customerMotivation === m.value;
                                return (
                                    <button
                                        key={m.value}
                                        type="button"
                                        role="radio"
                                        aria-checked={active}
                                        className={`${s.chip} ${active ? s.chipActive : ""}`}
                                        onClick={() =>
                                            props.setCustomerMotivation(active ? null : m.value)
                                        }
                                    >
                                        {m.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className={s.pipedriveStrip}>
                    <PipedriveLinkPanel
                        pipedrivePersonId={props.pipedrivePersonId}
                        pipedriveDealId={props.pipedriveDealId}
                        seedQuery={props.customerName || props.address}
                        onChange={({ personId, dealId }) => {
                            props.setPipedrivePersonId(personId);
                            props.setPipedriveDealId(dealId);
                        }}
                    />
                </div>
            </section>

            {/* ── Property ───────────────────────────────────────────── */}
            <section className={s.section}>
                <header className={s.sectionHeader}>
                    <span className={s.sectionLabel}>Property</span>
                    {props.loading && (
                        <span className={s.sectionHint}>Pulling property data…</span>
                    )}
                </header>

                <div className={`${s.grid}`}>
                    <div className={s.field}>
                        <label className={s.label}>Address</label>
                        <props.AddressAutocomplete
                            value={props.address}
                            onChange={(v: string) => props.setAddress(v)}
                            onResolved={(d: any) => props.setAddress(d.formattedAddress)}
                        />
                    </div>
                </div>

                <div className={`${s.grid} ${s.grid2col}`} style={{ marginTop: 14 }}>
                    <div className={s.field}>
                        <label className={s.label} htmlFor="step1-owed">Mortgage balance</label>
                        <div className={s.moneyWrap}>
                            <span className={s.moneyPrefix}>$</span>
                            <input
                                id="step1-owed"
                                className={s.input}
                                value={props.owed}
                                onChange={(e) => props.setOwed(e.target.value)}
                                placeholder="250,000"
                                inputMode="numeric"
                            />
                        </div>
                    </div>

                    <div className={s.field}>
                        <label className={s.label} htmlFor="step1-pmt">Current monthly payment</label>
                        <div className={s.moneyWrap}>
                            <span className={s.moneyPrefix}>$</span>
                            <input
                                id="step1-pmt"
                                className={s.input}
                                value={props.currentFirstPmtMonthly}
                                onChange={(e) => props.setCurrentFirstPmtMonthly(e.target.value)}
                                placeholder="1,000"
                                inputMode="numeric"
                            />
                        </div>
                    </div>
                </div>

                <div className={s.photoRow}>
                    <input
                        ref={photoInputRef}
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={handlePhotoFile}
                    />
                    {props.propertyPhotoUrl ? (
                        <>
                            <img
                                src={props.propertyPhotoUrl}
                                alt="Property"
                                className={s.photoThumb}
                            />
                            <span className={s.photoLabel}>Site photo attached</span>
                            <button
                                type="button"
                                className={s.photoLink}
                                onClick={() => photoInputRef.current?.click()}
                            >
                                Replace
                            </button>
                            <button
                                type="button"
                                className={s.photoLinkDanger}
                                onClick={() => props.setPropertyPhotoUrl(null)}
                            >
                                Remove
                            </button>
                        </>
                    ) : (
                        <>
                            <span className={s.photoLabel}>Site photo</span>
                            <span className={s.photoMeta}>Aerial or street view — shown on slide 2</span>
                            <button
                                type="button"
                                className={s.photoLink}
                                onClick={() => photoInputRef.current?.click()}
                            >
                                Upload
                            </button>
                        </>
                    )}
                </div>

                {props.error && <div className={s.error} role="alert">{props.error}</div>}
            </section>

            {/* ── Units ──────────────────────────────────────────────── */}
            <section className={s.section}>
                <header className={s.sectionHeader}>
                    <span className={s.sectionLabel}>Units</span>
                    <div className={s.defaultTypeWrap}>
                        <span className={s.defaultTypeLabel}>Default type:</span>
                        <div className={s.chips}>
                            {ADU_TYPES.map((t) => {
                                const active = props.aduType === t.value;
                                return (
                                    <button
                                        key={t.value}
                                        type="button"
                                        className={`${s.chip} ${active ? s.chipActive : ""}`}
                                        onClick={() => props.setAduType(active ? "" : t.value)}
                                        title="Applied to newly-added units; can be overridden per unit below"
                                    >
                                        {t.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </header>

                <UnitsPanel
                    allFloorplans={props.floorplans}
                    aduCompareIds={props.aduCompareIds}
                    toggleAdu={props.toggleAdu}
                    defaults={props.defaults}
                    updateDefault={props.updateDefault}
                    globalAduType={props.aduType}
                    aduTypeByUnitId={props.aduTypeByUnitId}
                    setAduTypeByUnitId={props.setAduTypeByUnitId}
                    bedsByUnitId={props.bedsByUnitId}
                    setBedsByUnitId={props.setBedsByUnitId}
                    bathsByUnitId={props.bathsByUnitId}
                    setBathsByUnitId={props.setBathsByUnitId}
                    onAddCustomFloorplan={props.addCustomFloorplan}
                    onRemoveFloorplan={props.removeCustomFloorplan}
                    onDuplicateFloorplan={props.duplicateFloorplan}
                    onAddBathroomUpcharge={props.addBathroomUpcharge}
                />
            </section>
        </div>
    );
}
