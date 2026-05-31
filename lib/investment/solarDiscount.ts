// Solar-discount eligibility — the single source of truth. Both the FPA's
// architect-facing badge and the rep's DiscountsPanel call evaluateSolarDiscount()
// so the rule lives in exactly one place.
//
// Rules (per product):
//   • Solar hardware is INCLUDED on every unit 500 sq ft and larger.
//   • The $7,500 solar DISCOUNT then depends on ADU type + size, and on climate
//     zone for detached units:
//       - Attached / garage conversion: eligible when sqft > 500 (strictly).
//       - Detached: eligible when sqft >= 500, capped by CA Title 24 climate zone
//           · zone 10 → max 600 sq ft
//           · zone 9  → max 714 sq ft
//           · every other zone → uncapped
//         When the zone is unknown AND the unit is larger than the strictest cap
//         (600), eligibility can't be decided → status "needs_zone" (never
//         auto-applied) so we don't mis-price.
//       - JADU: never eligible.

export const SOLAR_INCLUDED_MIN_SQFT = 500;
export const SOLAR_DISCOUNT_AMOUNT = 7500;

/** Detached-only square-foot caps by climate zone; zones not listed are uncapped. */
export const DETACHED_ZONE_CAPS: Record<number, number> = { 9: 714, 10: 600 };

/** Strictest cap across all zones — the safe ceiling when the zone is unknown. */
const STRICTEST_CAP = Math.min(...Object.values(DETACHED_ZONE_CAPS));

export type AduType = "detached" | "attached" | "garage_conversion" | "jadu";
export type SolarStatus = "eligible" | "ineligible" | "needs_zone" | "needs_input";

export interface SolarDiscountInput {
    /** Square footage of the unit being built (custom sizes use exact sqft). */
    sqft: number | null;
    /** From FPA siteVisitJson.adu_type. */
    aduType: AduType | string | null;
    /** CA Title 24 climate zone (6–16) from FPA siteVisitJson.climate_zone. */
    climateZone: number | null;
}

export interface SolarDiscountResult {
    /** Solar hardware is included (sqft >= 500), independent of the discount. */
    solarIncluded: boolean;
    status: SolarStatus;
    /** Convenience flag: status === "eligible". */
    eligible: boolean;
    /** Dollar discount to apply when eligible, else 0. */
    amount: number;
    /** The size cap that applied (detached zone 9/10), or null when uncapped/N/A. */
    zoneCap: number | null;
    /** Human-readable explanation for the badge and the rep lock tooltip. */
    reason: string;
}

function normalizeType(t: SolarDiscountInput["aduType"]): AduType | null {
    if (t === "detached" || t === "attached" || t === "garage_conversion" || t === "jadu") return t;
    return null;
}

export function evaluateSolarDiscount(input: SolarDiscountInput): SolarDiscountResult {
    const sqft = input.sqft != null && !Number.isNaN(input.sqft) ? input.sqft : null;
    const aduType = normalizeType(input.aduType);
    const zone =
        input.climateZone != null && !Number.isNaN(input.climateZone) ? input.climateZone : null;

    const none = { amount: 0, zoneCap: null as number | null };

    if (sqft == null) {
        return {
            ...none,
            solarIncluded: false,
            status: "needs_input",
            eligible: false,
            reason: "Enter the ADU square footage to check solar-discount eligibility.",
        };
    }

    const solarIncluded = sqft >= SOLAR_INCLUDED_MIN_SQFT;
    if (!solarIncluded) {
        return {
            ...none,
            solarIncluded: false,
            status: "ineligible",
            eligible: false,
            reason: `Solar is included only on units ${SOLAR_INCLUDED_MIN_SQFT} sq ft and larger.`,
        };
    }

    if (aduType == null) {
        return {
            ...none,
            solarIncluded,
            status: "needs_input",
            eligible: false,
            reason: "Set the ADU type (detached, attached, or garage conversion) to check eligibility.",
        };
    }

    if (aduType === "jadu") {
        return {
            ...none,
            solarIncluded,
            status: "ineligible",
            eligible: false,
            reason: "JADUs don't qualify for the solar discount.",
        };
    }

    // Attached / garage conversion: zone-independent, must exceed 500 sq ft.
    if (aduType === "attached" || aduType === "garage_conversion") {
        const label = aduType === "attached" ? "Attached" : "Garage-conversion";
        if (sqft > SOLAR_INCLUDED_MIN_SQFT) {
            return {
                ...none,
                solarIncluded,
                status: "eligible",
                eligible: true,
                amount: SOLAR_DISCOUNT_AMOUNT,
                reason: `${label} unit over ${SOLAR_INCLUDED_MIN_SQFT} sq ft — solar discount applies.`,
            };
        }
        return {
            ...none,
            solarIncluded,
            status: "ineligible",
            eligible: false,
            reason: `${label} units must exceed ${SOLAR_INCLUDED_MIN_SQFT} sq ft to qualify — this one is exactly ${SOLAR_INCLUDED_MIN_SQFT}.`,
        };
    }

    // Detached: capped by climate zone.
    if (zone == null) {
        if (sqft <= STRICTEST_CAP) {
            return {
                ...none,
                solarIncluded,
                status: "eligible",
                eligible: true,
                amount: SOLAR_DISCOUNT_AMOUNT,
                reason: `Detached at ${sqft} sq ft — within every climate-zone cap, solar discount applies.`,
            };
        }
        return {
            ...none,
            solarIncluded,
            status: "needs_zone",
            eligible: false,
            reason: `Detached at ${sqft} sq ft: set the climate zone — zones 9 (≤714) and 10 (≤600) cap the size; other zones don't.`,
        };
    }

    const cap = DETACHED_ZONE_CAPS[zone] ?? null;
    if (cap == null) {
        return {
            amount: SOLAR_DISCOUNT_AMOUNT,
            zoneCap: null,
            solarIncluded,
            status: "eligible",
            eligible: true,
            reason: `Detached in climate zone ${zone} (uncapped) — solar discount applies.`,
        };
    }
    if (sqft <= cap) {
        return {
            amount: SOLAR_DISCOUNT_AMOUNT,
            zoneCap: cap,
            solarIncluded,
            status: "eligible",
            eligible: true,
            reason: `Detached in climate zone ${zone} at ${sqft} sq ft (≤ ${cap}) — solar discount applies.`,
        };
    }
    return {
        amount: 0,
        zoneCap: cap,
        solarIncluded,
        status: "ineligible",
        eligible: false,
        reason: `Detached in climate zone ${zone}: solar discount caps at ${cap} sq ft, this unit is ${sqft}.`,
    };
}
