import { get } from "../api";
import { API_URL } from "../constants";
import { User } from "../types";

let users:{[id:string]:User} = {};

const getUser = async (id: number) => {
    if (users[id] !== undefined) {
        return users[id];
    }
    const data = await get(API_URL+'user/'+id);
    // TODO error handling
    users[id] = data;
    return data;
};


export {getUser};