import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { configureApi } from '../utils/api';
import alertReducer from './alertSlice';
import resourceReducer from './resourceSlice';
import reportReducer from './reportSlice';
import userReducer from './userSlice';

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['resources', 'reports', 'alerts'], // Only persist these reducers
  blacklist: ['user'], // Don't persist user state as it's handled by JWT
};

const rootReducer = combineReducers({
  alerts: alertReducer,
  resources: resourceReducer,
  reports: reportReducer,
  user: userReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        // Ignore non-serializable date instances in state
        ignoredPaths: ['alerts.items.timestamp', 'reports.items.createdAt', 'resources.items.lastUpdated']
      }
    })
});

// Configure API to get token from store
configureApi(() => store.getState().user?.token);

export const persistor = persistStore(store);

export default store;