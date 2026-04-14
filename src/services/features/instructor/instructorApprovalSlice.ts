import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { instructorApi, PendingApprovalsResponse } from "@/services/api/instructorApi";
import { message } from "antd";

interface InstructorApprovalState {
  pendingPresentations: any[];
  approvedPresentations: any[];
  totalPending: number;
  totalApproved: number;
  loading: boolean;
  approvingIds: number[];
  error: string | null;
}

const initialState: InstructorApprovalState = {
  pendingPresentations: [],
  approvedPresentations: [],
  totalPending: 0,
  totalApproved: 0,
  loading: false,
  approvingIds: [],
  error: null,
};

// Async thunks
export const fetchPendingApprovals = createAsyncThunk(
  "instructor/fetchPendingApprovals",
  async (
    params?: { classId?: string; courseId?: string; limit?: number; offset?: number },
    { rejectWithValue }
  ) => {
    try {
      const response = await instructorApi.getPendingApprovals(params);
      return response.data as PendingApprovalsResponse;
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Failed to fetch pending approvals");
      return rejectWithValue(error?.response?.data);
    }
  }
);

export const fetchApprovedPresentations = createAsyncThunk(
  "instructor/fetchApprovedPresentations",
  async (
    params?: { classId?: string; courseId?: string; limit?: number; offset?: number },
    { rejectWithValue }
  ) => {
    try {
      const response = await instructorApi.getApprovedPresentations(params);
      return response.data;
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Failed to fetch approved presentations");
      return rejectWithValue(error?.response?.data);
    }
  }
);

export const approvePresentation = createAsyncThunk(
  "instructor/approvePresentation",
  async (
    { presentationId, note }: { presentationId: number; note?: string },
    { rejectWithValue, dispatch }
  ) => {
    try {
      const response = await instructorApi.approvePresentation(presentationId, note);
      // Refresh lists after approval
      dispatch(fetchPendingApprovals());
      dispatch(fetchApprovedPresentations());
      return response.data;
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Failed to approve presentation");
      return rejectWithValue(error?.response?.data);
    }
  }
);

export const unapprovePresentation = createAsyncThunk(
  "instructor/unapprovePresentation",
  async (presentationId: number, { rejectWithValue, dispatch }) => {
    try {
      const response = await instructorApi.unapprovePresentation(presentationId);
      // Refresh lists after unapproval
      dispatch(fetchPendingApprovals());
      dispatch(fetchApprovedPresentations());
      return response.data;
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Failed to revoke approval");
      return rejectWithValue(error?.response?.data);
    }
  }
);

const instructorApprovalSlice = createSlice({
  name: "instructorApproval",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    removeFromPending: (state, action: PayloadAction<number>) => {
      state.pendingPresentations = state.pendingPresentations.filter(
        (p) => p.presentationId !== action.payload
      );
      state.totalPending = Math.max(0, state.totalPending - 1);
    },
    addToApproved: (state, action: PayloadAction<any>) => {
      state.approvedPresentations.unshift(action.payload);
      state.totalApproved += 1;
    },
  },
  extraReducers: (builder) => {
    // Fetch pending approvals
    builder
      .addCase(fetchPendingApprovals.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPendingApprovals.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.success && action.payload.data) {
          state.pendingPresentations = action.payload.data.presentations;
          state.totalPending = action.payload.data.total;
        }
      })
      .addCase(fetchPendingApprovals.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch approved presentations
    builder
      .addCase(fetchApprovedPresentations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchApprovedPresentations.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.success && action.payload.data) {
          state.approvedPresentations = action.payload.data.presentations;
          state.totalApproved = action.payload.data.total;
        }
      })
      .addCase(fetchApprovedPresentations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Approve presentation
    builder
      .addCase(approvePresentation.pending, (state, action) => {
        state.approvingIds.push(action.meta.arg.presentationId);
      })
      .addCase(approvePresentation.fulfilled, (state, action) => {
        state.approvingIds = state.approvingIds.filter(
          (id) => id !== action.meta.arg.presentationId
        );
        if (action.payload.success) {
          message.success("Duyệt thành công!");
        }
      })
      .addCase(approvePresentation.rejected, (state, action) => {
        state.approvingIds = state.approvingIds.filter(
          (id) => id !== action.meta.arg.presentationId
        );
        state.error = action.payload as string;
      });

    // Unapprove presentation
    builder
      .addCase(unapprovePresentation.pending, (state, action) => {
        state.approvingIds.push(action.meta.arg);
      })
      .addCase(unapprovePresentation.fulfilled, (state, action) => {
        state.approvingIds = state.approvingIds.filter((id) => id !== action.meta.arg);
        if (action.payload.success) {
          message.success("Đã huỷ duyệt!");
        }
      })
      .addCase(unapprovePresentation.rejected, (state, action) => {
        state.approvingIds = state.approvingIds.filter((id) => id !== action.meta.arg);
        state.error = action.payload as string;
      });
  },
});

export const { clearError, removeFromPending, addToApproved } =
  instructorApprovalSlice.actions;

export default instructorApprovalSlice.reducer;
