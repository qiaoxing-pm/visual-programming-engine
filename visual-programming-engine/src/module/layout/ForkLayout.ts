import ForkNode from "../core/node/ForkNode.js";

export const FORK_LEFT_HANDLE_KEY = "fork:left";
export const FORK_RIGHT_HANDLE_KEY = "fork:right";

export type ForkNodeFrame = {
    width: number;
    height: number;
};

export type ForkHandleLayoutItem = {
    key: string;
    x: number;
    y: number;
    width: number;
    height: number;
    relative: boolean;
};

export default class ForkLayout {
    private readonly nodeWidth = 6;
    private readonly nodeHeight = 6;
    private readonly handleSize = 5;

    private readonly leftHandleX = -0.82;
    private readonly rightHandleX = 1.05;
    private readonly handleY = 0.1;

    computeNodeFrame(_node: ForkNode): ForkNodeFrame {
        return {
            width: this.nodeWidth,
            height: this.nodeHeight,
        };
    }

    computeHandles(_node: ForkNode): ForkHandleLayoutItem[] {
        return [
            {
                key: FORK_LEFT_HANDLE_KEY,
                x: this.leftHandleX,
                y: this.handleY,
                width: this.handleSize,
                height: this.handleSize,
                relative: true,
            },
            {
                key: FORK_RIGHT_HANDLE_KEY,
                x: this.rightHandleX,
                y: this.handleY,
                width: this.handleSize,
                height: this.handleSize,
                relative: true,
            },
        ];
    }
}
