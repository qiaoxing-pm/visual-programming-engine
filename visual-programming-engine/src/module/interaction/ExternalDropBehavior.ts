import type { Graph } from "../packages/maxGraph/core/src/index.js";

export type ExternalDropPoint = {
    x: number;
    y: number;
};

type ExternalDropOptions = {
    mimeType: string;
    onDragStateChange?: (isDraggingOver: boolean) => void;
    onDrop: (payload: string, point: ExternalDropPoint) => void;
};

export default class ExternalDropBehavior {
    private boundHost: HTMLElement | null = null;
    private dragDepth = 0;
    private dragEnterHandler: ((evt: DragEvent) => void) | null = null;
    private dragOverHandler: ((evt: DragEvent) => void) | null = null;
    private dragLeaveHandler: ((evt: DragEvent) => void) | null = null;
    private dropHandler: ((evt: DragEvent) => void) | null = null;

    bind(host: HTMLElement, graph: Graph, options: ExternalDropOptions) {
        this.dispose();
        const { mimeType, onDragStateChange, onDrop } = options;
        const hasMime = (evt: DragEvent) => evt.dataTransfer?.types.includes(mimeType) ?? false;

        this.dragEnterHandler = (evt) => {
            if (!hasMime(evt)) {
                return;
            }
            this.dragDepth += 1;
            if (this.dragDepth === 1) {
                onDragStateChange?.(true);
            }
        };

        this.dragOverHandler = (evt) => {
            
            if (!hasMime(evt)) {
                return;
            }
            evt.preventDefault();
            if (evt.dataTransfer) {
                evt.dataTransfer.dropEffect = "copy";
            }
        };

        this.dragLeaveHandler = (evt) => {
            console.log(evt);
            if (!hasMime(evt)) {
                return;
            }
            this.dragDepth = Math.max(0, this.dragDepth - 1);
            if (this.dragDepth === 0) {
                onDragStateChange?.(false);
            }
        };

        this.dropHandler = (evt) => {
            console.log(evt);
            if (!hasMime(evt)) {
                return;
            }
            evt.preventDefault();
            this.dragDepth = 0;
            onDragStateChange?.(false);
            const payload = evt.dataTransfer?.getData(mimeType) ?? "";
            if (!payload) {
                return;
            }
            const point = graph.getPointForEvent(evt);
            onDrop(payload, { x: point.x, y: point.y });
        };

        host.addEventListener("dragenter", this.dragEnterHandler);
        host.addEventListener("dragover", this.dragOverHandler);
        host.addEventListener("dragleave", this.dragLeaveHandler);
        host.addEventListener("drop", this.dropHandler);
        this.boundHost = host;
    }

    dispose() {
        if (!this.boundHost) {
            return;
        }
        if (this.dragEnterHandler) {
            this.boundHost.removeEventListener("dragenter", this.dragEnterHandler);
        }
        if (this.dragOverHandler) {
            this.boundHost.removeEventListener("dragover", this.dragOverHandler);
        }
        if (this.dragLeaveHandler) {
            this.boundHost.removeEventListener("dragleave", this.dragLeaveHandler);
        }
        if (this.dropHandler) {
            this.boundHost.removeEventListener("drop", this.dropHandler);
        }
        this.dragDepth = 0;
        this.boundHost = null;
        this.dragEnterHandler = null;
        this.dragOverHandler = null;
        this.dragLeaveHandler = null;
        this.dropHandler = null;
    }
}
