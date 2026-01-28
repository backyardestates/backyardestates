"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function toIntOrNull(v: FormDataEntryValue | null) {
    if (v === null) return null;
    const s = String(v).trim();
    if (!s) return null;
    const n = Number(s);
    return Number.isFinite(n) ? Math.round(n) : null;
}

export async function updateWorkItem(formData: FormData) {

    const id = String(formData.get("id"));
    const title = String(formData.get("title") || "").trim();
    const slug = String(formData.get("slug") || "").trim();

    if (!id || !title || !slug) throw new Error("Missing required fields.");

    await prisma.workItem.update({
        where: { id },
        data: {
            title,
            slug,
            overview: String(formData.get("overview") || "").trim() || null,
            typicalMin: toIntOrNull(formData.get("typicalMin")),
            typicalMax: toIntOrNull(formData.get("typicalMax")),
            whyItMatters: String(formData.get("whyItMatters") || "").trim() || null,
        },
    });

    revalidatePath("/admin");
    revalidatePath(`/admin/work-items/${id}`);
}

export async function deleteWorkItem(formData: FormData) {

    const id = String(formData.get("id"));
    if (!id) throw new Error("Missing id");

    // If you have relations, you may need to delete children first or set cascade in Prisma.
    await prisma.workItem.delete({ where: { id } });

    revalidatePath("/admin");
    redirect("/admin");
}
