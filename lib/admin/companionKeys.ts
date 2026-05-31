/**
 * Per-proposal scoping for the panel-owned localStorage keys (site-work +
 * discounts) and the presenter sync handoff.
 *
 * These used to be single GLOBAL keys (`swp_master`, `swp_custom`, `dp_master`,
 * `dp_custom`, `be_present_state`) shared across every proposal. Opening one
 * client, editing costs, then switching to another client without saving bled
 * the first client's costs/discounts into the second — and the autosave could
 * then persist the contaminated numbers into the second client's draft.
 *
 * The fix: namespace every one of those keys by a per-proposal scope. The scope
 * is resolved ONCE per document from the URL and frozen for the page lifetime.
 * The admin tool now does a full reload on every proposal switch, so a reload
 * re-resolves the scope cleanly. Resolving from the URL (rather than threading a
 * prop) means even a first-render `useState` initializer inside a child panel
 * reads the correct scope before any setter has run.
 *
 *   - admin tool   → `?proposalId=<id>` or `?address=<addressKey>`
 *   - presenter    → `?scope=<scope>` (passed by `openPresenterWindow`)
 *   - brand-new    → a fresh `new_<uuid>` per page load (two new proposals in
 *                    separate tabs, or after a "New proposal" reload, never share keys)
 */

export const COMPANION_BASES = ["swp_master", "swp_custom", "dp_master", "dp_custom"] as const;
export type CompanionBase = (typeof COMPANION_BASES)[number];

let activeScope: string | null = null;

function deriveScope(): string {
    if (typeof window === "undefined") return "__ssr__";
    const p = new URLSearchParams(window.location.search);
    // `?address` is already a normalized addressKey; `?proposalId` is a CUID.
    const fromUrl = p.get("scope") || p.get("proposalId") || p.get("address");
    if (fromUrl && fromUrl.trim()) return fromUrl.trim();
    const rand =
        typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : Math.random().toString(36).slice(2);
    return `new_${rand}`;
}

/** The frozen per-proposal scope for this page/document. */
export function getCompanionScope(): string {
    if (activeScope == null) activeScope = deriveScope();
    return activeScope;
}

/**
 * Pin the scope explicitly (e.g. the admin tool fixing the scope it resolved).
 * Optional — call sites that don't pin still get the correct value via the URL
 * fallback in {@link getCompanionScope}.
 */
export function setCompanionScope(scope: string): void {
    activeScope = scope && scope.trim() ? scope.trim() : deriveScope();
}

/** The actual localStorage key for a companion base under the active scope. */
export function scopedCompanionKey(base: string): string {
    return `${base}:${getCompanionScope()}`;
}

/** Read a companion value from its scoped localStorage key. */
export function readCompanion(base: CompanionBase): string | null {
    if (typeof window === "undefined") return null;
    try {
        return window.localStorage.getItem(scopedCompanionKey(base));
    } catch {
        return null;
    }
}

/** Write (or, when `value` is null, clear) a companion value at its scoped key. */
export function writeCompanion(base: CompanionBase, value: string | null): void {
    if (typeof window === "undefined") return;
    try {
        if (value == null) window.localStorage.removeItem(scopedCompanionKey(base));
        else window.localStorage.setItem(scopedCompanionKey(base), value);
    } catch {
        /* quota / private mode — best effort, the DB draft is the source of truth */
    }
}
