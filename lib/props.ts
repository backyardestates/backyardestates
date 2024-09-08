interface LeadPreferences {
    purpose: string
    bedrooms: number
    bathrooms: number
    homeowner: string
    timeline: string
    unitType: string
    homeType: string
}

export interface StepProps {
    setStep: (step: number) => void
    preferences: any
    setPreferences: Function
}
