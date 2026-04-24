import Node from "../../Node.js";
const TCP_CONNECT = new Node('TCP_CONNECT', 'TCP_CONNECT');


TCP_CONNECT.addOutput("CONNECT", "string");
TCP_CONNECT.addOutput("IP_ADDRESS", "string");
TCP_CONNECT.addOutput("PORT", "string");
TCP_CONNECT.addInput("SOCKET_ID", "string");


export default TCP_CONNECT;