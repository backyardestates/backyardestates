// types/normalizedProperty.ts
export interface NormalizedProperty {
    id: string
    name: string
    slug: string
    bed: number
    bath: number
    sqft: number
    featured?: boolean
    completed?: boolean
    image?: string | null
    isLegacy: boolean
}
