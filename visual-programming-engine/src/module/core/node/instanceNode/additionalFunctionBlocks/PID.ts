import Node from "../../Node.js";
const PID = new Node('PID', 'PID', {
	x: 360,
	y: 0,
});


PID.addInput("AUTO", "string");
PID.addInput("PV", "string");
PID.addInput("SP", "string");
PID.addInput("X0", "string");
PID.addInput("KP", "string");
PID.addInput("TR", "string");
PID.addInput("TD", "string");
PID.addInput("CYCLE", "string");

PID.addOutput("XOUT", "string");

export default PID;
