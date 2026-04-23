import type { INamed,ValueType } from "../type";


interface IPort extends INamed {
    type: ValueType;
    nodeId: string;
}

class InputPort implements IPort {
    name: string;
    type: ValueType;
    nodeId: string;
    constructor(
        name: string,
        type: ValueType,
        nodeId: string
    ) {
        this.name = name;
        this.type = type;
        this.nodeId = nodeId;
    }
}

class OutputPort implements IPort {
    name: string;
    type: ValueType;
    nodeId: string;
    constructor(
        name: string,
        type: ValueType,
        nodeId: string
    ) {
        this.name = name;
        this.type = type;
        this.nodeId = nodeId;
    }
}

export {
    InputPort,
    OutputPort,
}