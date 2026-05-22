"use client";

import React from "react";
import { StepCard, type StepKind } from "../shared/StepCard";

export interface Step7Props {
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

export function Step7_FeatureBuilds(props: Step7Props) {
    return (
        <StepCard stepNumber={6} title="Feature Builds" {...props}>
            {props.children}
        </StepCard>
    );
}
