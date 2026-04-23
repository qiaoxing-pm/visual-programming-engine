import StartNode from "./StartNode";

export default async function run(start: StartNode) {
    let current: any = start;

    while (current) {
        await current.execute();
        current = current.next;
    }

}