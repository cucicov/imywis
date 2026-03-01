const API_BASE_URL = 'http://localhost:8080';
const NODES_API_PATH = '/api/nodes';

export const APP_CONFIG = {
    apiBaseUrl: API_BASE_URL,
    nodesApiPath: NODES_API_PATH,
    nodesApiUrl: new URL(NODES_API_PATH, API_BASE_URL).toString(),
};
