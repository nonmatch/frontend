const isProd = (process.env.NODE_ENV === 'production');

export const API_URL = isProd
    ? "https://1ea8-2a02-8070-1c4-e320-00-14ac.eu.ngrok.io/"
    : "http://127.0.0.1:5000/";

export const CEXPLORE_URL = isProd || true
    ? "https://cexplore.henny022.eu.ngrok.io/api/compiler/tmc_agbcc/compile"
    : "http://127.0.0.1:10240/api/compiler/tmc_agbcc/compile";

export const COMPILE_DEBOUNCE_TIME = 500;