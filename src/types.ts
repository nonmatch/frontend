
export interface Project {
    id: number,
    name: string
}


export interface Func {
    id: number,
    name: string,
    file: string,
    size: number,
    best_score: number,
    lockedByName?: string,
    locked?: TrelloUser,
    decomp_me_scratch?: string,
    decomp_me_matched: boolean
}

export interface User {
    id: number,
    username: string,
    email: string,
    avatar: string,
}

export interface Submission {
    id: number,
    code: string,
    owner: number,
    ownerName?: string,
    function: number,
    score: number,
    is_equivalent: boolean,
    parent: number,
    time_created: string
}

export interface ErrorLine {
    text: string,
    tag?: {
        text: string,
        line: number,
        column?: number
    }
}

export interface AsmLine {
    text: string,
    source?: {
        file?: string,
        line: number
    }
}

export interface TrelloUser {
    username: string,
    fullName: string,
    avatarUrl: string
}