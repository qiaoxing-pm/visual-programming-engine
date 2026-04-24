import Node from "../../Node.js";
const INTEGRAL = new Node('INTEGRAL');


INTEGRAL.addOutput("RUN", "string");
INTEGRAL.addOutput("R1", "string");
INTEGRAL.addOutput("XIN", "string");
INTEGRAL.addOutput("X0", "string");
INTEGRAL.addOutput("CYCLE", "string");

INTEGRAL.addInput("Q", "string");
INTEGRAL.addInput("XOUT", "string");

export default INTEGRAL;