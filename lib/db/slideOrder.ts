import { prisma } from "@/lib/prisma";
import { SLIDE_COUNT } from "@/lib/store/presentationStore";

const SINGLETON_ID = "default";

/**
 * The natural / built-in slide order. When the catalog is empty (or admins
 * want to "reset"), this is what new proposals get.
 */
export function naturalOrder(): number[] {
    return Array.from({ length: SLIDE_COUNT }, (_, i) => i + 1);
}

/**
 * Read the canonical default slide order. Seeds with the natural order on
 * first access so the catalog is never empty.
 */
export async function getDefaultSlideOrder(): Promise<number[]> {
    const row = await prisma.slideOrderDefault.upsert({
        where: { id: SINGLETON_ID },
        update: {},
        create: { id: SINGLETON_ID, order: naturalOrder() },
    });
    return row.order;
}

/**
 * Replace the default slide order. Caller is responsible for auth checks.
 */
export async function setDefaultSlideOrder(
    next: number[],
    updatedById: string | null
): Promise<number[]> {
    const row = await prisma.slideOrderDefault.upsert({
        where: { id: SINGLETON_ID },
        create: { id: SINGLETON_ID, order: next, updatedById: updatedById ?? undefined },
        update: { order: next, updatedById: updatedById ?? undefined },
    });
    return row.order;
}
