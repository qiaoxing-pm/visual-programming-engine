export const createTitleKey = (nodeId: string) => `title:${nodeId}`;
export const isTitleCellId = (cellId: string | null | undefined) =>
    typeof cellId === "string" && cellId.includes(":title:");