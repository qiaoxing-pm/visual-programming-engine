import { store } from "./store";

const FBD_KEY = "fbd";
const XML_DATA_KEY = "xmlData";

const saveFBD = (fbd: any) => {
    store.set(FBD_KEY, fbd);
}

const getFBD = () => {
    return store.get(FBD_KEY);
}

const removeFBD = () => {
    store.remove(FBD_KEY);
}

const saveXmlData = (xmlData: any) => {
    store.set(XML_DATA_KEY, xmlData);
}

const getXmlData = () => {
    return store.get(XML_DATA_KEY);
}

const removeXmlData = () => {
    store.remove(XML_DATA_KEY);
}

export { saveFBD, getFBD, removeFBD, saveXmlData, getXmlData, removeXmlData };