import Node from "../../Node.js";
const RTC = new Node('RTC');


RTC.addOutput("IN", "string");
RTC.addOutput("PDT", "string");


RTC.addInput("Q", "string");
RTC.addInput("CDT", "string");


export default RTC;