"use client";

import React from "react";
import { StepCard, type StepKind } from "../shared/StepCard";

export interface Step3Props {
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

export function Step3_EstimateJob(props: Step3Props) {
    return (
        <StepCard stepNumber={3} title="Estimate the Job" {...props}>
            {props.children}
        </StepCard>
    );
}
