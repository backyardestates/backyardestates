"use client";

import React from "react";
import { StepCard, type StepKind } from "../shared/StepCard";

export interface Step2Props {
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

export function Step2_ChooseUnits(props: Step2Props) {
    return (
        <StepCard stepNumber={2} title="Choose Units" {...props}>
            {props.children}
        </StepCard>
    );
}
