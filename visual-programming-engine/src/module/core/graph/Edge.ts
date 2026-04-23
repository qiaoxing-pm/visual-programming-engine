import type { InputPort, OutputPort } from "../port/Port.js";

class Edge {

    from: OutputPort;
    to: InputPort;

    constructor(
        from: OutputPort,
        to: InputPort
    ) {
        this.from = from;
        this.to = to;
    }

    validate() {
        if (this.to.type !== 'any' && this.from.type !== this.to.type) {
            throw new Error(
                `Type mismatch: ${this.from.type} -> ${this.to.type}`
            );
        }
    }
}

export default Edge;