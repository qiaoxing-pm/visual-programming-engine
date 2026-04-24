import type BaseNode from "../core/node/BaseNode.js";
import type { Cell } from "../packages/maxGraph/core/src/index.js";

export type SceneState = {
    nodeCellMap: Map<string, Cell>;
    cellNodeMap: Map<Cell, BaseNode>;
    nodePortCellMap: Map<string, Map<string, Cell>>;
    nodeTitleCellMap: Map<string, Map<string, Cell>>;
};

export function createSceneState(): SceneState {
    return {
        nodeCellMap: new Map<string, Cell>(),
        cellNodeMap: new Map<Cell, BaseNode>(),
        nodePortCellMap: new Map<string, Map<string, Cell>>(),
        nodeTitleCellMap: new Map<string, Map<string, Cell>>(),
    };
}
