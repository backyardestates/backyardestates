// Helpers that derive real, data-backed facts for the floorplan page from the
// estate's properties (works across both the new and legacy schemas).

type EstateLike = {
    address?: { city?: string | null } | null
    location?: string | null
}

/** A property's city: new schema uses address.city; legacy uses a "City, ST" string. */
export function cityOf(p: EstateLike): string | undefined {
    const c = p?.address?.city
    if (c && c.trim()) return c.trim()
    const loc = p?.location
    if (typeof loc === 'string' && loc.trim()) return loc.split(',')[0].trim()
    return undefined
}

/** Unique cities across an estate's properties, in first-seen order. */
export function uniqueCities(estates: EstateLike[] = []): string[] {
    const out: string[] = []
    for (const e of estates) {
        const c = cityOf(e)
        if (c && !out.includes(c)) out.push(c)
    }
    return out
}

/** Human list: "Upland, Claremont and San Dimas" or "Upland, Claremont and 4 more". */
export function formatCities(cities: string[], max = 3): string {
    if (!cities.length) return ''
    if (cities.length === 1) return cities[0]
    if (cities.length <= max) {
        return cities.slice(0, -1).join(', ') + ' and ' + cities[cities.length - 1]
    }
    return `${cities.slice(0, max).join(', ')} and ${cities.length - max} more`
}

/** Plain-English size context relative to other plans with the same bed count. */
export function sqftQualifier(
    current: { bed?: number | null; sqft?: number | null },
    all: { bed?: number | null; sqft?: number | null }[] = []
): string | null {
    if (current?.sqft == null || current?.bed == null) return null
    const sameBed = all.filter(
        (f) => f.bed === current.bed && typeof f.sqft === 'number'
    ) as { bed: number; sqft: number }[]
    if (sameBed.length < 2) return null

    const sizes = sameBed.map((f) => f.sqft).sort((a, b) => a - b)
    const max = sizes[sizes.length - 1]
    const median = sizes[Math.floor(sizes.length / 2)]
    const bedLabel = current.bed === 0 ? 'studio' : `${current.bed}-bedroom`

    if (current.sqft >= max) {
        return current.bed === 0
            ? 'Our most spacious studio layout'
            : `Our largest ${bedLabel} layout`
    }
    if (current.sqft >= median) return `One of our larger ${bedLabel} layouts`
    return null
}
