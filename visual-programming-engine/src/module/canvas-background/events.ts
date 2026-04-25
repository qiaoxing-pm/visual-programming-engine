/**
 * Event names aligned with maxGraph `InternalEvent` on `Graph` / `GraphView`.
 * Plain strings so this module does not import maxGraph.
 */
export const CANVAS_HOST_GRAPH_VIEW_EVENTS = {
    scale: "scale",
    translate: "translate",
    scaleAndTranslate: "scaleAndTranslate",
} as const;

export const CANVAS_HOST_GRAPH_EVENTS = {
    pan: "pan",
} as const;
