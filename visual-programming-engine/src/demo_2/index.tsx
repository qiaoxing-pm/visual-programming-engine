import { useEffect, useRef } from "react";
import type BaseNode from "../module/core/node/BaseNode.js";
import Node from "../module/core/node/Node.js";
import ForkNode from "../module/core/node/ForkNode.js";
import CanvasAdapter from "../module/adapter/canvas/CanvasAdapter.js";
import {
    createNode,
    patchNodePosition,
    mountNode,
} from "../module/adapter/canvas/commands.js";
import { Graph } from "../module/packages/maxGraph/core/src";
import {
    PID,
} from "../module/core/node/instanceNode/additionalFunctionBlocks.js";
import { CanvasHostBackground } from "../module/canvas-background/index.js";
import ExternalDropBehavior from "../module/interaction/ExternalDropBehavior.js";

const NODE_TEMPLATE_DRAG_MIME = "application/x-vpe-node-template";

function cloneNodeFromTemplate(template: BaseNode, position: { x: number; y: number }) {
    if (template instanceof ForkNode) {
        return new ForkNode(template.name, position, { blockSelfLoop: template.blockSelfLoop });
    }
    const next = new Node(template.type, template.name, position);
    for (const port of template.outputs) {
        next.addOutput(port.name, port.type);
    }
    for (const port of template.inputs) {
        next.addInput(port.name, port.type);
    }
    return next;
}

const FORK_TEMPLATE = new ForkNode("Fork");
const NODE_TEMPLATE_MAP: Record<string, BaseNode> = {
    PID,
    FORK: FORK_TEMPLATE,
};

export default function Demo2() {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const host = ref.current;
        if (!host) {
            return;
        }

        const graph = new Graph(host);
        const adapter = new CanvasAdapter();
        const canvasHostBackground = new CanvasHostBackground();
        const externalDropBehavior = new ExternalDropBehavior();
        adapter.applyCanvas(graph);
        canvasHostBackground.bind(graph, host, {
            showGrid: true,
            gridSpacing: 12,
            snapToGrid: true,
            freeCanvas: true,
            zoomEnabled: true,
            minScale: 0.25,
            maxScale: 3,
            zoomStep: 0.12,
        });

        const seedNode = cloneNodeFromTemplate(PID, { x: 120, y: 80 });
        adapter.execute(createNode(seedNode));
        adapter.execute(mountNode(seedNode.id));

        externalDropBehavior.bind(host, graph, {
            mimeType: NODE_TEMPLATE_DRAG_MIME,
            onDrop: (payload, point) => {
                const template = NODE_TEMPLATE_MAP[payload];
                if (!template) {
                    return;
                }
                const node = cloneNodeFromTemplate(template, { x: point.x, y: point.y });
                adapter.execute(createNode(node));
                adapter.execute(patchNodePosition(node.id, { x: point.x, y: point.y }));
                adapter.execute(mountNode(node.id));
            },
        });

        return () => {
            externalDropBehavior.dispose();
            canvasHostBackground.dispose();
            graph.destroy();
        };
    }, []);

    return <div ref={ref} className="plc-demo-graph-host"></div>;
}
