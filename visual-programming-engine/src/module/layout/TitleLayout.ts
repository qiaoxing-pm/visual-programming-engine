import type BaseNode from "../core/node/BaseNode.js";
import type { CellStyle } from "../packages/maxGraph/core/src/index.js";
import {
    createTitleKey
} from "../renderer/utils/title.js";

export type TitleLayoutItem = {
    key: string;
    name: string;
    x: number;
    y: number;
    width: number;
    height: number;
    offsetX: number;
    offsetY: number;
    relative: boolean;
    style: CellStyle;
};

export default class TitleLayout {
    private readonly titleStyle: CellStyle = {
        shape: "rectangle",
        fillColor: "none",
        strokeColor: "none",
        fontColor: "#fff",
        fontSize: 10,
        align: "center",
        verticalAlign: "middle",
    };

    compute(node: BaseNode): TitleLayoutItem {
        const width = 80;
        const height = 16;
        return {
            key: createTitleKey(`${node.id}-${node.name}`),
            name: node.name,
            x: 0.5,
            y: 0,
            width,
            height,
            offsetX: -width / 2,
            offsetY: -height - 5,
            relative: true,
            style: this.titleStyle,
        };
    }

}
