export const isProd = (process.env.NODE_ENV === 'production');

export const API_URL = isProd
    ? "https://1ea8-2a02-8070-1c4-e320-00-14ac.eu.ngrok.io"
    : "http://127.0.0.1:5000";

const useRemoteCexplore = isProd;

export const CEXPLORE_URL = useRemoteCexplore
    ? "https://cexplore.henny022.eu.ngrok.io/api/compiler/tmc_agbcc/compile"
    : "http://127.0.0.1:10240/api/compiler/tmc_agbcc/compile";

export const PYCAT_URL = useRemoteCexplore
    ? 'https://cexplore.henny022.eu.ngrok.io/api/compiler/pycat/compile'
    : 'http://127.0.0.1:10240/api/compiler/pycat/compile';

export const LINK_RESOLVE_URL = useRemoteCexplore
    ? 'https://cexplore.henny022.eu.ngrok.io/api/shortlinkinfo'
    : 'http://localhost:10240/api/shortlinkinfo';

export const COMPILE_DEBOUNCE_TIME = 500;
export const TLH_URL = 'http://localhost:10241';