import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface UploadPermissionChangedPayload {
  classId: number;
  isUploadEnabled: boolean;
  uploadStartDate: string | null;
  uploadEndDate: string | null;
}

export interface PresentationJobPayload {
  presentationId: number;
  jobType?: string;
  progress?: number;
  status?: string;
  message?: string;
}

export interface ReportGeneratedPayload {
  presentationId: number;
  reportId: number;
  overallScore?: number;
}

export interface SocketEvent {
  id: string;
  type: string;
  payload: unknown;
  timestamp: number;
}

export interface SocketState {
  connected: boolean;
  events: SocketEvent[];
  pendingPermissionChanges: Record<number, boolean>;
}

const initialState: SocketState = {
  connected: false,
  events: [],
  pendingPermissionChanges: {},
};

const socketSlice = createSlice({
  name: "socket",
  initialState,
  reducers: {
    setConnected(state, action: PayloadAction<boolean>) {
      state.connected = action.payload;
    },
    addEvent(state, action: PayloadAction<Omit<SocketEvent, "id" | "timestamp">>) {
      state.events.unshift({
        ...action.payload,
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        timestamp: Date.now(),
      });
      if (state.events.length > 50) {
        state.events = state.events.slice(0, 50);
      }
    },
    updateUploadPermission(state, action: PayloadAction<UploadPermissionChangedPayload>) {
      state.pendingPermissionChanges[action.payload.classId] = action.payload.isUploadEnabled;
    },
    clearUploadPermissionChange(state, action: PayloadAction<number>) {
      delete state.pendingPermissionChanges[action.payload];
    },
  },
});

export const { setConnected, addEvent, updateUploadPermission, clearUploadPermissionChange } =
  socketSlice.actions;

export default socketSlice.reducer;
