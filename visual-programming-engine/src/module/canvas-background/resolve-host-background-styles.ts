import type { CanvasHostBackgroundOptions } from "./types.js";
import {
    vscodeCanvasDotGridBackgroundImage,
    vscodeCanvasHostInsetShadow,
    vscodeEditorBackground,
} from "../theme/vscodeCssColors.js";

export type CanvasViewTransform = {
    scale: number;
    translateX: number;
    translateY: number;
    /**
     * Screen-space pan preview offset (e.g. maxGraph `panGraph` while dragging).
     * Omitted or 0 when the engine has already committed translate.
     */
    panPreviewX?: number;
    panPreviewY?: number;
};

export type ResolvedHostBackgroundStyles = {
    backgroundColor: string;
    boxShadow: string;
    backgroundImage: string;
    backgroundSize: string;
    backgroundPosition: string;
};

/**
 * Pixel distance between visual grid dots on screen.
 * When zoomed out, `snapSpacing * scale` becomes tiny; this widens to at least `minPixelSpacing`
 * by showing every N-th snap line (N integer), so dots stay aligned with real snap points.
 */
export function computeVisualGridSpacingPx(
    snapGridSpacing: number,
    scale: number,
    minPixelSpacing: number
): number {
    const S = Math.max(1e-9, snapGridSpacing);
    const sc = Math.max(1e-9, scale);
    const cellPx = S * sc;
    const min = Math.max(2, minPixelSpacing);
    if (cellPx >= min) {
        return cellPx;
    }
    const n = Math.ceil(min / cellPx);
    return n * cellPx;
}

/**
 * Pure: from logical grid spacing + view transform, produce CSS values for a host element.
 * Safe to use outside maxGraph (e.g. custom WebGL/SVG canvas) if you supply the same numbers.
 */
export function resolveCanvasHostBackgroundStyles(
    options: Pick<
        CanvasHostBackgroundOptions,
        "showGrid" | "gridSpacing" | "visualGridMinPixelSpacing"
    >,
    view: CanvasViewTransform
): ResolvedHostBackgroundStyles {
    const base: ResolvedHostBackgroundStyles = {
        backgroundColor: vscodeEditorBackground,
        boxShadow: vscodeCanvasHostInsetShadow,
        backgroundImage: "none",
        backgroundSize: "0px 0px",
        backgroundPosition: "0px 0px",
    };

    if (!options.showGrid) {
        return base;
    }

    const snap = Math.max(2, options.gridSpacing);
    const minPx = options.visualGridMinPixelSpacing ?? 14;
    const gridSize = computeVisualGridSpacingPx(snap, view.scale, minPx);
    const px = view.panPreviewX ?? 0;
    const py = view.panPreviewY ?? 0;
    const x = view.translateX * view.scale + px;
    const y = view.translateY * view.scale + py;

    return {
        ...base,
        backgroundImage: vscodeCanvasDotGridBackgroundImage,
        backgroundSize: `${gridSize}px ${gridSize}px`,
        backgroundPosition: `${x}px ${y}px`,
    };
}
