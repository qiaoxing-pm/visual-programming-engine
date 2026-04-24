import type BaseNode from "../../core/node/BaseNode.js";
import type { Cell } from "../../packages/maxGraph/core/src/index.js";
import type { CellStyle } from "../../packages/maxGraph/core/src/index.js";
import type { Graph } from "../../packages/maxGraph/core/src/index.js";
import {
    createInputPortKey,
    createOutputPortKey,
    getRelativePortY,
} from "../utils/port.js";
import {
    updateCellPosition,
    updateCellValue,
} from "../utils/canvasGraphOps.js";

type PortSyncResult = {
    added: Cell[];
    removed: Cell[];
};

export default class PortRenderer {
    private readonly portSize = 4;
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

    syncNodePorts(
        graph: Graph,
        node: BaseNode,
        nodeCell: Cell,
        nodePortCellMap: Map<string, Map<string, Cell>>
    ): PortSyncResult {
        const nodePortCells = nodePortCellMap.get(node.id) ?? new Map<string, Cell>();
        const nextKeys = new Set<string>();
        const added: Cell[] = [];
        const removed: Cell[] = [];

        const inputTotal = node.inputs.length;
        const outputTotal = node.outputs.length;
        const portSlotTotal = Math.max(inputTotal, outputTotal, 1);
        node.outputs.forEach((port, idx) => {
            const key = createOutputPortKey(idx, port.name);
            nextKeys.add(key);
            const y = getRelativePortY(idx, portSlotTotal);
            const existingPortCell = nodePortCells.get(key);
            if (existingPortCell) {
                updateCellPosition(graph, existingPortCell, this.outputPortX, y);
                updateCellValue(graph, existingPortCell, port.name);
                return;
            }
            const portCell = graph.insertVertex(
                nodeCell,
                `${node.id}:${key}`,
                port.name,
                this.outputPortX,
                y,
                this.portSize,
                this.portSize,
                this.outputPortStyle,
                true
            );
            nodePortCells.set(key, portCell);
            added.push(portCell);
        });
        node.inputs.forEach((port, idx) => {
            const key = createInputPortKey(idx, port.name);
            nextKeys.add(key);
            const y = getRelativePortY(idx, portSlotTotal);
            const existingPortCell = nodePortCells.get(key);
            if (existingPortCell) {
                updateCellPosition(graph, existingPortCell, this.inputPortX, y);
                updateCellValue(graph, existingPortCell, port.name);
                return;
            }
            const portCell = graph.insertVertex(
                nodeCell,
                `${node.id}:${key}`,
                port.name,
                this.inputPortX,
                y,
                this.portSize,
                this.portSize,
                this.inputPortStyle,
                true
            );
            nodePortCells.set(key, portCell);
            added.push(portCell);
        });



        for (const [key, cell] of nodePortCells.entries()) {
            if (nextKeys.has(key)) {
                continue;
            }
            graph.removeCells([cell], false);
            nodePortCells.delete(key);
            removed.push(cell);
        }

        nodePortCellMap.set(node.id, nodePortCells);
        return { added, removed };
    }

    releaseNodePorts(nodeId: string, nodePortCellMap: Map<string, Map<string, Cell>>) {
        const portCells = nodePortCellMap.get(nodeId);
        nodePortCellMap.delete(nodeId);
        if (!portCells) {
            return [];
        }
        return [...portCells.values()];
    }
}
