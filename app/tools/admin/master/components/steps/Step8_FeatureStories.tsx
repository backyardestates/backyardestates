"use client";

import React from "react";
import { StepCard, type StepKind } from "../shared/StepCard";

export interface Step8Props {
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

export function Step8_FeatureStories(props: Step8Props) {
    return (
        <StepCard stepNumber={8} title="Feature Stories" {...props}>
            {props.children}
        </StepCard>
    );
}
