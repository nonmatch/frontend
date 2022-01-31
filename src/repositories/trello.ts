import { TRELLO_URL } from "../constants";
import { TrelloUser } from "../types";


let locked: { [id: string]: TrelloUser } = {};
let loaded = false;

export const isFileLocked = (file: string) => {
    if (!loaded) {
        loaded = true;
        fetch(TRELLO_URL).then(async (data) => {
            if (data.ok) {
                const json = await data.json();
                for (const card of json) {
                    if (card.members.length === 0) {
                        locked[card.name] = { username: 'wip', fullName: '', avatarUrl: '' };
                    } else {
                        locked[card.name] = card.members[0]; // Ignore multiple members
                    }
                }
            }
        }, error => console.error(error));
    }

    if (locked[file] !== undefined) {
        return locked[file];
    }
    return undefined;
}