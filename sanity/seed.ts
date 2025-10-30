import { createClient } from "next-sanity"
// Initialize the client


const includedItemsData = [
    {
        title: "What We Built Into This ADU",
        description: "Project: Construction of a custom 749 square foot, 2 bed / 2 bath, turnkey and move-in ready Accessory Dwelling Unit (ADU) at the Project Site",
        items: [
            "Standard ADU Plans & Permitting - Architectural (including up to two revisions during design phase), Structural & Title 24",
            "Standard ADU Finishes - Selections made during design meeting prior to breaking ground",
            "Stainless Steel Kitchen appliances (Backyard Estates spec)",
            "Stucco Exterior",
            "Roof standard pitch up to 4:12 slope",
            "Standard site work includes foundation based on a rise of no more than 12” above grade, below grade rough plumbing, standard utility lengths through the same trench, and new 200 amp max electrical panel servicing both main home and ADU"
        ]
    },
    {
        title: "The Structure & Systems That Bring It to Life",
        items: [
            "Building foundation",
            "Rebar",
            "Framing - Standard 2x4",
            "Plan check corrections",
            "Finish carpentry",
            "Caulking",
            "Building insulation",
            "Roofing",
            "Sheet Metal flashings",
            "Lath and plaster",
            "Drywall",
            "Baseboard",
            "Interior painting, and fascia",
            "Bath accessories furnish and install",
            "Appliances for kitchen dishwasher, microwave, oven and MW hood",
            "Blinds and shades for all windows",
            "Rough and finish plumbing",
            "Sewer, water, and water main",
            "Plumbing fixtures, and toilet",
            "Water heater",
            "In ground plumbing",
            "HVAC",
            "Garbage disposal",
            "Relocate FAU, condensate lines, and safety pan",
            "Rough and finish electrical",
            "Lighting (per plans)",
            "Data conduit",
            "Cleanup"
        ]
    },
    {
        title: "Finishes & Features That Make It Move-In Ready",
        items: [
            "Doors and frames",
            "Finish hardware",
            "Windows",
            "Bathroom mirror",
            "Shaker style cabinetry (42” high) with crown moulding (soft close)",
            "Tub shower insert with shower head and tub head (standalone shower insert can be provided at request)",
            "Vanity",
            "Lever entry handle with deadbolt lock",
            "Interior doors lever handles",
            "Square pull bars on kitchen cabinets and drawers",
            "Hidden soft close hinges",
            "Single lever pull down kitchen faucet, 4”",
            "Widespread dual handle faucets for bathroom",
            "Bedroom mirrored closet doors",
            "Electrical outlets",
            "3 light fixture over vanity",
            "Bathroom square undermount sink",
            "Bathroom two handle faucet",
            "2” white vinyl window coverings",
            "Electric Stove (standard 4 burner)",
            "Refrigerator with Water Dispenser (exception for units with < 30\" wide opening, no water dispenser)",
            "Stainless steel undermount single cell sink",
            "Single lever faucet with pullout",
            "4” recessed can lights (per reflected ceiling plan)",
            "Hang only lighting fixtures (owner furnished)",
            "Rocker light switches",
            "Brushed nickel pull bars",
            "Quartz countertop with 4” wall slab backsplash (soft close)",
            "Outlets (standard or GFI as indicated on plans)",
            "Ceiling fans with lighting (in bedrooms)",
            "LVP (Luxury Vinyl Plank) Flooring throughout",
            "Closet with shelf and pole",
            "Ceiling fan with light",
            "Bathroom accessories - towel bar, hand towel ring, toilet paper ring",
            "Two tone paint (interior wall color and white ceilings, doors, baseboards, casing, etc.)",
            "Pantry / Linen closet",
            "Shoe kicks",
            "Molding / Baseboards",
            "Vaulted ceiling over living dining room 8’-10’ as allowable per jurisdiction (8’ flat ceilings in other bedrooms)",
            "30 gallon electric water heater, per title 24 standards",
            "Slotted laundry room door for ventilation",
            "Doorstops",
            "Stucco exterior",
            "Asphalt shingle roofing",
            "GFI exterior receptacle with bubble cover",
            "Exterior light",
            "Front hose bib"
        ]
    },
    {
        title: "Site-Specific Work for This Property",
        items: [
            "New water meter",
            "Encroachment permit",
            "Second electrical meter",
            "Grading of flow lines",
            "Tile roof",
            "Fire sprinklers",
            "Sewer scope",
            "Additional 106 lf of trenching",
            "Additional 106 lf of utilities",
            "Additional 169 lf of electrical lines",
            "174 sf of concrete cut and repour",
            "Siding",
            "Trim"
        ]
    }
];

const client = createClient({
    projectId: '4sw2w31c',
    dataset: 'production',
    apiVersion: '2025-07-25',     // or your dataset name
    token: process.env.SANITY_SEED_TOKEN, // Must have write access
    useCdn: false,                 // `false` if you want to ensure fresh data
})

const openHouseId = '1b960950-9570-4558-bf77-fc3626f67aa9'

export async function seedIncludedItems() {
    try {
        const result = await client
            .patch(openHouseId) // find the document
            .set({ includedItems: includedItemsData }) // set includedItems field
            .commit({ autoGenerateArrayKeys: true }) // generates unique keys for array items

        console.log('Successfully updated open house with included items:', result)
    } catch (err) {
        console.error('Error updating Sanity document:', err)
    }
}
