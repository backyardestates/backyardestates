// Fixed architect-analysis template, replicating the legacy Google Sheet
// ("Site Visit Info" + "City Info" tabs) field-for-field. The form is rendered
// generically from this config; answers are stored as JSON on FormalAnalysis
// (siteVisitJson / cityInfoJson). Reference-only blocks (discounts, links, past
// projects) are rendered read-only.

export type FieldKind = "text" | "textarea" | "number" | "yn";

export interface TemplateField {
    key: string;
    label: string;
    hint?: string;
    kind: FieldKind;
}

export interface TemplateSection {
    key: string;
    title: string;
    /** Special renderers handled by the form component. */
    variant?: "fields" | "fixtureMatrix" | "reference";
    fields?: TemplateField[];
    /** For variant: "reference" — static rows shown read-only. */
    reference?: { label: string; value: string }[];
    note?: string;
}

export interface TemplateTab {
    key: "siteVisit" | "cityInfo";
    title: string;
    sections: TemplateSection[];
}

// ── Fixture matrix ───────────────────────────────────────────────────────────
export interface FixtureRow {
    key: string;
    label: string;
    /** Standard water-supply fixture units per fixture (sheet defaults). */
    unitsPerFixture: number;
}

export const FIXTURE_ROWS: FixtureRow[] = [
    { key: "bath_tubs", label: "Bath tubs", unitsPerFixture: 4 },
    { key: "shower_only", label: "Shower only", unitsPerFixture: 2 },
    { key: "clothes_washers", label: "Clothes washers", unitsPerFixture: 4 },
    { key: "dishwashers", label: "Dishwashers", unitsPerFixture: 1.5 },
    { key: "toilets", label: "Toilets", unitsPerFixture: 2.5 },
    { key: "bathroom_sink", label: "Bathroom sink", unitsPerFixture: 1 },
    { key: "kitchen_sink", label: "Kitchen sink", unitsPerFixture: 1.5 },
    { key: "bar_sink", label: "Bar sink", unitsPerFixture: 1 },
    { key: "hose_bibs", label: "Hose bibs", unitsPerFixture: 2.5 },
    { key: "add_hose_bibs", label: "Additional hose bibs", unitsPerFixture: 1 },
    { key: "lawn_sprinklers", label: "Lawn sprinklers", unitsPerFixture: 1 },
];

export const GAS_APPLIANCES: TemplateField[] = [
    { key: "cooking", label: "Cooking", kind: "yn" },
    { key: "furnace", label: "Furnace", kind: "yn" },
    { key: "clothes_dryer", label: "Clothes dryer", kind: "yn" },
    { key: "water_heater", label: "Water heater", kind: "yn" },
];

export const WATER_METER_FIELDS: TemplateField[] = [
    { key: "longest_distance", label: "Longest distance from water meter", kind: "text" },
    { key: "water_pressure", label: "Water pressure", kind: "text" },
    { key: "design_water_pressure", label: "Design water pressure", kind: "text" },
    { key: "meter_size_needed", label: "Meter size needed (from table)", kind: "text" },
    { key: "meter_explanation", label: "Water meter explanation", kind: "textarea" },
];

// ── Site Visit Info tab ──────────────────────────────────────────────────────
const SITE_VISIT: TemplateSection[] = [
    {
        key: "water",
        title: "Water service",
        fields: [
            { key: "water_pressure", label: "Water pressure", hint: "e.g. 62psi with reg", kind: "text" },
            { key: "ex_meter_size", label: "Size of existing meter", kind: "text" },
            { key: "pipe_main_to_meter", label: "Pipe size from main to meter", kind: "text" },
            { key: "pipe_meter_to_house", label: "Pipe size from meter to house", kind: "text" },
            { key: "pipe_out_of_ground", label: "Pipe size out of ground at house", kind: "text" },
            { key: "water_meter_upgrade", label: "Water meter upgrade required (Y/N)", kind: "text" },
            { key: "water_provider", label: "Water company / provider", kind: "text" },
        ],
    },
    {
        key: "sewer",
        title: "Sewer",
        fields: [
            { key: "sewer_or_septic", label: "Sewer or septic", kind: "text" },
            { key: "septic_location", label: "Location of septic", kind: "text" },
            { key: "sewer_pipe_size", label: "Sewer pipe size", kind: "text" },
            { key: "sewer_depth", label: "Sewer depth", kind: "text" },
            { key: "sewer_scope_needed", label: "Sewer scope needed", kind: "text" },
            { key: "ejection_pump_needed", label: "Ejection pump needed", kind: "text" },
            { key: "cleanout_location", label: "Cleanout location", kind: "text" },
        ],
    },
    {
        key: "power",
        title: "Power",
        fields: [
            { key: "existing_meter_amp", label: "Existing meter amp", kind: "text" },
            { key: "electric_load_calc_needed", label: "Electric load calc needed", kind: "text" },
            { key: "overhead_or_underground", label: "Overhead or underground feed", kind: "text" },
            { key: "wire_clearance", label: "Expected wire clearance (3' or 8'?)", kind: "text" },
            { key: "existing_car_charger", label: "Existing car charger? amps?", kind: "text" },
            { key: "panel_upgrade_needed", label: "Panel upgrade needed", kind: "text" },
            { key: "sub_panels", label: "Any sub panels?", kind: "text" },
            { key: "relocate_panel", label: "Relocate panel to avoid OHP?", kind: "text" },
            { key: "electric_provider", label: "Electric provider", kind: "text" },
        ],
    },
    {
        key: "gas",
        title: "Natural gas",
        fields: [
            { key: "is_there_gas", label: "Is there gas", kind: "yn" },
            { key: "gas_provider", label: "Gas company / provider", kind: "text" },
        ],
    },
    {
        key: "main_residence",
        title: "Main residence",
        fields: [
            { key: "main_sqft", label: "Size of main residence (sq. ft.)", kind: "number" },
            { key: "year_built", label: "Year built", kind: "text" },
            { key: "how_many_stories", label: "How many stories", kind: "text" },
            { key: "existing_garage", label: "Is there an existing garage", kind: "text" },
            { key: "garage_detached_attached", label: "Garage detached or attached", kind: "text" },
            { key: "roofing_material", label: "Roofing material", kind: "text" },
            { key: "roof_design", label: "Type of roof design", kind: "text" },
            { key: "roof_slope", label: "Slope of roof", kind: "text" },
            { key: "interior_ceiling_heights", label: "Interior ceiling heights", kind: "text" },
            { key: "siding_materials", label: "Siding materials", kind: "textarea" },
            { key: "existing_solar", label: "Existing solar panels", kind: "text" },
            { key: "ex_fire_sprinklers", label: "Existing fire sprinklers (Y/N)", kind: "yn" },
            { key: "foundation_type", label: "Type of foundation", kind: "text" },
            { key: "stucco_to_roof_or_block", label: "Stucco to roof or block", kind: "text" },
            { key: "wires_through_attic", label: "Can we run wires through attic or crawl space?", kind: "textarea" },
        ],
    },
    {
        key: "site_terrain",
        title: "Site & terrain",
        fields: [
            { key: "sloping_terrain", label: "Sloping terrain", kind: "text" },
            { key: "adu_rise_fall_diff", label: "ADU rise/fall diff. from pressure measure to ADU highest fixture", kind: "number" },
            { key: "retaining_walls", label: "Need for retaining walls", kind: "text" },
            { key: "easements_reasons", label: "Noticeable reasons for easements", kind: "text" },
            { key: "actual_easements", label: "Actual easements", kind: "text" },
            { key: "unpermitted_structures", label: "Unpermitted structures", kind: "text" },
            { key: "trees_to_remove", label: "Trees that need to be removed", kind: "text" },
            { key: "chimney_proximity", label: "Proximity issues to ex. chimneys", kind: "text" },
            { key: "need_survey", label: "Need for survey", kind: "text" },
            { key: "need_area_drains", label: "Need for new area drains", kind: "text" },
            { key: "reroute_pipes", label: "Need to re-route ex. pipes from under ADU", kind: "text" },
            { key: "cross_lot_drainage", label: "Existing cross lot drainage", kind: "text" },
            { key: "need_rain_gutters", label: "Need for rain gutters", kind: "text" },
            { key: "storm_drain_sump_pump", label: "Need for storm drain sump pump", kind: "text" },
            { key: "eave_gable_vents", label: "Eave or gable vents on wall adjacent to ADU", kind: "text" },
            { key: "house_overhang_adjacent", label: "Overhang of house adjacent to ADU", kind: "text" },
            { key: "climate_zone", label: "Climate zone", kind: "text" },
        ],
    },
    { key: "fixtures", title: "Fixture counts", variant: "fixtureMatrix" },
    {
        key: "other_notes",
        title: "Other notes",
        fields: [
            { key: "other_notes", label: "Other notes", kind: "textarea" },
            { key: "open_questions", label: "Open questions / things to verify", kind: "textarea" },
        ],
    },
    {
        key: "scope_of_work",
        title: "Scope of work (from contract)",
        fields: [
            { key: "standard_unit", label: "Start with standard unit?", kind: "text" },
            { key: "sow_sqft", label: "Square footage", kind: "number" },
            { key: "sow_bathrooms", label: "Bathrooms", kind: "number" },
            { key: "sow_bedrooms", label: "Bedrooms", kind: "number" },
            { key: "sow_offices", label: "Offices", kind: "number" },
            { key: "sow_showers", label: "Showers or bathtub/showers", kind: "text" },
            { key: "sow_roll_in_shower", label: "Roll-in shower?", kind: "yn" },
        ],
    },
    {
        key: "discounts_ref",
        title: "Discounts at purchase (reference)",
        variant: "reference",
        reference: [
            { label: "Comes through an ad that signs", value: "$1,000" },
            { label: "Educator", value: "$1,500" },
            { label: "First responder", value: "$1,500" },
            { label: "Real estate agent referral fee", value: "$3,500" },
            { label: "Family discount", value: "$3,500" },
        ],
    },
    {
        key: "logistics",
        title: "Site-visit logistics",
        fields: [
            { key: "fire_hydrant_location", label: "Fire hydrant location", kind: "text" },
            { key: "take_photos", label: "Take photos", kind: "yn" },
            { key: "measure_critical_dims", label: "Measure critical dimensions", kind: "text" },
            { key: "measure_roof_pitches", label: "Measure roof pitches", kind: "yn" },
            { key: "take_drone_photos", label: "Take drone photos", kind: "yn" },
            { key: "distance_adu_over_150", label: "Distance to ADU from street over 150'", kind: "text" },
            { key: "fire_sprinklers_required", label: "Fire sprinklers required", kind: "text" },
            { key: "nearest_bus_stop", label: "Distance of nearest bus stop", kind: "text" },
        ],
    },
    {
        key: "adu_unit",
        title: "ADU unit wanted",
        fields: [
            { key: "adu_name", label: "Name of unit wanted", kind: "text" },
            { key: "adu_type", label: "Type of ADU unit", kind: "text" },
            { key: "adu_size", label: "Size of ADU", kind: "text" },
            { key: "adu_sqft", label: "Square footage", kind: "number" },
            { key: "adu_bedrooms", label: "How many bedrooms", kind: "number" },
            { key: "adu_bathrooms", label: "How many bathrooms", kind: "number" },
            { key: "adu_tub_showers", label: "How many tub/showers", kind: "number" },
            { key: "adu_showers_only", label: "How many showers only", kind: "number" },
            { key: "adu_toilets", label: "How many toilets", kind: "number" },
            { key: "adu_bathroom_sinks", label: "How many bathroom sinks", kind: "number" },
            { key: "adu_dishwashers", label: "How many dishwashers", kind: "number" },
            { key: "adu_laundry", label: "Laundry room", kind: "text" },
            { key: "adu_upper_windows", label: "Upper windows", kind: "text" },
            { key: "adu_ceiling_heights", label: "Ceiling heights", kind: "text" },
            { key: "adu_utilities", label: "Utilities", kind: "text" },
            { key: "adu_all_electric", label: "All-electric unit wanted (Y/N)", kind: "yn" },
            { key: "adu_split_or_central", label: "Split ductless or central air", kind: "text" },
            { key: "adu_dual_electric", label: "Dual electric metering wanted (Y/N)", kind: "yn" },
            { key: "adu_dual_water", label: "Dual water metering wanted (Y/N)", kind: "yn" },
            { key: "adu_dual_gas", label: "Dual gas metering wanted (Y/N)", kind: "yn" },
            { key: "adu_sewage_pump", label: "Possible sewage pump needed", kind: "text" },
            { key: "adu_deeper_footings", label: "Need for deeper footings", kind: "text" },
            { key: "adu_foundation_out", label: "More foundation sticking out of ground", kind: "text" },
            { key: "adu_fire_walls", label: "Need fire walls", kind: "text" },
        ],
    },
    {
        key: "attached_unit",
        title: "Attached-unit questions",
        fields: [
            { key: "att_fire_walls", label: "Fire walls", kind: "text" },
            { key: "att_drainage_issues", label: "Will this create drainage issues", kind: "text" },
            { key: "att_light_vent_issues", label: "Light and vent issues with existing rooms", kind: "text" },
            { key: "att_vents_fireplace", label: "Existing vents or fireplace issues", kind: "text" },
            { key: "att_solar_conflicts", label: "Conflicts with solar panels", kind: "text" },
            { key: "att_finish_floor_diff", label: "Differences in finish floors", kind: "text" },
            { key: "att_upper_windows", label: "Upper windows concerns", kind: "text" },
            { key: "att_roof_design", label: "Roof design concerns", kind: "text" },
        ],
    },
    {
        key: "garage_conversion",
        title: "Garage-conversion questions",
        fields: [
            { key: "gar_existing_curb", label: "Is there an existing curb", kind: "text" },
            { key: "gar_fill_to_curb", label: "Fill to top of curb?", kind: "text" },
            { key: "gar_header_height", label: "Check header height of garage door", kind: "text" },
            { key: "gar_fire_walls", label: "Fire walls?", kind: "text" },
            { key: "gar_foundation_concerns", label: "Existing foundation concerns", kind: "text" },
            { key: "gar_height_to_plate", label: "Height to top plate", kind: "text" },
            { key: "gar_vapor_barrier", label: "Wall vapor barrier concerns?", kind: "text" },
        ],
    },
    {
        key: "closeout",
        title: "Job closeout",
        fields: [
            { key: "closeout_final_order", label: "Order for scheduling final inspection?", kind: "textarea" },
            { key: "closeout_who", label: "Who to schedule with?", kind: "text" },
            { key: "closeout_second_meters", label: "How do second meters impact that?", kind: "textarea" },
            { key: "closeout_recommended", label: "Recommended job-closeout schedule to optimize timing", kind: "textarea" },
        ],
    },
    {
        key: "inspections",
        title: "Inspections",
        fields: [
            { key: "insp_how", label: "How to schedule?", kind: "textarea" },
            { key: "insp_timing", label: "Expected timing?", kind: "text" },
            { key: "insp_stacking", label: "Stacking inspections allowed? Same or different depts?", kind: "textarea" },
        ],
    },
];

// ── City Info tab ────────────────────────────────────────────────────────────
const CITY_INFO: TemplateSection[] = [
    {
        key: "zoning",
        title: "Zoning & setbacks",
        fields: [
            { key: "adu_guidelines_link", label: "ADU guidelines link", kind: "text" },
            { key: "city_phone", label: "Phone number", kind: "text" },
            { key: "city_spoke_to", label: "Who did you speak to", kind: "text" },
            { key: "city_spoke_date", label: "Date you spoke to them", kind: "text" },
            { key: "zone_rnd", label: "Zone / residential neighborhood district", kind: "text" },
            { key: "allowed_uses", label: "Allowed uses", kind: "text" },
            { key: "max_lot_coverage", label: "Max lot coverage", kind: "text" },
            { key: "def_lot_coverage", label: "Definition of lot coverage", kind: "textarea" },
            { key: "setback_adu_front", label: "Setback ADU — front", kind: "text" },
            { key: "setback_adu_side", label: "Setback ADU — side", kind: "text" },
            { key: "setback_adu_rear", label: "Setback ADU — rear", kind: "text" },
            { key: "setback_main_front", label: "Setback main residence — front", kind: "text" },
            { key: "setback_main_side", label: "Setback main residence — side", kind: "text" },
            { key: "setback_main_rear", label: "Setback main residence — rear", kind: "text" },
            { key: "max_height_adu", label: "Max height ADU", kind: "text" },
            { key: "max_height_main", label: "Max height main residence", kind: "text" },
            { key: "min_distance_structures", label: "Min. distance between structures", kind: "text" },
        ],
    },
    {
        key: "reference_links",
        title: "Reference links",
        variant: "reference",
        reference: [
            { label: "Earthquake Zones of Required Investigation", value: "" },
            { label: "Fire Hazard Severity Zone Viewer", value: "" },
            { label: "FEMA's National Flood Hazard Layer (NFHL) Viewer", value: "" },
            { label: "Map My County Public v12.00", value: "" },
            { label: "T24 Mandatory Requirements", value: "" },
        ],
    },
    {
        key: "adu_size_submittal",
        title: "ADU size & submittal",
        fields: [
            { key: "max_size_detached", label: "Max size detached ADU", kind: "text" },
            { key: "max_size_attached", label: "Max size attached ADU", kind: "text" },
            { key: "special_city_requirements", label: "Any special city requirements", kind: "textarea" },
            { key: "match_house", label: "What of the ADU needs to match the house?", kind: "text" },
            { key: "submittal_process", label: "What is the submittal process", kind: "textarea" },
            { key: "online_or_in_person", label: "Online or in-person submittal", kind: "text" },
            { key: "submit_planning_first", label: "Do we submit to planning before building dept.", kind: "text" },
            { key: "num_sets_plans", label: "How many sets of plans/calcs needed to submit", kind: "text" },
            { key: "special_plans", label: "Special plans", kind: "text" },
            { key: "landscape_plans_when", label: "When are the landscape plans required", kind: "text" },
        ],
    },
    {
        key: "address_title",
        title: "Address & title",
        fields: [
            { key: "apn", label: "APN / API", kind: "text" },
            { key: "legal_description", label: "Legal description", kind: "textarea" },
            { key: "request_title_report", label: "Request title report?", kind: "yn" },
            { key: "request_easements", label: "Request easements?", kind: "yn" },
        ],
    },
    {
        key: "water_dept",
        title: "Water department",
        fields: [
            { key: "water_find_service_size", label: "How to find out size of service on street side?", kind: "textarea" },
            { key: "water_process", label: "Process to find out", kind: "textarea" },
            { key: "water_pricing_sheet", label: "Pricing sheet", kind: "text" },
            { key: "water_meter_requirements", label: "Water meter requirements sheet?", kind: "text" },
            { key: "water_which_company", label: "Which company for this address?", kind: "text" },
        ],
    },
    {
        key: "permitting",
        title: "Permitting Q&A",
        fields: [
            { key: "perm_adu_design", label: "ADU design (height, roof pitch, front style, etc.)", kind: "textarea" },
            { key: "perm_fire_sprinklers", label: "Fire sprinklers", kind: "text" },
            { key: "perm_separate_utilities", label: "Separate utilities", kind: "text" },
            { key: "perm_2nd_address_when", label: "When to submit for 2nd address", kind: "text" },
            { key: "perm_survey_permitting", label: "Survey required for permitting?", kind: "text" },
            { key: "perm_survey_construction", label: "Survey required during construction?", kind: "text" },
            { key: "perm_mep_plans", label: "MEP plans?", kind: "text" },
            { key: "perm_drainage_plans", label: "Drainage plans?", kind: "text" },
            { key: "perm_landscaping_plans", label: "Landscaping plans?", kind: "text" },
            { key: "perm_school_fees", label: "When are school fees applicable", kind: "text" },
            { key: "perm_soils_report", label: "Soils report", kind: "text" },
            { key: "perm_impact_fees", label: "Impact fees", kind: "text" },
            { key: "perm_fire_flow", label: "Fire flow?", kind: "text" },
            { key: "perm_backflow", label: "Backflow device", kind: "text" },
            { key: "perm_unpermitted_structures", label: "Unpermitted structures", kind: "textarea" },
            { key: "perm_permitting_order", label: "Permitting order", kind: "text" },
            { key: "perm_plans_timeline", label: "Plans timeline", kind: "text" },
            { key: "perm_permit_timeline", label: "Permit timeline", kind: "textarea" },
            { key: "perm_construction_timeline", label: "Construction", kind: "text" },
            { key: "perm_2nd_meter_timeline", label: "2nd meter timeline", kind: "text" },
            { key: "perm_inspections", label: "Inspections", kind: "textarea" },
            { key: "perm_closeout", label: "Close out", kind: "textarea" },
        ],
    },
    {
        key: "special_zones",
        title: "Special zones",
        fields: [
            { key: "zone_fire", label: "Special fire zone", kind: "text" },
            { key: "zone_soils", label: "Special soils zone", kind: "text" },
            { key: "zone_flood", label: "Special flood zone", kind: "text" },
            { key: "special_plans_required", label: "Special plans required", kind: "text" },
            { key: "mep_required", label: "Engineered MEP required or is layout ok", kind: "text" },
            { key: "solar_deferred", label: "Can solar plans be deferred", kind: "text" },
            { key: "fire_sprinklers_deferred", label: "Can fire sprinklers be deferred", kind: "text" },
            { key: "grading_drainage_plans", label: "Grading and drainage plans", kind: "text" },
            { key: "fire_flow_test", label: "Does your city require a fire flow test", kind: "text" },
            { key: "which_depts_final", label: "Which departments have a final inspection?", kind: "text" },
            { key: "cheer_hers_required", label: "CHEERS/HERS required for final inspection sign-off?", kind: "text" },
            { key: "certificate_of_occupancy", label: "Certificate of occupancy? If so, how to get it?", kind: "text" },
            { key: "sewage_ejection_pump_reqs", label: "Any special requirements for sewage ejection pump", kind: "text" },
            { key: "backflow_device_required", label: "Do we require a backflow device to be installed?", kind: "text" },
        ],
    },
    {
        key: "past_projects",
        title: "Past projects (reference)",
        variant: "reference",
        reference: [
            { label: "1", value: "Bowdoin" },
            { label: "2", value: "Genesee" },
            { label: "3", value: "Bonita" },
        ],
    },
];

export const FPA_TEMPLATE: TemplateTab[] = [
    { key: "siteVisit", title: "Site Visit Info", sections: SITE_VISIT },
    { key: "cityInfo", title: "City Info", sections: CITY_INFO },
];
