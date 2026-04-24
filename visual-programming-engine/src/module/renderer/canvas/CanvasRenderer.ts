import type BaseNode from "../../core/node/BaseNode.js";
import type { Cell } from "../../packages/maxGraph/core/src/index.js";
import type { Graph } from "../../packages/maxGraph/core/src/index.js";
import type NodeViewModel from "../../view-model/NodeViewModel.js";
import type { SceneState } from "../../state/SceneState.js";
import { releaseNodePorts, syncNodePorts } from "./PortRenderer.js";
import { releaseNodeCellTitles, syncNodeCellTitles } from "./CellTitleRenderer.js";
import { updateCellPosition } from "../utils/canvasGraphOps.js";
import type { CellStyle } from "../../packages/maxGraph/core/src/index.js";

const nodeWidth = 100;
const nodeHeight = 80;

const nodeStyle: CellStyle = {
    shape: "rectangle",
    fillColor: "#2e3038",
    strokeColor: "white",
    labelPosition: "center",
    // align: "center",
    spacingLeft: 6,
    verticalAlign: 'top',
    fontColor: "#fff",
    fontSize: 8,
    spacingRight: 6,
    rounded: true,
    arcSize: 12,
};

export function syncNode(
    graph: Graph,
    node: BaseNode,
    viewModel: NodeViewModel,
    sceneState: SceneState
) {
    let cell = sceneState.nodeCellMap.get(node.id);
    if (!cell) {
        const parent = graph.getDefaultParent();
        cell = graph.insertVertex(
            parent,
            node.id,
            node.type,
            viewModel.x,
            viewModel.y,
            nodeWidth,
            nodeHeight,
            nodeStyle
        );
        sceneState.nodeCellMap.set(node.id, cell);
        sceneState.cellNodeMap.set(cell, node);
    }
    syncNodePosition(graph, cell, viewModel);
    const { added, removed } = syncNodePorts(graph, node, cell, sceneState);
    const { added: titleAdded, removed: titleRemoved } = syncNodeCellTitles(graph, node, cell, sceneState);
    for (const portCell of added) {
        sceneState.cellNodeMap.set(portCell, node);
    }
    for (const portCell of removed) {
        sceneState.cellNodeMap.delete(portCell);
    }

    for (const titleCell of titleAdded) {
        sceneState.cellNodeMap.set(titleCell, node);
    }
    for (const titleCell of titleRemoved) {
        sceneState.cellNodeMap.delete(titleCell);
    }
    return cell;
}

export function unmountNode(graph: Graph, node: BaseNode, sceneState: SceneState) {
    const cell = sceneState.nodeCellMap.get(node.id);
    if (!cell) {
        return;
    }
    graph.removeCells([cell], false);
    sceneState.cellNodeMap.delete(cell);
    sceneState.nodeCellMap.delete(node.id);
    const portCells = releaseNodePorts(node.id, sceneState);
    for (const portCell of portCells) {
        sceneState.cellNodeMap.delete(portCell);
    }
    const titleCells = releaseNodeCellTitles(node.id, sceneState);
    for (const titleCell of titleCells) {
        sceneState.cellNodeMap.delete(titleCell);
    }
}

export function getNodeByCell(cell: Cell, sceneState: SceneState) {
    return sceneState.cellNodeMap.get(cell) ?? null;
}

function syncNodePosition(graph: Graph, cell: Cell, viewModel: NodeViewModel) {
    const geometry = cell.getGeometry();
    if (!geometry) {
        return;
    }
    updateCellPosition(graph, cell, viewModel.x, viewModel.y);
}


