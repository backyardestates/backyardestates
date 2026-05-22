"use client";

import React from "react";
import type { Floorplan } from "@/lib/rentcast/types";
import type { AduType } from "@/lib/units/resolveUnitSpec";
import s from "./UnitOverridesPanel.module.css";

interface Props {
    /** The units currently selected for comparison. */
    selectedUnits: Floorplan[];
    /** Global default — used to seed each unit's type when not overridden. */
    globalAduType: AduType | "";

    aduTypeByUnitId: Record<string, AduType>;
    setAduTypeByUnitId: (
        update: (prev: Record<string, AduType>) => Record<string, AduType>
    ) => void;

    bedsByUnitId: Record<string, number>;
    setBedsByUnitId: (
        update: (prev: Record<string, number>) => Record<string, number>
    ) => void;

    bathsByUnitId: Record<string, number>;
    setBathsByUnitId: (
        update: (prev: Record<string, number>) => Record<string, number>
    ) => void;
}

const TYPE_OPTIONS: { value: AduType; label: string }[] = [
    { value: "detached", label: "Detached" },
    { value: "attached", label: "Attached" },
    { value: "garage",   label: "Garage Conversion" },
];

export function UnitOverridesPanel({
    selectedUnits,
    globalAduType,
    aduTypeByUnitId,
    setAduTypeByUnitId,
    bedsByUnitId,
    setBedsByUnitId,
    bathsByUnitId,
    setBathsByUnitId,
}: Props) {
    if (selectedUnits.length === 0) {
        return (
            <div className={s.panel}>
                <div className={s.empty}>
                    Pick at least one floor plan above to start customizing it.
                </div>
            </div>
        );
    }

    function changeType(unitId: string, value: AduType) {
        setAduTypeByUnitId((prev) => ({ ...prev, [unitId]: value }));
    }
    function changeBeds(unitId: string, raw: string) {
        const n = Number(raw);
        if (!Number.isFinite(n)) return;
        setBedsByUnitId((prev) => ({ ...prev, [unitId]: Math.max(0, Math.round(n)) }));
    }
    function changeBaths(unitId: string, raw: string) {
        const n = Number(raw);
        if (!Number.isFinite(n)) return;
        // Allow half-baths (1.5, 2.5, etc.)
        const snapped = Math.max(0, Math.round(n * 2) / 2);
        setBathsByUnitId((prev) => ({ ...prev, [unitId]: snapped }));
    }

    return (
        <div className={s.panel}>
            <div className={s.intro}>
                Customize each comparison unit — type, beds, baths. Overrides flow into
                slides and the agreement automatically.
            </div>

            <div className={s.list}>
                {selectedUnits.map((fp) => {
                    const fallbackType: AduType =
                        globalAduType === "attached" || globalAduType === "garage"
                            ? globalAduType
                            : "detached";
                    const type = aduTypeByUnitId[fp._id] ?? fallbackType;
                    const beds = bedsByUnitId[fp._id] ?? fp.beds ?? fp.bedrooms ?? 0;
                    const baths = bathsByUnitId[fp._id] ?? fp.baths ?? fp.bathrooms ?? 0;

                    return (
                        <div key={fp._id} className={s.row}>
                            <div className={s.unitMain}>
                                <span className={s.unitName}>{fp.name}</span>
                                <span className={s.unitSqft}>
                                    {fp.sqft ? `${fp.sqft.toLocaleString()} sqft` : "—"}
                                </span>
                            </div>

                            <div className={s.field}>
                                <label className={s.label}>Type</label>
                                <select
                                    className={s.select}
                                    value={type}
                                    onChange={(e) => changeType(fp._id, e.target.value as AduType)}
                                >
                                    {TYPE_OPTIONS.map((o) => (
                                        <option key={o.value} value={o.value}>{o.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className={s.field}>
                                <label className={s.label}>Beds</label>
                                <input
                                    type="number"
                                    min={0}
                                    step={1}
                                    className={s.numInput}
                                    value={beds}
                                    onChange={(e) => changeBeds(fp._id, e.target.value)}
                                />
                            </div>

                            <div className={s.field}>
                                <label className={s.label}>Baths</label>
                                <input
                                    type="number"
                                    min={0}
                                    step={0.5}
                                    className={s.numInput}
                                    value={baths}
                                    onChange={(e) => changeBaths(fp._id, e.target.value)}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
