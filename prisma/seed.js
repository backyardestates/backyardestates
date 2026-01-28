require("dotenv/config");

const { PrismaClient } = require("@prisma/client");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    // Categories
    const categories = [
        "Utilities",
        "Drainage",
        "Access",
        "Soils & Grading",
        "Engineering",
        "Fire",
    ];

    const categoryMap = {};
    for (const name of categories) {
        const c = await prisma.category.upsert({
            where: { name },
            update: {},
            create: { name },
        });
        categoryMap[name] = c.id;
    }

    // Helper
    const createWorkItem = async (data) => {
        const wi = await prisma.workItem.upsert({
            where: { slug: data.slug },
            update: {
                title: data.title,
                overview: data.overview,
                description: data.description,
                whyItMatters: data.whyItMatters,
                categoryId: data.categoryId,
                typicalMin: data.typicalMin,
                typicalMax: data.typicalMax,
                internalMin: data.internalMin,
                internalMax: data.internalMax,
                affectsPlans: data.affectsPlans ?? false,
                affectsPermitting: data.affectsPermitting ?? false,
                affectsConstruction: data.affectsConstruction ?? false,
                assessmentSummary: data.assessmentSummary,
                avoidanceSummary: data.avoidanceSummary,
            },
            create: data,
        });
        return wi;
    };

    // --- 10–15 Work Items (initial) ---
    const items = [];

    items.push(await createWorkItem({
        slug: "water-meter-upgrade",
        title: "Water meter upgrade / new meter",
        overview: "May be required to meet ADU demand.",
        description: "Some properties need a larger meter or additional capacity to serve the ADU.",
        whyItMatters: "Can add major fees + coordination time with the water district.",
        categoryId: categoryMap["Utilities"],
        typicalMin: 5000,
        typicalMax: 15000,
        internalMin: 3500,
        internalMax: 12000,
        affectsPermitting: true,
        affectsConstruction: true,
        assessmentSummary: "Confirm meter size, water district requirements, and capacity before pricing.",
        avoidanceSummary: "Validate early; sometimes design choices reduce demand.",
    }));

    items.push(await createWorkItem({
        slug: "sewer-ejector-pump",
        title: "Sewer ejector pump / lift station",
        overview: "Needed when sewer line elevation makes gravity tie-in difficult.",
        description: "If the ADU is lower than the connection point or the sewer line is too shallow/deep, a pump may be required.",
        whyItMatters: "Adds equipment + electrical + maintenance considerations.",
        categoryId: categoryMap["Utilities"],
        typicalMin: 8000,
        typicalMax: 25000,
        internalMin: 6000,
        internalMax: 18000,
        affectsPlans: true,
        affectsConstruction: true,
        assessmentSummary: "Determine sewer tie-in location + elevations; camera scope can help.",
        avoidanceSummary: "Optimize layout and plumbing route; confirm cleanout access early.",
    }));

    items.push(await createWorkItem({
        slug: "electrical-panel-upgrade",
        title: "Electrical panel upgrade / relocation",
        overview: "May be required to support new loads.",
        description: "If the existing panel is undersized or poorly located, upgrades or relocation may be needed.",
        whyItMatters: "Can trigger permitting changes and utility coordination.",
        categoryId: categoryMap["Utilities"],
        typicalMin: 4000,
        typicalMax: 12000,
        internalMin: 3000,
        internalMax: 9000,
        affectsPermitting: true,
        affectsConstruction: true,
        assessmentSummary: "Review panel amps, available breakers, location, and service capacity.",
        avoidanceSummary: "Confirm early and plan routes to reduce relocation scope.",
    }));

    items.push(await createWorkItem({
        slug: "trenching-utility-runs",
        title: "Trenching for utility runs",
        overview: "Long runs or hardscape can increase costs.",
        description: "Utilities often require trenching to reach the ADU: water, sewer, electrical, gas.",
        whyItMatters: "Hardscape removal/replacement can blow up budget and timeline.",
        categoryId: categoryMap["Utilities"],
        typicalMin: 3000,
        typicalMax: 20000,
        internalMin: 2500,
        internalMax: 15000,
        affectsConstruction: true,
        assessmentSummary: "Measure distances and identify obstacles (concrete, slopes, landscaping).",
        avoidanceSummary: "Plan the ADU placement and utility routes before finalizing design.",
    }));

    items.push(await createWorkItem({
        slug: "fire-sprinklers",
        title: "Fire sprinklers (if required)",
        overview: "Sometimes required depending on setbacks and local rules.",
        description: "Certain jurisdictions or site conditions can trigger sprinkler requirements.",
        whyItMatters: "Can add meaningful cost and introduce plan/permitting complexity.",
        categoryId: categoryMap["Fire"],
        typicalMin: 6000,
        typicalMax: 20000,
        internalMin: 4500,
        internalMax: 15000,
        affectsPlans: true,
        affectsPermitting: true,
        affectsConstruction: true,
        assessmentSummary: "Confirm local fire requirements + water supply capacity.",
        avoidanceSummary: "Design to avoid triggers when possible (setbacks, separations).",
    }));

    items.push(await createWorkItem({
        slug: "retaining-wall",
        title: "Retaining wall / grade retention",
        overview: "Triggered by slopes, cut/fill, or drainage needs.",
        description: "If the build area requires retaining due to topography or required setbacks/grades.",
        whyItMatters: "Often requires engineering and adds construction complexity.",
        categoryId: categoryMap["Engineering"],
        typicalMin: 8000,
        typicalMax: 45000,
        internalMin: 6000,
        internalMax: 35000,
        affectsPlans: true,
        affectsPermitting: true,
        affectsConstruction: true,
        assessmentSummary: "Assess slope, neighboring grades, and cut/fill needs early.",
        avoidanceSummary: "Adjust placement/design to minimize grade changes when possible.",
    }));

    items.push(await createWorkItem({
        slug: "over-excavation-export",
        title: "Over-excavation / export of unsuitable soils",
        overview: "Soils can require removal and replacement.",
        description: "If soils are expansive/unsuitable, additional excavation and compaction may be required.",
        whyItMatters: "Can be a major cost driver and timeline extender.",
        categoryId: categoryMap["Soils & Grading"],
        typicalMin: 5000,
        typicalMax: 60000,
        internalMin: 4000,
        internalMax: 50000,
        affectsPlans: true,
        affectsConstruction: true,
        assessmentSummary: "Use soils report, site history, and visual indicators; confirm during formal analysis.",
        avoidanceSummary: "Early soils testing; design foundation accordingly.",
    }));

    items.push(await createWorkItem({
        slug: "site-drainage-upgrades",
        title: "Site drainage upgrades",
        overview: "Required to protect the structure and pass inspection.",
        description: "May include French drains, area drains, grading, or connecting to storm systems.",
        whyItMatters: "Drainage issues cause delays, change orders, and long-term risk.",
        categoryId: categoryMap["Drainage"],
        typicalMin: 3000,
        typicalMax: 25000,
        internalMin: 2500,
        internalMax: 20000,
        affectsPlans: true,
        affectsPermitting: true,
        affectsConstruction: true,
        assessmentSummary: "Check slope, downspouts, existing drainage paths, and ponding.",
        avoidanceSummary: "Plan grading + drainage early; maintain positive drainage.",
    }));

    items.push(await createWorkItem({
        slug: "utility-relocation",
        title: "Utility relocation (gas, electrical, water lines)",
        overview: "Existing utilities may conflict with the ADU footprint.",
        description: "If lines/meters/panels fall in the build zone, relocation is required.",
        whyItMatters: "Adds coordination, permits, and can stall scheduling.",
        categoryId: categoryMap["Utilities"],
        typicalMin: 4000,
        typicalMax: 35000,
        internalMin: 3000,
        internalMax: 28000,
        affectsPlans: true,
        affectsPermitting: true,
        affectsConstruction: true,
        assessmentSummary: "Locate meters, panels, gas lines and confirm routes.",
        avoidanceSummary: "Adjust building placement to avoid relocating where possible.",
    }));

    items.push(await createWorkItem({
        slug: "restricted-access",
        title: "Restricted access / limited equipment access",
        overview: "Tight access can change construction approach and cost.",
        description: "Narrow side yards or obstacles can require mini equipment or manual handling.",
        whyItMatters: "Can affect schedule and labor cost significantly.",
        categoryId: categoryMap["Access"],
        typicalMin: 2000,
        typicalMax: 20000,
        internalMin: 1500,
        internalMax: 16000,
        affectsConstruction: true,
        assessmentSummary: "Measure side yard widths; identify obstacles and paths.",
        avoidanceSummary: "Plan staging zones; remove obstacles early where feasible.",
    }));

    // --- Pricing Models (basic defaults for now) ---
    for (const wi of items) {
        await prisma.pricingModel.create({
            data: {
                workItemId: wi.id,
                calcMethod: "MANUAL",
                notes: "Initial feasibility range only; finalize after formal analysis.",
                isDefault: true,
            },
        });
    }

    // --- Impacts (basic defaults for now) ---
    const impact = async (slug, area, detail, minDays, maxDays, severity = "MEDIUM") => {
        const wi = await prisma.workItem.findUnique({ where: { slug } });
        await prisma.impactDetail.create({
            data: {
                workItemId: wi.id,
                area,
                severity,
                detail,
                durationMinDays: minDays,
                durationMaxDays: maxDays,
            },
        });
    };

    await impact("water-meter-upgrade", "TIMELINE", "Water district coordination + possible inspections.", 7, 21, "HIGH");
    await impact("sewer-ejector-pump", "CONSTRUCTION", "Adds equipment install + electrical scope.", 2, 7, "MEDIUM");
    await impact("electrical-panel-upgrade", "PERMITTING", "May require revised electrical plans + utility coordination.", 3, 14, "HIGH");
    await impact("restricted-access", "CONSTRUCTION", "May require mini equipment or manual labor.", 1, 10, "MEDIUM");
    await impact("site-drainage-upgrades", "PLANS", "May require civil drainage plan adjustments.", 2, 10, "MEDIUM");

    // --- Triggers ---
    const linkTrigger = async (sourceSlug, triggeredSlug, condition) => {
        const source = await prisma.workItem.findUnique({ where: { slug: sourceSlug } });
        const triggered = await prisma.workItem.findUnique({ where: { slug: triggeredSlug } });
        await prisma.triggerRule.create({
            data: {
                sourceWorkItemId: source.id,
                triggeredWorkItemId: triggered.id,
                condition,
            },
        });
    };

    // Example triggers
    await linkTrigger("utility-relocation", "trenching-utility-runs", "If relocation requires new routing across hardscape.");
    await linkTrigger("restricted-access", "trenching-utility-runs", "If equipment cannot reach trench route easily.");
    await linkTrigger("site-drainage-upgrades", "retaining-wall", "If grade changes require retention.");
    await linkTrigger("over-excavation-export", "retaining-wall", "If excavation exposes slope instability / needs retention.");

    console.log("✅ Seed complete.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
