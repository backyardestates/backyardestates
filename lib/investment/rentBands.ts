export const FLOORPLAN_BANDS: Array<{ key: string; target: number; min: number; max: number }> = [
    { key: "350", target: 350, min: 300, max: 380 },
    { key: "400", target: 400, min: 360, max: 440 },
    { key: "450", target: 450, min: 410, max: 500 },
    { key: "500", target: 500, min: 460, max: 560 },
    { key: "600", target: 600, min: 540, max: 680 },
    { key: "750", target: 750, min: 680, max: 820 },
    { key: "750+", target: 750, min: 680, max: 820 }, // same sqft, different baths handled in adjustments
    { key: "800", target: 800, min: 740, max: 880 },
    { key: "950", target: 950, min: 860, max: 1050 },
    { key: "1200", target: 1200, min: 1050, max: 1350 },
];

export function bandForTargetSqft(targetSqft: number) {
    // pick the closest target band
    let best = FLOORPLAN_BANDS[0];
    let bestDist = Math.abs(targetSqft - best.target);
    for (const b of FLOORPLAN_BANDS) {
        const d = Math.abs(targetSqft - b.target);
        if (d < bestDist) { best = b; bestDist = d; }
    }
    return { minSqft: best.min, maxSqft: best.max, bandKey: best.key };
}