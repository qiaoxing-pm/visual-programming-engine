import ForkNode from "../../core/node/ForkNode.js";
import type { Cell } from "../../packages/maxGraph/core/src/index.js";
import type { CellStyle, Graph } from "../../packages/maxGraph/core/src/index.js";
import type NodeViewModel from "../../view-model/NodeViewModel.js";
import type { SceneState } from "../../state/SceneState.js";
import ForkLayout from "../../layout/ForkLayout.js";
import {
    vscodeEditorForeground,
    vscodeEditorWidgetBackground,
    vscodeEditorWidgetBorder,
} from "../../theme/vscodeCssColors.js";
import { resolveCellStyleCssColors } from "../../theme/resolveCssColor.js";
import { updateCellPosition, updateCellStyle, updateCellValue } from "../utils/canvasGraphOps.js";

const forkLayout = new ForkLayout();

const forkNodeStyle: CellStyle = {
    shape: "rectangle",
    fillColor: vscodeEditorWidgetBackground,
    strokeColor: vscodeEditorWidgetBorder,
    fontColor: vscodeEditorForeground,
    fontSize: 8,
    rounded: true,
    arcSize: 12,
    align: "center",
    verticalAlign: "middle",
};

const forkHandleStyle: CellStyle = {
    shape: "rectangle",
    fillColor: vscodeEditorWidgetBackground,
    strokeColor: vscodeEditorWidgetBorder,
    fontColor: vscodeEditorForeground,
    fontSize: 8,
    rounded: true,
    arcSize: 12,
    align: "center",
    verticalAlign: "middle",
};

function getResolvedForkNodeStyle(graph: Graph): CellStyle {
    return resolveCellStyleCssColors(graph.container, forkNodeStyle);
}

export function syncForkNode(
    graph: Graph,
    node: ForkNode,
    viewModel: NodeViewModel,
    sceneState: SceneState
) {
    let cell = sceneState.nodeCellMap.get(node.id);
    const resolvedNodeStyle = getResolvedForkNodeStyle(graph);
    const frame = forkLayout.computeNodeFrame(node);
    if (!cell) {
        const parent = graph.getDefaultParent();
        cell = graph.insertVertex(
            parent,
            node.id,
            '',
            viewModel.x,
            viewModel.y,
            frame.width,
            frame.height,
            resolvedNodeStyle
        );
        sceneState.nodeCellMap.set(node.id, cell);
        sceneState.cellNodeMap.set(cell, node);
    } else {
        updateCellStyle(graph, cell, resolvedNodeStyle);
        updateCellValue(graph, cell, '');
    }

    updateCellPosition(graph, cell, viewModel.x, viewModel.y);
    syncForkHandles(graph, node, cell, sceneState);
    return cell;
}

function syncForkHandles(graph: Graph, node: ForkNode, nodeCell: Cell, sceneState: SceneState) {
    const partCells = sceneState.forkPartCellMap.get(node.id) ?? new Map<string, Cell>();
    const handleItems = forkLayout.computeHandles(node);
    const requiredKeys = new Set(handleItems.map((item) => item.key));

    for (const item of handleItems) {
        ensureForkHandle(graph, nodeCell, partCells, sceneState, node, item);
    }

    for (const [key, cell] of partCells.entries()) {
        if (requiredKeys.has(key)) {
            continue;
        }
        graph.removeCells([cell], false);
        partCells.delete(key);
        sceneState.cellNodeMap.delete(cell);
    }

    sceneState.forkPartCellMap.set(node.id, partCells);
}

function ensureForkHandle(
    graph: Graph,
    nodeCell: Cell,
    partCells: Map<string, Cell>,
    sceneState: SceneState,
    node: ForkNode,
    item: ReturnType<ForkLayout["computeHandles"]>[number]
) {
    const { key, x, y, width, height, relative } = item;
    const cellId = `${node.id}:${key}`;
    const existingCell = partCells.get(key);
    if (existingCell) {
        const geometry = existingCell.getGeometry();
        if (geometry) {
            const nextGeometry = geometry.clone();
            nextGeometry.x = x;
            nextGeometry.y = y;
            nextGeometry.width = width;
            nextGeometry.height = height;
            nextGeometry.relative = relative;
            nextGeometry.offset = null;
            graph.getDataModel().setGeometry(existingCell, nextGeometry);
        }
        return;
    }

    const handleCell = graph.insertVertex(
        nodeCell,
        cellId,
        "",
        x,
        y,
        width,
        height,
        forkHandleStyle,
        relative
    );
    graph.getDataModel().setVisible(handleCell, false);
    partCells.set(key, handleCell);
    sceneState.cellNodeMap.set(handleCell, node);
}

export function releaseForkNode(nodeId: string, sceneState: SceneState) {
    const partCells = sceneState.forkPartCellMap.get(nodeId);
    sceneState.forkPartCellMap.delete(nodeId);
    if (!partCells) {
        return [];
    }
    return [...partCells.values()];
}
