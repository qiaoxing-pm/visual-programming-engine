import type BaseNode from "../../core/node/BaseNode";

export default class StartNode {
    id = 'start';

    next: BaseNode | null = null;

    async execute() {
        // if (this.next) {
        //     await this.next.execute();
        // }
        return;
    }
}