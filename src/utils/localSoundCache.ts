const DB_NAME = 'imywis-local-sound-cache';
const STORE_NAME = 'sounds';
const DB_VERSION = 1;

type CachedRecord = {path: string; dataUrl: string; updatedAt: number};

const openCacheDb = (): Promise<IDBDatabase> => new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME, {keyPath: 'path'});
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
});

export const saveLocalSoundDataUrl = async (path: string, dataUrl: string) => {
    if (!path || !dataUrl.startsWith('data:audio/')) return;
    const db = await openCacheDb();
    await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).put({path, dataUrl, updatedAt: Date.now()} satisfies CachedRecord);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
    db.close();
};

export const getLocalSoundDataUrl = async (path: string): Promise<string | null> => {
    if (!path) return null;
    const db = await openCacheDb();
    const record = await new Promise<CachedRecord | undefined>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const request = tx.objectStore(STORE_NAME).get(path);
        request.onsuccess = () => resolve(request.result as CachedRecord | undefined);
        request.onerror = () => reject(request.error);
    });
    db.close();
    return record?.dataUrl?.startsWith('data:audio/') ? record.dataUrl : null;
};
