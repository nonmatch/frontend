
export interface Project {
    id: number,
    name: string
}


export interface Func {
    id: number,
    projectId: number, // TODO remove
    name: string,
    file: string,
    cCode?: string, // TODO remove
    asmCode?: string, // TODO remove
    score?: number // TODO remove
    size: number
}

export interface User {
    id: number,
    name: string, // TODO remove
    username: string,
    email: string,
    avatar: string,
    points: number // TODO remove
}

export interface Submission {
    id: number,
    code: string,
    owner: number,
    function: number,
    score: number,
    is_equivalent: boolean,
    parent: number,
}

export interface ErrorLine {
    text: string,
    tag?: {
        text: string,
        line: number,
        column?: number
    }
}