import type BaseNode from "../../core/node/BaseNode.js";
import type { Cell } from "../../packages/maxGraph/core/src/index.js";
import type { Graph } from "../../packages/maxGraph/core/src/index.js";
import PortLayout from "../../layout/PortLayout.js";
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
    private readonly portLayout = new PortLayout();

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
        const layoutItems = this.portLayout.compute(node);

        for (const item of layoutItems) {
            const key = item.key;
            nextKeys.add(key);
            const existingPortCell = nodePortCells.get(key);
            if (existingPortCell) {
                updateCellPosition(graph, existingPortCell, item.x, item.y);
                updateCellValue(graph, existingPortCell, item.name);
                continue;
            }
            const portCell = graph.insertVertex(
                nodeCell,
                `${node.id}:${key}`,
                item.name,
                item.x,
                item.y,
                this.portSize,
                this.portSize,
                item.style,
                true
            );
            nodePortCells.set(key, portCell);
            added.push(portCell);
        }

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
