import type { Graph } from "../packages/maxGraph/core/src/index.js";
import SelectionHandlerPlugin from "./SelectionHandlerPlugin.js";

export default class Plugin {
    static pluginId: string;
    private graph: Graph;
    private selectionHandlerPlugin: SelectionHandlerPlugin;

    constructor(graph: Graph) {
        this.graph = graph;

        this.selectionHandlerPlugin = new SelectionHandlerPlugin(graph);
    }
}