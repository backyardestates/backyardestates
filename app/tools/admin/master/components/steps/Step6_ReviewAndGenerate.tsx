"use client";

import React from "react";
import { StepCard, type StepKind } from "../shared/StepCard";

export interface Step6Props {
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

export function Step6_ReviewAndGenerate(props: Step6Props) {
    return (
        <StepCard stepNumber={6} title="Review & Generate" {...props}>
            {props.children}
        </StepCard>
    );
}
