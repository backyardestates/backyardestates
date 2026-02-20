import { useContext } from "react";
import { PreviewContext } from "@/components/InclusionsPanel";
import { PreviewHomeContext } from "@/components/InclusionsHomePanel";
import { usePathname } from "next/navigation";
import { COLLECTIONS } from "@/content/inclusions";
import { Check } from "lucide-react";
import style from "./TabBarButton.module.css";
import type { PackageKey } from "@/lib/inclusions/packages";

export type PreviewState = {
    collection: PackageKey;
    collectionID?: number;
    roomID?: number;
    room?: string;
    isCustom?: boolean;

    kitchenCabinets?: any;
    bathroomCabinets?: any;
};

export type PreviewContextValue = {
    preview: PreviewState;
    setPreview: React.Dispatch<React.SetStateAction<PreviewState>>;
};
const COLLECTION_STYLES: Record<
    string,
    { label: string; swatch: string; ring?: string }
> = {
    light: { label: "Contemporary light", swatch: "#E7E1D8", ring: "#CFC6B8" },
    dark: { label: "Contemporary dark", swatch: "#2F2F2F", ring: "#5E5E5E" },
    blue: { label: "Modern blue", swatch: "#1F3E73", ring: "#2B5AA7" },
    monochrome: { label: "Modern monochrome", swatch: "#111111", ring: "#8A8A8A" },
    olive: { label: "Urban olive", swatch: "#6E775D", ring: "#9AA487" },
    custom: { label: "Custom package", swatch: "#D1D5DB", ring: "#9CA3AF" },
};

export default function TabBarButton({
    id,
    value,
}: {
    id: number;
    value: string;
}) {
    const pathname = usePathname();
    const context = pathname === "/" ? PreviewHomeContext : PreviewContext;
    const { preview, setPreview } = useContext(context)!;

    const isSelected = preview.collection === value;

    const meta = COLLECTION_STYLES[value] ?? {
        label: value,
        swatch: "#D1D5DB",
        ring: "var(--brand-color-beige",
    };

    const isDarkSwatch = ["dark", "blue", "monochrome"].includes(value);

    return (
        <button
            type="button"
            className={`${style.base} ${isSelected ? style.selected : ""}`}
            aria-label={meta.label}
            aria-pressed={isSelected}
            title={meta.label}
            onClick={() => {
                setPreview({
                    ...preview,
                    collectionID: id,
                    collection: value as PackageKey,
                    isCustom: value === "custom",

                    // keep your existing cabinet wiring (guarded)
                    kitchenCabinets: COLLECTIONS[id]?.rooms?.[0]?.cabinet,
                    bathroomCabinets: COLLECTIONS[id]?.rooms?.[3]?.cabinet,
                });
            }}
        >
            <span
                className={style.swatch}
                style={{
                    backgroundColor: meta.swatch,
                }}
            />

            {isSelected && (
                <span className={`${style.check} ${isDarkSwatch ? style.checkOnDark : style.checkOnLight}`}>
                    <Check size={14} strokeWidth={3} />
                </span>
            )}
        </button>
    );
}
