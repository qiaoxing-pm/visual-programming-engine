import type BaseNode from "../core/node/BaseNode.js";
import type { Cell } from "../packages/maxGraph/core/src/index.js";
import type { Graph } from "../packages/maxGraph/core/src/index.js";
import { CellRenderer } from "../packages/maxGraph/core/src/index.js";
import InternalEvent from "../packages/maxGraph/core/src/view/event/InternalEvent.js";
import type ConnectionHandler from "../packages/maxGraph/core/src/view/handler/ConnectionHandler.js";
import EdgeHandler from "../packages/maxGraph/core/src/view/handler/EdgeHandler.js";
import type SelectionCellsHandler from "../packages/maxGraph/core/src/view/handler/SelectionCellsHandler.js";
import CellState from "../packages/maxGraph/core/src/view/cell/CellState.js";
// import BezierShape from "../packages/maxGraph/core/src/view/geometry/edge/BezierShape.js";
import BezierShape2 from "../packages/maxGraph/core/src/view/geometry/edge/BezierShape2.js";
// import CellRenderer from "../packages/maxGraph/core/src/view/cell/CellRenderer.js";
import { createInputPortKey, createOutputPortKey } from "../renderer/utils/port.js";

const BEZIER_EDGE_SHAPE_NAME = "bezier";
let isBezierShapeRegistered = false;

function ensureBezierShapeRegistered() {
    if (isBezierShapeRegistered) {
        return;
    }
    CellRenderer.registerShape(BEZIER_EDGE_SHAPE_NAME, BezierShape2);
    isBezierShapeRegistered = true;
}

type PortDirection = "input" | "output";
type PortConnectionMetadata = {
    nodeId: string;
    direction: PortDirection;
    type: string;
};

export default class ConnectionBehavior {
    private isValidConnectionBase: ((source: Cell | null, target: Cell | null) => boolean) | null = null;
    private isCellConnectableBase: ((cell: Cell) => boolean) | null = null;
    private boundGraph: Graph | null = null;

    bind(graph: Graph, getNodeByCell: (cell: Cell) => BaseNode | null) {
        const graphWithCellConnectable = graph as Graph & {
            isCellConnectable: (cell: Cell) => boolean;
        };
        if (this.boundGraph !== graph) {
            this.isValidConnectionBase = graph.isValidConnection.bind(graph);
            const baseIsCellConnectable = (graph as unknown as { isCellConnectable?: (cell: Cell) => boolean }).isCellConnectable;
            this.isCellConnectableBase =
                typeof baseIsCellConnectable === "function"
                    ? baseIsCellConnectable.bind(graph)
                    : () => true;
            this.applyDefaultEdgeStyle(graph);
            this.applyConnectionPreviewStyle(graph);
            this.applyEdgeWaypointBehavior(graph);
            this.boundGraph = graph;
        }

        graph.setConnectable(true);
        graph.setAllowDanglingEdges(false);
        graphWithCellConnectable.isCellConnectable = (cell) => {
            if (!cell) {
                return false;
            }
            const isPort = this.resolvePortConnectionMetadata(cell, getNodeByCell) !== null;
            if (!isPort) {
                return false;
            }
            return this.isCellConnectableBase?.(cell) ?? true;
        };
        graph.isValidConnection = (source, target) => {
            const sourcePort = this.resolvePortConnectionMetadata(source, getNodeByCell);
            const targetPort = this.resolvePortConnectionMetadata(target, getNodeByCell);
            if (!sourcePort || !targetPort) {
                return false;
            }
            if (sourcePort.nodeId === targetPort.nodeId) {
                return false;
            }
            if (sourcePort.type !== targetPort.type) {
                return false;
            }
            const isInputOutputPair =
                (sourcePort.direction === "output" && targetPort.direction === "input") ||
                (sourcePort.direction === "input" && targetPort.direction === "output");
            if (!isInputOutputPair) {
                return false;
            }
            return this.isValidConnectionBase?.(source, target) ?? true;
        };
    }

    private applyDefaultEdgeStyle(graph: Graph) {
        ensureBezierShapeRegistered();
        const defaultEdgeStyle = graph.getStylesheet().getDefaultEdgeStyle();
        defaultEdgeStyle.shape = BEZIER_EDGE_SHAPE_NAME;
        defaultEdgeStyle.startArrow = "none";
        defaultEdgeStyle.endArrow = "none";
    }

    private applyConnectionPreviewStyle(graph: Graph) {
        ensureBezierShapeRegistered();
        const connectionHandler = graph.getPlugin<ConnectionHandler>("ConnectionHandler");
        if (!connectionHandler) {
            return;
        }

        connectionHandler.livePreview = true;
        connectionHandler.createEdgeState = () => {
            const edge = graph.createEdge(null, "", null, null, null, {
                shape: BEZIER_EDGE_SHAPE_NAME,
                startArrow: "none",
                endArrow: "none",
            });
            return new CellState(graph.getView(), edge, graph.getCellStyle(edge));
        };
    }

    private applyEdgeWaypointBehavior(graph: Graph) {
        graph.addListener(InternalEvent.DOUBLE_CLICK, (_, evt) => {
            const cell = evt.getProperty("cell") as Cell | null;
            const nativeEvent = evt.getProperty("event") as MouseEvent | null;
            if (!cell || !nativeEvent || !cell.isEdge()) {
                return;
            }

            graph.setSelectionCell(cell);
            const selectionCellsHandler = graph.getPlugin<SelectionCellsHandler>("SelectionCellsHandler");
            const handler = selectionCellsHandler?.getHandler(cell);
            if (!(handler instanceof EdgeHandler)) {
                return;
            }

            const state = graph.getView().getState(cell);
            if (!state) {
                return;
            }

            handler.addPoint(state, nativeEvent);
        });
    }

    private resolvePortConnectionMetadata(
        cell: Cell | null,
        getNodeByCell: (cell: Cell) => BaseNode | null
    ): PortConnectionMetadata | null {
        if (!cell) {
            return null;
        }
        const node = getNodeByCell(cell);
        if (!node) {
            return null;
        }
        const cellId = cell.getId();
        if (!cellId) {
            return null;
        }

        for (const [idx, port] of node.inputs.entries()) {
            const candidateId = `${node.id}:${createInputPortKey(idx, port.name)}`;
            if (cellId === candidateId) {
                return { nodeId: node.id, direction: "input", type: port.type };
            }
        }

        for (const [idx, port] of node.outputs.entries()) {
            const candidateId = `${node.id}:${createOutputPortKey(idx, port.name)}`;
            if (cellId === candidateId) {
                return { nodeId: node.id, direction: "output", type: port.type };
            }
        }

        return null;
    }
}
