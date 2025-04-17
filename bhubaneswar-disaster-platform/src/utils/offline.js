import { openDB } from 'idb';

const DB_NAME = 'bhubaneswar_disaster_platform';
const DB_VERSION = 2; // Increased version for new stores

export async function initDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, newVersion) {
      // Create object stores if they don't exist
      if (!db.objectStoreNames.contains('alerts')) {
        const alertStore = db.createObjectStore('alerts', { keyPath: 'alertId' });
        alertStore.createIndex('timestamp', 'timestamp');
      }
      if (!db.objectStoreNames.contains('resources')) {
        const resourceStore = db.createObjectStore('resources', { keyPath: 'resourceId' });
        resourceStore.createIndex('lastUpdated', 'lastUpdated');
      }
      if (!db.objectStoreNames.contains('reports')) {
        const reportsStore = db.createObjectStore('reports', { keyPath: 'reportId', autoIncrement: true });
        reportsStore.createIndex('status', 'status');
        reportsStore.createIndex('timestamp', 'timestamp');
      }
      if (!db.objectStoreNames.contains('offlineActions')) {
        const actionsStore = db.createObjectStore('offlineActions', { keyPath: 'id', autoIncrement: true });
        actionsStore.createIndex('action', 'action');
        actionsStore.createIndex('timestamp', 'timestamp');
      }
      if (!db.objectStoreNames.contains('syncMetadata')) {
        const metaStore = db.createObjectStore('syncMetadata', { keyPath: 'key' });
        metaStore.createIndex('lastSync', 'lastSync');
      }
    }
  });
}

export const isOnline = () => {
  return typeof navigator !== 'undefined' && navigator.onLine;
};

export const setupOfflineListeners = (onOnline, onOffline) => {
  if (typeof window !== 'undefined') {
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }
  return () => {};
};

export async function saveDataLocally(storeName, data, metadata = {}) {
  const db = await initDB();
  const tx = db.transaction(storeName, 'readwrite');
  const store = tx.objectStore(storeName);
  
  if (Array.isArray(data)) {
    for (const item of data) {
      const enhancedItem = {
        ...item,
        _metadata: {
          ...metadata,
          lastModified: new Date().toISOString(),
          isLocalOnly: !isOnline(),
        }
      };
      await store.put(enhancedItem);
    }
  } else {
    const enhancedItem = {
      ...data,
      _metadata: {
        ...metadata,
        lastModified: new Date().toISOString(),
        isLocalOnly: !isOnline(),
      }
    };
    await store.put(enhancedItem);
  }
  
  await tx.done;
}

export async function getLocalData(storeName, query = {}) {
  const db = await initDB();
  const tx = db.transaction(storeName, 'readonly');
  const store = tx.objectStore(storeName);
  
  let items = await store.getAll();
  
  // Apply filters if provided
  if (query.filter) {
    items = items.filter(query.filter);
  }
  
  // Apply sorting if provided
  if (query.sort) {
    items.sort(query.sort);
  }
  
  return items;
}

export async function queueOfflineAction(action, data) {
  const db = await initDB();
  const tx = db.transaction('offlineActions', 'readwrite');
  const store = tx.objectStore('offlineActions');
  
  await store.add({
    action,
    data,
    timestamp: new Date().toISOString(),
    retryCount: 0,
    status: 'pending'
  });
  
  await tx.done;
}

export async function processOfflineActions(apiClient) {
  if (!isOnline()) return;

  const db = await initDB();
  const actions = await db.getAll('offlineActions');
  
  if (actions.length === 0) return;
  
  const tx = db.transaction('offlineActions', 'readwrite');
  const store = tx.objectStore('offlineActions');
  
  for (const action of actions) {
    try {
      if (action.retryCount >= 3) {
        await store.delete(action.id);
        continue;
      }

      switch (action.action) {
        case 'submitReport':
          await apiClient.post('/reports', action.data);
          break;
        case 'updateResource':
          await apiClient.put(`/resources/${action.data.resourceId}`, action.data);
          break;
        case 'updateAlert':
          await apiClient.patch(`/alerts/${action.data.alertId}`, action.data);
          break;
        case 'deleteReport':
          await apiClient.delete(`/reports/${action.data.reportId}`);
          break;
      }
      
      // Remove processed action
      await store.delete(action.id);
    } catch (error) {
      console.error('Failed to process offline action:', error);
      // Update retry count and status
      await store.put({
        ...action,
        retryCount: (action.retryCount || 0) + 1,
        lastError: error.message,
        status: 'failed'
      });
    }
  }
  
  await tx.done;
}

export async function syncWithServer(apiClient, storeName) {
  if (!isOnline()) return;

  const db = await initDB();
  const metaTx = db.transaction('syncMetadata', 'readwrite');
  const metaStore = metaTx.objectStore('syncMetadata');

  // Get last sync timestamp
  const lastSync = await metaStore.get(storeName)
    .then(meta => meta?.lastSync)
    .catch(() => null);

  try {
    // Fetch updates from server
    const response = await apiClient.get(`/${storeName}`, {
      params: lastSync ? { since: lastSync } : {}
    });

    // Save server data locally
    await saveDataLocally(storeName, response.data, {
      syncedAt: new Date().toISOString()
    });

    // Update sync metadata
    await metaStore.put({
      key: storeName,
      lastSync: new Date().toISOString()
    });

    await metaTx.done;
    return response.data;
  } catch (error) {
    console.error(`Failed to sync ${storeName}:`, error);
    throw error;
  }
}

export async function resolveConflicts(localData, serverData, strategy = 'serverWins') {
  switch (strategy) {
    case 'serverWins':
      return serverData;
    case 'localWins':
      return localData;
    case 'merge':
      return {
        ...serverData,
        ...localData,
        _metadata: {
          ...serverData._metadata,
          ...localData._metadata,
          merged: true,
          mergedAt: new Date().toISOString()
        }
      };
    default:
      throw new Error(`Unknown conflict resolution strategy: ${strategy}`);
  }
}

export async function clearOfflineData(storeName) {
  const db = await initDB();
  const tx = db.transaction(storeName, 'readwrite');
  const store = tx.objectStore(storeName);
  await store.clear();
  await tx.done;
}