import type BaseNode from "../../core/node/BaseNode.js";
import type { Cell } from "../../packages/maxGraph/core/src/index.js";
import type { Graph } from "../../packages/maxGraph/core/src/index.js";
import type { CanvasCommand } from "./commands.js";
import { mountNode, removeNode } from "./commands.js";
import { applyDefaultNodePosition, deriveNodeViewModel } from "../../layout/NodeLayout.js";
import { runInCommandContext } from "../../state/StateRules.js";
import CanvasRenderer from "../../renderer/canvas/CanvasRenderer.js";
import NodeViewModel from "../../view-model/NodeViewModel.js";



class CanvasAdapter {

    private graph: Graph | null = null;
    private renderer = new CanvasRenderer();
    private nodeMap = new Map<string, BaseNode>();
    private nodeViewModelMap = new Map<string, NodeViewModel>();
    private nodeCellMap = new Map<string, Cell>();
    private cellNodeMap = new Map<Cell, BaseNode>();
    private nodePortCellMap = new Map<string, Map<string, Cell>>();
    private dirtyNodeIds = new Set<string>();
    private commitEvents = new EventTarget();
    private flushScheduled = false;

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
                return this.renderer.syncNode(
                    this.graph,
                    node,
                    viewModel,
                    this.nodeCellMap,
                    this.cellNodeMap,
                    this.nodePortCellMap
                );
            }
            case "remove_node": {
                if (this.graph) {
                    const node = this.nodeMap.get(command.nodeId);
                    if (node) {
                        this.renderer.unmountNode(
                            this.graph,
                            node,
                            this.nodeCellMap,
                            this.cellNodeMap,
                            this.nodePortCellMap
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
        return this.renderer.getNodeByCell(cell, this.cellNodeMap);
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