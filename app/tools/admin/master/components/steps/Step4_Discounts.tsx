"use client";

import React from "react";
import { StepCard } from "../shared/StepCard";

export interface Step4Props {
    isComplete: boolean;
    isActive: boolean;
    isPending: boolean;
    completeSummary: string;
    onEdit: () => void;
    children: React.ReactNode;
}

export function Step4_Discounts({
    isComplete,
    isActive,
    isPending,
    completeSummary,
    onEdit,
    children,
}: Step4Props) {
    return (
        <StepCard
            stepNumber={4}
            title="Discounts"
            badge="OPTIONAL"
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
