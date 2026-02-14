export const HandleTypes = {
    RED_INPUT: 'red-input',
    RED_OUTPUT: 'red-output',
    ORANGE_INPUT: 'orange-input',
    ORANGE_OUTPUT: 'orange-output',
    TURQUOISE_INPUT: 'turquoise-input',
    TURQUOISE_OUTPUT: 'turquoise-output',
    SAGE_INPUT: 'sage-input',
    SAGE_OUTPUT: 'sage-output',
} as const;

export type HandleType = typeof HandleTypes[keyof typeof HandleTypes];