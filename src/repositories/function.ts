import { get } from "../api";
import { API_URL } from "../constants";
import { User } from "../types";

let functions:{[id:string]:User} = {};

const getFunction = async (id: number) => {
    if (functions[id] !== undefined) {
        return functions[id];
    }
    const data = await get(API_URL+'functions/'+id);
    // TODO error handling
    functions[id] = data;
    return data;
};


export {getFunction};