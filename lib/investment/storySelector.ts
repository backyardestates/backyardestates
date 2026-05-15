import type { SanityStory, CustomerMotivation } from "@/lib/store/presentationStore";

const STORY_MAP: Record<NonNullable<CustomerMotivation> | "null", string[]> = {
    family: [
        "sylvia-and-enrique",
        "billy-and-kelley",
        "katie-and-paula",
    ],
    income: [
        "jeanne-and-ralph",
        "vanessa-and-gabriel",
        "juan",
    ],
    investment: [
        "paul",
        "alma-and-jesus",
        "mike",
    ],
    null: [
        "dan",
        "jennifer",
    ],
};

export function selectStory(
    motivation: CustomerMotivation,
    stories: SanityStory[]
): SanityStory | null {
    if (stories.length === 0) return null;
    const slugPriority = STORY_MAP[motivation ?? "null"] ?? STORY_MAP["null"];
    for (const slug of slugPriority) {
        const story = stories.find((s) => s.slug?.current === slug);
        if (story) return story;
    }
    return stories[0] ?? null;
}
