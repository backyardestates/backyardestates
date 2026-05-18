"use client";

import React from "react";
import { StepCard, type StepKind } from "../shared/StepCard";

export interface Step1Props {
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

export function Step1_WhoAndWhere(props: Step1Props) {
    return (
        <StepCard stepNumber={1} title="Who & Where" {...props}>
            {props.children}
        </StepCard>
    );
}
