export default class NodeViewModel {

    readonly id: string;
    readonly x: number;
    readonly y: number;

    constructor(id: string, x = 0, y = 0) {
        this.id = id;
        this.x = x;
        this.y = y;
    }
}