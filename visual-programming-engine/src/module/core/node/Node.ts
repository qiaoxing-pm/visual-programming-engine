import BaseNode from "./BaseNode.js";
import type { ValueType, positionType } from "../type.js";




export default class Node extends BaseNode {

    constructor(type: string, name: string, position?: positionType) {
        super(type, name, position);
    }

    override addInput(name: string, type: ValueType) {
        return super.addInput(name, type);
    }
    override addOutput(name: string, type: ValueType) {
        return super.addOutput(name, type);
    }

    async execute() {
        return;
    }
}
