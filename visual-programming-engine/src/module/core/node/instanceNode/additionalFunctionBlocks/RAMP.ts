import Node from "../../Node.js";
const RAMP = new Node('RAMP');


RAMP.addOutput("RUN", "string");
RAMP.addOutput("X0", "string");
RAMP.addOutput("X1", "string");
RAMP.addOutput("TR", "string");
RAMP.addOutput("CYCLE", "string");

RAMP.addInput("BUSY", "string");
RAMP.addInput("XOUT", "string");


export default RAMP;