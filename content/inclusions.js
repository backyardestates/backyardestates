// Canonical inclusions, sourced from the Backyard Estates ADU proposal
// ("What's Included"). Organized into the six categories shown to customers.
// `getInclusions(solarIncluded)` returns the same data with the Construction
// energy line phrased for the specific floorplan (PV solar is included on
// 2-bedroom plans and larger — Estate 500 through Estate 1200).
export const ROOMS = [
    {
        title: 'Kitchen',
        features: [
            {
                header: 'Cabinets',
                text: 'Wood shaker cabinets, soft-close · pantry · lazy susan · spice and trash roll-outs',
                options: ['light', 'dark', 'blue', 'monochrome', 'olive'],
            },
            {
                header: 'Countertops',
                text: 'Quartz with 4″ backsplash and mitered edge',
                options: [],
            },
            {
                header: 'Appliances',
                text: 'Stainless steel 30″ fridge, range, dishwasher, and over-range microwave',
                options: [],
            },
            {
                header: 'Sink & faucet',
                text: 'Undermount stainless steel sink with garbage disposal and Delta® Antony pulldown faucet',
                options: [],
            },
            {
                header: 'Lighting',
                text: '4″ LED recessed lighting (4–8 per plan)',
                options: [],
            },
        ],
    },
    {
        title: 'Bathroom',
        features: [
            {
                header: 'Shower',
                text: '60″ fiberglass pan or tub with subway-tile walls and Delta® Portwood trim',
                options: [],
            },
            {
                header: 'Vanity',
                text: '30″ wood vanity, soft-close, with undermount sink and quartz top',
                options: ['light', 'dark', 'blue', 'monochrome', 'olive'],
            },
            {
                header: 'Toilet',
                text: 'Elongated low-flow, water-saving toilet',
                options: [],
            },
            {
                header: 'Accessories',
                text: 'Mirror · towel bar · towel ring · paper holder · widespread faucet',
                options: [],
            },
            {
                header: 'Lighting',
                text: '3-light vanity fixture · 2 recessed lights · Nutone® quiet exhaust fan',
                options: [],
            },
        ],
    },
    {
        title: 'Interior',
        features: [
            {
                header: 'Ceilings',
                text: 'Vaulted 8′–10′ ceilings in the great room · 8′ ceilings in bedrooms',
                options: [],
            },
            {
                header: 'Floors & doors',
                text: 'Luxury vinyl plank throughout · shaker 6′8″ passage doors with lever sets',
                options: [],
            },
            {
                header: 'Paint & trim',
                text: 'Dunn-Edwards SuperPaint® · 1×2.5″ casing · 1×4″ baseboard',
                options: [],
            },
            {
                header: 'Electrical',
                text: 'Decora® dimmers · outlets every 12′ · prewired data hub (CAT 6 & coax)',
                options: [],
            },
            {
                header: 'Closets',
                text: 'Mirrored wardrobe doors with shelf and pole',
                options: [],
            },
        ],
    },
    {
        title: 'Exterior',
        features: [
            {
                header: 'Siding & roof',
                text: 'Stucco 16/20 · 30-year asphalt shingles · 8″ Windsor fascia',
                options: [],
            },
            {
                header: 'Windows',
                text: 'White vinyl dual-pane Low-E · Title 24 compliant · 2″ faux-wood blinds',
                options: [],
            },
            {
                header: 'Door',
                text: '36″ Masonite® fiberglass entry door, prehung and primed',
                options: [],
            },
            {
                header: 'Electrical',
                text: 'Dawn-to-dusk light · (2) GFCI patio outlets · EV charger prep',
                options: [],
            },
            {
                header: 'Plumbing',
                text: '1 exterior hose bib',
                options: [],
            },
        ],
    },
    {
        title: 'Construction',
        features: [
            {
                header: 'Structure',
                text: 'Wood-framed · slab-on-grade foundation · 2×4 walls · 5/8″ fire-rated drywall',
                options: [],
            },
            {
                header: 'Insulation',
                text: 'R15 walls + R30 roof · interior and exterior walls insulated',
                options: [],
            },
            {
                // Solar phrasing is rewritten per-floorplan by getInclusions().
                header: 'Energy',
                text: 'CA Title 24 compliant · PV solar system included on 2-bedroom plans and larger',
                solar: true,
                options: [],
            },
            {
                header: 'Roof',
                text: 'Gabled roof · 20″ front/rear overhang · 3×3 concrete patio stoop',
                options: [],
            },
        ],
    },
    {
        title: 'Systems & Utilities',
        features: [
            {
                header: 'Water heater',
                text: 'High-efficiency 50-gallon heat-pump water heater (3.24 EF) with enclosure',
                options: [],
            },
            {
                header: 'HVAC',
                text: 'Mini-split system with flush cassettes · one head per bedroom · heating and cooling',
                options: [],
            },
            {
                header: 'Plumbing',
                text: 'PEX water lines · shutoff valves at every fixture · external exhaust venting',
                options: [],
            },
            {
                header: 'Electrical',
                text: '200A panel + 225 busbar · 100A ADU sub-panel · CAT 6 and coax',
                options: [],
            },
        ],
    },
]

// Returns the inclusion categories with the Construction → Energy line phrased
// for a specific floorplan. PV solar is included on 2-bedroom plans and larger.
export function getInclusions(solarIncluded) {
    return ROOMS.map((room) => {
        if (room.title !== 'Construction') return room
        return {
            ...room,
            features: room.features.map((feature) =>
                feature.solar
                    ? {
                          ...feature,
                          text: solarIncluded
                              ? 'CA Title 24 compliant · PV solar system — included'
                              : 'CA Title 24 compliant · PV solar system available',
                      }
                    : feature
            ),
        }
    })
}

// The city departments Backyard Estates coordinates and the fees included in
// every all-in price (proposal: "We coordinate 11 departments + all city fees").
export const SERVICES = {
    departments: [
        'Planning',
        'Building',
        'Engineering',
        'Public Works',
        'Waste',
        'City / County Fire',
        'Recorder',
        'Water',
        'Electric Provider',
        'School Districts',
        'CA ADU Law',
    ],
    fees: [
        'Address, plan-check, and building fees — admin, inspection, sub-panel, fire',
        'School fees · notarization · permit pull · plan-checker follow-up',
        'Corrections review · state compliance · dedicated PM + superintendent',
    ],
}

export const COLLECTIONS = [
    {
        name: 'light',
        rooms: [
            {
                name: 'kitchen',
                flooring: 'oyster',
                cabinet: 'light',
                countertop: 'fairy-white',
                hardware: 'brushed-nickel',
            },
            {
                name: 'living',
            },
            {
                name: 'bedroom',
                flooring: 'oyster',
                hardware: 'brushed-nickel',
            },
            {
                name: 'bathroom',
                flooring: 'oyster',
                cabinet: 'light',
                countertop: 'fairy-white',
                hardware: 'brushed-nickel',
            },
            {
                name: 'exteriors',
                flooring: 'oyster',
                hardware: 'brushed-nickel',
            },
            ,
            {
                name: 'construction',
                flooring: 'oyster',
                hardware: 'brushed-nickel',
            },
        ],
    },
    {
        name: 'dark',
        rooms: [
            {
                name: 'kitchen',
                flooring: 'espresso',
                cabinet: 'dark',
                countertop: 'calacatta-vega',
                hardware: 'black-matte',
            },
            {
                name: 'living',
                flooring: 'espresso',
                hardware: 'black-matte',
            },
            {
                name: 'bedroom',
                flooring: 'espresso',
                hardware: 'black-matte',
            },
            {
                name: 'bathroom',
                flooring: 'espresso',
                cabinet: 'dark',
                countertop: 'calacatta-vega',
                hardware: 'black-matte',
            },
            {
                name: 'interiors',
                flooring: 'espresso',
                hardware: 'black-matte',
            },
        ],
    },
    {
        name: 'blue',
        rooms: [
            {
                name: 'kitchen',
                flooring: 'malibu',
                cabinet: 'blue',
                countertop: 'galant-gray',
                hardware: 'black-matte',
            },
            {
                name: 'living',
            },
            {
                name: 'bedroom',
                flooring: 'oyster',
                hardware: 'brushed-nickel',
            },
            {
                name: 'bathroom',
                flooring: 'malibu',
                cabinet: 'blue',
                countertop: 'galant-gray',
                hardware: 'black-matte',
            },
            {
                name: 'interiors',
                flooring: 'malibu',
                hardware: 'black-matte',
            },
        ],
    },
    {
        name: 'monochrome',
        rooms: [
            {
                name: 'kitchen',
                flooring: 'gentry',
                cabinet: 'monochrome',
                countertop: 'calacatta-miraggio-gold',
                hardware: 'brushed-nickel',
            },
            {
                name: 'living',
            },
            {
                name: 'bedroom',
                flooring: 'oyster',
                hardware: 'brushed-nickel',
            },
            {
                name: 'bathroom',
                flooring: 'gentry',
                cabinet: 'monochrome',
                countertop: 'calacatta-miraggio-gold',
                hardware: 'brushed-nickel',
            },
            {
                name: 'interiors',
                flooring: 'gentry',
                hardware: 'brushed-nickel',
            },
        ],
    },
    {
        name: 'olive',
        rooms: [
            {
                name: 'kitchen',
                flooring: 'fox-and-hound',
                cabinet: 'olive',
                countertop: 'pure-white',
                hardware: 'brushed-nickel',
            },
            {
                name: 'living',
            },
            {
                name: 'bedroom',
                flooring: 'fox-and-hound',
                hardware: 'brushed-nickel',
            },
            {
                name: 'bathroom',
                flooring: 'fox-and-hound',
                cabinet: 'olive',
                countertop: 'pure-white',
                hardware: 'brushed-nickel',
            },
            {
                name: 'interiors',
                flooring: 'fox-and-hound',
                hardware: 'brushed-nickel',
            },
        ],
    },
]
