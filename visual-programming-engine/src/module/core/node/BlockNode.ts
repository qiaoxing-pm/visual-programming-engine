import BaseNode from "./BaseNode.js";
import type { ValueType, positionType } from "../type.js";

type BlockConnectionPosition = {
    x?: string;
    y?: string;
};

type BlockConnectionPoint = {
    relPosition?: BlockConnectionPosition;
};

type BlockVariable = {
    formalParameter?: string;
    connectionPointIn?: BlockConnectionPoint;
    connectionPointOut?: BlockConnectionPoint;
};

type BlockVariableContainer = {
    variable?: BlockVariable | BlockVariable[] | "";
};

export type FBDBlock = {
    localId?: string;
    typeName: string;
    instanceName?: string;
    executionOrderId?: string;
    height?: string;
    width?: string;
    position?: {
        x?: string;
        y?: string;
    };
    inputVariables?: BlockVariableContainer | "";
    inOutVariables?: BlockVariableContainer | "";
    outputVariables?: BlockVariableContainer | "";
};

function toNumber(value?: string): number | undefined {
    if (value === undefined || value === "") {
        return undefined;
    }
    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
}

function toPosition(position?: FBDBlock["position"]): positionType | undefined {
    if (!position) {
        return undefined;
    }
    return {
        x: toNumber(position.x),
        y: toNumber(position.y),
    };
}

function toVariables(container?: BlockVariableContainer | ""): BlockVariable[] {
    if (!container || container === "" || !container.variable) {
        return [];
    }
    return Array.isArray(container.variable) ? container.variable : [container.variable];
}

function inferValueType(): ValueType {
    return "any";
}

export default class BlockNode extends BaseNode {
    readonly localId: string;
    readonly executionOrderId?: string;
    readonly width?: number;
    readonly height?: number;
    readonly raw: FBDBlock;

    constructor(block: FBDBlock) {
        super(block.typeName, block.instanceName ?? block.typeName, toPosition(block.position));
        this.localId = block.localId ?? this.id;
        this.executionOrderId = block.executionOrderId;
        this.width = toNumber(block.width);
        this.height = toNumber(block.height);
        this.raw = block;

        for (const input of toVariables(block.inputVariables)) {
            if (input.formalParameter) {
                this.addInput(input.formalParameter, inferValueType());
            }
        }

        for (const inOut of toVariables(block.inOutVariables)) {
            if (!inOut.formalParameter) {
                continue;
            }
            const type = inferValueType();
            this.addInput(inOut.formalParameter, type);
            this.addOutput(inOut.formalParameter, type);
        }

        for (const output of toVariables(block.outputVariables)) {
            if (output.formalParameter) {
                this.addOutput(output.formalParameter, inferValueType());
            }
        }
    }

    async execute() {
        return this.raw;
    }
}
