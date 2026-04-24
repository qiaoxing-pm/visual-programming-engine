import type BaseNode from "../../core/node/BaseNode.js";
import type { Cell } from "../../packages/maxGraph/core/src/index.js";
import type { Graph } from "../../packages/maxGraph/core/src/index.js";
import type { CanvasCommand } from "./commands.js";
import { mountNode, removeNode } from "./commands.js";
import { applyDefaultNodePosition, deriveNodeViewModel } from "../../layout/NodeLayout.js";
import { runInCommandContext } from "../../state/StateRules.js";
import {
    getNodeByCell as getNodeByCellInScene,
    syncNode as syncSceneNode,
    unmountNode as unmountSceneNode,
} from "../../renderer/canvas/CanvasRenderer.js";
import ConnectionBehavior from "../../interaction/ConnectionBehavior.js";
import NodeViewModel from "../../view-model/NodeViewModel.js";
import { createSceneState } from "../../state/SceneState.js";


class CanvasAdapter {

    private graph: Graph | null = null;
    private nodeMap = new Map<string, BaseNode>();
    private nodeViewModelMap = new Map<string, NodeViewModel>();
    private sceneState = createSceneState();
    private dirtyNodeIds = new Set<string>();
    private commitEvents = new EventTarget();
    private flushScheduled = false;
    private readonly connectionBehavior = new ConnectionBehavior();

    constructor() {
        this.commitEvents.addEventListener("viewmodel:dirty", () => {
            this.scheduleFlush();
        });
    }

    unmountNode(node: BaseNode) {
        this.execute(removeNode(node.id));
    }

    applyCanvas(graph: Graph) {
        this.graph = graph;
        this.connectionBehavior.bind(graph, (cell) => this.getNodeByCell(cell));
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

    private syncDerivedViewModel(node: BaseNode) {
        const viewModel = deriveNodeViewModel(node);
        this.nodeViewModelMap.set(node.id, viewModel);
        return viewModel;
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