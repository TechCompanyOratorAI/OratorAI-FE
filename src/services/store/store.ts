import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { TypedUseSelectorHook, useSelector, useDispatch } from "react-redux";
import { persistReducer, persistStore } from "redux-persist";
import storage from "redux-persist/lib/storage";
import authReducer from "../features/auth/authSlice";
import courseReducer from "../features/course/courseSlice";
import adminReducer from "../features/admin/adminSlice";
import classReducer from "../features/admin/classSlice";
import topicReducer from "../features/topic/topicSlice";
import enrollmentReducer from "../features/enrollment/enrollmentSlice";

const presistConfig = {
  key: "root",
  storage,
  whitelist: ["auth"],
};

// Create a hook for using TypedUseSelectorHook
const rootReducer = combineReducers({
  auth: authReducer,
  course: courseReducer,
  admin: adminReducer,
  class: classReducer,
  topic: topicReducer,
  enrollment: enrollmentReducer,
});

const persistedReducer = persistReducer(presistConfig, rootReducer);

// Combine all reducers
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

// Persist the store
export const persistor = persistStore(store);

// Export types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Export hooks for using TypedUseSelectorHook
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
