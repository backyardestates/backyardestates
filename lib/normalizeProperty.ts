// lib/normalizeProperty.ts
import { NormalizedProperty } from './normalizedProperty'

export function normalizeLegacyProperty(p: any): NormalizedProperty {
    return {
        id: p._id,
        name: p.name,
        slug: p.slug,
        bed: p.bed,
        bath: p.bath,
        sqft: p.sqft,
        featured: p.featured ?? false,
        completed: false,
        image: p.thumbnail?.url ?? null,
        isLegacy: true,
    }
}

export function normalizeNewProperty(p: any): NormalizedProperty {
    return {
        id: p._id,
        name: p.name,
        slug: p.slug,
        bed: p.bed,
        bath: p.bath,
        sqft: p.sqft,
        featured: p.featured ?? false,
        completed: p.completed ?? false,
        image: p.photos?.[0]?.url ?? null,
        isLegacy: false,
    }
}
