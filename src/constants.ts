export const isProd = (process.env.NODE_ENV === 'production');

export const API_URL = isProd
    ? 'https://1ea8-2a02-8070-1c4-e320-00-14ac.eu.ngrok.io'
    : 'http://127.0.0.1:5000';


export const REMOTE_CEXPLORE_HOST = 'https://cexplore.henny022.eu.ngrok.io';
export const LOCAL_CEXPLORE_HOST = 'http://127.0.0.1:10240';

// export const DECOMP_ME_FRONTEND = 'https://decomp.me';
// export const DECOMP_ME_BACKEND = 'https://decomp.me/api';
export const DECOMP_ME_FRONTEND = 'http://127.0.0.1:8080';
export const DECOMP_ME_BACKEND = 'http://127.0.0.1:8000/api';

//https://cexplore.henny022.eu.ngrok.io
//export const COMPILE_PATH = '/api/compiler/tmc_agbcc/compile';
export const COMPILE_PATH = '/api/compiler/agbpyccC/compile';
//export const PYCAT_PATH = '/api/compiler/pycat/compile';
export const PYCAT_PATH = '/api/compiler/agbpycc/compile';

// Urls for the global CExplore instance for sharing
export const LINK_RESOLVE_URL = 'https://cexplore.henny022.eu.ngrok.io/api/shortlinkinfo';
export const CEXPLORE_SHARE_URL = 'https://cexplore.henny022.eu.ngrok.io/#';

export const COMPILE_DEBOUNCE_TIME = 1000;
export const TLH_URL = 'http://localhost:10241';

export const TRELLO_URL = 'https://api.trello.com/1/lists/5ee43e55e7c2e03e4541ff79/cards?members=true';
export const TRELLO_STATUS_URL = 'https://api.trello.com/1/lists/61fcda0676b887856607e705/cards';