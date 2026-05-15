"use client";

import React from "react";
import { StepCard } from "../shared/StepCard";

export interface Step1Props {
    isComplete: boolean;
    isActive: boolean;
    isPending: boolean;
    completeSummary: string;
    onEdit: () => void;
    children: React.ReactNode;
}

export function Step1_WhoAndWhere({
    isComplete,
    isActive,
    isPending,
    completeSummary,
    onEdit,
    children,
}: Step1Props) {
    return (
        <StepCard
            stepNumber={1}
            title="Who & Where"
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
