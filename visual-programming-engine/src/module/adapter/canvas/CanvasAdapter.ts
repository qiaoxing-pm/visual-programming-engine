import type BaseNode from "../../core/node/BaseNode.js";
import type { Cell } from "../../packages/maxGraph/core/src/index.js";
import type { Graph } from "../../packages/maxGraph/core/src/index.js";
import type { CanvasCommand } from "./commands.js";
import { mountNode, patchNodeName, patchNodePosition, removeNode } from "./commands.js";
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
import { isTitleCellId } from "../../renderer/utils/title.js";
import Plugin from "../../plugin/Plugin.js";


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
        this.graph = graph;
        this.plugin = new Plugin(graph);
        this.connectionBehavior.bind(graph, (cell) => this.getNodeByCell(cell));
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
