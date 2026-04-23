import NodeViewModel from "../view-model/NodeViewModel.js";

type NodeState = {
    id: string;
    x: number;
    y: number;
};

let commandContextDepth = 0;

export const runInCommandContext = <T>(runner: () => T): T => {
    commandContextDepth += 1;
    try {
        return runner();
    } finally {
        commandContextDepth -= 1;
    }
};

export const assertNodeMutableByCommand = (action: string) => {
    if (commandContextDepth > 0) {
        return;
    }
    throw new Error(`StateRules violation: "${action}" must run via command execution.`);
};

export const deriveViewModelFromNode = (node: NodeState) => {
    return new NodeViewModel(node.id, node.x, node.y);
};
