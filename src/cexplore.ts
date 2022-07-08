import LZString from "lz-string";
import rison from "rison";
import { CEXPLORE_SHARE_URL } from "./constants";


const risonQuote = (text: string) => {
    if (/^[-A-Za-z0-9~!*()_.',:@$/]*$/.test(text))
        return text;

    return encodeURIComponent(text)
        .replace(/%2C/g, ',')
        .replace(/%3A/g, ':')
        .replace(/%40/g, '@')
        .replace(/%24/g, '$')
        .replace(/%2F/g, '/')
        .replace(/%20/g, '+');

};

const risonify = (data: any) => {
    return risonQuote(rison.encode_object(data));
};

export const generateCExploreURL = (src: string, asm: string) => {
    let state = "g:!((g:!((g:!((h:codeEditor,i:(fontScale:13,j:1,lang:___c,selection:(endColumn:20,endLineNumber:6,positionColumn:20,positionLineNumber:6,selectionStartColumn:20,selectionStartLineNumber:6,startColumn:20,startLineNumber:6),source:'%23include+%22entity.h%22%0A%23include+%22functions.h%22%0A%23include+%22player.h%22%0A%23include+%22script.h%22%0A%0A//+Add+C+code+here+'),l:'5',n:'0',o:'C+source+%231',t:'0'),(h:compiler,i:(compiler:tmc_agbcc,filters:(b:'0',binary:'1',commentOnly:'0',demangle:'0',directives:'0',execute:'1',intel:'0',libraryCode:'1',trim:'1'),fontScale:14,j:1,lang:___c,libs:!(),options:'-O2',selection:(endColumn:1,endLineNumber:1,positionColumn:1,positionLineNumber:1,selectionStartColumn:1,selectionStartLineNumber:1,startColumn:1,startLineNumber:1),source:1),l:'5',n:'0',o:'tmc_agbcc+(Editor+%231,+Compiler+%231)+C',t:'0')),k:30.16338263472055,l:'4',m:100,n:'0',o:'',s:0,t:'0'),(g:!((g:!((h:diff,i:(fontScale:11,lhs:1,lhsdifftype:0,rhs:2,rhsdifftype:0),l:'5',n:'0',o:'Diff+tmc_agbcc+vs+cat',t:'0')),header:(),k:43.47343067999081,l:'4',m:77.37306843267108,n:'0',o:'',s:0,t:'0'),(g:!((h:output,i:(compiler:1,editor:1,fontScale:11,wrap:'1'),l:'5',n:'0',o:'%231+with+tmc_agbcc',t:'0')),header:(),l:'4',m:22.626931567328924,n:'0',o:'',s:0,t:'0')),k:45.89413114177405,l:'3',n:'0',o:'',t:'0'),(g:!((h:codeEditor,i:(fontScale:13,j:2,lang:assembly,selection:(endColumn:25,endLineNumber:1,positionColumn:25,positionLineNumber:1,selectionStartColumn:25,selectionStartLineNumber:1,startColumn:25,startLineNumber:1),source:'@+Add+assembly+code+here'),l:'5',n:'0',o:'Assembly+source+%232',t:'0'),(h:compiler,i:(compiler:pycat,filters:(b:'0',binary:'1',commentOnly:'0',demangle:'0',directives:'0',execute:'1',intel:'0',libraryCode:'0',trim:'1'),fontScale:14,j:2,lang:assembly,libs:!(),options:'',selection:(endColumn:1,endLineNumber:1,positionColumn:1,positionLineNumber:1,selectionStartColumn:1,selectionStartLineNumber:1,startColumn:1,startLineNumber:1),source:2),l:'5',n:'0',o:'cat+(Editor+%232,+Compiler+%232)+Assembly',t:'0')),k:23.94248622350541,l:'4',n:'0',o:'',s:0,t:'0')),l:'2',n:'0',o:'',t:'0')),version:4";
    let data = rison.decode_object(state) as any;
    console.log(data)
    // Insert our code in the editors
    data['g'][0]['g'][0]['g'][0]['i']['source'] = src;
    data['g'][0]['g'][0]['g'][1]['i']['libs'].push({
        id: 'tmc',
        version: 'master'
    })
    data['g'][0]['g'][2]['g'][0]['i']['source'] = asm;

    const newState = risonify(data);
    const newStateObj = {
        'z': LZString.compressToBase64(newState)
    };
    return CEXPLORE_SHARE_URL + risonify(newStateObj);
};