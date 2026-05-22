export const DEFAULT_FINANCING_POLICY = {
    cashOutRefi: {
        maxLTVs: [0.8, 0.9, 0.95],
        rate: 0.0625,
        termYears: 30,
    },
    heloc: {
        maxCLTV: 0.9,
        rate: 0.07,
        interestOnly: true,
    },
    cashOutSecond: {
        maxCLTV: 0.9,
        rate: 0.0725,
        termYears: 30,
    },
    renovation: {
        maxLTV: 0.95,
        rate: 0.085,
        termYears: 30,
    },
} as const;
