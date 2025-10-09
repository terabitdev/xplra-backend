import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import adventuresReducer from './slices/adventuresSlice';
import questsReducer from './slices/questsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    adventures: adventuresReducer,
    quests: questsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // Disable for Firebase timestamps if needed
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
