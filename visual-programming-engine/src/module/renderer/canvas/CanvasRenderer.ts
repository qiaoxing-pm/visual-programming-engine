import type BaseNode from "../../core/node/BaseNode.js";
import type { Cell } from "../../packages/maxGraph/core/src/index.js";
import type { Graph } from "../../packages/maxGraph/core/src/index.js";
import type NodeViewModel from "../../view-model/NodeViewModel.js";
import type { SceneState } from "../../state/SceneState.js";
import { releaseNodePorts, syncNodePorts } from "./PortRenderer.js";
import { releaseNodeCellTitles, syncNodeCellTitles } from "./CellTitleRenderer.js";
import { updateCellPosition,updateCellStyle, getNodeWidthAndHeight } from "../utils/canvasGraphOps.js";
import type { CellStyle } from "../../packages/maxGraph/core/src/index.js";
import {
    vscodeEditorForeground,
    vscodeEditorWidgetBackground,
    vscodeEditorWidgetBorder,
} from "../../theme/vscodeCssColors.js";
import { resolveCellStyleCssColors } from "../../theme/resolveCssColor.js";

// const nodeStyle: CellStyle = {
//     shape: "rectangle",
//     fillColor: "#2e3038",
//     strokeColor: "white",
//     labelPosition: "center",
//     // align: "center",
//     spacingLeft: 6,
//     verticalAlign: 'top',
//     fontColor: "#fff",
//     fontSize: 8,
//     spacingRight: 6,
//     rounded: true,
//     arcSize: 12,
// };

// export function syncNode(
//     graph: Graph,
//     node: BaseNode,
//     viewModel: NodeViewModel,
//     sceneState: SceneState
// ) {
//     let cell = sceneState.nodeCellMap.get(node.id);
//     // console.log(node.name,)
//     const nodeHW = getNodeWidthAndHeight(node);

//     if (!cell) {
//         const parent = graph.getDefaultParent();
//         cell = graph.insertVertex(
//             parent,
//             node.id,
//             node.type,
//             viewModel.x,
//             viewModel.y,
//             nodeHW.width,
//             nodeHW.height,
//             nodeStyle
//         );
//         sceneState.nodeCellMap.set(node.id, cell);
//         sceneState.cellNodeMap.set(cell, node);
//     }
//     syncNodePosition(graph, cell, viewModel);
//     const { added, removed } = syncNodePorts(graph, node, cell, sceneState);
//     const { added: titleAdded, removed: titleRemoved } = syncNodeCellTitles(graph, node, cell, sceneState);
//     for (const portCell of added) {
//         sceneState.cellNodeMap.set(portCell, node);
//     }
//     for (const portCell of removed) {
//         sceneState.cellNodeMap.delete(portCell);
//     }

//     for (const titleCell of titleAdded) {
//         sceneState.cellNodeMap.set(titleCell, node);
//     }
//     for (const titleCell of titleRemoved) {
//         sceneState.cellNodeMap.delete(titleCell);
//     }
//     return cell;
// }

// export function unmountNode(graph: Graph, node: BaseNode, sceneState: SceneState) {
//     const cell = sceneState.nodeCellMap.get(node.id);
//     if (!cell) {
//         return;
//     }
//     graph.removeCells([cell], false);
//     sceneState.cellNodeMap.delete(cell);
//     sceneState.nodeCellMap.delete(node.id);
//     const portCells = releaseNodePorts(node.id, sceneState);
//     for (const portCell of portCells) {
//         sceneState.cellNodeMap.delete(portCell);
//     }
//     const titleCells = releaseNodeCellTitles(node.id, sceneState);
//     for (const titleCell of titleCells) {
//         sceneState.cellNodeMap.delete(titleCell);
//     }
// }

// export function getNodeByCell(cell: Cell, sceneState: SceneState) {
//     return sceneState.cellNodeMap.get(cell) ?? null;
// }

// function syncNodePosition(graph: Graph, cell: Cell, viewModel: NodeViewModel) {
//     const geometry = cell.getGeometry();
//     if (!geometry) {
//         return;
//     }
//     updateCellPosition(graph, cell, viewModel.x, viewModel.y);
// }





const nodeStyle: CellStyle = {
    shape: "rectangle",
    fillColor: vscodeEditorWidgetBackground,
    strokeColor: vscodeEditorWidgetBorder,
    labelPosition: "center",
    // align: "center",
    spacingLeft: 6,
    verticalAlign: 'top',
    fontColor: vscodeEditorForeground,
    fontSize: 8,
    spacingRight: 6,
    rounded: true,
    arcSize: 12,
};

function getResolvedNodeStyle(graph: Graph): CellStyle {
    return resolveCellStyleCssColors(graph.container, nodeStyle);
}

export function syncNode(
    graph: Graph,
    node: BaseNode,
    viewModel: NodeViewModel,
    sceneState: SceneState
) {
    let cell = sceneState.nodeCellMap.get(node.id);
    const resolvedNodeStyle = getResolvedNodeStyle(graph);
    console.log(viewModel)
    const nodeHeightAndWidth = getNodeWidthAndHeight(node);
    if (!cell) {
        const parent = graph.getDefaultParent();
        cell = graph.insertVertex(
            parent,
            node.id,
            node.type,
            viewModel.x,
            viewModel.y,
            nodeHeightAndWidth.width,
            nodeHeightAndWidth.height,
            resolvedNodeStyle
        );
        sceneState.nodeCellMap.set(node.id, cell);
        sceneState.cellNodeMap.set(cell, node);
    } else {
        updateCellStyle(graph, cell, resolvedNodeStyle);
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


