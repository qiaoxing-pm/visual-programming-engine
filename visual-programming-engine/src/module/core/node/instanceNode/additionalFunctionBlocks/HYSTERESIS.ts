import Node from "../../Node.js";
const HYSTERESIS = new Node('HYSTERESIS');


HYSTERESIS.addOutput("XIN1", "string");
HYSTERESIS.addOutput("XIN2", "string");
HYSTERESIS.addOutput("EPS", "string");

HYSTERESIS.addInput("Q", "string");

export default HYSTERESIS;