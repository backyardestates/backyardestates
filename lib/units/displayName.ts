// Display helper for ADU unit names. A unit's custom "tag" (e.g. "Hillside")
// distinguishes duplicates without touching the underlying Floorplan.name or the
// auto "(N)" duplicate suffix. When a tag is set it replaces the "(N)" in
// display; otherwise the "(N)" marker is shown so duplicates stay distinguishable.

const DUP_SUFFIX = /\s*\((\d+)\)\s*$/;

/** Strip a trailing " (N)" duplicate marker from a unit name. */
export function baseUnitName(name: string): string {
    return (name ?? "").replace(DUP_SUFFIX, "").trim();
}

export interface UnitNameParts {
    /** The estate name with any "(N)" stripped, e.g. "Estate 1200". */
    base: string;
    /** The custom tag to show after the name, if set. */
    tag: string | null;
    /** The duplicate number ("1") when the name had a "(N)" suffix. */
    dupNum: string | null;
}

/**
 * Split a unit name + optional custom label into display parts. Render rule:
 * show `base`, then ` · {tag}` when a tag exists, else ` ({dupNum})` when it's a
 * duplicate, else nothing.
 */
export function unitNameParts(name: string, label?: string | null): UnitNameParts {
    const raw = name ?? "";
    const m = raw.match(DUP_SUFFIX);
    const base = (m ? raw.slice(0, m.index) : raw).trim();
    const dupNum = m ? m[1] : null;
    const tag = label && label.trim() ? label.trim() : null;
    return { base, tag, dupNum };
}

/** The suffix to append after the base name in plain-text contexts. */
export function unitNameSuffix(name: string, label?: string | null): string {
    const { tag, dupNum } = unitNameParts(name, label);
    if (tag) return ` · ${tag}`;
    if (dupNum) return ` (${dupNum})`;
    return "";
}

/** Full single-string display name (plain text). */
export function unitDisplayName(name: string, label?: string | null): string {
    return baseUnitName(name) + unitNameSuffix(name, label);
}
