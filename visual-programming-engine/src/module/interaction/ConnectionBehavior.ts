import type BaseNode from "../core/node/BaseNode.js";
import type { Cell } from "../packages/maxGraph/core/src/index.js";
import type { Graph } from "../packages/maxGraph/core/src/index.js";
import { BezierShape, CellRenderer } from "../packages/maxGraph/core/src/index.js";
import { createInputPortKey, createOutputPortKey } from "../renderer/utils/port.js";

const BEZIER_EDGE_SHAPE_NAME = "bezier";
let isBezierShapeRegistered = false;

function ensureBezierShapeRegistered() {
    if (isBezierShapeRegistered) {
        return;
    }
    CellRenderer.registerShape(BEZIER_EDGE_SHAPE_NAME, BezierShape);
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
    private boundGraph: Graph | null = null;

    bind(graph: Graph, getNodeByCell: (cell: Cell) => BaseNode | null) {
        if (this.boundGraph !== graph) {
            this.isValidConnectionBase = graph.isValidConnection.bind(graph);
            this.applyDefaultEdgeStyle(graph);
            this.boundGraph = graph;
        }

        graph.setConnectable(true);
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
