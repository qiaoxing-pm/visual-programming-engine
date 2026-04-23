import { InputPort, OutputPort } from "../port/Port.js";
import type { ValueType, INamed } from "../type.js";

abstract class BaseNode implements INamed {
    id: string;
    name: string;

    inputs: InputPort[] = [];
    outputs: OutputPort[] = [];

    next: BaseNode | null = null;

    index: number = 0;

    constructor(name: string) {
        this.id = crypto.randomUUID();

        this.name = name;
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

    abstract execute(): Promise<any>;

}

export default BaseNode;