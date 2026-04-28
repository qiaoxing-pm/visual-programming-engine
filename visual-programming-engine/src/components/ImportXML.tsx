import { type ChangeEvent, useRef } from "react";
import { parseXML, readXMLFile, xmlToObject } from "../module/import/importXML";

function ImportXML() {
    const inputRef = useRef<HTMLInputElement | null>(null);

    const importXml = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const xmlText = await readXMLFile(file);
            const xmlDoc = parseXML(xmlText);
            const result = xmlToObject(xmlDoc);

            // TODO: Replace with graph import logic when schema is confirmed.
            console.log("XML import result:", result.types.pous.pou[6].body.FBD);
        } catch (error) {
            console.error("XML import failed:", error);
        } finally {
            // Allow selecting the same file again.
            e.target.value = "";
        }
    };

    return (
        <button
            type="button"
            onClick={() => {
                const current = inputRef.current;
                if (current) {
                    current.click();
                }
            }}
            className="left-toolbar__action left-toolbar__action--draggable"
        >
            <input
                onChange={importXml}
                type="file"
                accept=".xml,text/xml,application/xml"
                ref={inputRef}
                className="input-file"
            />
            <span>载入</span>
        </button>
    );
}

export default ImportXML;