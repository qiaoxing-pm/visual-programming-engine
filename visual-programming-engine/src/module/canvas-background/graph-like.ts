/**
 * Minimal surface required from a graph engine (e.g. maxGraph `Graph`).
 * Implementations matching this shape can use `CanvasHostBackground` without
 * this folder importing maxGraph.
 */
export type GraphViewLike = {
    scale: number;
    translate: { x: number; y: number };
    addListener: (name: string, funct: (...args: unknown[]) => void) => void;
    removeListener: (funct: (...args: unknown[]) => void) => void;
};

export type GraphLike = {
    getView: () => GraphViewLike;
    addListener: (name: string, funct: (...args: unknown[]) => void) => void;
    removeListener: (funct: (...args: unknown[]) => void) => void;
    setGridSize: (value: number) => void;
    setGridEnabled: (value: boolean) => void;
    useScrollbarsForPanning: boolean;
    setPanning: (enabled: boolean) => void;
    zoomTo: (scale: number, center?: boolean) => void;
    /** maxGraph: preview pan offset in px while dragging; omit if not applicable. */
    getPanDx?: () => number;
    getPanDy?: () => number;
};
