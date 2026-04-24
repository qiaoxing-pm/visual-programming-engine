import type BaseNode from "../../core/node/BaseNode.js";
import type { Cell } from "../../packages/maxGraph/core/src/index.js";
import type { Graph } from "../../packages/maxGraph/core/src/index.js";
import TitleLayout from "../../layout/TitleLayout.js";
import type { SceneState } from "../../state/SceneState.js";
import Point from "../../packages/maxGraph/core/src/view/geometry/Point.js";
import { updateCellValue } from "../utils/canvasGraphOps.js";

export type CellTitleSyncResult = {
    added: Cell[];
    removed: Cell[];
};

export function syncNodeCellTitles(
    graph: Graph,
    node: BaseNode,
    nodeCell: Cell,
    sceneState: SceneState
): CellTitleSyncResult {
    const nodeTitleCells = sceneState.nodeTitleCellMap.get(node.id) ?? new Map<string, Cell>();
    const added: Cell[] = [];
    const removed: Cell[] = [];
    const layoutItem = new TitleLayout().compute(node);
    const titleCellId = `${node.id}:${layoutItem.key}`;
    const existingTitleCell = nodeTitleCells.get(layoutItem.key);
    if (existingTitleCell) {
        const geometry = existingTitleCell.getGeometry();
        if (geometry) {
            const nextGeometry = geometry.clone();
            nextGeometry.x = layoutItem.x;
            nextGeometry.y = layoutItem.y;
            nextGeometry.width = layoutItem.width;
            nextGeometry.height = layoutItem.height;
            nextGeometry.relative = layoutItem.relative;
            nextGeometry.offset = new Point(layoutItem.offsetX, layoutItem.offsetY);
            graph.getDataModel().setGeometry(existingTitleCell, nextGeometry);
        }
        updateCellValue(graph, existingTitleCell, layoutItem.name);
    } else {
        const titleCell = graph.insertVertex(
            nodeCell,
            titleCellId,
            layoutItem.name,
            layoutItem.x,
            layoutItem.y,
            layoutItem.width,
            layoutItem.height,
            layoutItem.style,
            layoutItem.relative
        );
        const titleGeometry = titleCell.getGeometry();
        if (titleGeometry) {
            const nextGeometry = titleGeometry.clone();
            nextGeometry.offset = new Point(layoutItem.offsetX, layoutItem.offsetY);
            graph.getDataModel().setGeometry(titleCell, nextGeometry);
        }
        nodeTitleCells.set(layoutItem.key, titleCell);
        added.push(titleCell);
    }
    sceneState.nodeTitleCellMap.set(node.id, nodeTitleCells);
    return { added, removed };
}

export function releaseNodeCellTitles(nodeId: string, sceneState: SceneState) {
    const titleCells = sceneState.nodeTitleCellMap.get(nodeId);
    sceneState.nodeTitleCellMap.delete(nodeId);
    if (!titleCells) {
        return [];
    }
    return [...titleCells.values()];
}
