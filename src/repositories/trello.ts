import { TRELLO_STATUS_URL, TRELLO_URL } from "../constants";
import { TrelloUser } from "../types";


let locked: { [id: string]: TrelloUser } = {};
let loaded = false;

export const isFileLocked = async (file: string) => {
    if (!loaded) {
        loaded = true;
        try {
            const data = await fetch(TRELLO_URL);
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
        } catch(error) {
            console.error(error);
        }
    }

    if (locked[file] !== undefined) {
        return locked[file];
    }
    return undefined;
}

export const getStatusFromTrello = async () => {
    const data = await fetch(TRELLO_STATUS_URL);
    if (data.ok) {
        const json = await data.json();
        if (json.length == 0) {
            return 'The backend could not be reached.';
        }
        if (json[0].desc == '') {
            return json[0].name;
        } else {
            return json[0].name + '\n' + json[0].desc;
        }
    } else {
        throw Error('http error');
    }
}