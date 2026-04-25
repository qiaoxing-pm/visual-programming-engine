interface INamed {
    name: string;
}

type ValueType = | 'number' | 'string' | 'boolean' | 'any' | 'flow';

interface positionType {
    x?: number;
    y?: number;
}

export type {
    INamed,
    ValueType,
    positionType,
}
