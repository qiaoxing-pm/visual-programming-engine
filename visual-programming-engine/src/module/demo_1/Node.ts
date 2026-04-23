import BaseNode from "../core/node/BaseNode.js";
import type { ValueType } from "../core/type.js";

export default class Node extends BaseNode {
    id = "start";

    constructor(id: string) {
        super(id);
        this.id = id;
    }

    public addInput(name: string, type: ValueType) {
        return super.addInput(name, type);
    }
    public addOutput(name: string, type: ValueType) {
        return super.addOutput(name, type);
    }

    async execute() {
        // Start node only marks flow entry.
        // The traversal is driven by run(), so no action here.
        return;
    }
}