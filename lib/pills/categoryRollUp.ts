// lib/pills/categoryRollup.ts
import type { IncludedItem } from "@/lib/IncludedScope"; // your current item type
import type { CategoryPill } from "@/components/IncludedPills/IncludedPills";

type PillTone = "included" | "upgrade" | "site";

export type CategoryDefinition = {
    id: string; // unique id for the category pill
    category: string; // matches IncludedItem.group values (ex: "design", "permits")
    title: string; // pill label (Design)
    description: string; // pill subtitle
    tone: PillTone;
    order: number;
    /** Optional: curated highlight cards */
    highlightBuilder?: (items: IncludedItem[]) => { title: string; detail?: string }[];
};

/**
 * Turn a list of IncludedItem[] into CategoryPill[] (one pill per category)
 * - Each category modal shows: overview + highlights + structured sections
 */
export function buildCategoryPills(
    items: IncludedItem[],
    defs: CategoryDefinition[]
): CategoryPill[] {
    return defs
        .map((def) => {
            const catItems = items.filter((i) => i.category === def.category);

            // skip empty categories
            if (catItems.length === 0) return null;

            const firstThree = catItems.slice(0, 3).map((x) => x.title);

            const overview =
                def.tone === "included"
                    ? `Everything in ${def.title} is included in your base price. Below is the full breakdown of what’s covered.`
                    : def.tone === "upgrade"
                        ? `These are popular upgrades in ${def.title}. They’re optional enhancements beyond the standard finish package.`
                        : `These items vary by property. We assess ${def.title} upfront during your site audit so you avoid surprises.`;

            // “Apple-ish” highlights
            const highlights =
                def.highlightBuilder?.(catItems) ??
                [
                    {
                        title: `${catItems.length} items covered`,
                        detail: firstThree.length
                            ? `Includes: ${firstThree.join(", ")}${catItems.length > 3 ? ", …" : ""}`
                            : undefined,
                    },
                    def.tone === "site"
                        ? { title: "Assessed upfront", detail: "We confirm requirements before final pricing." }
                        : { title: "Designed to be turnkey", detail: "Clear scope, clean finish, predictable process." },
                    def.tone === "upgrade"
                        ? { title: "Optional enhancements", detail: "Add style, comfort, or function based on your goals." }
                        : { title: "Built for approval", detail: "Aligned with plans, inspections, and code compliance." },
                ].filter(Boolean) as { title: string; detail?: string }[];

            // Build “deep content” sections from item modals
            const bullets = catItems.flatMap((i) => i.modal.whatsIncluded ?? []).slice(0, 10);
            const questions = catItems.flatMap((i) => i.modal.commonQuestions ?? []).slice(0, 8);
            const notes = catItems.flatMap((i) => i.modal.notes ?? []).slice(0, 8);

            // Site-specific: add cost blocks if present
            const costBlocks =
                def.tone === "site"
                    ? catItems
                        .filter((i) => (i as any).modal?.estCost) // because your site-specific items include estCost
                        .slice(0, 6)
                        .map((i) => {
                            const estCost = (i as any).modal.estCost as { min: number; max: number; display: string };
                            const howWeAssess = (i as any).modal.howWeAssess as string[] | undefined;

                            return {
                                title: i.title,
                                kind: "cost" as const,
                                cost: estCost,
                                items: howWeAssess?.slice(0, 5),
                            };
                        })
                    : [];

            return {
                id: def.id,
                category: def.category,
                title: def.title,
                description: def.description,
                tone: def.tone,
                order: def.order,
                modal: {
                    overview,
                    highlights,
                    sections: [
                        ...(bullets.length
                            ? [
                                {
                                    title: "What’s included",
                                    kind: "bullets" as const,
                                    items: bullets,
                                },
                            ]
                            : []),
                        ...(costBlocks.length ? costBlocks : []),
                        ...(questions.length
                            ? [
                                {
                                    title: "Common questions",
                                    kind: "faq" as const,
                                    items: questions,
                                },
                            ]
                            : []),
                        ...(notes.length
                            ? [
                                {
                                    title: "Notes",
                                    kind: "notes" as const,
                                    items: notes,
                                },
                            ]
                            : []),
                    ],
                    ctas:
                        def.tone === "site"
                            ? [
                                { label: "How we assess this upfront", hint: "Site audit + verification before final scope" },
                                { label: "Ask about your property", hint: "Share your address and city" },
                            ]
                            : def.tone === "upgrade"
                                ? [{ label: "Explore upgrade options", hint: "See what’s possible for your layout" }]
                                : [{ label: "See full breakdown", hint: "Detailed scope by category" }],
                },
            } satisfies CategoryPill;
        })
        .filter(Boolean) as CategoryPill[];
}
