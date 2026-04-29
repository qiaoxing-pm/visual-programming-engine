import BaseNode from "./BaseNode.js";
import type { positionType } from "../type.js";

export type VirtualPortSide = 'left' | 'right';

export interface VirtualPortRef {
    nodeId: string;
    side: VirtualPortSide;
}

export default class ForkNode extends BaseNode {
    leftConnections: Set<string>;   // 输入侧连接（edge ids）
    rightConnections: Set<string>;  // 输出侧连接（edge ids）
    readonly blockSelfLoop: boolean;

    constructor(name = "Fork", position?: positionType, options?: { blockSelfLoop?: boolean }) {
        super("FORK", name, position);
        this.leftConnections = new Set<string>();
        this.rightConnections = new Set<string>();
        this.blockSelfLoop = options?.blockSelfLoop ?? true;
    }

    addConnection(side: VirtualPortSide, edgeId: string) {
        this.getConnectionSet(side).add(edgeId);
    }

    removeConnection(side: VirtualPortSide, edgeId: string) {
        this.getConnectionSet(side).delete(edgeId);
    }

    clearConnections(side?: VirtualPortSide) {
        if (!side) {
            this.leftConnections.clear();
            this.rightConnections.clear();
            return;
        }
        this.getConnectionSet(side).clear();
    }

    canLink(from: VirtualPortRef, to: VirtualPortRef) {
        if (from.side !== "right" || to.side !== "left") {
            return false;
        }
        if (this.blockSelfLoop && from.nodeId === to.nodeId) {
            return false;
        }
        return true;
    }

    flattenLinks(
        incoming: ReadonlyArray<{ fromNodeId: string; edgeId: string }>,
        outgoing: ReadonlyArray<{ toNodeId: string; edgeId: string }>
    ) {
        const flattened: Array<{ fromNodeId: string; toNodeId: string; viaEdgeIds: string[] }> = [];
        for (const inEdge of incoming) {
            for (const outEdge of outgoing) {
                if (this.blockSelfLoop && inEdge.fromNodeId === outEdge.toNodeId) {
                    continue;
                }
                flattened.push({
                    fromNodeId: inEdge.fromNodeId,
                    toNodeId: outEdge.toNodeId,
                    viaEdgeIds: [inEdge.edgeId, outEdge.edgeId],
                });
            }
        }
        return flattened;
    }

    private getConnectionSet(side: VirtualPortSide) {
        return side === "left" ? this.leftConnections : this.rightConnections;
    }

    async execute(): Promise<void> {
        return;
    }
}