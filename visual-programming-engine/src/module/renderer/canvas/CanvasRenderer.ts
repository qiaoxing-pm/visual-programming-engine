import type BaseNode from "../../core/node/BaseNode.js";
import type { Cell } from "../../packages/maxGraph/core/src/index.js";
import type { Graph } from "../../packages/maxGraph/core/src/index.js";
import type NodeViewModel from "../../view-model/NodeViewModel.js";
import PortRenderer from "./PortRenderer.js";
import { updateCellPosition } from "../utils/canvasGraphOps.js";
import type { CellStyle } from "../../packages/maxGraph/core/src/index.js";

export default class CanvasRenderer {
    private portRenderer = new PortRenderer();

    private readonly nodeWidth = 100;
    private readonly nodeHeight = 80;

    private readonly nodeStyle: CellStyle = {
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
        rounded: true,          // ✅ 开启圆角
        arcSize: 12,  
    };

    constructor() {
    }

    syncNode(
        graph: Graph,
        node: BaseNode,
        viewModel: NodeViewModel,
        nodeCellMap: Map<string, Cell>,
        cellNodeMap: Map<Cell, BaseNode>,
        nodePortCellMap: Map<string, Map<string, Cell>>
    ) {
        let cell = nodeCellMap.get(node.id);
        if (!cell) {
            const parent = graph.getDefaultParent();
            cell = graph.insertVertex(
                parent,
                node.id,
                node.type,
                viewModel.x,
                viewModel.y,
                this.nodeWidth,
                this.nodeHeight,
                this.nodeStyle
            );
            nodeCellMap.set(node.id, cell);
            cellNodeMap.set(cell, node);

            cell.connectable = false;
        }
        this.syncNodePosition(graph, cell, viewModel);
        this.syncNodePorts(graph, node, cell, nodePortCellMap, cellNodeMap);
        return cell;
    }

    unmountNode(
        graph: Graph,
        node: BaseNode,
        nodeCellMap: Map<string, Cell>,
        cellNodeMap: Map<Cell, BaseNode>,
        nodePortCellMap: Map<string, Map<string, Cell>>
    ) {
        const cell = nodeCellMap.get(node.id);
        if (!cell) {
            return;
        }
        graph.removeCells([cell], false);
        cellNodeMap.delete(cell);
        nodeCellMap.delete(node.id);
        const portCells = this.portRenderer.releaseNodePorts(node.id, nodePortCellMap);
        for (const portCell of portCells) {
            cellNodeMap.delete(portCell);
        }
    }

    getNodeByCell(cell: Cell, cellNodeMap: Map<Cell, BaseNode>) {
        return cellNodeMap.get(cell) ?? null;
    }

    private syncNodePorts(
        graph: Graph,
        node: BaseNode,
        nodeCell: Cell,
        nodePortCellMap: Map<string, Map<string, Cell>>,
        cellNodeMap: Map<Cell, BaseNode>
    ) {
        const { added, removed } = this.portRenderer.syncNodePorts(graph, node, nodeCell, nodePortCellMap);
        for (const cell of added) {
            cellNodeMap.set(cell, node);
        }
        for (const cell of removed) {
            cellNodeMap.delete(cell);
        }
    }

    private syncNodePosition(graph: Graph, cell: Cell, viewModel: NodeViewModel) {
        const geometry = cell.getGeometry();
        if (!geometry) {
            return;
        }
        updateCellPosition(graph, cell, viewModel.x, viewModel.y);
    }

}


