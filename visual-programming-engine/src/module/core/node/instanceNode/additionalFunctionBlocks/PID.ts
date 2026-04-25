import Node from "../../Node.js";
const PID = new Node('PID', 'PID', {
	x: 360,
	y: 0,
});


PID.addOutput("AUTO", "string");
PID.addOutput("PV", "string");
PID.addOutput("SP", "string");
PID.addOutput("X0", "string");
PID.addOutput("KP", "string");
PID.addOutput("TR", "string");
PID.addOutput("TD", "string");
PID.addOutput("CYCLE", "string");

PID.addInput("XOUT", "string");

export default PID;
