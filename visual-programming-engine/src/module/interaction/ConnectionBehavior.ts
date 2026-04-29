import type BaseNode from "../core/node/BaseNode.js";
import ForkNode from "../core/node/ForkNode.js";
import { FORK_LEFT_HANDLE_KEY, FORK_RIGHT_HANDLE_KEY } from "../layout/ForkLayout.js";
import type { Cell, MouseListenerSet } from "../packages/maxGraph/core/src/index.js";
import type { CellStyle } from "../packages/maxGraph/core/src/index.js";
import type { Graph } from "../packages/maxGraph/core/src/index.js";
import { CellRenderer, Point } from "../packages/maxGraph/core/src/index.js";
import type EventObject from "../packages/maxGraph/core/src/view/event/EventObject.js";
import type EventSource from "../packages/maxGraph/core/src/view/event/EventSource.js";
import InternalEvent from "../packages/maxGraph/core/src/view/event/InternalEvent.js";
import type InternalMouseEvent from "../packages/maxGraph/core/src/view/event/InternalMouseEvent.js";
import type ConnectionHandler from "../packages/maxGraph/core/src/view/handler/ConnectionHandler.js";
import EdgeHandler from "../packages/maxGraph/core/src/view/handler/EdgeHandler.js";
import type SelectionCellsHandler from "../packages/maxGraph/core/src/view/handler/SelectionCellsHandler.js";
import CellState from "../packages/maxGraph/core/src/view/cell/CellState.js";
import GeometryChange from "../packages/maxGraph/core/src/view/undoable_changes/GeometryChange.js";
import BezierShape2 from "../packages/maxGraph/core/src/view/geometry/edge/BezierShape2.js";
import { createInputPortKey, createOutputPortKey } from "../renderer/utils/port.js";
import type { ValueType } from "../core/type.js";

const BEZIER_EDGE_SHAPE_NAME = "bezier";
let isBezierShapeRegistered = false;
const EDGE_EXTENSION_POINT_SIZE = 6;
const EDGE_EXTENSION_POINT_SAMPLES_PER_CURVE = 24;
const FORK_SOURCE_SIDE_STYLE_KEY = "forkSourceSide";
const FORK_TARGET_SIDE_STYLE_KEY = "forkTargetSide";

function ensureBezierShapeRegistered() {
    if (isBezierShapeRegistered) {
        return;
    }
    CellRenderer.registerShape(BEZIER_EDGE_SHAPE_NAME, BezierShape2);
    isBezierShapeRegistered = true;
}

type PortDirection = "input" | "output";
type ForkTriggerSide = "left" | "right";
type PortConnectionMetadata = {
    nodeId: string;
    direction: PortDirection;
    type: ValueType;
};
type InsertForkAtEdgeCallback = (edge: Cell, point: { x: number; y: number }) => boolean;

export default class ConnectionBehavior {
    private isValidConnectionBase: ((source: Cell | null, target: Cell | null) => boolean) | null = null;
    private isValidSourceBase: ((cell: Cell | null) => boolean) | null = null;
    private isCellConnectableBase: ((cell: Cell) => boolean) | null = null;
    private boundGraph: Graph | null = null;
    private nodeResolver: ((cell: Cell) => BaseNode | null) | null = null;
    private edgeExtensionPointSeq = 0;
    private edgeExtensionPointMetadata = new Map<Cell, PortConnectionMetadata>();
    private edgeExtensionPointOwnerEdge = new Map<Cell, Cell>();
    private edgeExtensionPointAnchorX = new Map<Cell, number>();
    private edgeExtensionPointDragCell: Cell | null = null;
    private edgeExtensionPointDragGraph: Graph | null = null;
    private insertForkAtEdge: InsertForkAtEdgeCallback | null = null;
    private edgeExtensionPointMouseListener: MouseListenerSet | null = null;
    private pendingEdgeExtensionPointSyncEdges = new Set<Cell>();
    private edgeExtensionPointSyncScheduled = false;
    private activeForkSourceSide: ForkTriggerSide | null = null;
    private connectionHandlerMouseDownPatched = false;
    private readonly edgeExtensionPointStyle: CellStyle = {
        shape: "ellipse",
        fillColor: "#1a192b",
        strokeColor: "#7dd3fc",
        fontColor: "#fff",
        fontSize: 0,
        noLabel: true,
        movable: false,
        resizable: false,
    };

    bind(
        graph: Graph,
        getNodeByCell: (cell: Cell) => BaseNode | null,
        options?: { onInsertForkAtEdge?: InsertForkAtEdgeCallback }
    ) {
        const graphWithCellConnectable = graph as Graph & {
            isCellConnectable: (cell: Cell) => boolean;
        };
        if (this.boundGraph !== graph) {
            this.isValidConnectionBase = graph.isValidConnection.bind(graph);
            this.isValidSourceBase = graph.isValidSource.bind(graph);
            const baseIsCellConnectable = (graph as unknown as { isCellConnectable?: (cell: Cell) => boolean }).isCellConnectable;
            this.isCellConnectableBase =
                typeof baseIsCellConnectable === "function"
                    ? baseIsCellConnectable.bind(graph)
                    : () => true;
            this.applyDefaultEdgeStyle(graph);
            this.applyConnectionPreviewStyle(graph);
            this.applyEdgeWaypointBehavior(graph);
            this.applyEdgeDirectionStyle(graph);
            this.applyEdgeExtensionPointDragBehavior(graph);
            this.applyEdgeExtensionPointGeometrySync(graph);
            this.boundGraph = graph;
        }
        this.nodeResolver = getNodeByCell;
        this.insertForkAtEdge = options?.onInsertForkAtEdge ?? null;

        graph.setConnectable(true);
        graph.setAllowDanglingEdges(false);
        graph.keepEdgesInBackground = true;
        graph.keepEdgesInForeground = false;
        graph.isValidSource = (cell) => {
            const isPort = this.resolvePortConnectionMetadata(cell, getNodeByCell, "source") !== null;
            if (!isPort) {
                return false;
            }
            return this.isValidSourceBase?.(cell) ?? true;
        };
        graphWithCellConnectable.isCellConnectable = (cell) => {
            if (!cell) {
                return false;
            }
            const isPort = this.resolvePortConnectionMetadata(cell, getNodeByCell, "source") !== null;
            if (!isPort) {
                return false;
            }
            return this.isCellConnectableBase?.(cell) ?? true;
        };
        graph.isValidConnection = (source, target) => {
            const sourcePort = this.resolvePortConnectionMetadata(source, getNodeByCell, "source");
            const targetPort = this.resolvePortConnectionMetadata(target, getNodeByCell, "target");
            if (!sourcePort || !targetPort) {
                return false;
            }
            if (sourcePort.nodeId === targetPort.nodeId) {
                return false;
            }
            if (sourcePort.type !== targetPort.type) {
                return false;
            }
            const isInputOutputPair =
                (sourcePort.direction === "output" && targetPort.direction === "input") ||
                (sourcePort.direction === "input" && targetPort.direction === "output");
            if (!isInputOutputPair) {
                return false;
            }
            return this.isValidConnectionBase?.(source, target) ?? true;
        };
    }

    private applyDefaultEdgeStyle(graph: Graph) {
        ensureBezierShapeRegistered();
        const defaultEdgeStyle = graph.getStylesheet().getDefaultEdgeStyle();
        defaultEdgeStyle.shape = BEZIER_EDGE_SHAPE_NAME;
        defaultEdgeStyle.startArrow = "none";
        defaultEdgeStyle.endArrow = "none";
    }

    private applyConnectionPreviewStyle(graph: Graph) {
        ensureBezierShapeRegistered();
        const connectionHandler = graph.getPlugin<ConnectionHandler>("ConnectionHandler");
        if (!connectionHandler) {
            return;
        }
        if (!this.connectionHandlerMouseDownPatched) {
            const baseMouseDown = connectionHandler.mouseDown.bind(connectionHandler);
            connectionHandler.mouseDown = (sender, me) => {
                const sourceTrigger = this.resolveForkTriggerByCell(connectionHandler.previous?.cell ?? null);
                this.activeForkSourceSide = sourceTrigger?.side ?? null;
                if (sourceTrigger) {
                    const coreState = graph.getView().getState(sourceTrigger.coreCell);
                    if (coreState) {
                        connectionHandler.previous = coreState;
                    }
                }
                baseMouseDown(sender, me);
            };
            this.connectionHandlerMouseDownPatched = true;
        }

        connectionHandler.livePreview = true;
        connectionHandler.createEdgeState = () => {
            const sourceCell = connectionHandler.previous?.cell ?? null;
            const sc = this.getDirectionScalarBySourceCell(sourceCell, this.activeForkSourceSide);
            const edge = graph.createEdge(null, "", null, null, null, {
                shape: BEZIER_EDGE_SHAPE_NAME,
                startArrow: "none",
                endArrow: "none",
                sc,
                ...(this.activeForkSourceSide ? { [FORK_SOURCE_SIDE_STYLE_KEY]: this.activeForkSourceSide } : {}),
            } as any);
            return new CellState(graph.getView(), edge, graph.getCellStyle(edge));
        };
    }

    private applyEdgeDirectionStyle(graph: Graph) {
        graph.addListener(InternalEvent.CONNECT, (_sender: unknown, evt: EventObject) => {
            const edge = evt.getProperty("cell") as Cell | null;
            if (!edge) {
                return;
            }
            const sourceCell = edge.getTerminal(true);
            const targetCell = edge.getTerminal(false);
            const sourceForkTrigger = this.resolveForkTriggerByCell(sourceCell);
            const targetForkTrigger = this.resolveForkTriggerByCell(targetCell);
            const sourceCoreCell = sourceForkTrigger?.coreCell ?? sourceCell;
            const targetCoreCell = targetForkTrigger?.coreCell ?? targetCell;
            const style = edge.getStyle();
            const nextStyle = { ...style } as Record<string, any>;
            const effectiveSourceSide =
                sourceForkTrigger?.side ?? this.activeForkSourceSide ?? this.readForkTriggerSideFromEdgeStyle(style, true);
            if (effectiveSourceSide) {
                nextStyle[FORK_SOURCE_SIDE_STYLE_KEY] = effectiveSourceSide;
            }
            if (targetForkTrigger) {
                nextStyle[FORK_TARGET_SIDE_STYLE_KEY] = targetForkTrigger.side;
            }
            graph.getDataModel().beginUpdate();
            try {
                if (sourceCoreCell !== sourceCell) {
                    graph.getDataModel().setTerminal(edge, sourceCoreCell, true);
                }
                if (targetCoreCell !== targetCell) {
                    graph.getDataModel().setTerminal(edge, targetCoreCell, false);
                }
                this.snapEdgeExtensionPoints(graph, edge);
                const sc = this.getDirectionScalarBySourceCell(
                    sourceCoreCell,
                    effectiveSourceSide
                );
                graph.getDataModel().setStyle(edge, {
                    ...nextStyle,
                    sc,
                } as any);
            } finally {
                graph.getDataModel().endUpdate();
                this.activeForkSourceSide = null;
            }
            // Keep the new edge behind ports/nodes even if insertion order changes.
            graph.orderCells(true, [edge]);
        });
    }

    private applyEdgeWaypointBehavior(graph: Graph) {
        graph.addListener(InternalEvent.DOUBLE_CLICK, (_sender: unknown, evt: EventObject) => {
            const cell = evt.getProperty("cell") as Cell | null;
            const nativeEvent = evt.getProperty("event") as MouseEvent | null;
            if (!cell || !nativeEvent || !cell.isEdge()) {
                return;
            }

            const state = graph.getView().getState(cell);
            if (!state) {
                return;
            }

            if (this.isEdgeExtensionPointEvent(nativeEvent)) {
                this.addEdgeExtensionPoint(graph, cell, state, nativeEvent);
                return;
            }

            const graphPoint = graph.getPointForEvent(nativeEvent, false);
            const inserted = this.insertForkAtEdge?.(cell, { x: graphPoint.x, y: graphPoint.y }) ?? false;
            if (inserted) {
                evt.consume();
                return;
            }

            graph.setSelectionCell(cell);
            const selectionCellsHandler = graph.getPlugin<SelectionCellsHandler>("SelectionCellsHandler");
            const handler = selectionCellsHandler?.getHandler(cell);
            if (!(handler instanceof EdgeHandler)) {
                return;
            }

            handler.addPoint(state, nativeEvent);
        });
    }

    private isEdgeExtensionPointEvent(nativeEvent: MouseEvent) {
        return nativeEvent.shiftKey;
    }

    private applyEdgeExtensionPointGeometrySync(graph: Graph) {
        graph.getDataModel().addListener(InternalEvent.CHANGE, (_sender: unknown, evt: EventObject) => {
            const changes = evt.getProperty("changes") as unknown[] | null;
            if (!changes) {
                return;
            }

            for (const change of changes) {
                if (!(change instanceof GeometryChange) || !change.cell.isEdge()) {
                    continue;
                }
                this.scheduleEdgeExtensionPointSync(graph, change.cell);
            }
        });
        graph.addListener(InternalEvent.CELLS_MOVED, () => {
            this.scheduleAllEdgeExtensionPointSync(graph);
        });
        graph.addListener(InternalEvent.MOVE_CELLS, () => {
            this.scheduleAllEdgeExtensionPointSync(graph);
        });
    }

    private applyEdgeExtensionPointDragBehavior(graph: Graph) {
        this.edgeExtensionPointMouseListener = {
            mouseDown: (_sender: EventSource, me: InternalMouseEvent) => {
                const cell = me.getCell();
                if (!cell || !this.edgeExtensionPointMetadata.has(cell) || !me.getEvent().altKey) {
                    return;
                }

                this.edgeExtensionPointDragCell = cell;
                this.edgeExtensionPointDragGraph = graph;
                this.updateEdgeExtensionPointByMouse(graph, cell, me);
                me.consume();
            },
            mouseMove: (_sender: EventSource, me: InternalMouseEvent) => {
                if (!this.edgeExtensionPointDragCell || this.edgeExtensionPointDragGraph !== graph) {
                    return;
                }

                this.updateEdgeExtensionPointByMouse(graph, this.edgeExtensionPointDragCell, me);
                me.consume();
            },
            mouseUp: (_sender: EventSource, me: InternalMouseEvent) => {
                if (!this.edgeExtensionPointDragCell || this.edgeExtensionPointDragGraph !== graph) {
                    return;
                }

                this.updateEdgeExtensionPointByMouse(graph, this.edgeExtensionPointDragCell, me);
                this.edgeExtensionPointDragCell = null;
                this.edgeExtensionPointDragGraph = null;
                me.consume();
            },
        };
        graph.mouseListeners.unshift(this.edgeExtensionPointMouseListener);
    }

    private scheduleEdgeExtensionPointSync(graph: Graph, edge: Cell) {
        this.pendingEdgeExtensionPointSyncEdges.add(edge);
        if (this.edgeExtensionPointSyncScheduled) {
            return;
        }

        this.edgeExtensionPointSyncScheduled = true;
        const sync = () => {
            this.edgeExtensionPointSyncScheduled = false;
            const edges = [...this.pendingEdgeExtensionPointSyncEdges];
            this.pendingEdgeExtensionPointSyncEdges.clear();
            graph.getView().validate();
            for (const pendingEdge of edges) {
                this.snapEdgeExtensionPoints(graph, pendingEdge);
            }
        };

        const view = graph.container.ownerDocument.defaultView;
        if (view) {
            view.requestAnimationFrame(sync);
            return;
        }

        queueMicrotask(sync);
    }

    private scheduleAllEdgeExtensionPointSync(graph: Graph) {
        for (const edge of this.edgeExtensionPointOwnerEdge.values()) {
            this.pendingEdgeExtensionPointSyncEdges.add(edge);
        }
        if (this.pendingEdgeExtensionPointSyncEdges.size === 0) {
            return;
        }

        const firstEdge = this.pendingEdgeExtensionPointSyncEdges.values().next().value as Cell | undefined;
        if (firstEdge) {
            this.scheduleEdgeExtensionPointSync(graph, firstEdge);
        }
    }

    private updateEdgeExtensionPointByMouse(graph: Graph, cell: Cell, me: InternalMouseEvent) {
        const ownerEdge = this.edgeExtensionPointOwnerEdge.get(cell);
        if (!ownerEdge?.isEdge()) {
            return;
        }

        graph.getView().validate();
        const state = graph.getView().getState(ownerEdge);
        if (!state) {
            return;
        }

        const mouseGraphPoint = new Point(me.getGraphX(), me.getGraphY());
        const mouseAbsolutePoint = this.getAbsolutePointFromGraphPoint(graph, mouseGraphPoint);
        const pointOnVisiblePath = this.getClosestPointOnVisibleEdgePath(state, mouseAbsolutePoint);
        const relativePoint = graph.getView().getRelativePoint(state, pointOnVisiblePath.x, pointOnVisiblePath.y);

        this.edgeExtensionPointAnchorX.set(cell, relativePoint.x);
        this.setEdgeExtensionPointGeometry(graph, cell, pointOnVisiblePath);
    }

    private addEdgeExtensionPoint(graph: Graph, edge: Cell, state: CellState, nativeEvent: MouseEvent) {
        if (!this.nodeResolver) {
            return;
        }

        const metadata = this.resolveInputLikeMetadataFromEdge(edge, this.nodeResolver);
        if (!metadata) {
            return;
        }

        graph.getView().validate();
        const graphPoint = graph.getPointForEvent(nativeEvent, false);
        const absolutePoint = this.getAbsolutePointFromGraphPoint(graph, graphPoint);
        const pointOnVisiblePath = this.getClosestPointOnVisibleEdgePath(state, absolutePoint);
        const relativePoint = graph.getView().getRelativePoint(state, pointOnVisiblePath.x, pointOnVisiblePath.y);
        const pointOnGraph = this.getGraphPointFromAbsolutePoint(graph, pointOnVisiblePath);
        const id = `edge-extension:${edge.getId() ?? "edge"}:${this.edgeExtensionPointSeq++}`;

        const extensionPoint = graph.insertVertex(
            graph.getDefaultParent(),
            id,
            "",
            pointOnGraph.x - EDGE_EXTENSION_POINT_SIZE / 2,
            pointOnGraph.y - EDGE_EXTENSION_POINT_SIZE / 2,
            EDGE_EXTENSION_POINT_SIZE,
            EDGE_EXTENSION_POINT_SIZE,
            this.edgeExtensionPointStyle,
            false
        );
        this.edgeExtensionPointMetadata.set(extensionPoint, metadata);
        this.edgeExtensionPointOwnerEdge.set(extensionPoint, edge);
        this.edgeExtensionPointAnchorX.set(extensionPoint, relativePoint.x);
        this.snapEdgeExtensionPointToEdge(graph, extensionPoint);
    }

    private snapEdgeExtensionPoints(graph: Graph, edge: Cell) {
        graph.getView().validate();
        for (const [extensionPoint, ownerEdge] of this.edgeExtensionPointOwnerEdge.entries()) {
            if (ownerEdge === edge) {
                this.snapEdgeExtensionPointToEdge(graph, extensionPoint);
            }
        }
    }

    private snapEdgeExtensionPointToEdge(graph: Graph, cell: Cell) {
        const ownerEdge = this.edgeExtensionPointOwnerEdge.get(cell);
        if (!ownerEdge?.isEdge()) {
            return;
        }

        const state = graph.getView().getState(ownerEdge);
        if (!state) {
            return;
        }

        const geometry = cell.getGeometry();
        if (!geometry) {
            return;
        }

        const anchorX = this.edgeExtensionPointAnchorX.get(cell) ?? geometry.x;
        const pointOnVisiblePath = this.getPointOnVisibleEdgePathAtRelativeX(state, anchorX);
        this.setEdgeExtensionPointGeometry(graph, cell, pointOnVisiblePath);
    }

    private setEdgeExtensionPointGeometry(graph: Graph, cell: Cell, absolutePoint: Point) {
        const geometry = cell.getGeometry();
        if (!geometry) {
            return;
        }

        const graphPoint = this.getGraphPointFromAbsolutePoint(graph, absolutePoint);
        const nextGeometry = geometry.clone();
        nextGeometry.x = graphPoint.x - EDGE_EXTENSION_POINT_SIZE / 2;
        nextGeometry.y = graphPoint.y - EDGE_EXTENSION_POINT_SIZE / 2;
        nextGeometry.offset = null;
        graph.getDataModel().setGeometry(cell, nextGeometry);
    }

    private getClosestPointOnVisibleEdgePath(edgeState: CellState, absolutePoint: Point) {
        const points = edgeState.absolutePoints.filter((point): point is Point => point !== null);
        if (points.length === 0) {
            return absolutePoint;
        }
        if (points.length === 1) {
            return points[0].clone();
        }

        const style = edgeState.style as { sc?: 1 | -1 };
        const sc = (style.sc || 1) as 1 | -1;
        let closest = points[0].clone();
        let minDistanceSquared = Number.POSITIVE_INFINITY;

        for (let i = 0; i < points.length - 1; i += 1) {
            const candidates = this.sampleVisibleLinkPath(points[i], points[i + 1], sc);
            for (let j = 0; j < candidates.length - 1; j += 1) {
                const candidate = this.getClosestPointOnLineSegment(candidates[j], candidates[j + 1], absolutePoint);
                const dx = candidate.x - absolutePoint.x;
                const dy = candidate.y - absolutePoint.y;
                const distanceSquared = dx * dx + dy * dy;
                if (distanceSquared < minDistanceSquared) {
                    minDistanceSquared = distanceSquared;
                    closest = candidate;
                }
            }
        }

        return closest;
    }

    private getPointOnVisibleEdgePathAtRelativeX(edgeState: CellState, relativeX: number) {
        const points = edgeState.absolutePoints.filter((point): point is Point => point !== null);
        if (points.length === 0) {
            return new Point();
        }
        if (points.length === 1) {
            return points[0].clone();
        }

        const segments = edgeState.segments ?? [];
        const totalLength = edgeState.length || segments.reduce((sum, segment) => sum + segment, 0);
        if (totalLength === 0) {
            return points[0].clone();
        }

        const targetDistance = Math.max(0, Math.min(totalLength, (relativeX / 2 + 0.5) * totalLength));
        let accumulated = 0;
        let segmentIndex = 0;
        while (segmentIndex < segments.length - 1 && accumulated + segments[segmentIndex] < targetDistance) {
            accumulated += segments[segmentIndex];
            segmentIndex += 1;
        }

        const segmentLength = segments[segmentIndex] || 0;
        const segmentProgress = segmentLength === 0 ? 0 : (targetDistance - accumulated) / segmentLength;
        const style = edgeState.style as { sc?: 1 | -1 };
        const sc = (style.sc || 1) as 1 | -1;
        const visibleSamples = this.sampleVisibleLinkPath(points[segmentIndex], points[segmentIndex + 1], sc);
        return this.getPointOnSampledPath(visibleSamples, segmentProgress);
    }

    private getPointOnSampledPath(samples: Point[], progress: number) {
        if (samples.length === 0) {
            return new Point();
        }
        if (samples.length === 1) {
            return samples[0].clone();
        }

        const segmentLengths: number[] = [];
        let totalLength = 0;
        for (let i = 0; i < samples.length - 1; i += 1) {
            const dx = samples[i + 1].x - samples[i].x;
            const dy = samples[i + 1].y - samples[i].y;
            const length = Math.sqrt(dx * dx + dy * dy);
            segmentLengths.push(length);
            totalLength += length;
        }

        if (totalLength === 0) {
            return samples[0].clone();
        }

        const targetLength = Math.max(0, Math.min(1, progress)) * totalLength;
        let accumulated = 0;
        for (let i = 0; i < segmentLengths.length; i += 1) {
            const nextAccumulated = accumulated + segmentLengths[i];
            if (targetLength <= nextAccumulated) {
                const localProgress = segmentLengths[i] === 0 ? 0 : (targetLength - accumulated) / segmentLengths[i];
                return new Point(
                    samples[i].x + (samples[i + 1].x - samples[i].x) * localProgress,
                    samples[i].y + (samples[i + 1].y - samples[i].y) * localProgress
                );
            }
            accumulated = nextAccumulated;
        }

        return samples[samples.length - 1].clone();
    }

    private getClosestPointOnLineSegment(start: Point, end: Point, point: Point) {
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const lengthSquared = dx * dx + dy * dy;
        if (lengthSquared === 0) {
            return start.clone();
        }

        const t = Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared));
        return new Point(start.x + dx * t, start.y + dy * t);
    }

    private sampleVisibleLinkPath(origin: Point, destination: Point, sc: 1 | -1) {
        const curves = this.getVisibleLinkPathCurves(origin, destination, sc);
        const samples: Point[] = [];
        for (const curve of curves) {
            for (let i = 0; i <= EDGE_EXTENSION_POINT_SAMPLES_PER_CURVE; i += 1) {
                samples.push(this.getCubicBezierPoint(curve[0], curve[1], curve[2], curve[3], i / EDGE_EXTENSION_POINT_SAMPLES_PER_CURVE));
            }
        }
        return samples;
    }

    private getVisibleLinkPathCurves(origin: Point, destination: Point, sc: 1 | -1) {
        const dy = destination.y - origin.y;
        const dx = destination.x - origin.x;
        const nodeWidth = 100;
        const nodeHeight = 30;
        const delta = Math.sqrt(dy * dy + dx * dx);
        let scale = 0.75;
        const scaleY = 0;

        if (dx * sc > 0) {
            if (delta < nodeWidth) {
                scale = 0.75 - 0.75 * ((nodeWidth - delta) / nodeWidth);
            }
            return [[
                origin,
                new Point(origin.x + sc * nodeWidth * scale, origin.y + scaleY * nodeHeight),
                new Point(destination.x - sc * scale * nodeWidth, destination.y - scaleY * nodeHeight),
                destination,
            ]];
        }

        scale = 0.4 - 0.2 * (Math.max(0, nodeWidth - Math.min(Math.abs(dx), Math.abs(dy))) / nodeWidth);
        const midX = Math.floor(destination.x - dx / 2);
        const midY = Math.floor(destination.y - dy / 2);
        if (Math.abs(dy) < 10) {
            const bottomY = Math.max(origin.y, destination.y) + 25;
            const startCurveHeight = bottomY - origin.y;
            const endCurveHeight = bottomY - destination.y;
            const firstCurveEnd = new Point(origin.x + sc * 25, origin.y + startCurveHeight / 2);
            const secondCurveEnd = new Point(origin.x, origin.y + startCurveHeight);
            const lineEnd = new Point(destination.x, origin.y + startCurveHeight);
            const thirdCurveEnd = new Point(destination.x - sc * 25, destination.y + endCurveHeight / 2);
            return [
                [
                    origin,
                    new Point(origin.x + sc * 15, origin.y),
                    new Point(origin.x + sc * 25, origin.y + 5),
                    firstCurveEnd,
                ],
                [
                    firstCurveEnd,
                    new Point(origin.x + sc * 25, origin.y + startCurveHeight - 5),
                    new Point(origin.x + sc * 15, origin.y + startCurveHeight),
                    secondCurveEnd,
                ],
                [
                    secondCurveEnd,
                    secondCurveEnd,
                    lineEnd,
                    lineEnd,
                ],
                [
                    lineEnd,
                    new Point(destination.x - sc * 15, origin.y + startCurveHeight),
                    new Point(destination.x - sc * 25, origin.y + startCurveHeight - 5),
                    thirdCurveEnd,
                ],
                [
                    thirdCurveEnd,
                    new Point(destination.x - sc * 25, destination.y + 5),
                    new Point(destination.x - sc * 15, destination.y),
                    destination,
                ],
            ];
        }

        const cpHeight = nodeHeight / 2;
        const y1 = (destination.y + midY) / 2;
        const topX = origin.x + sc * nodeWidth * scale;
        const topY = dy > 0
            ? Math.min(y1 - dy / 2, origin.y + cpHeight)
            : Math.max(y1 - dy / 2, origin.y - cpHeight);
        const bottomX = destination.x - sc * nodeWidth * scale;
        const bottomY = dy > 0
            ? Math.max(y1, destination.y - cpHeight)
            : Math.min(y1, destination.y + cpHeight);
        const x1 = (origin.x + topX) / 2;
        const scy = dy > 0 ? 1 : -1;
        const cp = [
            new Point(x1, origin.y),
            new Point(topX, dy > 0 ? Math.max(origin.y, topY - cpHeight) : Math.min(origin.y, topY + cpHeight)),
            new Point(x1, dy > 0 ? Math.min(midY, topY + cpHeight) : Math.max(midY, topY - cpHeight)),
            new Point(bottomX, dy > 0 ? Math.max(midY, bottomY - cpHeight) : Math.min(midY, bottomY + cpHeight)),
            new Point((destination.x + bottomX) / 2, destination.y),
        ];

        if (cp[2].y === topY + scy * cpHeight) {
            if (Math.abs(dy) < cpHeight * 10) {
                cp[1].y = topY - scy * cpHeight / 2;
                cp[3].y = bottomY - scy * cpHeight / 2;
            }
            cp[2].x = topX;
        }

        const top = new Point(topX, topY);
        const middle = new Point(midX, midY);
        const bottom = new Point(bottomX, bottomY);
        const first = [origin, cp[0], cp[1], top] as [Point, Point, Point, Point];
        const second = this.createSmoothCurve(top, cp[1], cp[2], middle);
        const third = this.createSmoothCurve(middle, cp[2], cp[3], bottom);
        const fourth = this.createSmoothCurve(bottom, cp[3], cp[4], destination);
        return [first, second, third, fourth];
    }

    private createSmoothCurve(start: Point, previousControl: Point, control: Point, end: Point): [Point, Point, Point, Point] {
        const reflectedControl = new Point(2 * start.x - previousControl.x, 2 * start.y - previousControl.y);
        return [start, reflectedControl, control, end];
    }

    private getCubicBezierPoint(p0: Point, p1: Point, p2: Point, p3: Point, t: number) {
        const mt = 1 - t;
        const mt2 = mt * mt;
        const t2 = t * t;
        return new Point(
            mt2 * mt * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t2 * t * p3.x,
            mt2 * mt * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t2 * t * p3.y
        );
    }

    private getAbsolutePointFromGraphPoint(graph: Graph, graphPoint: Point) {
        const view = graph.getView();
        return new Point((graphPoint.x + view.translate.x) * view.scale, (graphPoint.y + view.translate.y) * view.scale);
    }

    private getGraphPointFromAbsolutePoint(graph: Graph, absolutePoint: Point) {
        const view = graph.getView();
        return new Point(absolutePoint.x / view.scale - view.translate.x, absolutePoint.y / view.scale - view.translate.y);
    }

    private resolveInputLikeMetadataFromEdge(
        edge: Cell,
        getNodeByCell: (cell: Cell) => BaseNode | null
    ): PortConnectionMetadata | null {
        const sourceMetadata = this.resolvePortMetadataFromEdgeTerminal(edge, true, getNodeByCell);
        const targetMetadata = this.resolvePortMetadataFromEdgeTerminal(edge, false, getNodeByCell);
        const inputMetadata =
            sourceMetadata?.direction === "input"
                ? sourceMetadata
                : targetMetadata?.direction === "input"
                    ? targetMetadata
                    : null;

        if (!inputMetadata) {
            return null;
        }

        return {
            nodeId: inputMetadata.nodeId,
            direction: "input",
            type: inputMetadata.type,
        };
    }

    private resolvePortConnectionMetadata(
        cell: Cell | null,
        getNodeByCell: (cell: Cell) => BaseNode | null,
        treatForkCoreAs: "source" | "target" | null = null
    ): PortConnectionMetadata | null {
        if (!cell) {
            return null;
        }
        const extensionPointMetadata = this.edgeExtensionPointMetadata.get(cell);
        if (extensionPointMetadata) {
            return extensionPointMetadata;
        }
        const node = getNodeByCell(cell);
        if (!node) {
            return null;
        }
        const cellId = cell.getId();
        if (!cellId) {
            return null;
        }

        if (node instanceof ForkNode) {
            const forkPortType = node.portType;
            const leftHandleId = `${node.id}:${FORK_LEFT_HANDLE_KEY}`;
            if (cellId === leftHandleId) {
                return { nodeId: node.id, direction: "input", type: forkPortType };
            }
            const rightHandleId = `${node.id}:${FORK_RIGHT_HANDLE_KEY}`;
            if (cellId === rightHandleId) {
                return { nodeId: node.id, direction: "output", type: forkPortType };
            }
            if (cellId === node.id && treatForkCoreAs) {
                return {
                    nodeId: node.id,
                    direction: treatForkCoreAs === "source" ? "output" : "input",
                    type: forkPortType,
                };
            }
        }

        for (const [idx, port] of node.inputs.entries()) {
            const candidateId = `${node.id}:${createInputPortKey(idx, port.name)}`;
            if (cellId === candidateId) {
                return { nodeId: node.id, direction: "input", type: port.type };
            }
        }

        for (const [idx, port] of node.outputs.entries()) {
            const candidateId = `${node.id}:${createOutputPortKey(idx, port.name)}`;
            if (cellId === candidateId) {
                return { nodeId: node.id, direction: "output", type: port.type };
            }
        }

        return null;
    }

    private getDirectionScalarBySourceCell(sourceCell: Cell | null, forkSourceSide?: ForkTriggerSide | null): 1 | -1 {
        if (forkSourceSide) {
            return forkSourceSide === "right" ? -1 : 1;
        }
        if (!sourceCell || !this.nodeResolver) {
            return 1;
        }
        const sourceMetadata = this.resolvePortConnectionMetadata(sourceCell, this.nodeResolver, "source");
        if (!sourceMetadata) {
            return 1;
        }
        // Keep existing default for input; reverse direction for output-start edges.
        return sourceMetadata.direction === "output" ? -1 : 1;
    }

    resolvePortMetadata(cell: Cell | null, getNodeByCell: (cell: Cell) => BaseNode | null) {
        return this.resolvePortConnectionMetadata(cell, getNodeByCell);
    }

    resolvePortMetadataFromEdgeTerminal(
        edge: Cell,
        isSource: boolean,
        getNodeByCell: (cell: Cell) => BaseNode | null
    ) {
        const terminal = edge.getTerminal(isSource);
        const terminalRole: "source" | "target" = isSource ? "source" : "target";
        const metadata = this.resolvePortConnectionMetadata(terminal, getNodeByCell, terminalRole);
        if (metadata) {
            return metadata;
        }
        const forkSide = this.readForkTriggerSideFromEdgeStyle(edge.getStyle(), isSource);
        if (!forkSide) {
            return null;
        }
        const node = terminal ? getNodeByCell(terminal) : null;
        if (!(node instanceof ForkNode)) {
            return null;
        }
        return {
            nodeId: node.id,
            direction: forkSide === "right" ? "output" : "input",
            type: node.portType,
        };
    }

    private resolveForkTriggerByCell(cell: Cell | null): { side: ForkTriggerSide; coreCell: Cell } | null {
        if (!cell) {
            return null;
        }
        const cellId = cell.getId() ?? "";
        if (cellId.endsWith(`:${FORK_LEFT_HANDLE_KEY}`)) {
            const parent = cell.getParent();
            return parent ? { side: "left", coreCell: parent } : null;
        }
        if (cellId.endsWith(`:${FORK_RIGHT_HANDLE_KEY}`)) {
            const parent = cell.getParent();
            return parent ? { side: "right", coreCell: parent } : null;
        }
        return null;
    }

    private readForkTriggerSideFromEdgeStyle(
        style: Record<string, any> | null | undefined,
        isSource: boolean
    ): ForkTriggerSide | null {
        const key = isSource ? FORK_SOURCE_SIDE_STYLE_KEY : FORK_TARGET_SIDE_STYLE_KEY;
        const raw = style?.[key];
        return raw === "left" || raw === "right" ? raw : null;
    }
}
