"use client";

import React from "react";
import { StepCard, type StepKind } from "../shared/StepCard";

export interface Step10Props {
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

export function Step10_SlideOrder(props: Step10Props) {
    return (
        <StepCard stepNumber={10} title="Slide Order" {...props}>
            {props.children}
        </StepCard>
    );
}
