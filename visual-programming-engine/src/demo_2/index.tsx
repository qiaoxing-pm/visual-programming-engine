import { useEffect, useRef } from "react";
import CanvasAdapter from "../module/adapter/canvas/CanvasAdapter.js";
import {
    createNode,
    mountNode,
} from "../module/adapter/canvas/commands.js";
import { Graph } from "../module/packages/maxGraph/core/src";
import {
    TCP_CONNECT,
    RTC,
    INTEGRAL,
    DERIVATIVE,
    PID,
    RAMP,
    HYSTERESIS,
} from "../module/core/node/instanceNode/additionalFunctionBlocks.js";
import { CanvasHostBackground } from "../module/canvas-background/index.js";


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

        const nodes = [
            TCP_CONNECT,
            RTC,
            INTEGRAL,
            DERIVATIVE,
            PID,
            RAMP,
            HYSTERESIS,
        ]

        nodes.forEach(node => {
            adapter.execute(createNode(node));
            adapter.execute(mountNode(node.id));

            // adapter.execute(patchNodePosition(node.id, { x: 280, y: 120 }));
            adapter.execute(mountNode(node.id));
        });

        return () => {
            canvasHostBackground.dispose();
            graph.destroy();
        };
    }, []);

    return <div ref={ref} className="plc-demo-graph-host"></div>;
}
