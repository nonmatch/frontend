export const isProd = (process.env.NODE_ENV === 'production');

// !!! When changing the prod url, it also needs to be changed in the GitHub application itself
// https://github.com/settings/applications/1798345
export const API_URL = isProd
    ? 'https://d42f-2a02-8070-18e-cc80-1e81-9393-1e36-c692.eu.ngrok.io'
    : 'http://127.0.0.1:5000';

//export const REMOTE_CEXPLORE_HOST = 'https://cexplore.henny022.eu.ngrok.io';
//export const REMOTE_CEXPLORE_HOST = 'https://d42f-2a02-8070-18e-cc80-1e81-9393-1e36-c692.eu.ngrok.io';
//export const REMOTE_CEXPLORE_HOST = 'http://127.0.0.1:5000';
//export const REMOTE_CEXPLORE_HOST = 'http://192.168.0.3:5000';
export const REMOTE_CEXPLORE_HOST = 'https://nonmatch.us.to';
export const LOCAL_CEXPLORE_HOST = 'http://127.0.0.1:10240';

export const DECOMP_ME_FRONTEND = 'https://decomp.me';
export const DECOMP_ME_BACKEND = 'https://decomp.me/api';
// export const DECOMP_ME_FRONTEND = 'http://127.0.0.1:8080';
// export const DECOMP_ME_BACKEND = 'http://127.0.0.1:8000/api';

//https://cexplore.henny022.eu.ngrok.io
//export const COMPILE_PATH = '/api/compiler/tmc_agbcc/compile';
//export const COMPILE_PATH = '/api/compiler/agbpyccC/compile';
export const COMPILE_PATH = '/api/compiler/agbcc/compile';
//export const PYCAT_PATH = '/api/compiler/pycat/compile';
//export const PYCAT_PATH = '/api/compiler/agbpycc/compile';
export const CAT_PATH = '/api/compiler/cat/compile';

//export const FORMATTER_HOST = 'http://139.144.77.114:10245';
export const FORMATTER_HOST = 'https://formatter.us.to';
export const FORMATTER_PATH = '/format';
// Urls for the global CExplore instance for sharing
export const LINK_RESOLVE_URL = 'https://cexplore.henny022.eu.ngrok.io/api/shortlinkinfo';
export const CEXPLORE_SHARE_URL = 'https://cexplore.henny022.eu.ngrok.io/#';

export const COMPILE_DEBOUNCE_TIME = 1000;
export const TLH_URL = 'http://localhost:10241';

export const TRELLO_URL = 'https://api.trello.com/1/lists/5ee43e55e7c2e03e4541ff79/cards?members=true';
export const TRELLO_STATUS_URL = 'https://api.trello.com/1/lists/61fcda0676b887856607e705/cards';