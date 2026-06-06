// Single source of truth for the Formal Property Analysis (FPA) story shown on
// the pricing page (and reusable on /about-us/our-process later).
//
// Facts sourced from the canonical "250+ Checklist" spreadsheet (Google Drive
// id 1JItJL4s80AX94ekp0IQtWcTYTQSUw1P0YMfWb5vcr68 — 134 items across the six
// categories below) and the FPA marketing docs: the office visit is FREE; the
// FPA is $500, fully credited toward construction; outputs are a confirmed
// buildable plan, a reliable project cost, and a clear path forward.

export const FPA_FEE = 500
export const FPA_FEE_CREDIT_NOTE = 'fully credited toward your build'
export const FPA_POINTS_LABEL = '250+'
// Numeric twin of FPA_POINTS_LABEL, used for the count-up animation.
export const FPA_POINTS_VALUE = 250

export interface FpaStep {
    title: string
    detail: string
    note?: string
}

// The path from published standard pricing to the customer's exact number.
export const FPA_STEPS: FpaStep[] = [
    {
        title: 'Free office visit',
        detail: 'We pull up your property on the big screen and place floor plans on your actual lot — sizes, layouts, placement.',
        note: 'No pressure, no commitment',
    },
    {
        title: 'Formal Property Analysis',
        detail: 'Our architect and engineering team visit your property and verify 250+ items — utilities, site conditions, and city rules.',
        note: '$500, fully credited toward your build',
    },
    {
        title: 'Your formal proposal',
        detail: 'A confirmed buildable solution with your exact all-in price — a reliable price you can actually build on.',
        note: 'No assumptions, no surprises',
    },
]

export interface FpaCategory {
    title: string
    examples: string
}

// The six verification categories, with representative items from the checklist.
export const FPA_CATEGORIES: FpaCategory[] = [
    {
        title: 'Property basics',
        examples:
            'Zoning, setbacks, lot layout, ADU placement options, permit history',
    },
    {
        title: 'Site conditions',
        examples:
            'Slope, soil, easements, drainage, trees, retaining-wall needs',
    },
    {
        title: 'Utilities',
        examples:
            'Sewer depth & material, panel size, water, gas, utility run lengths and complexity',
    },
    {
        title: 'Fixtures & loads',
        examples:
            'Fixture counts, HVAC and water-heater demands, appliance power loads',
    },
    {
        title: 'Structure & design',
        examples:
            'Roof and foundation type, max ADU size, height limits, finish matching',
    },
    {
        title: 'City compliance',
        examples:
            'Fire sprinklers, school & plan-check fees, lot coverage, Title 24',
    },
]

// What the customer walks away with.
export const FPA_OUTPUTS = [
    'A confirmed buildable solution',
    'A reliable project cost',
    'A clear path forward',
]
