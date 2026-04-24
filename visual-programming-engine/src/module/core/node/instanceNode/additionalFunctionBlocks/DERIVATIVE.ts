import Node from "../../Node.js";
const DERIVATIVE = new Node('DERIVATIVE', 'DERIVATIVE');


DERIVATIVE.addOutput("RUN", "string");
DERIVATIVE.addOutput("XIN", "string");
DERIVATIVE.addOutput("CYCLE", "string");

DERIVATIVE.addInput("XOUT", "string");

export default DERIVATIVE;