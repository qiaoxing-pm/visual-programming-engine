export type CanvasHostBackgroundOptions = {
    showGrid: boolean;
    gridSpacing: number;
    snapToGrid: boolean;
    freeCanvas: boolean;
    zoomEnabled: boolean;
    minScale: number;
    maxScale: number;
    zoomStep: number;
};

export const DEFAULT_CANVAS_HOST_BACKGROUND_OPTIONS: CanvasHostBackgroundOptions = {
    showGrid: true,
    gridSpacing: 16,
    snapToGrid: true,
    freeCanvas: true,
    zoomEnabled: true,
    minScale: 0.2,
    maxScale: 2.5,
    zoomStep: 0.15,
};
