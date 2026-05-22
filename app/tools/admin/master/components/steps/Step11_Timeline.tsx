"use client";

import React from "react";
import { StepCard, type StepKind } from "../shared/StepCard";

export interface Step11Props {
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

export function Step11_Timeline(props: Step11Props) {
    return (
        <StepCard stepNumber={10} title="Project Timeline" {...props}>
            {props.children}
        </StepCard>
    );
}
