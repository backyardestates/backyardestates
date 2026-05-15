"use client";

import React from "react";
import { StepCard } from "../shared/StepCard";

export interface Step3Props {
    isComplete: boolean;
    isActive: boolean;
    isPending: boolean;
    completeSummary: string;
    onEdit: () => void;
    children: React.ReactNode;
}

export function Step3_EstimateJob({
    isComplete,
    isActive,
    isPending,
    completeSummary,
    onEdit,
    children,
}: Step3Props) {
    return (
        <StepCard
            stepNumber={3}
            title="Estimate the Job"
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
