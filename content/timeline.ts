// Single source of truth for the turnkey build timeline shown on the home page
// (TurnkeySection) and the floorplan detail page, so the two never drift.
export type BuildPhaseKey = 'plans' | 'permits' | 'construction'

export interface BuildPhase {
    key: BuildPhaseKey
    title: string
    timeline: string
    items: string[]
}

export const BUILD_PHASES: BuildPhase[] = [
    {
        key: 'plans',
        title: 'Plans',
        timeline: '4–6 Weeks',
        items: [
            'Custom Floor Plans',
            'Site Plan + Elevations',
            'Structural + T24',
            'MEP Engineering',
            'Soils / Survey / Hydrology',
            'Septic (if required)',
            'Full Kitchen Design',
            'Finish Selections',
        ],
    },
    {
        key: 'permits',
        title: 'Permits',
        timeline: 'As Fast as 6 Weeks',
        items: [
            'Planning Department',
            'Building Department',
            'Engineering',
            'Fire Department',
            'School Fees',
            'Impact Fees',
            'Plan Check Corrections',
            'Permit Pull Process',
        ],
    },
    {
        key: 'construction',
        title: 'Construction',
        timeline: '6–10 Weeks',
        items: [
            'Dedicated PM + Superintendent',
            'Weekly Updates',
            'Jobsite Photos',
            'Online Portal (Plans, Corrections, Payments)',
            'City Inspections',
            'Finish Installation',
        ],
    },
]
