export default class LogNode {
    id = "log";
    name = "Log1";
    message: string;

    constructor(message: string) {
        this.message = message;
    }

    async execute() {
        console.log(this.message);
    }
}