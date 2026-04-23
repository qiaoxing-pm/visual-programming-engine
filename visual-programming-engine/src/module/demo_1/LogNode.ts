export default class LogNode {
    id = "log";

    message: string;

    constructor(message: string) {
        this.message = message;
    }

    async execute() {
        console.log(this.message);
    }
}