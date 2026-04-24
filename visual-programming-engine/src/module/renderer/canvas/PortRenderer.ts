import type BaseNode from "../../core/node/BaseNode.js";
import type { Cell } from "../../packages/maxGraph/core/src/index.js";
import type { Graph } from "../../packages/maxGraph/core/src/index.js";
import PortLayout from "../../layout/PortLayout.js";
import type { SceneState } from "../../state/SceneState.js";
import {
    updateCellPosition,
    updateCellValue,
} from "../utils/canvasGraphOps.js";

export type PortSyncResult = {
    added: Cell[];
    removed: Cell[];
};

const portSize = 4;
const portLayout = new PortLayout();

export function syncNodePorts(
    graph: Graph,
    node: BaseNode,
    nodeCell: Cell,
    sceneState: SceneState
): PortSyncResult {
    const nodePortCells = sceneState.nodePortCellMap.get(node.id) ?? new Map<string, Cell>();
    const nextKeys = new Set<string>();
    const added: Cell[] = [];
    const removed: Cell[] = [];
    const layoutItems = portLayout.compute(node);

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
            portSize,
            portSize,
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

    sceneState.nodePortCellMap.set(node.id, nodePortCells);
    return { added, removed };
}

export function releaseNodePorts(nodeId: string, sceneState: SceneState) {
    const portCells = sceneState.nodePortCellMap.get(nodeId);
    sceneState.nodePortCellMap.delete(nodeId);
    if (!portCells) {
        return [];
    }
    return [...portCells.values()];
}
