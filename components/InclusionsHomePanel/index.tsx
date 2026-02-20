// components/InclusionsHomePanel.tsx
"use client";

import { createContext, useMemo, useState } from "react";
import TabBar from "@/components/TabBar";
import Image from "next/image";
import style from "./InclusionsHomePanel.module.css";

import type { PackageKey } from "@/lib/inclusions/packages";
import { flattenSelectionsToIdMap } from "@/lib/inclusions/flattenSelections";
import { buildPackageDisplay } from "@/lib/inclusions/buildPackageDisplay";
import SelectionsGallery from "../SelectionsGallery";
import { groupSelectionsFromPackage } from "@/lib/inclusions/groupSelections";
import SoftCTA from "../SoftCTA";

import type { PreviewContextValue, PreviewState } from "@/components/TabBarButton";

const DEFAULT_PREVIEW: PreviewState = { collection: "light", isCustom: false };

export const PreviewHomeContext = createContext<PreviewContextValue>({
    preview: DEFAULT_PREVIEW,
    setPreview: () => { }, // safe default; real value provided by Provider
});

export default function InclusionsHomePanel({ selections }: { selections: any }) {
    const [preview, setPreview] = useState<{ collection: PackageKey }>({ collection: "light" });

    const selectionsById = useMemo(
        () => flattenSelectionsToIdMap(selections),
        [selections]
    );

    const packageItems = useMemo(() => {
        return buildPackageDisplay({
            selectionsById,
            packageKey: preview.collection,
        });
    }, [selectionsById, preview.collection]);

    const groupedSelections = useMemo(() => {
        return groupSelectionsFromPackage(packageItems);
    }, [packageItems]);
    const label = "YOUR ADU. YOUR WAY.";
    const headline = "Fully Custom. Surprisingly Simple.";
    const subheadline = "Choose from our high-quality standard finishes or upgrade any selection to match your vision.";

    return (
        <PreviewHomeContext.Provider value={{ preview, setPreview }}>

            <div className={style.base}>
                <div className={style.interface}>
                    <p className={`${style.label} ${style.fadeInUp}`}>{label}</p>

                    <header className={`${style.header} ${style.fadeInUp}`} style={{ animationDelay: "60ms" }}>
                        <h2 className={style.h2}>{headline}</h2>
                        <p className={style.subhead}>{subheadline}</p>
                    </header>
                    <div className={style.header}>
                        <TabBar />
                    </div>

                    <div className={style.preview}>
                        <Image
                            src={`/images/kitchen-${preview.collection}.png`}
                            width={480}
                            height={360}
                            alt={`Preview of the ${preview.collection} kitchen`}
                            className={style.previewImage}
                        />
                    </div>

                    <SelectionsGallery data={groupedSelections} variant="property" />
                </div>
                <SoftCTA href="/selections" linkText="See Our Standard Finishes" />
            </div>

        </PreviewHomeContext.Provider>
    );
}
