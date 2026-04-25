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
 * Pure: from logical grid spacing + view transform, produce CSS values for a host element.
 * Safe to use outside maxGraph (e.g. custom WebGL/SVG canvas) if you supply the same numbers.
 */
export function resolveCanvasHostBackgroundStyles(
    options: Pick<CanvasHostBackgroundOptions, "showGrid" | "gridSpacing">,
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

    // const gridSize = Math.max(2, options.gridSpacing) * view.scale;
    // const x = view.translateX * view.scale;
    // const y = view.translateY * view.scale;
    const gridSize = Math.max(2, options.gridSpacing) * view.scale;
    // const x = view.translateX * view.scale;
    // const y = view.translateY * view.scale;
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
