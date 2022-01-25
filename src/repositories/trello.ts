import { TRELLO_URL } from "../constants";
import { TrelloUser } from "../types";


let locked: {[id:string]: TrelloUser} = {};
let loaded = false;

export const isFileLocked = async (file: string) => {
    if (!loaded) {
        loaded = true;
        const data = await fetch(TRELLO_URL);
        if (data.ok) {
            const json = await data.json();
            for (const card of json) {
                if (card.members.length === 0) {
                    locked[card.name] = {username:'wip', fullName:'', avatarUrl:''};
                } else {
                    locked[card.name] = card.members[0]; // Ignore multiple members
                }
            }
        }
    }

    if (locked[file] !== undefined) {
        return locked[file];
    }
    return undefined;
}