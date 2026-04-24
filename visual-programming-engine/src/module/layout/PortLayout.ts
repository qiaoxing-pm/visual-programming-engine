import type BaseNode from "../core/node/BaseNode.js";
import type { CellStyle } from "../packages/maxGraph/core/src/index.js";
import {
    createInputPortKey,
    createOutputPortKey,
} from "../renderer/utils/port.js";

export type PortLayoutItem = {
    key: string;
    name: string;
    x: number;
    y: number;
    style: CellStyle;
};

export default class PortLayout {
    private readonly outputPortX = -0.02;
    private readonly inputPortX = 0.98;
    private readonly inputPortStyle: CellStyle = {
        shape: "ellipse",
        fillColor: "#1a192b",
        strokeColor: "white",
        labelPosition: "left",
        align: "right",
        spacingLeft: 1,
        fontColor: "#fff",
        fontSize: 8,
    };
    private readonly outputPortStyle: CellStyle = {
        shape: "ellipse",
        fillColor: "#1a192b",
        strokeColor: "white",
        labelPosition: "right",
        align: "left",
        spacingRight: 1,
        fontColor: "#fff",
        fontSize: 8,
    };

    compute(node: BaseNode): PortLayoutItem[] {
        const inputTotal = node.inputs.length;
        const outputTotal = node.outputs.length;
        const portSlotTotal = Math.max(inputTotal, outputTotal, 1);
        const items: PortLayoutItem[] = [];

        node.outputs.forEach((port, idx) => {
            items.push({
                key: createOutputPortKey(idx, port.name),
                name: port.name,
                x: this.outputPortX,
                y: this.getRelativePortY(idx, portSlotTotal),
                style: this.outputPortStyle,
            });
        });

        node.inputs.forEach((port, idx) => {
            items.push({
                key: createInputPortKey(idx, port.name),
                name: port.name,
                x: this.inputPortX,
                y: this.getRelativePortY(idx, portSlotTotal),
                style: this.inputPortStyle,
            });
        });

        return items;
    }

    private getRelativePortY(index: number, total: number) {
        return (index + 1) / (total + 1);
    }
}
