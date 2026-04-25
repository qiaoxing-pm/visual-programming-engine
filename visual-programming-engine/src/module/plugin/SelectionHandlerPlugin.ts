import SelectionHandler from "../packages/maxGraph/core/src/view/handler/SelectionHandler.js";

import type { Graph } from "../packages/maxGraph/core/src/index.js";

export default class SelectionHandlerPlugin {
    static pluginId = "SelectionHandlerPlugin";
    private graph: Graph;
    constructor(graph: Graph) {
        this.graph = graph;
        const selectionHandler = graph.getPlugin<SelectionHandler>("SelectionHandler");
        selectionHandler.previewColor = "#22c55e";

        // selectionHandler.createPreviewShape = function (bounds) {
        //     const shape = new RectangleShape(bounds, NONE, "#22c55e");
        //     shape.isDashed = true;     // false 就是实线
        //     shape.strokeWidth = 2;     // 线宽
        //     shape.dialect = DIALECT.SVG;
        //     shape.init(this.graph.getView().getOverlayPane());
        //     shape.pointerEvents = false;
        //     return shape;
        //   };





    }
}