import { prisma } from "@/lib/prisma";
import { updateWorkItem, deleteWorkItem } from "./actions";

export default async function EditWorkItemPage({ params }: { params: { id: string } }) {
    const wi = await prisma.workItem.findUnique({
        where: { id: params.id },
        include: { category: true, pricingModels: true, impacts: true },
    });

    if (!wi) return <div>Not found</div>;

    return (
        <div style={{ maxWidth: 900 }}>
            <h1>Edit Work Item</h1>

            <form action={updateWorkItem} style={{ display: "grid", gap: 12 }}>
                <input type="hidden" name="id" value={wi.id} />

                <label>
                    Title
                    <input name="title" defaultValue={wi.title} />
                </label>

                <label>
                    Slug
                    <input name="slug" defaultValue={wi.slug} />
                </label>

                <label>
                    Overview
                    <input name="overview" defaultValue={wi.overview ?? ""} />
                </label>

                <label>
                    Typical Min
                    <input name="typicalMin" defaultValue={wi.typicalMin ?? ""} />
                </label>

                <label>
                    Typical Max
                    <input name="typicalMax" defaultValue={wi.typicalMax ?? ""} />
                </label>

                <label>
                    Why it matters
                    <textarea name="whyItMatters" defaultValue={wi.whyItMatters ?? ""} />
                </label>

                <button type="submit">Save</button>
            </form>

            <hr style={{ margin: "24px 0" }} />

            <form action={deleteWorkItem}>
                <input type="hidden" name="id" value={wi.id} />
                <button type="submit" style={{ color: "red" }}>
                    Delete Work Item
                </button>
            </form>
        </div>
    );
}
