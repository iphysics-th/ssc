"use client";
import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { apiSlice, setupPeriodicTokenRefresh } from "./apiSlice";
import authSlice from "../features/auth/authSlice";
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import storage from "redux-persist/lib/storage"; // defaults to localStorage for web

// --- Persist Configuration ---
const persistConfig = {
  key: "root",
  version: 1,
  storage,
  blacklist: [apiSlice.reducerPath],
};

// --- Combine Reducers ---
const rootReducer = combineReducers({
  [apiSlice.reducerPath]: apiSlice.reducer,
  auth: authSlice,
});

// --- Persist Reducer ---
const persistedReducer = persistReducer(persistConfig, rootReducer);

// --- Create Store ---
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(apiSlice.middleware),
  devTools: process.env.NODE_ENV !== "production",
});

// --- Persistor ---
export const persistor = persistStore(store);

// --- Background Token Refresh ---
setupPeriodicTokenRefresh(store.dispatch, 15 * 60 * 1000); // every 15 min
