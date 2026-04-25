/*---------------------------------------------------------------------------------------------
 * String tokens for maxgraph cell styles and canvas host CSS when embedded in VS Code.
 * No platform imports — safe to keep if this folder is copied elsewhere.
 *--------------------------------------------------------------------------------------------*/

/** Editor surface (canvas host background). */
export const vscodeEditorBackground = "var(--vscode-editor-background,#0b0f15)";

/** Primary text / outlines on editor surface. */
export const vscodeEditorForeground = "var(--vscode-editor-foreground,#fff)";

/** Raised UI (function blocks) distinct from editor background. */
export const vscodeEditorWidgetBackground = "var(--vscode-editorWidget-background, #2e3038)";

/** Borders around widgets / ports. */
export const vscodeEditorWidgetBorder = "var(--vscode-editor-foreground,white)";

/** Inset frame on the canvas host (replaces fixed rgba border). */
export const vscodeCanvasHostInsetShadow =
	"inset 0 0 0 1px rgba(255, 255, 255, 0.1)";

/**
 * Dot grid for canvas background; uses color-mix so it tracks editor foreground token.
 * 
 * "radial-gradient(circle, rgba(148, 163, 184, 0.35) 1px, transparent 1.1px)"
 */
export const vscodeCanvasDotGridBackgroundImage = 
	"radial-gradient(circle, color-mix(in srgb, var(--vscode-editor-foreground,rgba(148, 163, 184, 0.35)) 32%, transparent) 1px, transparent 1.1px)";
