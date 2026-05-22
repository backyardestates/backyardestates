// Per-unit override resolvers.
//
// The merged Step 1 lets the admin override aduType/beds/baths per unit.
// Anywhere downstream (slides, agreement, presenter wire) that needs to read
// the *effective* spec for a unit should go through these helpers — never
// reach into the override maps or the floorplan directly. That keeps the
// "override beats default beats floorplan" priority in one place.

export type AduType = "detached" | "attached" | "garage";

export interface FloorplanLike {
    _id?: string;
    /** Sanity uses `bed`; some other shapes use `beds`. Accept either. */
    bed?: number;
    beds?: number;
    bath?: number;
    baths?: number;
}

/**
 * Pick the ADU type for a unit. Priority:
 *   1. The per-unit override from `aduTypeByUnitId[unitId]`
 *   2. The global proposal-level `aduType` (Step 1's default)
 *   3. "detached" as the final fallback
 */
export function resolveAduType(
    unitId: string,
    aduTypeByUnitId: Record<string, AduType> | undefined,
    globalDefault: AduType | "" | undefined,
): AduType {
    const override = aduTypeByUnitId?.[unitId];
    if (override) return override;
    if (globalDefault === "detached" || globalDefault === "attached" || globalDefault === "garage") {
        return globalDefault;
    }
    return "detached";
}

const TYPE_LABELS: Record<AduType, string> = {
    detached: "Detached ADU",
    attached: "Attached ADU",
    garage: "Garage Conversion",
};

export function aduTypeLabel(t: AduType): string {
    return TYPE_LABELS[t];
}

/** Beds: per-unit override → floorplan.beds → floorplan.bed → 0. */
export function resolveBeds(
    unit: FloorplanLike | null | undefined,
    bedsByUnitId: Record<string, number> | undefined,
): number {
    const id = unit?._id;
    if (id && bedsByUnitId && bedsByUnitId[id] != null) return bedsByUnitId[id];
    return unit?.beds ?? unit?.bed ?? 0;
}

/** Baths: per-unit override → floorplan.baths → floorplan.bath → 0. */
export function resolveBaths(
    unit: FloorplanLike | null | undefined,
    bathsByUnitId: Record<string, number> | undefined,
): number {
    const id = unit?._id;
    if (id && bathsByUnitId && bathsByUnitId[id] != null) return bathsByUnitId[id];
    return unit?.baths ?? unit?.bath ?? 0;
}
