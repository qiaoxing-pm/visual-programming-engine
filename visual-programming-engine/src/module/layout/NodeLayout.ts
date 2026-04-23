import type BaseNode from "../core/node/BaseNode.js";
import { deriveViewModelFromNode } from "../state/StateRules.js";

const DEFAULT_START_X = 40;
const DEFAULT_START_Y = 40;
const DEFAULT_GAP_X = 220;

export const applyDefaultNodePosition = (node: BaseNode) => {
    if (node.hasLayoutPosition) {
        return;
    }
    const x = DEFAULT_START_X + node.index * DEFAULT_GAP_X;
    node.applyPositionPatch({ x, y: DEFAULT_START_Y });
};

export const deriveNodeViewModel = (node: BaseNode) => {
    return deriveViewModelFromNode(node);
};
