import BaseNode from "../node/BaseNode.js";
import Edge from "./Edge.js";
import type { OutputPort, InputPort } from "../port/Port.js";

class Graph {
    nodes: BaseNode[] = [];
    edges: Edge[] = [];

    addNode(node: BaseNode) {
        node.index = this.nodes.length;
        this.nodes.push(node);
    }

    connect(from: OutputPort, to: InputPort) {
        const edge = new Edge(from, to);
        edge.validate();
        this.edges.push(edge);
    }

    getNodeById(id: string) {
        return this.nodes.find(node => node.id === id);
    }
}

export default Graph;