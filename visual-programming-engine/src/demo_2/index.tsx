import { useEffect, useRef } from "react";
import CanvasAdapter from "../module/adapter/canvas/CanvasAdapter.js";
import {
    createNode,
    mountNode,
    patchNodePosition,
    removeNode,
} from "../module/adapter/canvas/commands.js";
// import Node from "../demo_1/Node.js";
import { Graph } from "../module/packages/maxGraph/core/src/index.js";
import {
    TCP_CONNECT,
    RTC,
    INTEGRAL,
    DERIVATIVE,
    PID,
    RAMP,
    HYSTERESIS,
} from "../module/core/node/instanceNode/additionalFunctionBlocks.js";


export default function Demo2() {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const host = ref.current;
        if (!host) {
            return;
        }

        const graph = new Graph(host);
        const adapter = new CanvasAdapter();
        adapter.applyCanvas(graph);

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

            adapter.execute(patchNodePosition(node.id, { x: 280, y: 120 }));
            adapter.execute(mountNode(node.id));
        });

        return () => {
            graph.destroy();
        };
    }, []);

    return <div ref={ref} className="plc-demo-graph-host"></div>;
}
