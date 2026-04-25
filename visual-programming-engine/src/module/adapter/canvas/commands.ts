import type BaseNode from "../../core/node/BaseNode.js";

export type PatchNodePositionCommand = {
    type: "patch_node_position";
    nodeId: string;
    patch: {
        x?: number;
        y?: number;
    };
};

export type PatchNodeNameCommand = {
    type: "patch_node_name";
    nodeId: string;
    name: string;
};

export type CreateNodeCommand = {
    type: "create_node";
    node: BaseNode;
};

export type RemoveNodeCommand = {
    type: "remove_node";
    nodeId: string;
};

export type MountNodeCommand = {
    type: "mount_node";
    nodeId: string;
};

export type CanvasCommand =
    | PatchNodePositionCommand
    | PatchNodeNameCommand
    | CreateNodeCommand
    | RemoveNodeCommand
    | MountNodeCommand;

export const patchNodePosition = (
    nodeId: string,
    patch: { x?: number; y?: number }
): PatchNodePositionCommand => ({
    type: "patch_node_position",
    nodeId,
    patch,
});

export const patchNodeName = (nodeId: string, name: string): PatchNodeNameCommand => ({
    type: "patch_node_name",
    nodeId,
    name,
});

export const createNode = (node: BaseNode): CreateNodeCommand => ({
    type: "create_node",
    node,
});

export const removeNode = (nodeId: string): RemoveNodeCommand => ({
    type: "remove_node",
    nodeId,
});

export const mountNode = (nodeId: string): MountNodeCommand => ({
    type: "mount_node",
    nodeId,
});
