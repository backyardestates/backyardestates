// Architect-analysis template, modelled on the legacy Google Sheet ("Site Visit
// Info" + "City Info" tabs) and expanded per the field-by-field spec. The form
// is rendered generically from this config; answers are stored as JSON on
// FormalAnalysis (siteVisitJson / cityInfoJson). Reference-only blocks
// (links, past projects) render read-only; discounts render as a live checklist.
//
// IMPORTANT: field `key`s are stable identifiers — saved answers and architect
// flags are keyed by them. Existing keys are preserved; new fields use new keys.

export type FieldKind =
    // primitives
    | "text"
    | "textarea"
    | "number"
    | "currency"
    // legacy three-state dropdown (Yes / No / Unsure) — kept for old field keys
    | "yn"
    // segmented button groups — `options` supplies the choices
    | "toggle" // two-state; defaults to Yes / No when no options given
    | "segmented" // N-state (Yes / No / Unknown, Done / Not Done / N/A, …)
    // pickers
    | "select" // dropdown; `options` required, `allowOther` adds a free-text escape
    | "stepper" // integer +/- control
    | "numberUnit" // number paired with a unit dropdown (`units`)
    | "tel"
    | "email"
    | "url"
    | "date";

export interface FieldOption {
    value: string;
    label: string;
}

/**
 * Show this field only when another field on the same tab holds a matching
 * value. Purely a render-time gate — hidden fields keep their stored value and
 * any flag attached to them (flagging logic is untouched).
 */
export interface ShowWhen {
    /** Key of the controlling field on the same tab. */
    key: string;
    /** Visible when the controlling value equals one of these. */
    equals: string | string[];
}

export interface TemplateField {
    key: string;
    label: string;
    hint?: string;
    kind: FieldKind;
    /** Choices for select / toggle / segmented. */
    options?: FieldOption[];
    /** When true, a select renders an extra "Other" free-text input. */
    allowOther?: boolean;
    /** Unit choices for `numberUnit` (first is the default). */
    units?: string[];
    /** Adornments / bounds for number-style inputs. */
    prefix?: string;
    suffix?: string;
    min?: number;
    max?: number;
    step?: number;
    placeholder?: string;
    /** Conditional visibility. */
    showWhen?: ShowWhen;
    /** Force the field to span the full grid width. */
    wide?: boolean;
}

export interface TemplateSection {
    key: string;
    title: string;
    /** Short context line rendered under the section title. */
    note?: string;
    /** Special renderers handled by the form component. */
    variant?: "fields" | "fixtureMatrix" | "reference" | "discounts";
    fields?: TemplateField[];
    /** For variant: "reference" — static rows shown read-only. */
    reference?: { label: string; value: string }[];
    /** For variant: "discounts" — selectable line items with a live total. */
    discounts?: { key: string; label: string; value: number }[];
    /** Hide the whole section unless this field (same tab) matches. */
    showWhen?: ShowWhen;
}

export interface TemplateTab {
    key: "siteVisit" | "cityInfo";
    title: string;
    /** Short blurb shown under the tab's heading. */
    blurb?: string;
    sections: TemplateSection[];
}

// ── Shared option sets ───────────────────────────────────────────────────────
const YES_NO: FieldOption[] = [
    { value: "yes", label: "Yes" },
    { value: "no", label: "No" },
];
const YES_NO_UNKNOWN: FieldOption[] = [...YES_NO, { value: "unknown", label: "Unknown" }];
const YES_NO_TBD: FieldOption[] = [...YES_NO, { value: "tbd", label: "TBD" }];
const YES_NO_MAYBE: FieldOption[] = [...YES_NO, { value: "maybe", label: "Maybe" }];
const YES_NO_PER_OWNER: FieldOption[] = [...YES_NO, { value: "per_owner", label: "Per owner" }];
const DONE_STATES: FieldOption[] = [
    { value: "done", label: "Done" },
    { value: "not_done", label: "Not done" },
    { value: "na", label: "N/A" },
];
const CLIMATE_ZONES: FieldOption[] = Array.from({ length: 11 }, (_, i) => ({
    value: String(i + 6),
    label: `Zone ${i + 6}`,
}));

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

// Design water pressure auto-computes (water pressure − 3 PSI); meter size is a
// manual lookup the architect reads from the city's sizing table.
export const WATER_METER_FIELDS: TemplateField[] = [
    { key: "longest_distance", label: "Longest distance from water meter", kind: "number", suffix: "ft" },
    { key: "water_pressure", label: "Water pressure", kind: "number", suffix: "PSI" },
    { key: "design_water_pressure", label: "Design water pressure (pressure − 3)", kind: "text" },
    { key: "meter_size_needed", label: "Meter size needed (from table)", kind: "text" },
    { key: "meter_explanation", label: "Water meter explanation", kind: "textarea" },
];

// ── Site Visit Info tab ──────────────────────────────────────────────────────
const SITE_VISIT: TemplateSection[] = [
    {
        key: "files",
        title: "Project files",
        note: "The Dropbox folder where the architect uploads site photos, measurements & documents.",
        fields: [
            {
                key: "dropbox_link",
                label: "Dropbox link",
                kind: "url",
                wide: true,
                placeholder: "https://www.dropbox.com/…",
            },
        ],
    },
    {
        key: "jurisdiction",
        title: "Jurisdiction",
        fields: [
            { key: "jurisdiction_city", label: "City / County", kind: "text", hint: "Auto-fills from the address when available" },
            { key: "hoa", label: "Is the property part of an HOA?", kind: "toggle", options: YES_NO },
            { key: "hoa_notes", label: "HOA notes", kind: "textarea", wide: true, showWhen: { key: "hoa", equals: "yes" } },
            { key: "historic_district", label: "Historic district?", kind: "segmented", options: YES_NO_UNKNOWN },
            { key: "historic_notes", label: "Historic district notes", kind: "textarea", wide: true, showWhen: { key: "historic_district", equals: ["yes", "unknown"] } },
        ],
    },
    {
        key: "sewer",
        title: "Site utilities — Sewer",
        fields: [
            { key: "sewer_or_septic", label: "Sewer or septic", kind: "select", options: [
                { value: "sewer", label: "Sewer" },
                { value: "septic", label: "Septic" },
                { value: "unknown", label: "Unknown" },
            ] },
            { key: "septic_location", label: "Location of septic", kind: "textarea", wide: true, showWhen: { key: "sewer_or_septic", equals: "septic" } },
            { key: "sewer_pipe_size", label: "Sewer pipe size", kind: "text", hint: 'e.g. 4" cleanout in back' },
            { key: "sewer_depth", label: "Sewer depth", kind: "numberUnit", units: ["in", "ft"], hint: 'e.g. 18" at back' },
            { key: "sewer_scope_needed", label: "Sewer scope needed", kind: "segmented", options: YES_NO_TBD },
            { key: "sewer_scope_cost", label: "Sewer scope cost", kind: "currency", showWhen: { key: "sewer_scope_needed", equals: "yes" } },
            { key: "ejection_pump_needed", label: "Ejection pump needed", kind: "select", options: [
                { value: "yes", label: "Yes" },
                { value: "no", label: "No" },
                { value: "not_likely", label: "Not likely" },
                { value: "tbd", label: "TBD" },
            ] },
            { key: "ejection_pump_notes", label: "Ejection pump notes", kind: "textarea", wide: true },
            { key: "cleanout_location", label: "Cleanout location", kind: "text" },
        ],
    },
    {
        key: "power",
        title: "Site utilities — Power",
        fields: [
            { key: "existing_meter_amp", label: "Existing meter amps", kind: "select", allowOther: true, options: [
                { value: "100A", label: "100A" },
                { value: "200A", label: "200A" },
                { value: "400A", label: "400A" },
            ] },
            { key: "electric_load_calc_needed", label: "Electric load calc needed", kind: "toggle", options: YES_NO },
            { key: "overhead_or_underground", label: "Overhead or underground feed", kind: "select", options: [
                { value: "overhead", label: "Overhead" },
                { value: "underground", label: "Underground" },
                { value: "both", label: "Both" },
            ] },
            { key: "feed_notes", label: "Feed notes", kind: "textarea", wide: true, hint: '"goes over ADU" type notes' },
            { key: "wire_clearance", label: "Expected wire clearance", kind: "select", options: [
                { value: "3", label: "3'" },
                { value: "8", label: "8'" },
                { value: "unknown", label: "Unknown" },
            ] },
            { key: "existing_car_charger", label: "Existing car charger?", kind: "toggle", options: YES_NO },
            { key: "car_charger_amps", label: "Car charger amps", kind: "number", suffix: "A", showWhen: { key: "existing_car_charger", equals: "yes" } },
            { key: "panel_upgrade_needed", label: "Panel upgrade needed", kind: "toggle", options: YES_NO },
            { key: "panel_upgrade_notes", label: "Panel upgrade notes", kind: "textarea", wide: true, hint: 'e.g. "move to back of ADU"', showWhen: { key: "panel_upgrade_needed", equals: "yes" } },
            { key: "sub_panels", label: "Any sub panels?", kind: "toggle", options: YES_NO },
            { key: "sub_panel_notes", label: "Sub panel notes", kind: "textarea", wide: true, showWhen: { key: "sub_panels", equals: "yes" } },
            { key: "relocate_panel", label: "Relocate panel to avoid OHP?", kind: "toggle", options: YES_NO },
            { key: "relocation_notes", label: "Relocation notes", kind: "textarea", wide: true, showWhen: { key: "relocate_panel", equals: "yes" } },
            { key: "electric_provider", label: "Electric provider", kind: "select", allowOther: true, options: [
                { value: "edison", label: "Edison" },
                { value: "sce", label: "SCE" },
            ] },
        ],
    },
    {
        key: "gas",
        title: "Site utilities — Natural gas",
        fields: [
            { key: "is_there_gas", label: "Is there gas?", kind: "toggle", options: YES_NO },
            { key: "gas_provider", label: "Gas company / provider", kind: "select", allowOther: true, showWhen: { key: "is_there_gas", equals: "yes" }, options: [
                { value: "scg", label: "SCG" },
                { value: "socalgas", label: "SoCalGas" },
            ] },
            { key: "gas_wires_attic_crawl", label: "Wires through attic or crawl space?", kind: "select", options: [
                { value: "attic", label: "Attic" },
                { value: "crawl", label: "Crawl space" },
                { value: "neither", label: "Neither" },
                { value: "both", label: "Both" },
            ] },
            { key: "gas_fixture_units", label: "Gas fixture units", kind: "number", step: 0.1, hint: "Used for load calcs", showWhen: { key: "is_there_gas", equals: "yes" } },
        ],
    },
    {
        key: "water",
        title: "Site utilities — Water",
        note: "Capture meter & pressure before the office visit; pipe sizing on the onsite visit.",
        fields: [
            { key: "water_pressure", label: "Water pressure", kind: "number", suffix: "PSI", hint: "e.g. 88" },
            { key: "ex_meter_size", label: "Size of existing meter", kind: "select", options: [
                { value: '5/8"', label: '5/8"' },
                { value: '3/4"', label: '3/4"' },
                { value: '1"', label: '1"' },
                { value: '1-1/2"', label: '1-1/2"' },
                { value: '2"', label: '2"' },
            ] },
            { key: "pipe_main_to_meter", label: "Pipe size: main to meter", kind: "text", hint: 'e.g. 1-1/8" OD' },
            { key: "pipe_meter_to_house", label: "Pipe size: meter to house", kind: "select", allowOther: true, options: [
                { value: '1/2"', label: '1/2"' },
                { value: '3/4"', label: '3/4"' },
                { value: '1"', label: '1"' },
                { value: "unknown", label: "Unknown" },
            ] },
            { key: "pipe_out_of_ground", label: "Pipe size: out of ground at house", kind: "select", options: [
                { value: '3/4"', label: '3/4"' },
                { value: '1"', label: '1"' },
                { value: '1-1/4"', label: '1-1/4"' },
                { value: '1-1/2"', label: '1-1/2"' },
            ] },
            { key: "water_meter_upgrade", label: "Water meter upgrade required?", kind: "segmented", options: YES_NO_TBD },
            { key: "water_meter_upgrade_cost", label: "Water meter upgrade cost", kind: "currency", showWhen: { key: "water_meter_upgrade", equals: "yes" } },
            { key: "water_provider", label: "Water company / provider", kind: "text", hint: 'e.g. "City of Pomona"' },
        ],
    },
    {
        key: "site_terrain",
        title: "Site characteristics",
        fields: [
            { key: "sloping_terrain", label: "Sloping terrain description", kind: "textarea", wide: true, hint: "Critical field — always has detail" },
            { key: "adu_rise_fall_diff", label: "ADU rise/fall differential", kind: "number", suffix: "ft", hint: "Pressure to highest fixture" },
            { key: "retaining_walls", label: "Need for retaining walls", kind: "segmented", options: YES_NO_TBD },
            { key: "retaining_wall_notes", label: "Retaining wall notes", kind: "textarea", wide: true, showWhen: { key: "retaining_walls", equals: ["yes", "tbd"] } },
            { key: "easements_reasons", label: "Noticeable reasons for easements", kind: "toggle", options: YES_NO },
            { key: "actual_easements", label: "Actual easements description", kind: "textarea", wide: true, hint: "Often detailed legal descriptions", showWhen: { key: "easements_reasons", equals: "yes" } },
            { key: "unpermitted_structures", label: "Unpermitted structures", kind: "segmented", options: YES_NO_PER_OWNER },
            { key: "unpermitted_structures_notes", label: "Unpermitted structures notes", kind: "textarea", wide: true, showWhen: { key: "unpermitted_structures", equals: ["yes", "per_owner"] } },
            { key: "trees_to_remove", label: "Trees that need to be removed", kind: "segmented", options: YES_NO_MAYBE },
            { key: "tree_removal_notes", label: "Tree removal notes", kind: "textarea", wide: true, hint: "Size, species, quantity", showWhen: { key: "trees_to_remove", equals: ["yes", "maybe"] } },
            { key: "chimney_proximity", label: "Proximity issues to existing chimneys", kind: "toggle", options: YES_NO },
            { key: "chimney_notes", label: "Chimney notes", kind: "textarea", wide: true, showWhen: { key: "chimney_proximity", equals: "yes" } },
            { key: "need_survey", label: "Need for survey", kind: "select", options: [
                { value: "yes", label: "Yes" },
                { value: "no", label: "No" },
                { value: "depends", label: "Depends" },
                { value: "city_requires", label: "City requires" },
            ] },
            { key: "survey_notes", label: "Survey notes", kind: "textarea", wide: true },
            { key: "need_area_drains", label: "Need for new area drains", kind: "toggle", options: YES_NO },
            { key: "reroute_pipes", label: "Re-route existing pipes under ADU", kind: "toggle", options: YES_NO },
            { key: "cross_lot_drainage", label: "Existing cross-lot drainage", kind: "segmented", options: YES_NO_UNKNOWN },
            { key: "need_rain_gutters", label: "Need for rain gutters", kind: "toggle", options: YES_NO },
            { key: "storm_drain_sump_pump", label: "Need for storm drain sump pump", kind: "segmented", options: YES_NO_TBD },
            { key: "eave_gable_vents", label: "Eave or gable vents on adjacent wall", kind: "select", options: [
                { value: "eave", label: "Eave" },
                { value: "gable", label: "Gable" },
                { value: "both", label: "Both" },
                { value: "none", label: "None" },
            ] },
            { key: "house_overhang_adjacent", label: "Overhang of house adjacent to ADU", kind: "text", hint: "Note the measurement" },
            { key: "climate_zone", label: "Climate zone", kind: "select", options: CLIMATE_ZONES, hint: "CA Title 24 — affects solar PV exemption" },
        ],
    },
    {
        key: "main_residence",
        title: "Existing main residence",
        fields: [
            { key: "main_sqft", label: "Square footage", kind: "number", suffix: "sq ft" },
            { key: "year_built", label: "Year built", kind: "number", placeholder: "YYYY" },
            { key: "how_many_stories", label: "How many stories", kind: "select", options: [
                { value: "1", label: "1" },
                { value: "2", label: "2" },
                { value: "3+", label: "3+" },
            ] },
            { key: "existing_garage", label: "Is there an existing garage?", kind: "toggle", options: YES_NO },
            { key: "garage_detached_attached", label: "Garage: detached or attached", kind: "select", showWhen: { key: "existing_garage", equals: "yes" }, options: [
                { value: "detached", label: "Detached" },
                { value: "attached", label: "Attached" },
                { value: "none", label: "None" },
            ] },
            { key: "garage_num_cars", label: "Garage: number of cars", kind: "select", showWhen: { key: "existing_garage", equals: "yes" }, options: [
                { value: "1", label: "1-car" },
                { value: "2", label: "2-car" },
                { value: "3", label: "3-car" },
            ] },
            { key: "roofing_material", label: "Roofing material", kind: "select", allowOther: true, options: [
                { value: "comp_shingle", label: "Comp shingle" },
                { value: "tile", label: "Tile" },
                { value: "flat_tpo", label: "Flat-TPO" },
                { value: "wood_shake", label: "Wood shake" },
            ] },
            { key: "roof_design", label: "Type of roof design", kind: "select", options: [
                { value: "gable", label: "Gable" },
                { value: "hip", label: "Hip" },
                { value: "flat", label: "Flat" },
                { value: "shed", label: "Shed" },
                { value: "mixed", label: "Mixed" },
            ] },
            { key: "roof_slope", label: "Slope of roof", kind: "text", hint: 'Allow multiple, e.g. "3.5:12 and 4:12"' },
            { key: "interior_ceiling_heights", label: "Interior ceiling heights", kind: "text", hint: `e.g. 8' flat or 8' with vault` },
            { key: "siding_materials", label: "Siding materials", kind: "textarea", wide: true, hint: "Often multiple materials" },
            { key: "existing_solar", label: "Existing solar panels", kind: "toggle", options: YES_NO },
            { key: "ex_fire_sprinklers", label: "Existing fire sprinklers", kind: "toggle", options: YES_NO },
            { key: "foundation_type", label: "Type of foundation", kind: "select", options: [
                { value: "raised", label: "Raised" },
                { value: "slab", label: "Slab on grade" },
                { value: "crawl", label: "Crawl space" },
                { value: "unknown", label: "Unknown" },
            ] },
            { key: "stucco_to_roof_or_block", label: "Stucco to roof or block", kind: "select", options: [
                { value: "roof", label: "Roof" },
                { value: "block", label: "Block" },
            ] },
            { key: "wires_through_attic", label: "Run wires through attic or crawl space?", kind: "select", allowOther: true, wide: true, options: [
                { value: "attic", label: "Attic" },
                { value: "crawl", label: "Crawl space" },
                { value: "neither", label: "Neither" },
                { value: "conduit_exterior", label: "Conduit on exterior" },
            ] },
        ],
    },
    { key: "fixtures", title: "Fixture count", variant: "fixtureMatrix" },
    {
        key: "scope_of_work",
        title: "Scope of work (from contract)",
        fields: [
            { key: "standard_unit", label: "Start with standard unit?", kind: "toggle", options: YES_NO },
            { key: "sow_sqft", label: "Square footage", kind: "number", suffix: "sq ft" },
            { key: "sow_bathrooms", label: "Bathrooms", kind: "number" },
            { key: "sow_bedrooms", label: "Bedrooms", kind: "number" },
            { key: "sow_offices", label: "Offices", kind: "number" },
            { key: "sow_showers", label: "Showers or bathtub/showers", kind: "text" },
            { key: "sow_roll_in_shower", label: "Roll-in shower?", kind: "toggle", options: YES_NO },
        ],
    },
    {
        key: "adu_unit",
        title: "Proposed ADU design",
        fields: [
            { key: "adu_name", label: "Unit / Estate name", kind: "select", allowOther: true, options: [
                { value: "estate_400", label: "Estate 400" },
                { value: "estate_714", label: "Estate 714" },
                { value: "estate_800", label: "Estate 800" },
            ] },
            { key: "adu_type", label: "ADU type", kind: "select", options: [
                { value: "detached", label: "Detached" },
                { value: "attached", label: "Attached" },
                { value: "garage_conversion", label: "Garage conversion" },
                { value: "jadu", label: "JADU" },
            ] },
            { key: "adu_size", label: "Size of ADU", kind: "text" },
            { key: "adu_sqft", label: "Square footage", kind: "number", suffix: "sq ft" },
            { key: "adu_bedrooms", label: "Bedrooms", kind: "stepper", min: 0, max: 4 },
            { key: "adu_bathrooms", label: "Bathrooms", kind: "stepper", min: 1, max: 3 },
            { key: "adu_tub_showers", label: "Tub/shower combos", kind: "stepper", min: 0 },
            { key: "adu_showers_only", label: "Shower only", kind: "stepper", min: 0 },
            { key: "adu_toilets", label: "Toilets", kind: "stepper", min: 0 },
            { key: "adu_bathroom_sinks", label: "Bathroom sinks", kind: "stepper", min: 0 },
            { key: "adu_dishwashers", label: "Dishwashers", kind: "stepper", min: 0, max: 1 },
            { key: "adu_laundry", label: "Laundry room", kind: "toggle", options: YES_NO },
            { key: "adu_upper_windows", label: "Upper windows", kind: "toggle", options: YES_NO },
            { key: "adu_upper_windows_notes", label: "Upper windows notes", kind: "textarea", wide: true, showWhen: { key: "adu_upper_windows", equals: "yes" } },
            { key: "adu_ceiling_heights", label: "Ceiling heights", kind: "select", allowOther: true, options: [
                { value: "8", label: "8'" },
                { value: "9", label: "9'" },
                { value: "10", label: "10'" },
                { value: "12", label: "12'" },
            ] },
            { key: "adu_utilities", label: "Utilities", kind: "text" },
            { key: "adu_all_electric", label: "All electric?", kind: "toggle", options: YES_NO },
            { key: "adu_split_or_central", label: "HVAC type", kind: "select", options: [
                { value: "split_ductless", label: "Split ductless" },
                { value: "central_air", label: "Central air" },
                { value: "none", label: "None" },
            ] },
            { key: "adu_dual_electric", label: "Dual electric metering?", kind: "toggle", options: YES_NO },
            { key: "adu_dual_water", label: "Dual water metering?", kind: "toggle", options: YES_NO },
            { key: "adu_dual_gas", label: "Dual gas metering?", kind: "toggle", options: YES_NO },
            { key: "adu_sewage_pump", label: "Possible sewage pump?", kind: "segmented", options: YES_NO_TBD },
            { key: "adu_deeper_footings", label: "Need for deeper footings", kind: "toggle", options: YES_NO },
            { key: "adu_deeper_footings_notes", label: "Deeper footings notes", kind: "textarea", wide: true, showWhen: { key: "adu_deeper_footings", equals: "yes" } },
            { key: "adu_foundation_out", label: "More foundation above ground?", kind: "toggle", options: YES_NO },
            { key: "adu_foundation_out_measure", label: "Foundation above ground — measurement", kind: "text", showWhen: { key: "adu_foundation_out", equals: "yes" } },
            { key: "adu_fire_walls", label: "Need fire walls?", kind: "toggle", options: YES_NO },
            { key: "adu_fire_walls_notes", label: "Fire walls notes", kind: "textarea", wide: true, showWhen: { key: "adu_fire_walls", equals: "yes" } },
        ],
    },
    {
        key: "attached_unit",
        title: "Attached-unit questions",
        note: "Shown for attached ADUs.",
        showWhen: { key: "adu_type", equals: "attached" },
        fields: [
            { key: "att_drainage_issues", label: "Will this create drainage issues?", kind: "toggle", options: YES_NO },
            { key: "att_drainage_cost", label: "Drainage cost", kind: "currency", showWhen: { key: "att_drainage_issues", equals: "yes" } },
            { key: "att_drainage_notes", label: "Drainage notes", kind: "textarea", wide: true, showWhen: { key: "att_drainage_issues", equals: "yes" } },
            { key: "att_light_vent_issues", label: "Light and vent issues with existing rooms?", kind: "toggle", options: YES_NO },
            { key: "att_light_vent_notes", label: "Light & vent notes", kind: "textarea", wide: true, showWhen: { key: "att_light_vent_issues", equals: "yes" } },
            { key: "att_vents_fireplace", label: "Existing vents or fireplace issues?", kind: "toggle", options: YES_NO },
            { key: "att_vents_fireplace_notes", label: "Vents / fireplace notes", kind: "textarea", wide: true, showWhen: { key: "att_vents_fireplace", equals: "yes" } },
            { key: "att_solar_conflicts", label: "Conflicts with solar panels?", kind: "toggle", options: YES_NO },
            { key: "att_solar_notes", label: "Solar conflict notes", kind: "textarea", wide: true, showWhen: { key: "att_solar_conflicts", equals: "yes" } },
            { key: "att_finish_floor_diff", label: "Differences in finish floors?", kind: "toggle", options: YES_NO },
            { key: "att_finish_floor_notes", label: "Finish floor notes", kind: "textarea", wide: true, showWhen: { key: "att_finish_floor_diff", equals: "yes" } },
            { key: "att_upper_windows", label: "Upper windows concerns?", kind: "toggle", options: YES_NO },
            { key: "att_upper_windows_notes", label: "Upper windows notes", kind: "textarea", wide: true, showWhen: { key: "att_upper_windows", equals: "yes" } },
            { key: "att_roof_design", label: "Roof design concerns?", kind: "toggle", options: YES_NO },
            { key: "att_roof_design_notes", label: "Roof design notes", kind: "textarea", wide: true, showWhen: { key: "att_roof_design", equals: "yes" } },
            { key: "att_fire_walls", label: "Fire walls?", kind: "toggle", options: YES_NO },
        ],
    },
    {
        key: "garage_conversion",
        title: "Garage-conversion questions",
        note: "Shown for garage-conversion ADUs.",
        showWhen: { key: "adu_type", equals: "garage_conversion" },
        fields: [
            { key: "gar_existing_curb", label: "Is there an existing curb?", kind: "toggle", options: YES_NO },
            { key: "gar_curb_measure", label: "Curb measurement", kind: "text", showWhen: { key: "gar_existing_curb", equals: "yes" } },
            { key: "gar_fill_to_curb", label: "Fill to top of curb?", kind: "toggle", options: YES_NO },
            { key: "gar_fill_notes", label: "Fill notes", kind: "textarea", wide: true, showWhen: { key: "gar_fill_to_curb", equals: "yes" } },
            { key: "gar_header_height", label: "Check header height for garage door", kind: "number", suffix: "in" },
            { key: "gar_fire_walls", label: "Fire walls?", kind: "toggle", options: YES_NO },
            { key: "gar_fire_walls_notes", label: "Fire walls notes", kind: "textarea", wide: true, showWhen: { key: "gar_fire_walls", equals: "yes" } },
            { key: "gar_foundation_concerns", label: "Existing foundation concerns?", kind: "toggle", options: YES_NO },
            { key: "gar_foundation_notes", label: "Foundation notes", kind: "textarea", wide: true, showWhen: { key: "gar_foundation_concerns", equals: "yes" } },
            { key: "gar_height_to_plate", label: "Height to top plate", kind: "number", suffix: "in", hint: "e.g. 97.5" },
            { key: "gar_vapor_barrier", label: "Wall vapor barrier concerns?", kind: "toggle", options: YES_NO },
            { key: "gar_vapor_notes", label: "Vapor barrier notes", kind: "textarea", wide: true, showWhen: { key: "gar_vapor_barrier", equals: "yes" } },
        ],
    },
    {
        key: "logistics",
        title: "Final site check",
        note: "Mark each item Done / Not done / N/A before leaving the site.",
        fields: [
            { key: "fire_hydrant_location", label: "Fire hydrant location", kind: "text" },
            { key: "take_photos", label: "Photos taken", kind: "segmented", options: DONE_STATES },
            { key: "measure_critical_dims", label: "Critical dimensions measured", kind: "segmented", options: DONE_STATES },
            { key: "measure_roof_pitches", label: "Roof pitches measured", kind: "segmented", options: DONE_STATES },
            { key: "take_drone_photos", label: "Drone photos taken", kind: "segmented", options: DONE_STATES },
            { key: "distance_adu_over_150", label: "Distance to ADU from street > 150'?", kind: "toggle", options: YES_NO },
            { key: "distance_adu_feet", label: "Distance to ADU", kind: "number", suffix: "ft", showWhen: { key: "distance_adu_over_150", equals: "yes" } },
            { key: "fire_sprinklers_required", label: "Fire sprinklers required?", kind: "toggle", options: YES_NO },
            { key: "fire_sprinklers_reason", label: "Fire sprinklers — reason", kind: "textarea", wide: true, showWhen: { key: "fire_sprinklers_required", equals: "yes" } },
            { key: "nearest_bus_stop", label: "Distance to nearest bus stop", kind: "number", suffix: "ft" },
        ],
    },
    {
        key: "closeout",
        title: "Job closeout",
        fields: [
            { key: "closeout_final_order", label: "Order for scheduling final inspection?", kind: "textarea", wide: true },
            { key: "closeout_who", label: "Who to schedule with?", kind: "text" },
            { key: "closeout_second_meters", label: "How do second meters impact that?", kind: "textarea", wide: true },
            { key: "closeout_recommended", label: "Recommended job-closeout schedule to optimize timing", kind: "textarea", wide: true },
        ],
    },
    {
        key: "inspections",
        title: "Inspections",
        fields: [
            { key: "insp_how", label: "How to schedule?", kind: "textarea", wide: true },
            { key: "insp_timing", label: "Expected timing?", kind: "text" },
            { key: "insp_stacking", label: "Stacking inspections allowed? Same or different depts?", kind: "textarea", wide: true },
        ],
    },
    {
        key: "other_notes",
        title: "Other notes",
        fields: [
            { key: "other_notes", label: "Other notes", kind: "textarea", wide: true },
            { key: "open_questions", label: "Open questions / things to verify", kind: "textarea", wide: true },
        ],
    },
    {
        key: "discounts_ref",
        title: "Discounts at purchase",
        note: "Check all that apply — the total updates automatically.",
        variant: "discounts",
        discounts: [
            { key: "disc_ad", label: "Ad sign-up", value: 1000 },
            { key: "disc_educator", label: "Educator", value: 1500 },
            { key: "disc_first_responder", label: "First responder", value: 1500 },
            { key: "disc_agent_referral", label: "Real estate agent referral", value: 3500 },
            { key: "disc_family", label: "Family discount", value: 3500 },
        ],
    },
];

// ── City Info tab ────────────────────────────────────────────────────────────
const CITY_INFO: TemplateSection[] = [
    {
        key: "zoning",
        title: "Jurisdiction / zoning research",
        note: "Filled in by the office.",
        fields: [
            { key: "adu_guidelines_link", label: "ADU guidelines link", kind: "url", wide: true },
            { key: "city_phone", label: "Jurisdiction phone", kind: "tel" },
            { key: "city_spoke_to", label: "Who did you speak to", kind: "text" },
            { key: "city_spoke_date", label: "Date spoken", kind: "date" },
            { key: "zone_rnd", label: "Zoning district", kind: "text", hint: "e.g. RND1" },
            { key: "allowed_uses", label: "Allowed uses", kind: "textarea", wide: true },
            { key: "max_lot_coverage", label: "Max lot coverage", kind: "number", suffix: "%" },
            { key: "def_lot_coverage", label: "Definition of lot coverage", kind: "textarea", wide: true },
            { key: "setback_adu_front", label: "ADU setback — front", kind: "number", suffix: "ft" },
            { key: "setback_adu_side", label: "ADU setback — side", kind: "number", suffix: "ft" },
            { key: "setback_adu_rear", label: "ADU setback — rear", kind: "number", suffix: "ft" },
            { key: "setback_main_front", label: "Main residence setback — front", kind: "number", suffix: "ft" },
            { key: "setback_main_side", label: "Main residence setback — side", kind: "number", suffix: "ft" },
            { key: "setback_main_rear", label: "Main residence setback — rear", kind: "number", suffix: "ft" },
            { key: "max_height_adu", label: "Max height ADU", kind: "number", suffix: "ft" },
            { key: "max_height_main", label: "Max height main residence", kind: "number", suffix: "ft" },
            { key: "min_distance_structures", label: "Min. distance between structures", kind: "number", suffix: "ft" },
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
            { key: "max_size_detached", label: "Max size detached ADU", kind: "number", suffix: "sq ft" },
            { key: "max_size_attached", label: "Max size attached ADU", kind: "text", hint: 'e.g. "1000sf or 50% of main"' },
            { key: "special_city_requirements", label: "Special city requirements", kind: "textarea", wide: true },
            { key: "match_house", label: "What must the ADU match?", kind: "textarea", wide: true },
            { key: "submittal_process", label: "Submittal process", kind: "textarea", wide: true },
            { key: "online_or_in_person", label: "Online or in-person submittal", kind: "select", options: [
                { value: "online", label: "Online" },
                { value: "in_person", label: "In-person" },
                { value: "both", label: "Both" },
            ] },
            { key: "submit_planning_first", label: "Submit to planning before building dept?", kind: "toggle", options: YES_NO },
            { key: "num_sets_plans", label: "Sets of plans required", kind: "number" },
            { key: "special_plans", label: "Special plans", kind: "text" },
            { key: "landscape_plans_required", label: "Landscape plans required?", kind: "segmented", options: [
                { value: "yes", label: "Yes" },
                { value: "no", label: "No" },
                { value: "sometimes", label: "Sometimes" },
            ] },
            { key: "landscape_plans_when", label: "When are landscape plans required", kind: "text" },
        ],
    },
    {
        key: "permitting",
        title: "Jurisdiction Q&A",
        fields: [
            { key: "perm_adu_design", label: "ADU design restrictions", kind: "textarea", wide: true, hint: "e.g. color / siding rules" },
            { key: "perm_fire_sprinklers", label: "Fire sprinklers requirement", kind: "select", options: [
                { value: "yes", label: "Yes" },
                { value: "no", label: "No" },
                { value: "conditional", label: "Conditional" },
            ] },
            { key: "perm_fire_sprinkler_threshold", label: "Fire sprinkler threshold", kind: "text", hint: `e.g. "150' from street"`, showWhen: { key: "perm_fire_sprinklers", equals: "conditional" } },
            { key: "perm_separate_utilities", label: "Separate utilities", kind: "select", options: [
                { value: "optional", label: "Optional" },
                { value: "required", label: "Required" },
                { value: "sometimes", label: "Sometimes" },
                { value: "not_allowed", label: "Not allowed" },
            ] },
            { key: "perm_2nd_address_when", label: "When to submit for 2nd address", kind: "select", options: [
                { value: "first", label: "First" },
                { value: "deferred", label: "Deferred" },
                { value: "before_permit", label: "Before permit" },
                { value: "not_permitted", label: "Not permitted" },
            ] },
            { key: "perm_survey_permitting", label: "Survey required for permitting?", kind: "select", options: [
                { value: "yes", label: "Yes" },
                { value: "no", label: "No" },
                { value: "sometimes", label: "Sometimes" },
                { value: "city_specific", label: "City-specific" },
            ] },
            { key: "perm_survey_construction", label: "Survey required during construction?", kind: "select", options: [
                { value: "yes", label: "Yes" },
                { value: "no", label: "No" },
                { value: "sometimes", label: "Sometimes" },
                { value: "city_specific", label: "City-specific" },
            ] },
            { key: "perm_mep_plans", label: "MEP plans required?", kind: "select", options: [
                { value: "engineered", label: "Engineered required" },
                { value: "layout_ok", label: "Layout OK" },
                { value: "not_required", label: "Not required" },
            ] },
            { key: "perm_drainage_plans", label: "Drainage plans?", kind: "toggle", options: YES_NO },
            { key: "perm_landscaping_plans", label: "Landscaping plans?", kind: "toggle", options: YES_NO },
            { key: "perm_school_fees", label: "School fees", kind: "select", options: [
                { value: "lt_500", label: "< 500 sf" },
                { value: "always", label: "Always" },
                { value: "not_required", label: "Not required" },
            ] },
            { key: "perm_soils_report", label: "Soils report trigger", kind: "select", options: [
                { value: "gt_50cy", label: "> 50 CY grading" },
                { value: "always", label: "Always" },
                { value: "liquefaction_fault", label: "Liquefaction / fault zone" },
            ] },
            { key: "perm_impact_fees", label: "Impact fees", kind: "select", options: [
                { value: "starting_750", label: "Starting at 750 sf" },
                { value: "not_applicable", label: "Not applicable" },
            ] },
            { key: "perm_fire_flow", label: "Fire flow required?", kind: "toggle", options: YES_NO },
            { key: "perm_backflow", label: "Backflow device required?", kind: "toggle", options: [
                { value: "yes", label: "Yes" },
                { value: "not_required", label: "Not required" },
            ] },
            { key: "perm_unpermitted_structures", label: "Unpermitted structures policy", kind: "select", wide: true, options: [
                { value: "wont_impede", label: "Won't impede" },
                { value: "addressed_after", label: "Must be addressed after" },
                { value: "blind_eye", label: "Blind eye" },
            ] },
            { key: "perm_permitting_order", label: "Permitting order", kind: "select", options: [
                { value: "planning_first", label: "Planning first" },
                { value: "building_direct", label: "Building direct" },
                { value: "other", label: "Other" },
            ] },
            { key: "perm_plans_timeline", label: "Plans timeline", kind: "text", hint: 'e.g. "3 weeks"' },
            { key: "perm_permit_timeline", label: "Permit timeline", kind: "text", hint: 'e.g. "10–16 weeks"' },
            { key: "perm_construction_timeline", label: "Construction timeline", kind: "text", hint: 'e.g. "8–12 weeks"' },
            { key: "perm_2nd_meter_timeline", label: "2nd meter timeline", kind: "text" },
            { key: "perm_inspections", label: "Inspections notes", kind: "textarea", wide: true },
            { key: "perm_closeout", label: "Closeout notes", kind: "textarea", wide: true },
        ],
    },
    {
        key: "special_zones",
        title: "Special zones",
        fields: [
            { key: "zone_fire", label: "Special fire zone", kind: "select", allowOther: true, options: [
                { value: "yes", label: "Yes" },
                { value: "not_within", label: "Not within" },
            ] },
            { key: "zone_soils", label: "Special soils zone", kind: "select", options: [
                { value: "none", label: "None" },
                { value: "fault", label: "Fault" },
                { value: "liquefaction", label: "Liquefaction" },
                { value: "landslide", label: "Landslide" },
            ] },
            { key: "zone_flood", label: "Special flood zone", kind: "select", allowOther: true, options: [
                { value: "zone_x", label: "Zone X" },
                { value: "zone_a", label: "Zone A" },
                { value: "zone_ae", label: "Zone AE" },
            ] },
            { key: "special_plans_required", label: "Special plans required", kind: "toggle", options: YES_NO },
            { key: "mep_required", label: "Engineered MEP required or is layout ok", kind: "select", options: [
                { value: "engineered", label: "Engineered required" },
                { value: "layout_ok", label: "Layout OK" },
                { value: "not_required", label: "Not required" },
            ] },
            { key: "solar_deferred", label: "Can solar plans be deferred", kind: "toggle", options: YES_NO },
            { key: "fire_sprinklers_deferred", label: "Can fire sprinklers be deferred", kind: "toggle", options: YES_NO },
            { key: "grading_drainage_plans", label: "Grading and drainage plans", kind: "toggle", options: YES_NO },
            { key: "fire_flow_test", label: "Does your city require a fire flow test", kind: "toggle", options: YES_NO },
            { key: "which_depts_final", label: "Which departments have a final inspection?", kind: "text" },
            { key: "cheer_hers_required", label: "CHEERS/HERS required for final sign-off?", kind: "toggle", options: YES_NO },
            { key: "certificate_of_occupancy", label: "Certificate of occupancy? If so, how to get it?", kind: "text" },
            { key: "sewage_ejection_pump_reqs", label: "Special requirements for sewage ejection pump", kind: "text" },
            { key: "backflow_device_required", label: "Backflow device required to be installed?", kind: "toggle", options: [
                { value: "yes", label: "Yes" },
                { value: "not_required", label: "Not required" },
            ] },
        ],
    },
    {
        key: "address_title",
        title: "Parcel / title info",
        fields: [
            { key: "apn", label: "APN / API", kind: "text", hint: "e.g. 8338-021-009" },
            { key: "legal_description", label: "Legal description", kind: "textarea", wide: true },
            { key: "parcel_city_or_county", label: "City or county", kind: "select", options: [
                { value: "city", label: "City" },
                { value: "county", label: "County" },
            ] },
            { key: "request_title_report", label: "Request title report?", kind: "toggle", options: YES_NO },
            { key: "request_easements", label: "Request easements?", kind: "toggle", options: YES_NO },
        ],
    },
    {
        key: "water_dept",
        title: "Water department",
        fields: [
            { key: "water_find_service_size", label: "How to find out size of service on street side?", kind: "textarea", wide: true },
            { key: "water_process", label: "Process to find out", kind: "textarea", wide: true },
            { key: "water_pricing_sheet", label: "Pricing sheet", kind: "text" },
            { key: "water_meter_requirements", label: "Water meter requirements sheet?", kind: "text" },
            { key: "water_which_company", label: "Which company for this address?", kind: "text" },
        ],
    },
    {
        key: "past_projects",
        title: "Past projects (same jurisdiction)",
        variant: "reference",
        reference: [
            { label: "1", value: "Bowdoin" },
            { label: "2", value: "Genesee" },
            { label: "3", value: "Bonita" },
        ],
    },
];

export const FPA_TEMPLATE: TemplateTab[] = [
    {
        key: "siteVisit",
        title: "Site Visit Info",
        blurb: "Field observations captured by the architect on the site visit.",
        sections: SITE_VISIT,
    },
    {
        key: "cityInfo",
        title: "City Info",
        blurb: "Jurisdiction & zoning research completed by the office.",
        sections: CITY_INFO,
    },
];
