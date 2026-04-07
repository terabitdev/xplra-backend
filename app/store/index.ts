import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import adventuresReducer from './slices/adventuresSlice';
import questsReducer from './slices/questsSlice';
import placesReducer from './slices/placesSlice';
import contributionsReducer from './slices/contributionsSlice';
import userReducer from './slices/userSlice';
import usersReducer from './slices/usersSlice';
import categoriesReducer from './slices/categoriesSlice';
import achievementsReducer from './slices/achievementsSlice';
import filterReducer from './slices/filterSlice';
import uiReducer from './slices/uiSlice';
import xpLedgerReducer from './slices/xpLedgerSlice';
import validationConfigsReducer from './slices/validationConfigsSlice';
import eventsReducer from './slices/eventsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    adventures: adventuresReducer,
    quests: questsReducer,
    places: placesReducer,
    contributions: contributionsReducer,
    user: userReducer,
    users: usersReducer,
    categories: categoriesReducer,
    achievements: achievementsReducer,
    filter: filterReducer,
    ui: uiReducer,
    xpLedger: xpLedgerReducer,
    validationConfigs: validationConfigsReducer,
    events: eventsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // Disable for Firebase timestamps if needed
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
