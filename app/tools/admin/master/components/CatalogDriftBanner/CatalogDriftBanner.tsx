"use client";

import React from "react";
import type { CatalogDriftReport } from "@/lib/investment/catalogDrift";
import type { Floorplan } from "@/lib/rentcast/types";

interface Props {
    report: CatalogDriftReport | null;
    /** Map from ADU id → display name so the banner can label entries with
     *  something more useful than a cuid. Falls back to the id when missing. */
    selectedAdus: Floorplan[];
    onDismiss?: () => void;
}

function labelForAdu(aduId: string, selectedAdus: Floorplan[]): string {
    if (aduId === "master") return "All units · default";
    return selectedAdus.find((fp) => fp._id === aduId)?.name ?? aduId;
}

/**
 * Warn the admin when an opened proposal references catalog items that no
 * longer exist (deleted or deactivated since the proposal was saved). The
 * banner is informational — the proposal will still load and the orphaned
 * references are harmless at render time (the helpers skip unknown ids), but
 * the rep should know that the saved totals may not be reproducible.
 */
export function CatalogDriftBanner({ report, selectedAdus, onDismiss }: Props) {
    if (!report || report.empty) return null;

    return (
        <div
            role="status"
            style={{
                margin: "0 0 20px 0",
                padding: 16,
                borderRadius: 10,
                background: "#FFF7E6",
                border: "1px solid #F2C97A",
                color: "#5A3F0E",
                fontSize: 13,
                lineHeight: 1.55,
                display: "grid",
                gap: 10,
            }}
        >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                <div>
                    <strong style={{ display: "block", fontSize: 14, color: "#3C2A0A" }}>
                        Catalog drift detected on this proposal
                    </strong>
                    <span style={{ color: "#5A3F0E" }}>
                        Some saved selections reference catalog items that have since been removed.
                        Totals and broadcasts use the live catalog, so these entries are skipped at render time.
                    </span>
                </div>
                {onDismiss && (
                    <button
                        onClick={onDismiss}
                        aria-label="Dismiss drift warning"
                        style={{
                            background: "transparent",
                            border: 0,
                            cursor: "pointer",
                            color: "#5A3F0E",
                            fontSize: 18,
                            lineHeight: 1,
                            padding: "0 4px",
                        }}
                    >
                        ×
                    </button>
                )}
            </div>

            {report.siteWork.length > 0 && (
                <div>
                    <div style={{ fontWeight: 600, color: "#3C2A0A", marginBottom: 4 }}>
                        Site work items removed from catalog ({report.siteWork.length})
                    </div>
                    <ul style={{ margin: 0, paddingLeft: 18 }}>
                        {report.siteWork.map((e, i) => (
                            <li key={`sw-${i}`}>
                                <code style={{ background: "rgba(0,0,0,0.04)", padding: "0 4px", borderRadius: 3 }}>{e.itemId}</code>
                                {" "}— qty {e.qty} · {labelForAdu(e.aduId, selectedAdus)}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {report.discounts.length > 0 && (
                <div>
                    <div style={{ fontWeight: 600, color: "#3C2A0A", marginBottom: 4 }}>
                        Discount presets removed from catalog ({report.discounts.length})
                    </div>
                    <ul style={{ margin: 0, paddingLeft: 18 }}>
                        {report.discounts.map((e, i) => (
                            <li key={`d-${i}`}>
                                <code style={{ background: "rgba(0,0,0,0.04)", padding: "0 4px", borderRadius: 3 }}>{e.slug}</code>
                                {" "}— {labelForAdu(e.aduId, selectedAdus)}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
