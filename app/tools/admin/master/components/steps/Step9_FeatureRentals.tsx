"use client";

import React from "react";
import { StepCard, type StepKind } from "../shared/StepCard";

export interface Step9Props {
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

export function Step9_FeatureRentals(props: Step9Props) {
    return (
        <StepCard stepNumber={9} title="Feature Rentals" {...props}>
            {props.children}
        </StepCard>
    );
}
