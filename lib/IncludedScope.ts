// lib/siteSpecificWork.data.ts
// Objects + structure for your parent component (3 sections).
// Keep IncludedPills reusable by passing a per-section config later.

export type Includedcategory =
    | "design"
    | "permits"
    | "construction"
    | "project_management"
    | "design_finish_features"
    | "optional_upgrades"
    | "site_specific"
    | (string & {});

export type IncludedItem = {
    id: string;
    category: Includedcategory;
    title: string;
    description: string;
    modal: {
        overview: string;
        whatsIncluded?: string[];
        whyItMatters?: string;
        commonQuestions?: string[];
        notes?: string[];
        /** Optional extras that your future modal can render */
        estCost?: { min: number; max: number; display: string };
        avoidIfPossible?: { title: string; detail?: string }[];
        triggers?: { key: string; title: string }[];
        howWeAssess?: string[];
    };
};

/** SECTION #1 — What's included (base price) */
export const INCLUDED_BASE: IncludedItem[] = [
    // ===== Design =====
    {
        id: "arch_design",
        category: "design",
        title: "Architectural Design",
        description: "Professional design tailored to your property and ADU goals.",
        modal: {
            overview:
                "We handle architectural design from concept to permit-ready drawings—so the ADU looks great, functions well, and meets local code.",
            whatsIncluded: [
                "Design coordination and plan development",
                "Code-aware layout + exterior design",
                "Integration with structural and energy requirements",
            ],
            whyItMatters:
                "Strong design prevents delays, reduces rework, and protects your budget by getting key decisions made early.",
            commonQuestions: [
                "Can you match my main home style?",
                "Can we customize the floorplan?",
                "How long does design take?",
            ],
            notes: [
                "Customization options depend on your selected plan + site constraints.",
            ],
        },
    },
    {
        id: "floor_plan",
        category: "design",
        title: "Floor Plan",
        description: "Interior layout showing rooms, dimensions, and flow.",
        modal: {
            overview:
                "The floor plan is the blueprint for how your ADU lives day-to-day—layout, storage, and comfort.",
            whatsIncluded: [
                "Room layout with dimensions and labels",
                "Door and window placement coordination",
                "Code clearances and circulation planning",
            ],
            whyItMatters:
                "A good plan makes the ADU feel larger, more functional, and more valuable—especially in smaller square footage.",
            commonQuestions: [
                "Can we move the laundry?",
                "Can we add more storage?",
                "Can we adjust bedroom sizes?",
            ],
        },
    },
    {
        id: "site_plan",
        category: "design",
        title: "Site Plan",
        description: "Property map showing ADU placement, setbacks, and notes for permits.",
        modal: {
            overview:
                "The site plan shows where the ADU sits on your lot and how it complies with setbacks, access, and utility routing.",
            whatsIncluded: [
                "ADU placement on the property",
                "Setback references and exterior dimensions",
                "Key site notes needed for permitting",
            ],
            whyItMatters:
                "Placement affects cost, privacy, yard space, and permitting—getting this right early protects timeline and budget.",
            commonQuestions: [
                "How close can it be to the fence?",
                "Will we lose parking?",
                "Can it go where the patio is now?",
            ],
        },
    },
    {
        id: "schematics",
        category: "design",
        title: "Schematics",
        description: "Early drawings used to confirm direction and feasibility.",
        modal: {
            overview:
                "Schematics help align the design direction early—before final construction drawings—so decisions are made upfront.",
            whatsIncluded: [
                "Concept-level layout direction",
                "Early coordination for key constraints",
                "Planning for systems and approvals",
            ],
            whyItMatters:
                "Catching issues early reduces change orders and keeps the project moving smoothly.",
            commonQuestions: [
                "Can we see multiple layout options?",
                "When do we finalize the design?",
            ],
        },
    },
    {
        id: "elevations",
        category: "design",
        title: "Elevations",
        description: "Exterior views showing style, materials, and window/door placement.",
        modal: {
            overview:
                "Elevations show how the ADU will look from each side and help the city review height, appearance, and compliance.",
            whatsIncluded: [
                "Exterior views (front/rear/sides as applicable)",
                "Window/door placement coordination",
                "Exterior material notes per spec",
            ],
            whyItMatters:
                "This ensures the ADU looks intentional, matches your property’s character, and passes plan review with fewer revisions.",
            commonQuestions: [
                "Can we match my main home?",
                "Can we add more windows?",
                "Can we change exterior style?",
            ],
        },
    },
    {
        id: "electrical_plan",
        category: "design",
        title: "Electrical Plan",
        description: "Layout of outlets, lighting, switches, and required circuits.",
        modal: {
            overview:
                "We plan the electrical layout so everything is placed logically and meets code—before walls close up.",
            whatsIncluded: [
                "Outlet + switch locations per plan",
                "Lighting layout and controls",
                "Dedicated circuits/panel coordination as required",
            ],
            whyItMatters:
                "Good planning reduces costly changes later and makes the ADU feel thoughtfully designed.",
            commonQuestions: [
                "Can I add extra outlets or recessed lights?",
                "What about exterior outlets?",
            ],
        },
    },
    {
        id: "structural_engineering",
        category: "design",
        title: "Structural Engineering",
        description: "Engineered foundation and framing to meet safety and code requirements.",
        modal: {
            overview:
                "Structural engineering ensures your ADU is designed for loads, seismic requirements, and local building codes.",
            whatsIncluded: [
                "Engineered calculations and details",
                "Foundation and framing specifications",
                "Coordination with architectural drawings and plan check",
            ],
            whyItMatters:
                "It’s critical for approvals, inspections, durability, and safety.",
            commonQuestions: [
                "Will you need a soils report?",
                "Does engineering change the foundation type?",
            ],
            notes: [
                "Certain sites may require additional engineering depending on conditions.",
            ],
        },
    },
    {
        id: "title_24",
        category: "design",
        title: "Title 24 Energy Compliance",
        description: "California energy documentation required for permits and inspections.",
        modal: {
            overview:
                "We include the required Title 24 energy documentation so your ADU meets California efficiency standards.",
            whatsIncluded: [
                "Title 24 documentation for the approved plan set",
                "Coordination of windows/insulation/HVAC specs to meet code",
                "Support for permit submission requirements",
            ],
            whyItMatters:
                "Without Title 24 compliance, permits can be delayed and inspections can fail.",
            commonQuestions: [
                "Does this affect window choices?",
                "Does it impact HVAC sizing?",
            ],
        },
    },

    // ===== Permits =====
    {
        id: "permit_expediting",
        category: "permits",
        title: "Permit Expediting",
        description: "We coordinate submissions, corrections, and follow-ups with the city.",
        modal: {
            overview:
                "We manage the permit process—submitting plans, responding to comments, and coordinating approvals to keep your project moving.",
            whatsIncluded: [
                "Plan submission coordination",
                "Tracking plan check comments/corrections",
                "Resubmission support and city communication",
            ],
            whyItMatters:
                "Permitting is where many projects stall—expediting reduces delays and keeps your timeline predictable.",
            commonQuestions: [
                "How long do permits take?",
                "Do I need to go to the city?",
            ],
            notes: ["City timelines vary by jurisdiction and workload."],
        },
    },
    {
        id: "permit_pull",
        category: "permits",
        title: "Permit Pull",
        description: "We pull permits so construction can legally begin.",
        modal: {
            overview:
                "Once plans are approved and requirements are met, we pull permits to officially start the build.",
            whatsIncluded: [
                "Permit issuance coordination",
                "Final checklist handling (as required by jurisdiction)",
                "Scheduling alignment for construction start",
            ],
            whyItMatters:
                "Permits unlock inspections and the official construction timeline.",
            commonQuestions: ["When do we pull permits?", "Can we start early?"],
        },
    },
    {
        id: "standard_city_fees",
        category: "permits",
        title: "Standard City Fees",
        description: "Standard permitting/processing fees included (per agreement).",
        modal: {
            overview:
                "We include standard city fees required to move your ADU through permitting and approvals (as defined in your agreement).",
            whatsIncluded: [
                "Standard permit and processing fees (per contract scope)",
                "Coordination and handling through the permit process",
            ],
            whyItMatters:
                "It simplifies budgeting and helps avoid surprises during the permit phase.",
            commonQuestions: ["Do fees vary by city?", "Are there fees not included?"],
            notes: [
                "Special assessments, utility agency charges, or unusual requirements may be separate.",
            ],
        },
    },
    {
        id: "document_notarization",
        category: "permits",
        title: "Document Notarization",
        description: "Notarized paperwork handled as part of the process (when required).",
        modal: {
            overview:
                "Some jurisdictions require notarized documents during permitting or recording. We coordinate the paperwork and signing steps.",
            whatsIncluded: [
                "Preparation of documents requiring notarization (as applicable)",
                "Coordination for signing and notarization steps",
            ],
            whyItMatters:
                "This prevents administrative delays and keeps the permit process moving.",
            commonQuestions: ["Which documents are notarized?", "Do I need to travel to sign?"],
            notes: ["Requirements vary by city/county and project type."],
        },
    },
    {
        id: "county_recording",
        category: "permits",
        title: "County Recording",
        description: "We coordinate required county recording steps (when applicable).",
        modal: {
            overview:
                "Some projects require official recording of documents. We coordinate the process when required.",
            whatsIncluded: [
                "Preparation and coordination of recordable documents (as applicable)",
                "Submission/processing support with the county",
            ],
            whyItMatters:
                "Recording is a compliance step—done properly, it avoids delays and future complications.",
            commonQuestions: ["Does every ADU require recording?"],
            notes: ["Requirements depend on jurisdiction and project details."],
        },
    },

    // ===== Construction =====
    {
        id: "rough_grading",
        category: "construction",
        title: "Rough Grading",
        description: "Preparing the site elevation and base conditions for construction.",
        modal: {
            overview:
                "We prepare the build area so foundations, drainage, and access can be done correctly.",
            whatsIncluded: [
                "Standard site prep and rough grading for the ADU footprint",
                "Coordination with foundation layout",
            ],
            whyItMatters:
                "Proper grading supports foundation performance and helps prevent drainage issues later.",
            commonQuestions: ["Will this remove landscaping?", "What if we have a slope?"],
            notes: ["Significant slope or unusual conditions may require additional scope."],
        },
    },
    {
        id: "foundation",
        category: "construction",
        title: "Foundation",
        description: "Code-compliant foundation built to engineered specifications.",
        modal: {
            overview:
                "We build the foundation per engineered plans, including formwork, reinforcement, concrete placement, and inspections.",
            whatsIncluded: [
                "Foundation work per approved plans and engineering",
                "Structural anchoring/hold-down coordination",
                "Inspection coordination during foundation phase",
            ],
            whyItMatters:
                "The foundation is the base of the entire ADU—accuracy here protects everything above it.",
            commonQuestions: [
                "What foundation type will we use?",
                "Will we need extra excavation?",
            ],
            notes: [
                "Rock excavation or unusual soils can affect scope and cost.",
            ],
        },
    },
    {
        id: "standard_utility_connections_50ft",
        category: "construction",
        title: "Standard Utility Connections (up to 50 ft through dirt)",
        description: "Standard utility routing included—up to 50 feet through dirt from tie-in points.",
        modal: {
            overview:
                "We include standard utility connections within typical distances and conditions to connect the ADU to services.",
            whatsIncluded: [
                "Utility trenching/routing up to 50 feet through dirt (as specified)",
                "Standard tie-in work under normal conditions",
                "Backfill and basic restoration within standard scope",
            ],
            whyItMatters:
                "Utilities are one of the biggest cost variables—defining what’s included protects budget expectations.",
            commonQuestions: [
                "What if trenching requires cutting concrete?",
                "What if my run is longer than 50 feet?",
            ],
            notes: [
                "Concrete/asphalt cutting, deep excavation, rock, or special equipment may be additional.",
            ],
        },
    },
    {
        id: "rough_meps",
        category: "construction",
        title: "Rough MEPs",
        description: "Mechanical, electrical, and plumbing rough-in before drywall.",
        modal: {
            overview:
                "We install plumbing lines, electrical wiring, and HVAC rough components before insulation and drywall.",
            whatsIncluded: [
                "Plumbing rough-in per plan",
                "Electrical rough-in per plan",
                "HVAC rough-in coordination for mini-split system",
            ],
            whyItMatters:
                "Clean rough-in work prevents future leaks/electrical issues and reduces rework.",
            commonQuestions: [
                "Can I add outlets now?",
                "Can we move fixtures?",
            ],
        },
    },
    {
        id: "framing",
        category: "construction",
        title: "Framing",
        description: "Structural wall and roof framing built to engineered plans.",
        modal: {
            overview:
                "Framing is the ADU’s skeleton—walls, roof structure, headers, and structural connections per engineering.",
            whatsIncluded: [
                "Wall and roof framing per approved plans",
                "Structural hardware per engineering",
                "Framing inspections coordination",
            ],
            whyItMatters:
                "Accurate framing impacts structural integrity, straight walls, and clean finishes.",
            commonQuestions: ["When does it start to look like a house?"],
        },
    },
    {
        id: "insulation",
        category: "construction",
        title: "Insulation",
        description: "Installed to meet code and comfort requirements.",
        modal: {
            overview:
                "We install insulation to meet Title 24 requirements and improve comfort year-round.",
            whatsIncluded: [
                "Insulation per plan and code requirements",
                "Inspection coordination where required",
            ],
            whyItMatters:
                "Good insulation improves comfort, reduces energy costs, and can improve sound performance.",
            commonQuestions: ["Can we upgrade for better sound control?"],
        },
    },
    {
        id: "drywall",
        category: "construction",
        title: "Drywall",
        description: "Installed and finished walls/ceilings ready for paint.",
        modal: {
            overview:
                "Drywall transforms framing into finished interior surfaces—taped, mudded, and sanded for a clean look.",
            whatsIncluded: ["Drywall installation and finishing", "Standard finish per spec"],
            whyItMatters:
                "A quality drywall finish is one of the biggest drivers of a high-end interior feel.",
            commonQuestions: ["Can we do smooth walls vs texture?"],
        },
    },
    {
        id: "paint",
        category: "construction",
        title: "Paint",
        description: "Interior and exterior painting per standard scope and spec.",
        modal: {
            overview:
                "We apply professional paint finishes to protect surfaces and deliver the final look.",
            whatsIncluded: [
                "Interior wall/ceiling paint per spec",
                "Exterior paint where applicable with exterior finish system",
            ],
            whyItMatters:
                "Paint impacts the entire mood of the space and protects materials from daily wear.",
            commonQuestions: ["Can I choose colors?", "Can we add an accent wall?"],
        },
    },
    {
        id: "roofing",
        category: "construction",
        title: "Roofing",
        description: "Complete roof system installed to code and weather standards.",
        modal: {
            overview:
                "We install the roof system to protect the ADU and meet local building requirements.",
            whatsIncluded: ["Roofing system installation per plan/spec", "Flashing and weatherproofing"],
            whyItMatters:
                "A high-quality roof prevents leaks and protects the entire structure long-term.",
            commonQuestions: ["Can it match my main house?"],
        },
    },
    {
        id: "stucco_exterior",
        category: "construction",
        title: "Stucco Exterior",
        description: "Durable exterior finish with clean curb appeal.",
        modal: {
            overview:
                "Stucco is a common, durable Southern California exterior finish that pairs well with modern ADU designs.",
            whatsIncluded: [
                "Stucco application per spec",
                "Integration with windows/doors/weatherproofing",
            ],
            whyItMatters:
                "Protects the structure and elevates curb appeal and value.",
            commonQuestions: ["Can we match my home’s texture?", "Can we do a different exterior material?"],
        },
    },
    {
        id: "finish_carpentry",
        category: "construction",
        title: "Finish Carpentry",
        description: "Trim, doors, and details to complete the interior look.",
        modal: {
            overview:
                "Finish carpentry is where the ADU becomes polished—trim lines, door installs, and fine detailing.",
            whatsIncluded: ["Interior trim/baseboards per spec", "Interior door installation and detailing"],
            whyItMatters:
                "It’s one of the clearest indicators of build quality.",
            commonQuestions: ["Can we upgrade doors or baseboards?"],
        },
    },
    {
        id: "finish_meps",
        category: "construction",
        title: "Finish MEPs",
        description: "Final installation of fixtures, devices, and equipment.",
        modal: {
            overview:
                "We install final fixtures, switches/outlets, lighting, and complete final connections and testing.",
            whatsIncluded: [
                "Plumbing fixture installation per spec",
                "Electrical devices + lighting install per plan/spec",
                "HVAC final connections and startup checks",
            ],
            whyItMatters:
                "This is where the ADU becomes fully functional—comfort, usability, and reliability come together.",
            commonQuestions: ["Can we add smart switches or upgrade fixtures?"],
        },
    },

    // ===== Project Management =====
    {
        id: "project_management",
        category: "project_management",
        title: "Project Management",
        description: "Dedicated coordination from start to finish.",
        modal: {
            overview:
                "We manage scheduling, trades, materials, inspections, and quality control so your project stays organized and on track.",
            whatsIncluded: [
                "Build scheduling and coordination",
                "Trade management and sequencing",
                "Inspection coordination and milestone tracking",
            ],
            whyItMatters:
                "Strong project management reduces downtime, improves quality, and keeps timelines predictable.",
            commonQuestions: ["Who is my point of contact?", "How are changes handled?"],
        },
    },
    {
        id: "site_supervision",
        category: "project_management",
        title: "Site Supervision",
        description: "On-site oversight to maintain quality, safety, and progress.",
        modal: {
            overview:
                "Active supervision helps ensure the build is executed correctly, safely, and in the right sequence—reducing rework.",
            whatsIncluded: [
                "On-site supervision during active phases",
                "Quality checks at key milestones",
                "Coordination of trades and inspections on-site",
            ],
            whyItMatters:
                "It protects build quality and catches issues early—before they become expensive fixes.",
            commonQuestions: ["Will someone be on-site every day?"],
            notes: ["Frequency varies by phase; some phases require more on-site time than others."],
        },
    },
    {
        id: "debris_haul_off",
        category: "project_management",
        title: "Debris Removal & Haul-Off",
        description: "Jobsite cleanup and debris removal throughout the build.",
        modal: {
            overview:
                "We include ongoing site cleanup and haul-off so your property stays safer and more manageable during construction.",
            whatsIncluded: [
                "Debris collection during the project",
                "Haul-off as needed throughout the build",
                "Final cleanup prior to completion milestones",
            ],
            whyItMatters:
                "A cleaner jobsite is safer, reduces disruption, and helps the project run smoother.",
            commonQuestions: ["Will there be a dumpster on-site?", "How often is debris removed?"],
        },
    },

    // ===== Standard Finish Package (features) =====
    {
        id: "modern_open_layout",
        category: "design_finish_features",
        title: "Modern Open Layout",
        description: "Bright, open living area designed to feel spacious and functional.",
        modal: {
            overview:
                "We design the main living, kitchen, and dining areas with an open concept to maximize usable space, natural light, and furniture flexibility.",
            whatsIncluded: [
                "Open-plan living/kitchen layout (where floorplan allows)",
                "Efficient circulation paths (less hallway waste)",
                "Furniture-friendly wall spacing and layout planning",
            ],
            whyItMatters:
                "Open layouts make smaller square footage feel larger and improve daily usability.",
        },
    },
    {
        id: "clerestory_windows",
        category: "design_finish_features",
        title: "Clerestory Windows",
        description: "High windows that bring in light while maintaining privacy (where applicable).",
        modal: {
            overview:
                "Clerestory windows increase daylight while limiting direct sightlines from neighbors for privacy.",
            whatsIncluded: [
                "Clerestory window placement per plan (where applicable)",
                "Coordination with elevations and structural framing",
                "Weatherproof installation as part of the build",
            ],
            whyItMatters:
                "Brighter interiors + better privacy + a modern architectural look.",
            notes: ["Exact sizes/placement are plan- and code-dependent."],
        },
    },
    {
        id: "shaker_cabinets",
        category: "design_finish_features",
        title: "Contemporary Shaker Cabinets",
        description: "Shaker-style cabinetry included in kitchen and bathroom storage areas.",
        modal: {
            overview:
                "We include contemporary shaker cabinets for a timeless, durable look that pairs well with modern finishes.",
            whatsIncluded: [
                "Kitchen base + upper cabinets per plan",
                "Bathroom vanity cabinetry (and upper/linen cabinetry where applicable)",
                "Standard hardware and professional installation",
            ],
            whyItMatters:
                "Durable, broadly appealing style that looks premium and holds up over time.",
        },
    },
    {
        id: "quartz_countertops",
        category: "design_finish_features",
        title: "Quartz Countertops",
        description: "Durable, low-maintenance counters in kitchen and bath areas (per plan).",
        modal: {
            overview:
                "Quartz is included for durability, stain resistance, and a clean modern finish.",
            whatsIncluded: [
                "Quartz countertops in kitchen per plan",
                "Quartz surfaces in bath/linen counter where applicable",
                "Standard edge detail and professional installation",
            ],
            whyItMatters:
                "Elevates finish level and is easy to maintain long-term.",
        },
    },
    {
        id: "lvp_flooring",
        category: "design_finish_features",
        title: "Luxury Vinyl Plank Flooring",
        description: "Resilient, water-resistant flooring designed for everyday living.",
        modal: {
            overview:
                "LVP is a premium flooring choice that performs well in living areas and high-traffic spaces.",
            whatsIncluded: [
                "LVP flooring installed per plan/spec",
                "Transitions and trim integration as required",
            ],
            whyItMatters:
                "Looks great, holds up to wear, and is easy to maintain.",
        },
    },
    {
        id: "stainless_appliances",
        category: "design_finish_features",
        title: "Stainless Steel Appliances",
        description: "A modern stainless appliance package to complete the kitchen (per spec).",
        modal: {
            overview:
                "We include a stainless appliance set so your kitchen is move-in-ready without separate coordination.",
            whatsIncluded: [
                "Stainless appliance package per standard spec",
                "Delivery coordination and installation scheduling",
            ],
            whyItMatters:
                "Simplifies the process and ensures the ADU is complete at finish.",
        },
    },
    {
        id: "mini_split_hvac",
        category: "design_finish_features",
        title: "Mini-Split HVAC System",
        description: "Efficient heating and cooling designed for ADU comfort.",
        modal: {
            overview:
                "Mini-splits provide quiet, efficient heating/cooling and are ideal for ADUs.",
            whatsIncluded: [
                "System sized per design and energy requirements",
                "Standard installation and startup testing",
            ],
            whyItMatters:
                "Comfort + efficiency + strong performance for smaller spaces.",
        },
    },
];

/** SECTION #2 — Optional Upgrades (examples + “and more”) */
export const OPTIONAL_UPGRADES: IncludedItem[] = [
    {
        id: "upgrade_kitchen_island",
        category: "optional_upgrades",
        title: "Kitchen Island",
        description: "Add prep space, seating, and storage (layout-dependent).",
        modal: {
            overview:
                "A kitchen island can add storage, seating, and a more open entertaining feel—depending on clearances and layout.",
            estCost: { min: 3500, max: 9000, display: "$3.5k–$9k" },
            whatsIncluded: [
                "Island layout design coordination (where feasible)",
                "Cabinetry + countertop integration",
                "Electrical outlets as required by code",
            ],
            whyItMatters:
                "Improves daily function and adds a premium feel that many homeowners and renters love.",
            commonQuestions: [
                "Do we have enough clearance for an island?",
                "Can it include seating for 2–4?",
            ],
            notes: [
                "Islands can affect circulation—final approval depends on plan and required clearances.",
            ],
        },
    },
    {
        id: "upgrade_10ft_ceilings",
        category: "optional_upgrades",
        title: "10' Ceilings",
        description: "Taller ceilings for a more open, luxury feel (plan + code dependent).",
        modal: {
            overview:
                "10-foot ceilings increase perceived space and bring a premium look—depending on plan design, structure, and local limits.",
            estCost: { min: 8000, max: 25000, display: "$8k–$25k+" },
            whatsIncluded: [
                "Design + elevation coordination",
                "Structural framing adjustments (as required)",
                "Updates to permitting set if applicable",
            ],
            whyItMatters:
                "Creates a brighter, more open feel—especially powerful in smaller square footage.",
            commonQuestions: [
                "Does this change the exterior height?",
                "Will it affect permitting or setbacks?",
            ],
            notes: [
                "Ceiling height increases may impact engineering, HVAC, and exterior design.",
            ],
        },
    },
    {
        id: "upgrade_sliding_doors",
        category: "optional_upgrades",
        title: "Sliding Doors",
        description: "Upgrade to larger sliders for indoor/outdoor flow and more light.",
        modal: {
            overview:
                "Upgraded sliding doors can expand the opening, increase natural light, and elevate the design.",
            estCost: { min: 2500, max: 12000, display: "$2.5k–$12k+" },
            whatsIncluded: [
                "Door sizing/design coordination",
                "Structural header coordination if needed",
                "Weatherproof installation and finish integration",
            ],
            whyItMatters:
                "Makes the ADU feel brighter and more connected to the yard—great for lifestyle and rental appeal.",
            commonQuestions: [
                "Can we do a multi-panel slider?",
                "Does this affect structural engineering?",
            ],
            notes: ["Larger openings may require structural updates."],
        },
    },
    {
        id: "upgrade_standalone_tub",
        category: "optional_upgrades",
        title: "Stand-Alone Tub",
        description: "Spa-style bath upgrade (space + plumbing dependent).",
        modal: {
            overview:
                "A stand-alone tub adds a luxury, spa-like feel—when the bathroom layout and plumbing allow it.",
            estCost: { min: 2500, max: 9000, display: "$2.5k–$9k" },
            whatsIncluded: [
                "Layout coordination for clearances and placement",
                "Plumbing fixture selection + installation scope adjustment",
                "Finish integration (tile/waterproofing as applicable)",
            ],
            whyItMatters:
                "Creates a premium experience and can be a strong value-add for end use or resale.",
            commonQuestions: [
                "Do we have enough bathroom space?",
                "Will it replace the shower or be separate?",
            ],
            notes: [
                "Not every plan supports a tub without changing layout.",
            ],
        },
    },
    {
        id: "upgrade_premium_lighting",
        category: "optional_upgrades",
        title: "Premium Lighting Package",
        description: "More recessed lighting, statement fixtures, and upgraded controls.",
        modal: {
            overview:
                "Upgrade lighting to create a more custom, high-end feel—better ambiance, better function, and a more modern look.",
            estCost: { min: 1200, max: 4500, display: "$1.2k–$4.5k" },
            whatsIncluded: [
                "Additional recessed lighting (layout-dependent)",
                "Statement fixture allowances (where applicable)",
                "Dimmer/smart control options (as selected)",
            ],
            whyItMatters:
                "Lighting is one of the fastest ways to make the ADU feel higher-end.",
            commonQuestions: ["Can we add dimmers everywhere?", "Can I choose fixture styles?"],
        },
    },
    {
        id: "upgrade_kitchen_full_height_splash",
        category: "optional_upgrades",
        title: "Full-Height Backsplash",
        description: "Tile to the ceiling for a more custom kitchen finish.",
        modal: {
            overview:
                "A full-height backsplash creates a designer look—especially behind a range or feature wall.",
            estCost: { min: 1200, max: 5500, display: "$1.2k–$5.5k" },
            whatsIncluded: [
                "Design coordination + material selection",
                "Additional tile labor/material scope",
            ],
            whyItMatters:
                "Upgrades the kitchen visually and protects walls in a practical way.",
            commonQuestions: ["What tile options do you recommend?", "Does it affect timeline?"],
        },
    },
];

/** SECTION #3 — Potential Additional Site-Specific Work (assessed upfront) */
export const POTENTIAL_SITE_SPECIFIC: IncludedItem[] = [
    {
        id: "site_water_meter",
        category: "site_specific",
        title: "Water Meter",
        description: "Some cities require a new or upgraded meter—policy varies.",
        modal: {
            overview:
                "City policy varies (shared vs separate meters). If a new meter is required, it can add coordination, scope, and timeline.",
            estCost: { min: 5000, max: 12000, display: "$5k–$12k+" },
            howWeAssess: [
                "Confirm the city’s ADU meter policy",
                "Verify existing meter size and capacity",
                "Identify meter location constraints early",
            ],
            avoidIfPossible: [
                { title: "Verify the city’s ADU meter policy (shared vs separate)" },
                { title: "Confirm existing meter size + capacity" },
                { title: "Plan meter location early to avoid redesign" },
            ],
            triggers: [
                { key: "encroachment", title: "Encroachment permit" },
                { key: "traffic_control", title: "Street / traffic coordination" },
            ],
            whyItMatters:
                "Confirming early protects budget and prevents late permit surprises that slow the project down.",
        },
    },
    {
        id: "site_sewer_connection",
        category: "site_specific",
        title: "Sewer Connection",
        description: "Trenching distance, concrete cuts, and pumps can be major cost drivers.",
        modal: {
            overview:
                "Sewer routing is often the biggest hidden variable. Distance, elevation, and hardscape crossings can increase scope significantly.",
            estCost: { min: 8000, max: 25000, display: "$8k–$25k+" },
            howWeAssess: [
                "Locate existing sewer cleanout and confirm route",
                "Verify elevation to confirm gravity flow",
                "Identify concrete/asphalt crossings early",
            ],
            avoidIfPossible: [
                { title: "Locate existing sewer cleanout and confirm route" },
                { title: "Optimize placement to shorten trench distance" },
                { title: "Verify elevation before assuming a pump" },
            ],
            triggers: [
                { key: "concrete_demo", title: "Concrete cut & restore" },
                { key: "ejector_pump", title: "Sewer ejector pump" },
            ],
            whyItMatters:
                "When sewer scope changes late, it can delay approvals and create avoidable change orders.",
        },
    },
    {
        id: "site_electrical_panel",
        category: "site_specific",
        title: "Electrical Panel / Capacity",
        description: "Upgrades depend on panel size, location, and utility requirements.",
        modal: {
            overview:
                "If the existing panel can’t support the ADU load, an upgrade or relocation may be required.",
            estCost: { min: 3500, max: 12000, display: "$3.5k–$12k+" },
            howWeAssess: [
                "Confirm existing panel size and available load",
                "Check location/clearances that could trigger relocation",
                "Coordinate service requirements early if needed",
            ],
            avoidIfPossible: [
                { title: "Confirm panel size + available load before design assumptions" },
                { title: "Check clearance/location constraints that trigger relocation" },
                { title: "Plan electrical runs early to reduce rework" },
            ],
            triggers: [
                { key: "panel_relocation", title: "Panel relocation" },
                { key: "service_upgrade", title: "Service coordination" },
            ],
            whyItMatters:
                "Electrical planning impacts timeline, inspections, and long-term comfort—verify early.",
        },
    },
    {
        id: "site_construction_access",
        category: "site_specific",
        title: "Construction Access",
        description: "Tight access can force mini-equipment or hand work (labor multiplier).",
        modal: {
            overview:
                "If access is tight, material handling and excavation become more labor-intensive, which can increase cost.",
            estCost: { min: 5000, max: 18000, display: "$5k–$18k+" },
            howWeAssess: [
                "Measure access width/height and identify choke points",
                "Identify fence/hardscape removals needed for access",
                "Evaluate placement options to reduce constraints",
            ],
            avoidIfPossible: [
                { title: "Measure access width/height and identify choke points" },
                { title: "Plan protections/removals for fences + hardscape if needed" },
                { title: "Adjust placement to reduce access constraints where possible" },
            ],
            triggers: [
                { key: "fence_rebuild", title: "Fence removal & rebuild" },
                { key: "hand_carry", title: "Hand-carry / mini equipment" },
            ],
            whyItMatters:
                "Access is one of the top hidden cost drivers—verifying early protects budget.",
        },
    },
    {
        id: "site_slope_grading",
        category: "site_specific",
        title: "Slope / Grading",
        description: "Slope can trigger grading plans and taller foundation design.",
        modal: {
            overview:
                "Even modest slope can affect foundation height, drainage, and whether a grading plan is required.",
            estCost: { min: 6000, max: 20000, display: "$6k–$20k+" },
            howWeAssess: [
                "Confirm elevation changes in the build area",
                "Evaluate placement to reduce slope impact",
                "Avoid foundation assumptions until elevations are verified",
            ],
            avoidIfPossible: [
                { title: "Confirm elevation changes in the build area" },
                { title: "Optimize placement to reduce slope impact" },
                { title: "Avoid foundation assumptions until elevations are verified" },
            ],
            triggers: [{ key: "grading_plan", title: "Grading plan" }],
            whyItMatters:
                "Grading surprises can be expensive—early verification reduces redesign and change orders.",
        },
    },
    {
        id: "site_soils_report",
        category: "site_specific",
        title: "Soils / Geotech Report",
        description: "Some parcels/jurisdictions require geotechnical verification.",
        modal: {
            overview:
                "Certain cities or areas require a soils/geotech report to verify foundation assumptions and site conditions.",
            estCost: { min: 2500, max: 8000, display: "$2.5k–$8k" },
            howWeAssess: [
                "Check city requirements tied to your parcel",
                "Confirm if a prior report can be reused (when valid)",
                "Evaluate if soils are likely based on area and conditions",
            ],
            avoidIfPossible: [
                { title: "Check city requirements tied to your parcel" },
                { title: "Confirm if a prior report can be reused (when valid)" },
                { title: "Avoid designing foundations blindly if soils are likely" },
            ],
            triggers: [{ key: "geotech", title: "Geotechnical review" }],
            whyItMatters:
                "If required, we want it identified early so foundation design and permits don’t stall.",
        },
    },
    {
        id: "site_drainage_requirements",
        category: "site_specific",
        title: "Drainage Requirements",
        description: "Drainage scope can be required even when the build seems simple.",
        modal: {
            overview:
                "Some jurisdictions require drainage improvements or stormwater compliance depending on site conditions and impervious area changes.",
            estCost: { min: 2500, max: 12000, display: "$2.5k–$12k+" },
            howWeAssess: [
                "Verify drainage paths and roof discharge plan",
                "Confirm stormwater requirements when applicable",
                "Coordinate gutters/downspouts early",
            ],
            avoidIfPossible: [
                { title: "Verify drainage paths and roof discharge plan" },
                { title: "Plan gutters/downspouts early to avoid redesign" },
                { title: "Confirm stormwater requirements when applicable" },
            ],
            triggers: [{ key: "stormwater", title: "Stormwater compliance" }],
            whyItMatters:
                "Drainage surprises can create permit delays and change orders—verification upfront reduces risk.",
        },
    },
    {
        id: "site_easements_setbacks",
        category: "site_specific",
        title: "Easements / Setbacks",
        description: "Constraints can force redesign or special approvals.",
        modal: {
            overview:
                "Easements and setbacks can limit placement and sometimes require special approvals or redesign.",
            estCost: { min: 3000, max: 15000, display: "$3k–$15k+" },
            howWeAssess: [
                "Review easements/records and placement constraints",
                "Confirm setback rules for your ADU type",
                "Identify approval requirements early (if any)",
            ],
            avoidIfPossible: [
                { title: "Verify easements on record before finalizing layout" },
                { title: "Use placement options that preserve flexibility" },
                { title: "Confirm if any special approvals are required" },
            ],
            triggers: [
                { key: "survey", title: "Survey" },
                { key: "encroachment", title: "Encroachment / special approval" },
            ],
            whyItMatters:
                "Confirming constraints early prevents late-stage redesign and permit delays.",
        },
    },
    {
        id: "site_fire_flow_sprinklers",
        category: "site_specific",
        title: "Fire Flow / Sprinklers",
        description: "Varies by jurisdiction and access conditions; can be a major scope add.",
        modal: {
            overview:
                "Fire requirements vary by city and access conditions. Some projects require a fire flow test or sprinklers.",
            estCost: { min: 4000, max: 25000, display: "$4k–$25k+" },
            howWeAssess: [
                "Verify local fire requirements tied to parcel/access",
                "Confirm hydrant distance and access constraints",
                "Avoid assuming exemptions without verification",
            ],
            avoidIfPossible: [
                { title: "Verify local fire requirements tied to parcel/access" },
                { title: "Confirm hydrant distance and access constraints" },
                { title: "Avoid assuming exemptions without verification" },
            ],
            triggers: [
                { key: "fire_flow_test", title: "Fire flow test" },
                { key: "sprinklers", title: "Fire sprinklers" },
            ],
            whyItMatters:
                "Fire requirements found late can stall permits—early checks protect your timeline.",
        },
    },
    {
        id: "site_garage_conversion_code",
        category: "site_specific",
        title: "Garage Conversion Code Upgrades",
        description: "Garage conversions can trigger extra code upgrades (fire separation, structure, etc.).",
        modal: {
            overview:
                "If your ADU is a garage conversion, extra code upgrades may be required depending on existing structure and rules.",
            estCost: { min: 5000, max: 18000, display: "$5k–$18k+" },
            howWeAssess: [
                "Confirm structure suitability (slab/framing/height)",
                "Verify fire separation upgrades if required",
                "Check parking replacement requirements (if applicable)",
            ],
            avoidIfPossible: [
                { title: "Confirm structure suitability (slab/framing/height)" },
                { title: "Verify fire separation upgrades if required" },
                { title: "Confirm parking replacement requirements if applicable" },
            ],
            triggers: [
                { key: "fire_separation", title: "Fire separation upgrades" },
                { key: "parking", title: "Parking / replacement rules" },
            ],
            whyItMatters:
                "Garage conversions can be straightforward—but only if required upgrades are identified upfront.",
        },
    },
];

/** Parent-friendly structure (optional helper) */
export const SITE_SPECIFIC_WORK_SECTIONS = [
    {
        key: "included",
        sectionNumber: 1,
        title: "What’s Included",
        subtitle: "All the work we already include in our base price.",
        items: INCLUDED_BASE,
    },
    {
        key: "upgrades",
        sectionNumber: 2,
        title: "Optional Upgrades",
        subtitle: "Popular enhancements that aren’t part of our standard finish package.",
        items: OPTIONAL_UPGRADES,
    },
    {
        key: "site_specific",
        sectionNumber: 3,
        title: "Potential Additional Site-Specific Work",
        subtitle: "Items that vary by property—here’s how we assess them upfront.",
        items: POTENTIAL_SITE_SPECIFIC,
    },
] as const;
