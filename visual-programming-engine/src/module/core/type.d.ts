interface INamed {
    name: string;
}

type ValueType = | 'number' | 'string' | 'boolean' | 'any' | 'flow';

export type {
    INamed,
    ValueType
}