import { configureStore } from '@reduxjs/toolkit';

import { reducer as analyticsReducer } from './pages/analytics/data/slice';

export default function initializeStore() {
  return configureStore({
    reducer: {
      analyticsReducer,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['plugin/registerOverrideMethod'],
        ignoredPaths: ['plugins'],
      },
    }),
  });
}

export const store = initializeStore();

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
