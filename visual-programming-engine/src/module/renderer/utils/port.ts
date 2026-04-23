export const createInputPortKey = (index: number, name: string) => `in:${index}:${name}`;

export const createOutputPortKey = (index: number, name: string) => `out:${index}:${name}`;

export const getRelativePortY = (index: number, total: number) => (index + 1) / (total + 1);
