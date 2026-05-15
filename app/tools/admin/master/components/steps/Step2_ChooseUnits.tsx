"use client";

import React from "react";
import { StepCard } from "../shared/StepCard";

export interface Step2Props {
    isComplete: boolean;
    isActive: boolean;
    isPending: boolean;
    completeSummary: string;
    onEdit: () => void;
    children: React.ReactNode;
}

export function Step2_ChooseUnits({
    isComplete,
    isActive,
    isPending,
    completeSummary,
    onEdit,
    children,
}: Step2Props) {
    return (
        <StepCard
            stepNumber={2}
            title="Choose Units"
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
