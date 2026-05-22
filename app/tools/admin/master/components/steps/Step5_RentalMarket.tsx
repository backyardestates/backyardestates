"use client";

import React from "react";
import { StepCard, type StepKind } from "../shared/StepCard";

export interface Step5Props {
    isComplete: boolean;
    isActive: boolean;
    isPending: boolean;
    completeSummary: string;
    onEdit: () => void;
    children: React.ReactNode;
    kind?: StepKind;
    needsInput?: boolean;
    needsInputMessage?: string;
    onDone?: () => void;
    doneLabel?: string;
}

export function Step5_RentalMarket(props: Step5Props) {
    return (
        <StepCard stepNumber={4} title="Rental Market" {...props}>
            {props.children}
        </StepCard>
    );
}
