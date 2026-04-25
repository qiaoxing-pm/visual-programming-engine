import {
    CANVAS_HOST_GRAPH_EVENTS,
    CANVAS_HOST_GRAPH_VIEW_EVENTS,
} from "./events.js";
import type { GraphLike } from "./graph-like.js";
import { resolveCanvasHostBackgroundStyles } from "./resolve-host-background-styles.js";
import {
    DEFAULT_CANVAS_HOST_BACKGROUND_OPTIONS,
    type CanvasHostBackgroundOptions,
} from "./types.js";

function mergeOptions(
    partial?: Partial<CanvasHostBackgroundOptions>
): CanvasHostBackgroundOptions {
    return {
        ...DEFAULT_CANVAS_HOST_BACKGROUND_OPTIONS,
        ...partial,
    };
}

function applyStylesToHost(
    host: HTMLElement,
    styles: ReturnType<typeof resolveCanvasHostBackgroundStyles>
) {
    host.style.backgroundColor = styles.backgroundColor;
    host.style.boxShadow = styles.boxShadow;
    host.style.backgroundImage = styles.backgroundImage;
    host.style.backgroundSize = styles.backgroundSize;
    host.style.backgroundPosition = styles.backgroundPosition;
}

/**
 * Binds grid / snap / free-canvas / wheel-zoom behavior to a DOM host and a {@link GraphLike} engine.
 * No React or other UI framework dependency; copy the `canvas-background` folder into another project.
 */
export class CanvasHostBackground {
    private graph: GraphLike | null = null;
    private host: HTMLElement | null = null;
    private options: CanvasHostBackgroundOptions = DEFAULT_CANVAS_HOST_BACKGROUND_OPTIONS;
    private wheelHandler: ((event: WheelEvent) => void) | null = null;
    private transformRefreshHandler: (() => void) | null = null;

    bind(graph: GraphLike, host: HTMLElement, options?: Partial<CanvasHostBackgroundOptions>) {
        this.disposeListeners();
        this.graph = graph;
        this.host = host;
        this.options = mergeOptions(options);

        this.applyGraphConfig();
        this.paintHost();
        this.registerGraphEvents();
        this.registerWheelZoom();
    }

    dispose() {
        this.disposeListeners();
        this.graph = null;
        this.host = null;
    }

    private disposeListeners() {
        if (this.graph && this.transformRefreshHandler) {
            const view = this.graph.getView();
            view.removeListener(this.transformRefreshHandler);
            this.graph.removeListener(this.transformRefreshHandler);
            this.transformRefreshHandler = null;
        }
        if (this.host && this.wheelHandler) {
            this.host.removeEventListener("wheel", this.wheelHandler);
        }
        this.wheelHandler = null;
    }

    private applyGraphConfig() {
        if (!this.graph || !this.host) {
            return;
        }
        const spacing = Math.max(4, this.options.gridSpacing);
        this.graph.setGridSize(spacing);
        this.graph.setGridEnabled(this.options.snapToGrid);

        if (this.options.freeCanvas) {
            this.host.style.overflow = "hidden";
            this.graph.useScrollbarsForPanning = false;
            this.graph.setPanning(true);
        }
    }

    private registerGraphEvents() {
        if (!this.graph) {
            return;
        }
        const refresh = () => this.paintHost();
        this.transformRefreshHandler = refresh;
        const view = this.graph.getView();
        view.addListener(CANVAS_HOST_GRAPH_VIEW_EVENTS.scale, refresh);
        view.addListener(CANVAS_HOST_GRAPH_VIEW_EVENTS.translate, refresh);
        view.addListener(CANVAS_HOST_GRAPH_VIEW_EVENTS.scaleAndTranslate, refresh);
        this.graph.addListener(CANVAS_HOST_GRAPH_EVENTS.pan, refresh);
    }

    private registerWheelZoom() {
        if (!this.graph || !this.host || !this.options.zoomEnabled) {
            return;
        }
        this.wheelHandler = (event) => {
            if (!this.graph) {
                return;
            }
            event.preventDefault();
            const current = this.graph.getView().scale;
            const factor =
                event.deltaY < 0 ? 1 + this.options.zoomStep : 1 / (1 + this.options.zoomStep);
            const next = Math.max(
                this.options.minScale,
                Math.min(this.options.maxScale, current * factor)
            );
            this.graph.zoomTo(next, false);
            this.paintHost();
        };
        this.host.addEventListener("wheel", this.wheelHandler, { passive: false });
    }

    /**
     * Re-applies host background (grid position/size and theme CSS values).
     * Call after color theme changes if the host does not update automatically.
     */
    repaint(): void {
        this.paintHost();
    }

    private paintHost() {
        if (!this.graph || !this.host) {
            return;
        }
        const view = this.graph.getView();
        const styles = resolveCanvasHostBackgroundStyles(this.options, {
            scale: view.scale,
            translateX: view.translate.x,
            translateY: view.translate.y,
            panPreviewX: this.graph.getPanDx?.() ?? 0,
            panPreviewY: this.graph.getPanDy?.() ?? 0,
        });
        applyStylesToHost(this.host, styles);
    }
}
