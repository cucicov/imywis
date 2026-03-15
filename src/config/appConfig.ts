const normalizeBaseUrl = (value: string): string => value.replace(/\/+$/, '');

const DEFAULT_DEV_API_BASE_URL = 'http://localhost:8080';
const DEFAULT_PROD_API_BASE_URL = 'https://beautifulneon.xyz';
const NODES_API_PATH = '/api/nodes';
const DEFAULT_TESTING_PUBLISH_REDIRECT_URL = 'http://localhost:8080/test';
const DEFAULT_PROD_PUBLISH_REDIRECT_URL = 'https://www.beautifulneon.xyz/test';
const DEFAULT_METADATA_EXPANDED_IN_DEV = true;
const DEFAULT_METADATA_EXPANDED_IN_PROD = false;

const API_BASE_URL = normalizeBaseUrl(
    import.meta.env.DEV
        ? (import.meta.env.VITE_API_BASE_URL_DEV ?? DEFAULT_DEV_API_BASE_URL)
        : (import.meta.env.VITE_API_BASE_URL_PROD ?? DEFAULT_PROD_API_BASE_URL)
);

const PUBLISH_REDIRECT_URL = import.meta.env.PROD
    ? (import.meta.env.VITE_PUBLISH_REDIRECT_URL_PROD ?? DEFAULT_PROD_PUBLISH_REDIRECT_URL)
    : (import.meta.env.VITE_PUBLISH_REDIRECT_URL_TESTING ?? DEFAULT_TESTING_PUBLISH_REDIRECT_URL);

const parseBoolean = (value: unknown): boolean | null => {
    if (typeof value === 'boolean') {
        return value;
    }
    if (typeof value !== 'string') {
        return null;
    }

    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') {
        return true;
    }
    if (normalized === 'false') {
        return false;
    }

    return null;
};

const DEFAULT_METADATA_EXPANDED = import.meta.env.DEV
    ? DEFAULT_METADATA_EXPANDED_IN_DEV
    : DEFAULT_METADATA_EXPANDED_IN_PROD;

const METADATA_EXPANDED_BY_DEFAULT = parseBoolean(import.meta.env.VITE_METADATA_EXPANDED_BY_DEFAULT)
    ?? DEFAULT_METADATA_EXPANDED;

export const APP_CONFIG = {
    apiBaseUrl: API_BASE_URL,
    nodesApiPath: NODES_API_PATH,
    nodesApiUrl: new URL(NODES_API_PATH, API_BASE_URL).toString(),
    publishRedirectUrl: PUBLISH_REDIRECT_URL,
    metadataExpandedByDefault: METADATA_EXPANDED_BY_DEFAULT,
};
