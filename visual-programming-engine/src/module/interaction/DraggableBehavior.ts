import type BaseNode from "../core/node/BaseNode.js";
import type { Cell } from "../packages/maxGraph/core/src/index.js";
import type { Graph } from "../packages/maxGraph/core/src/index.js";
import InternalEvent from "../packages/maxGraph/core/src/view/event/InternalEvent.js";

type NodePosition = {
    x: number;
    y: number;
};

type ResolveNodeByCell = (cell: Cell) => BaseNode | null;
type OnNodeMoved = (node: BaseNode, position: NodePosition) => void;

export default class DraggableBehavior {
    private boundGraph: Graph | null = null;
    private cellsMovedHandler: ((_: unknown, evt: any) => void) | null = null;

    bind(graph: Graph, resolveNodeByCell: ResolveNodeByCell, onNodeMoved: OnNodeMoved) {
        if (this.boundGraph && this.cellsMovedHandler) {
            this.boundGraph.removeListener(this.cellsMovedHandler);
        }

        graph.setCellsMovable(true);

        this.cellsMovedHandler = (_, evt) => {
            const cells = (evt.getProperty("cells") as Cell[] | null) ?? [];
            const syncedNodeIds = new Set<string>();
            for (const cell of cells) {
                const node = resolveNodeByCell(cell);
                if (!node || cell.getId() !== node.id || syncedNodeIds.has(node.id)) {
                    continue;
                }
                const geometry = cell.getGeometry();
                if (!geometry) {
                    continue;
                }
                syncedNodeIds.add(node.id);
                onNodeMoved(node, {
                    x: geometry.x,
                    y: geometry.y,
                });
            }
        };

        graph.addListener(InternalEvent.CELLS_MOVED, this.cellsMovedHandler);
        this.boundGraph = graph;
    }
}