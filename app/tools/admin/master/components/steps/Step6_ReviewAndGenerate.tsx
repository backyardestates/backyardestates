"use client";

import React from "react";
import { StepCard } from "../shared/StepCard";

export interface Step6Props {
    // Step 6 never collapses — always active
    isComplete: boolean;
    isActive: boolean;
    isPending: boolean;
    completeSummary: string;
    onEdit: () => void;
    children: React.ReactNode;
}

export function Step6_ReviewAndGenerate({
    isComplete,
    isActive,
    isPending,
    completeSummary,
    onEdit,
    children,
}: Step6Props) {
    return (
        <StepCard
            stepNumber={6}
            title="Review & Generate"
            isComplete={isComplete}
            isActive={isActive}
            isPending={isPending}
            completeSummary={completeSummary}
            onEdit={onEdit}
        >
            {children}
        </StepCard>
    );
}
