import type { Cell, Graph } from "../../packages/maxGraph/core/src/index.js";
import BaseNode from '../../core/node/BaseNode.js';
import type { CellStyle } from "../../packages/maxGraph/core/src/index.js";

export const updateCellPosition = (graph: Graph, cell: Cell, x: number, y: number) => {
    const geometry = cell.getGeometry();
    if (!geometry) {
        return;
    }
    const nextGeometry = geometry.clone();
    nextGeometry.x = x;
    nextGeometry.y = y;
    graph.getDataModel().setGeometry(cell, nextGeometry);
};

export const updateCellValue = (graph: Graph, cell: Cell, value: string) => {
    if (cell.getValue() === value) {
        return;
    }
    graph.getDataModel().setValue(cell, value);
};

type NodeSize = {
    width: number;
    height: number;
};

const NODE_WIDTH = 100;
const HEADER_HEIGHT = 24;
const PORT_ROW_HEIGHT = 24;
const VERTICAL_PADDING = 0;

export const getNodeWidthAndHeight = (node: BaseNode): NodeSize => {
    const inputCount = node.inputs.length;
    const outputCount = node.outputs.length;

    // 行数取最大值（保证左右对齐）
    const rowCount = Math.max(inputCount, outputCount);

    const height =
        HEADER_HEIGHT +
        rowCount * PORT_ROW_HEIGHT +
        VERTICAL_PADDING * 2;

    return {
        width: NODE_WIDTH,
        height,
    };
};


export const updateCellStyle = (graph: Graph, cell: Cell, style: CellStyle) => {
    const currentStyle = cell.getStyle();
    if (
        currentStyle.fillColor === style.fillColor &&
        currentStyle.fontColor === style.fontColor &&
        currentStyle.strokeColor === style.strokeColor
    ) {
        return;
    }

    graph.getDataModel().setStyle(cell, {
        ...currentStyle,
        fillColor: style.fillColor,
        fontColor: style.fontColor,
        strokeColor: style.strokeColor,
    });
};