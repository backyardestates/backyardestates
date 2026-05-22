"use client";

import React from "react";
import { StepCard, type StepKind } from "../shared/StepCard";

export interface Step4Props {
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

export function Step4_Discounts(props: Step4Props) {
    return (
        <StepCard stepNumber={3} title="Discounts" {...props}>
            {props.children}
        </StepCard>
    );
}
