// Units step body — split out of the former combined "Who, Where & Units"
// Step 1. The unit comparison picker is its own step now; Details (customer +
// property + financing, including the property-data pull) lives in Step1Body.
// Reuses Step1Body's CSS module so the card/header styling stays identical.

"use client";

import React from "react";
import type { Floorplan } from "@/lib/rentcast/types";
import type { Defaults } from "@/lib/investment/types";
import { UnitsPanel } from "../UnitsPanel/UnitsPanel";
import s from "../Step1Body/Step1Body.module.css";

const ADU_TYPES: { value: "detached" | "attached" | "garage"; label: string }[] = [
    { value: "detached", label: "Detached" },
    { value: "attached", label: "Attached" },
    { value: "garage",   label: "Garage" },
];

interface Props {
    floorplans: Floorplan[];
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
    labelByUnitId: Record<string, string>;
    setLabelByUnitId: (update: (prev: Record<string, string>) => Record<string, string>) => void;
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
    setBaseCostByAduId: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

export function UnitsBody(props: Props) {
    return (
        <div className={s.root}>
            <section className={s.card}>
                <header className={s.cardHeader}>
                    <span className={s.eyebrow}>Units</span>
                    <div className={s.defaultTypeWrap}>
                        <span className={s.defaultTypeLabel}>Default type</span>
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
                    labelByUnitId={props.labelByUnitId}
                    setLabelByUnitId={props.setLabelByUnitId}
                    onAddCustomFloorplan={props.addCustomFloorplan}
                    onRemoveFloorplan={props.removeCustomFloorplan}
                    onDuplicateFloorplan={props.duplicateFloorplan}
                    setBaseCostByAduId={props.setBaseCostByAduId}
                />
            </section>
        </div>
    );
}
