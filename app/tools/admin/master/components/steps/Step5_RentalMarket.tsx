"use client";

import React from "react";
import { StepCard } from "../shared/StepCard";

export interface Step5Props {
    isComplete: boolean;
    isActive: boolean;
    isPending: boolean;
    completeSummary: string;
    onEdit: () => void;
    children: React.ReactNode;
}

export function Step5_RentalMarket({
    isComplete,
    isActive,
    isPending,
    completeSummary,
    onEdit,
    children,
}: Step5Props) {
    return (
        <StepCard
            stepNumber={5}
            title="Rental Market"
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
