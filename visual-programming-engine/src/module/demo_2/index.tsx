import { useEffect, useRef } from "react";
import CanvasAdapter from "../adapter/canvas/CanvasAdapter.js";
import {
    createNode,
    mountNode,
    patchNodePosition,
    removeNode,
} from "../adapter/canvas/commands.js";
import Node from "../demo_1/Node.js";
import { Graph } from "../packages/maxGraph/core/src";

const start = new Node('123');
start.addOutput("output1", "string");
start.addOutput("output2", "string");
start.addOutput("output3", "string");

const end = new Node('321');
end.addInput("input1", "string");
end.addInput("input2", "string");
end.addInput("input3", "string");
end.addInput("input4", "string");
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
        adapter.execute(createNode(start));
        adapter.execute(mountNode(start.id));

        adapter.execute(patchNodePosition(start.id, { x: 280, y: 120 }));
        adapter.execute(mountNode(start.id));


        adapter.applyCanvas(graph);
        adapter.execute(createNode(end));
        adapter.execute(mountNode(end.id));

        adapter.execute(patchNodePosition(end.id, { x: 280, y: 120 }));
        adapter.execute(mountNode(end.id));


        return () => {
            // window.clearTimeout(timer);
            adapter.execute(removeNode(start.id));
            adapter.execute(removeNode(end.id));
            graph.destroy();
        };
    }, []);

    return <div ref={ref} className="plc-demo-graph-host"></div>;
}
