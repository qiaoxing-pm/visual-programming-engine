import BaseNode from "./BaseNode.js";
import type { ValueType } from "../type.js";

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
        return;
    }
}