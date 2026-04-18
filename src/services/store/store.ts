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
import presentationReducer from "../features/presentation/presentationSlice";
import groupReducer from "../features/group/groupSlice";
import reportReducer from "../features/report/reportSlice";
import rubricReducer from "../features/rubric/rubricSilce";
import rubricTemplateReducer from "../features/admin/rubricTempleSlice";
import shareReducer from "../features/share/shareSlice";
import classScoreReducer from "../features/classScore/classScoreSlice";
import instructorDashboardReducer from "../features/instructor/instructorDashboardSlice";
import groupGradeReducer from "../features/groupGrade/groupGradeSlice";
import instructorApprovalReducer from "../features/instructor/instructorApprovalSlice";
import uploadPermissionReducer from "../features/uploadPermission/uploadPermissionSlice";
import socketReducer from "../features/socket/socketSlice";
import notificationReducer from "../features/notification/notificationSlice";
import adminDashboardReducer from "../features/admin/adminDashboardSlice";
import speakerReducer from "../features/speaker/speakerSlice";

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
  presentation: presentationReducer,
  group: groupReducer,
  report: reportReducer,
  rubric: rubricReducer,
  rubricTemplate: rubricTemplateReducer,
  share: shareReducer,
  classScore: classScoreReducer,
  instructorDashboard: instructorDashboardReducer,
  groupGrade: groupGradeReducer,
  instructorApproval: instructorApprovalReducer,
  uploadPermission: uploadPermissionReducer,
  socket: socketReducer,
  notification: notificationReducer,
  adminDashboard: adminDashboardReducer,
  speaker: speakerReducer,
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
