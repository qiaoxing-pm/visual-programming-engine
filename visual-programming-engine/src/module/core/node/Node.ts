import BaseNode from "./BaseNode.js";
import type { ValueType } from "../type.js";

export default class Node extends BaseNode {
    name: string = '';

    constructor(type: string, name: string) {
        super(type, name);
        this.name = name;
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