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
import { groupSelections } from "@/lib/groupSelections";
import { groupSelectionsFromPackage } from "@/lib/inclusions/groupSelections";

export const PreviewHomeContext = createContext<any>(null);

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

    return (
        <PreviewHomeContext.Provider value={{ preview, setPreview }}>
            <div className={style.base}>
                <div className={style.interface}>
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
            </div>
        </PreviewHomeContext.Provider>
    );
}
