import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../constant/axiosInstance";

export interface Notification {
  id: string;
  type: "report:generated" | "report:confirmed" | "report:rejected" | "report:criterion-feedback-changed" | "grade:distributed" | "grade:finalized" | "grade:reopened" | "grade:feedback-updated" | "class:upload-permission-changed";
  presentationId: number;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

interface NotificationState {
  items: Notification[];
  unreadCount: number;
}

export type { NotificationState };

const initialState: NotificationState = {
  items: [],
  unreadCount: 0,
};

export const fetchNotifications = createAsyncThunk<
  Notification[],
  void,
  { rejectValue: string }
>(
  "notification/fetchNotifications",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get<{ success: boolean; data: Notification[] }>(
        "/notifications",
      );
      return response.data.data ?? [];
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Không thể tải thông báo");
    }
  }
);

const notificationSlice = createSlice({
  name: "notification",
  initialState,
  reducers: {
    addNotification: (state, action) => {
      const notif: Notification = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        ...action.payload,
        read: false,
        createdAt: new Date().toISOString(),
      };
      state.items.unshift(notif);
      state.unreadCount += 1;
    },
    markAllRead: (state) => {
      state.items.forEach((n) => { n.read = true; });
      state.unreadCount = 0;
    },
    clearNotifications: (state) => {
      state.items = [];
      state.unreadCount = 0;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.items = action.payload;
        state.unreadCount = action.payload.filter((n) => !n.read).length;
      });
  },
});

export const { addNotification, markAllRead, clearNotifications } = notificationSlice.actions;
export default notificationSlice.reducer;
