import { InputPort, OutputPort } from "../port/Port.js";
import type { ValueType, INamed, positionType } from "../type.js";
import { assertNodeMutableByCommand } from "../../state/StateRules.js";

function hasValidPosition(position?: positionType): boolean {
    return position?.x !== undefined || position?.y !== undefined;
}
abstract class BaseNode implements INamed {
    id: string;
    name: string;
    type: string;
    x = 0;
    y = 0;
    hasLayoutPosition = false;

    inputs: InputPort[] = [];
    outputs: OutputPort[] = [];

    next: BaseNode | null = null;

    index: number = 0;

    constructor(type: string, name: string, position?: positionType) {
        this.id = crypto.randomUUID();
        this.type = type;
        this.name = name;
        if (hasValidPosition(position)) {
            if (position?.x !== undefined) {
                this.x = position.x;
            }

            if (position?.y !== undefined) {
                this.y = position.y;
            }

            this.hasLayoutPosition = true;
        } else {
            this.hasLayoutPosition = false;
        }
    }

    protected addInput(name: string, type: ValueType) {
        const port = new InputPort(name, type, this.id);
        this.inputs.push(port);
        return port;
    }

    protected addOutput(name: string, type: ValueType) {
        const port = new OutputPort(name, type, this.id);
        this.outputs.push(port);
        return port;
    }

    applyPositionPatch(patch: { x?: number; y?: number }) {
        assertNodeMutableByCommand("BaseNode.applyPositionPatch");
        if (patch.x !== undefined) {
            this.x = patch.x;
        }
        if (patch.y !== undefined) {
            this.y = patch.y;
        }
        this.hasLayoutPosition = true;
    }

    applyNamePatch(name: string) {
        assertNodeMutableByCommand("BaseNode.applyNamePatch");
        this.name = name;
    }

    abstract execute(): Promise<any>;

}

export default BaseNode;
