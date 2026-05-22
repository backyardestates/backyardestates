"use client";

import React from "react";
import { StepCard, type StepKind } from "../shared/StepCard";

export interface Step12Props {
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

export function Step12_PaymentSchedule(props: Step12Props) {
    return (
        <StepCard stepNumber={11} title="Payment Schedule" {...props}>
            {props.children}
        </StepCard>
    );
}
