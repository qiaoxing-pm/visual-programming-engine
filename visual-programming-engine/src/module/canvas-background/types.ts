export type CanvasHostBackgroundOptions = {
    showGrid: boolean;
    gridSpacing: number;
    /**
     * Visual only: minimum distance in CSS pixels between grid dots when zoomed out.
     * Snap still uses `gridSpacing` in graph coordinates; dots align every N-th snap line.
     * @default 14
     */
    visualGridMinPixelSpacing?: number;
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
    visualGridMinPixelSpacing: 14,
    snapToGrid: true,
    freeCanvas: true,
    zoomEnabled: true,
    minScale: 0.2,
    maxScale: 2.5,
    zoomStep: 0.15,
};
