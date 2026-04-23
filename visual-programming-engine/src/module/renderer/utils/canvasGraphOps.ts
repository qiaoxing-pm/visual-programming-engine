import type { Cell, Graph } from "../../packages/maxGraph/core/src/index.js";

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
