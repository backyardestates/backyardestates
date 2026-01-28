import * as React from "react";

export const STEP_KEYS = ["vision", "floorplans", "reality", "finance", "review", "submit"] as const;
export type StepKey = (typeof STEP_KEYS)[number];

export type FlowItem = {
    id: string;
    step: StepKey;
    order: number;
    required?: boolean;
};

export type Flow = ReadonlyArray<FlowItem>;
export type QuestionType =
    | "cardSelect"
    | "pillSelect"
    | "multiPillSelect"
    | "stepper"
    | "select"
    | "text"
    | "info"
    | "action";

export type Option = {
    value: string;
    label?: string;
    title?: string;
    desc?: string;
    meta?: string;
};

export type StepDef = {
    key: StepKey;
    title: string;
    Icon: React.FC;
    index: number;
};

// export type QuestionDef = {
//     id: string; // keep flexible; you can narrow later
//     step: StepKey;
//     order: number; // optional, for debugging
//     title: string;
//     helper?: string;

//     type: QuestionType;

//     required?: boolean;

//     // options for selects/cards/pills
//     options?: Option[];

//     // stepper settings
//     stepper?: {
//         min: number;
//         max: number;
//         step: number; // can be 0.5
//         defaultValue?: number;
//         format?: (n: number) => string;
//     };

//     // select input default
//     placeholder?: string;

//     // for action steps
//     action?: {
//         label: string;
//     };

//     // optional: allow the flow to skip/jump based on answers
//     next?: (answers: Record<string, any>) => { step: StepKey; id: string } | null;
// };

// export type Flow = QuestionDef[];

export function isComplete(screen: { id: string }, answers: any) {
    switch (screen.id) {
        case "motivation":
            return !!answers.motivation;

        case "aduType":
            return !!answers.aduType;

        case "floorplansStep":
            return answers.bed != null && answers.bath != null && !!answers.timeframe && !!answers.selectedFloorplanId;

        case "financeStep":
            return !!answers.downPayment && !!answers.interestRate && !!answers.termMonths;

        default:
            return true;
    }
}
