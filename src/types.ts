
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
    decomp_me_matched: boolean,
    compile_flags?: string,
    is_asm_func: boolean,
    has_equivalent_try: boolean
    is_fakematch: boolean
    best_fakeness_score: number
    comments?: string[]
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
    time_created: string,
    fakeness_score: number,
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

export interface Comment {
    line: number,
    text: string
}

export interface Pr {
    id: number,
    title: string,
    text: string,
    functions: string,
    creator: number,
    time_created: string,
    time_updated: string,
    url?: string,
    is_submitted: boolean,
    is_error: boolean,
    error?: string
}

export interface Stage {
    name: string;
    path: string;
}

export enum Sources {
    FromCode,
    FromAsm,
    FromDump
}

export interface FakenessLine {
    text: string;
    line: number;
}

export interface FunctionComment {
    id: number,
    text: string,
    user: number,
    userName?: string,
    function: number,
}