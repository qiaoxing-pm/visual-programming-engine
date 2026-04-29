import type BaseNode from "../../core/node/BaseNode.js";
import ForkNode from "../../core/node/ForkNode.js";
import type { Cell, MouseListenerSet } from "../../packages/maxGraph/core/src/index.js";
import type { Graph } from "../../packages/maxGraph/core/src/index.js";
import type ConnectionHandler from "../../packages/maxGraph/core/src/view/handler/ConnectionHandler.js";
import type { CanvasCommand } from "./commands.js";
import { createNode, mountNode, patchNodeName, patchNodePosition, removeNode } from "./commands.js";
import { applyDefaultNodePosition, deriveNodeViewModel } from "../../layout/NodeLayout.js";
import { runInCommandContext } from "../../state/StateRules.js";
import {
    getNodeByCell as getNodeByCellInScene,
    syncNode as syncSceneNode,
    unmountNode as unmountSceneNode,
} from "../../renderer/canvas/CanvasRenderer.js";
import ConnectionBehavior from "../../interaction/ConnectionBehavior.js";
import DraggableBehavior from "../../interaction/DraggableBehavior.js";
import NodeViewModel from "../../view-model/NodeViewModel.js";
import { createSceneState } from "../../state/SceneState.js";
import InternalEvent from "../../packages/maxGraph/core/src/view/event/InternalEvent.js";
import type InternalMouseEvent from "../../packages/maxGraph/core/src/view/event/InternalMouseEvent.js";
import { isTitleCellId } from "../../renderer/utils/title.js";
import Plugin from "../../plugin/Plugin.js";
import { FORK_LEFT_HANDLE_KEY, FORK_RIGHT_HANDLE_KEY } from "../../layout/ForkLayout.js";


class CanvasAdapter {

    private graph: Graph | null = null;
    private nodeMap = new Map<string, BaseNode>();
    private nodeViewModelMap = new Map<string, NodeViewModel>();
    private sceneState = createSceneState();
    private dirtyNodeIds = new Set<string>();
    private commitEvents = new EventTarget();
    private flushScheduled = false;
    private readonly connectionBehavior = new ConnectionBehavior();
    private readonly draggableBehavior = new DraggableBehavior();
    private forkHoverMouseListener: MouseListenerSet | null = null;
    private hoveredForkNodeId: string | null = null;
    private labelChangedHandler: ((_: unknown, evt: any) => void) | null = null;
    private plugin: Plugin | null = null;
    constructor() {
        this.commitEvents.addEventListener("viewmodel:dirty", () => {
            this.scheduleFlush();
        });
    }

    unmountNode(node: BaseNode) {
        this.execute(removeNode(node.id));
    }

    applyCanvas(graph: Graph) {
        if (this.graph && this.labelChangedHandler) {
            this.graph.removeListener(this.labelChangedHandler);
        }
        if (this.graph && this.forkHoverMouseListener) {
            this.graph.removeMouseListener(this.forkHoverMouseListener);
            this.forkHoverMouseListener = null;
        }
        this.graph = graph;
        this.plugin = new Plugin(graph);
        this.connectionBehavior.bind(
            graph,
            (cell) => this.getNodeByCell(cell),
            {
                onInsertForkAtEdge: (edge, point) => this.insertForkOnEdge(edge, point),
            }
        );
        this.draggableBehavior.bind(
            graph,
            (cell) => this.getNodeByCell(cell),
            (node, position) => {
                this.execute(
                    patchNodePosition(node.id, {
                        x: position.x,
                        y: position.y,
                    })
                );
            }
        );
        this.bindTitleLabelEditing(graph);
        this.bindForkHoverBehavior(graph);
    }

    execute(command: CanvasCommand) {
        switch (command.type) {
            case "create_node": {
                this.nodeMap.set(command.node.id, command.node);
                runInCommandContext(() => {
                    applyDefaultNodePosition(command.node);
                });
                this.syncDerivedViewModel(command.node);
                this.markNodeDirty(command.node.id);
                return;
            }
            case "patch_node_position": {
                const node = this.nodeMap.get(command.nodeId);
                if (!node) {
                    return;
                }
                runInCommandContext(() => {
                    node.applyPositionPatch(command.patch);
                });
                this.syncDerivedViewModel(node);
                this.markNodeDirty(node.id);
                return;
            }
            case "patch_node_name": {
                const node = this.nodeMap.get(command.nodeId);
                if (!node) {
                    return;
                }
                runInCommandContext(() => {
                    node.applyNamePatch(command.name);
                });
                this.markNodeDirty(node.id);
                return;
            }
            case "mount_node": {
                if (!this.graph) {
                    return null;
                }
                const node = this.nodeMap.get(command.nodeId);
                if (!node) {
                    return null;
                }
                const viewModel = this.syncDerivedViewModel(node);
                return syncSceneNode(
                    this.graph,
                    node,
                    viewModel,
                    this.sceneState
                );
            }
            case "remove_node": {
                if (this.graph) {
                    const node = this.nodeMap.get(command.nodeId);
                    if (node) {
                        unmountSceneNode(
                            this.graph,
                            node,
                            this.sceneState
                        );
                    }
                }
                this.nodeMap.delete(command.nodeId);
                this.nodeViewModelMap.delete(command.nodeId);
                this.dirtyNodeIds.delete(command.nodeId);
                return;
            }
        }
    }

    getNodeByCell(cell: Cell) {
        return getNodeByCellInScene(cell, this.sceneState);
    }

    refreshThemeColors() {
        const view = this.graph?.container.ownerDocument.defaultView;
        const refresh = () => {
            for (const nodeId of this.nodeMap.keys()) {
                this.markNodeDirty(nodeId);
            }
        };

        if (view) {
            view.requestAnimationFrame(refresh);
            return;
        }

        refresh();
    }

    private syncDerivedViewModel(node: BaseNode) {
        const viewModel = deriveNodeViewModel(node);
        this.nodeViewModelMap.set(node.id, viewModel);
        return viewModel;
    }

    private getForkHandleCell(nodeId: string, handleKey: string) {
        const partCells = this.sceneState.forkPartCellMap.get(nodeId);
        return partCells?.get(handleKey) ?? null;
    }

    private insertForkOnEdge(edge: Cell, point: { x: number; y: number }) {
        if (!this.graph || !this.graph.getDataModel().contains(edge)) {
            return false;
        }
        const sourceCell = edge.getTerminal(true);
        const targetCell = edge.getTerminal(false);
        if (!sourceCell || !targetCell) {
            return false;
        }

        const sourceMetadata = this.connectionBehavior.resolvePortMetadataFromEdgeTerminal(
            edge,
            true,
            (cell) => this.getNodeByCell(cell)
        );
        const targetMetadata = this.connectionBehavior.resolvePortMetadataFromEdgeTerminal(
            edge,
            false,
            (cell) => this.getNodeByCell(cell)
        );
        if (!sourceMetadata || !targetMetadata) {
            return false;
        }

        const outputTerminal = sourceMetadata.direction === "output" ? sourceCell : targetCell;
        const inputTerminal = sourceMetadata.direction === "input" ? sourceCell : targetCell;
        const outputMetadata = sourceMetadata.direction === "output" ? sourceMetadata : targetMetadata;
        const inputMetadata = sourceMetadata.direction === "input" ? sourceMetadata : targetMetadata;
        if (outputMetadata.direction !== "output" || inputMetadata.direction !== "input") {
            return false;
        }
        if (outputMetadata.type !== inputMetadata.type) {
            return false;
        }
        const forkNode = new ForkNode("Fork", point, {
            portType: outputMetadata.type,
        });
        this.execute(createNode(forkNode));
        this.execute(mountNode(forkNode.id));
        const forkLeft = this.getForkHandleCell(forkNode.id, FORK_LEFT_HANDLE_KEY);
        const forkRight = this.getForkHandleCell(forkNode.id, FORK_RIGHT_HANDLE_KEY);
        if (!forkLeft || !forkRight) {
            return false;
        }

        const style = edge.getStyle();
        const model = this.graph.getDataModel();
        model.beginUpdate();
        try {
            model.setTerminal(edge, outputTerminal, true);
            model.setTerminal(edge, forkLeft, false);
            const nextGeometry = edge.getGeometry()?.clone();
            if (nextGeometry) {
                nextGeometry.points = null;
                model.setGeometry(edge, nextGeometry);
            }
            this.graph.insertEdge(
                this.graph.getDefaultParent(),
                null,
                edge.getValue(),
                forkRight,
                inputTerminal,
                style
            );
        } finally {
            model.endUpdate();
        }
        return true;
    }

    private bindTitleLabelEditing(graph: Graph) {
        this.labelChangedHandler = (_, evt) => {
            const cell = evt.getProperty("cell") as Cell | null;
            const value = evt.getProperty("value");
            if (!cell || !isTitleCellId(cell.getId())) {
                return;
            }
            const node = this.getNodeByCell(cell);
            if (!node) {
                return;
            }
            const nextName = typeof value === "string" ? value.trim() : String(value ?? "").trim();
            if (!nextName || node.name === nextName) {
                return;
            }
            this.execute(patchNodeName(node.id, nextName));
        };
        graph.addListener(InternalEvent.LABEL_CHANGED, this.labelChangedHandler);
    }

    private bindForkHoverBehavior(graph: Graph) {
        this.forkHoverMouseListener = {
            mouseDown: () => {
                // no-op
            },
            mouseMove: (_sender, me: InternalMouseEvent) => {
                this.updateForkHoverFromCell(me.getCell());
            },
            mouseUp: () => {
                this.updateForkHoverFromCell(null);
            },
        };
        graph.addMouseListener(this.forkHoverMouseListener);
    }

    private updateForkHoverFromCell(cell: Cell | null) {
        const nextHoveredForkNodeId = this.resolveHoveredForkCoreNodeId(cell);
        if (this.isForkConnectionInProgress() && this.hoveredForkNodeId && !nextHoveredForkNodeId) {
            return;
        }
        if (nextHoveredForkNodeId === this.hoveredForkNodeId) {
            return;
        }
        if (this.hoveredForkNodeId) {
            this.setForkHandlesVisible(this.hoveredForkNodeId, false);
        }
        this.hoveredForkNodeId = nextHoveredForkNodeId;
        if (this.hoveredForkNodeId) {
            this.setForkHandlesVisible(this.hoveredForkNodeId, true);
        }
    }

    private isForkConnectionInProgress() {
        if (!this.graph) {
            return false;
        }
        const connectionHandler = this.graph.getPlugin<ConnectionHandler>("ConnectionHandler");
        return connectionHandler?.isConnecting() ?? false;
    }

    private resolveHoveredForkCoreNodeId(cell: Cell | null) {
        if (!cell) {
            return null;
        }
        const node = this.getNodeByCell(cell);
        if (!(node instanceof ForkNode)) {
            return null;
        }
        const coreCell = this.sceneState.nodeCellMap.get(node.id) ?? null;
        if (coreCell === cell) {
            return node.id;
        }
        const partCells = this.sceneState.forkPartCellMap.get(node.id);
        if (!partCells || partCells.size === 0) {
            return null;
        }
        for (const partCell of partCells.values()) {
            if (partCell === cell) {
                return node.id;
            }
        }
        return null;
    }

    private setForkHandlesVisible(nodeId: string, visible: boolean) {
        if (!this.graph) {
            return;
        }
        const partCells = this.sceneState.forkPartCellMap.get(nodeId);
        if (!partCells || partCells.size === 0) {
            return;
        }
        for (const cell of partCells.values()) {
            const currentStyle = (cell.getStyle() ?? {}) as Record<string, any>;
            this.graph.getDataModel().setStyle(cell, {
                ...currentStyle,
                opacity: visible ? 100 : 0,
                fillOpacity: visible ? 100 : 0,
                strokeOpacity: visible ? 100 : 0,
                pointerEvents: visible,
            } as any);
        }
    }

    private markNodeDirty(nodeId: string) {
        if (!this.nodeMap.has(nodeId)) {
            return;
        }
        this.dirtyNodeIds.add(nodeId);
        this.commitEvents.dispatchEvent(new Event("viewmodel:dirty"));
    }

    private scheduleFlush() {
        if (this.flushScheduled) {
            return;
        }
        this.flushScheduled = true;
        queueMicrotask(() => {
            this.flushScheduled = false;
            this.flushDirtyNodes();
        });
    }

    private flushDirtyNodes() {
        if (!this.graph || this.dirtyNodeIds.size === 0) {
            return;
        }
        const dirtyIds = [...this.dirtyNodeIds];
        this.dirtyNodeIds.clear();
        for (const nodeId of dirtyIds) {
            this.execute(mountNode(nodeId));
        }
    }

}


export default CanvasAdapter;
