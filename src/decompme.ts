import { API_URL, DECOMP_ME_BACKEND, DECOMP_ME_FRONTEND} from "./constants";

const convertToUnifiedSyntax = (asm: string) => {
    return asm
    // We have stored the divided syntax instead
    .replace(/thumb_func_start (\S*)/, 'thumb_func_start $1\n.syntax divided')
    // data pointer sections need to be aligned
    .replace(/^_data/gm, '.align 2,0\n_data');
/*
    return asm
    .replace(/add /g, 'adds ')
    .replace(/sub /g, 'subs ')
    .replace(/mul /g, 'muls ')
    .replace(/rsb /g, 'rsbs ')
    .replace(/and /g, 'ands ')
    .replace(/orr /g, 'orrs ')
    .replace(/eor /g, 'eors ')
    .replace(/lsl /g, 'lsls ')
    .replace(/lsr /g, 'lsrs ')
    .replace(/asl /g, 'asls ')
    .replace(/asr /g, 'asrs ')
    .replace(/bic /g, 'bics ')
    .replace(/mov /g, 'movs ')
    .replace(/mvn /g, 'mvns ')
    .replace(/neg (\w*), \1/g, 'rsbs $1, $1, #0')
    .replace(/movs (r\w*), (r\w*)/g, 'mov $1, $2')
    // low register moves are done via an adds
    .replace(/mov (r[0-7]), (r[0-7])\n/g, 'adds $1, $2, #0\n')
    .replace(/subs sp/g, 'sub sp')
    .replace(/adds sp/g, 'add sp')
    // .replace('r10', 'sl')
    // .replace('r9', 'sb')
    // .replace('r12', 'ip')
    // data pointer sections need to be aligned
    .replace(/^_data/gm, '.align 2,0\n_data')
//    .replace(/'#0x([0-9])\n/g, '#$1')
    + '\n';*/
};

let cachedContext: string | null = null;
const getContext = async (): Promise<string> => {
    if (cachedContext == null) {
        const res = await fetch(API_URL + '/static/decompme-context.c');
        if (res.ok) {
            return res.text();
        } else {
            throw Error('Could not fetch context.');
        }
    } else {
        return cachedContext;
    }
};


const createScratch = async (name: string, asm: string, src: string): Promise<any> => {

    const data = {
        'compiler': 'agbcc',
        'compiler_flags': '-O2 -Wimplicit -Wparentheses -Werror -Wno-multichar -g3',
        'context': await getContext(),
        'diff_label': '',
        'platform': 'gba',
        'target_asm': asm,
        'source_code': src,
        'name': name
    };

    let options: any = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            //'credentials': 'same-origin' // Use decomp.me session of the user?
        },
        body: JSON.stringify(data)
    };

    const res = await fetch(DECOMP_ME_BACKEND + '/scratch', options);
    if (res.ok) {
        return res.json();
    } else {
        return new Promise((resolve, reject) => {
            res.json().then(data => reject(Error(data.detail)))
        });
    }
}

const removeIncludes = (src: string) => {
    return src.replace(/#include "\S*/g, '').trim()
};

export const generateDecompMeURL = async (name: string, src: string, asm: string): Promise<string> => {
    console.log(convertToUnifiedSyntax(asm))
    //throw Error('test')
    let data = await createScratch(name, convertToUnifiedSyntax(asm), removeIncludes(src));
    const scratchSlug = data.slug;
    return DECOMP_ME_FRONTEND + '/scratch/' + scratchSlug;
}


