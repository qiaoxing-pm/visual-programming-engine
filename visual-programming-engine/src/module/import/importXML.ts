export type ExtractedXML = {
  rootName: string;
  fields: Record<string, string | string[]>;
  text: string;
};

export type XMLObjectValue =
  | string
  | XMLObject
  | Array<string | XMLObject>;

export type XMLObject = {
  [key: string]: XMLObjectValue;
};

export function readXMLFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("XML 文件读取失败"));
    reader.readAsText(file, "utf-8");
  });
}

export function parseXML(xmlText: string): Document {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, "application/xml");
  const parserError = xmlDoc.querySelector("parsererror");

  if (parserError) {
    throw new Error("XML 格式不正确");
  }

  return xmlDoc;
}

export function extractXMLData(xmlDoc: Document): ExtractedXML {
  const root = xmlDoc.documentElement;
  if (!root) {
    throw new Error("XML 缺少根节点");
  }

  const fields: Record<string, string | string[]> = {};
  Array.from(root.children).forEach((node) => {
    const key = node.tagName;
    const value = node.textContent?.trim() ?? "";
    const current = fields[key];
    if (current === undefined) {
      fields[key] = value;
      return;
    }
    fields[key] = Array.isArray(current) ? [...current, value] : [current, value];
  });

  return {
    rootName: root.tagName,
    fields,
    text: root.textContent?.trim() ?? "",
  };
}

function convertElementToObject(element: Element): XMLObject | string {
  const attributes = Array.from(element.attributes);
  const childElements = Array.from(element.children);
  const textNodes = Array.from(element.childNodes).filter(
    (node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim(),
  );
  const textContent = textNodes.map((node) => node.textContent?.trim() ?? "").join(" ");

  if (attributes.length === 0 && childElements.length === 0) {
    return textContent;
  }

  const result: XMLObject = {};

  attributes.forEach((attr) => {
    result[attr.name] = attr.value;
  });

  childElements.forEach((child) => {
    const key = child.tagName;
    const value = convertElementToObject(child);
    const current = result[key];

    if (current === undefined) {
      result[key] = value;
      return;
    }

    if (Array.isArray(current)) {
      current.push(value);
      return;
    }

    result[key] = [current, value];
  });

  if (textContent && childElements.length > 0 && Object.keys(result).length === 0) {
    result.text = textContent;
  }

  return result;
}

export function xmlToObject(xmlDoc: Document): XMLObject {
  const root = xmlDoc.documentElement;
  if (!root) {
    throw new Error("XML 缺少根节点");
  }

  const converted = convertElementToObject(root);
  if (typeof converted === "string") {
    return { text: converted };
  }
  return converted;
}
  