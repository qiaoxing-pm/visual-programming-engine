import type { CellStyle } from "../packages/maxGraph/core/src/index.js";

const cssVariableColorPattern = /^var\(\s*(--[^,\s)]+)\s*(?:,\s*(.+))?\)$/;

export function resolveCssColor(host: HTMLElement | null | undefined, color: unknown): unknown {
	if (typeof color !== "string") {
		return color;
	}

	const match = cssVariableColorPattern.exec(color.trim());
	if (!match) {
		return color;
	}

	const [, variableName, fallback] = match;
	const view = host?.ownerDocument.defaultView;
	const resolved = host && view
		? view.getComputedStyle(host).getPropertyValue(variableName).trim()
		: "";

	return resolved || fallback?.trim() || color;
}

export function resolveCellStyleCssColors(
	host: HTMLElement | null | undefined,
	style: CellStyle
): CellStyle {
	return {
		...style,
		fillColor: resolveCssColor(host, style.fillColor) as CellStyle["fillColor"],
		fontColor: resolveCssColor(host, style.fontColor) as CellStyle["fontColor"],
		strokeColor: resolveCssColor(host, style.strokeColor) as CellStyle["strokeColor"],
	};
}
