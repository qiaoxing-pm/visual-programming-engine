import StartNode from "./StartNode";
import LogNode from "./LogNode";
import run from "./run";
const start = new StartNode();
const log = new LogNode("Hello, world!");

start.next = log;

run(start);