import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import adventuresReducer from './slices/adventuresSlice';
import questsReducer from './slices/questsSlice';
import eventsReducer from './slices/eventsSlice';
import storeReducer from './slices/storeSlice';
import userReducer from './slices/userSlice';
import categoriesReducer from './slices/categoriesSlice';
import achievementsReducer from './slices/achievementsSlice';
import filterReducer from './slices/filterSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    adventures: adventuresReducer,
    quests: questsReducer,
    events: eventsReducer,
    store: storeReducer,
    user: userReducer,
    categories: categoriesReducer,
    achievements: achievementsReducer,
    filter: filterReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // Disable for Firebase timestamps if needed
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
