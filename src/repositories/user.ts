import { get, put } from "../api";
import { API_URL } from "../constants";
import { User } from "../types";

let users:{[id:string]:User} = {};
let currentUser: User | null | undefined = undefined;

const getUser = async (id: number) => {
    if (users[id] !== undefined) {
        return users[id];
    }
    const data = await get(API_URL+'users/'+id);
    // TODO error handling
    users[id] = data;
    return data;
};


const getCurrentUser = async() => {
    if (currentUser !== undefined) {
        return currentUser;
    }
    const data = await get(API_URL + 'user');
    if (data['error'] !== undefined) {
      currentUser = null;
    }else {
      currentUser = data;
    }
    if (currentUser === undefined) return null; // TODO remove
    return currentUser;
};

const saveCurrentUser = async(user: User) => {
    const data = await put(API_URL + 'users/'+user.id, user);
    currentUser = user;
    // TODO error check
}

const resetCurrentUser = () => {
    currentUser = null;
};
export {getUser, getCurrentUser, saveCurrentUser, resetCurrentUser};