const normalizeBaseUrl = (value: string): string => value.replace(/\/+$/, '');

const DEFAULT_DEV_API_BASE_URL = 'http://localhost:8080';
const DEFAULT_PROD_API_BASE_URL = 'https://beautifulneon.xyz';
const NODES_API_PATH = '/api/nodes';

const API_BASE_URL = normalizeBaseUrl(
    import.meta.env.DEV
        ? (import.meta.env.VITE_API_BASE_URL_DEV ?? DEFAULT_DEV_API_BASE_URL)
        : (import.meta.env.VITE_API_BASE_URL_PROD ?? DEFAULT_PROD_API_BASE_URL)
);

export const APP_CONFIG = {
    apiBaseUrl: API_BASE_URL,
    nodesApiPath: NODES_API_PATH,
    nodesApiUrl: new URL(NODES_API_PATH, API_BASE_URL).toString(),
};
