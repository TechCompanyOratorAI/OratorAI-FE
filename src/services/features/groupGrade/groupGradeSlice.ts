import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../constant/axiosInstance";
import {
  DISTRIBUTE_GRADE_ENDPOINT,
  GET_GRADE_DISTRIBUTION_ENDPOINT,
  GROUP_GRADE_DISTRIBUTIONS_ENDPOINT,
  GROUP_MEMBER_GRADES_ENDPOINT,
  GRADE_DISTRIBUTION_FEEDBACK_ENDPOINT,
  GRADE_DISTRIBUTION_REOPEN_ENDPOINT,
  GRADE_DISTRIBUTION_FINALIZE_ENDPOINT,
} from "../../constant/apiConfig";

// ─── Interfaces ────────────────────────────────────────────────────────────────

export type DistributionStatus = "submitted" | "reopened" | "finalized";
export type FeedbackStatus = "pending" | "accepted" | "rejected";

export interface GradeDistributionMember {
  id?: number;
  studentId: number;
  percentage: number;
  receivedGrade: number;
  reason: string | null;
  memberFeedback?: string | null;
  feedbackAt?: string | null;
  feedbackStatus?: FeedbackStatus | null;
  student?: {
    userId?: number;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
}

export interface GradeDistribution {
  id: number;
  groupId: number;
  reportId: number;
  leaderStudentId: number;
  instructorGrade: number;
  reason: string | null;
  distributedAt: string | null;
  /** State machine status */
  status: DistributionStatus;
  /** Number of times leader has submitted (max 2) */
  submittedCount: number;
  finalizedAt: string | null;
  group?: {
    groupId: number;
    groupName?: string;
  };
  leader?: {
    userId?: number;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  members?: GradeDistributionMember[];
}

export interface DistributeGradePayload {
  reportId: number;
  reason?: string;
  members: Array<{
    studentId: number;
    percentage: number;
    reason?: string;
  }>;
}

// ─── State ────────────────────────────────────────────────────────────────────

interface GroupGradeState {
  distributions: GradeDistribution[];
  currentDistribution: GradeDistribution | null;
  memberGrades: GradeDistribution[];
  loading: boolean;
  actionLoading: boolean;
  error: string | null;
}

const initialState: GroupGradeState = {
  distributions: [],
  currentDistribution: null,
  memberGrades: [],
  loading: false,
  actionLoading: false,
  error: null,
};

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const distributeGrade = createAsyncThunk<
  GradeDistribution,
  DistributeGradePayload,
  { rejectValue: string }
>(
  "groupGrade/distributeGrade",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post<{ success: boolean; data: GradeDistribution }>(
        DISTRIBUTE_GRADE_ENDPOINT(payload.reportId.toString()),
        payload,
      );
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Không thể phân chia điểm");
    }
  },
);

export const fetchGradeDistributionByReport = createAsyncThunk<
  GradeDistribution | null,
  number,
  { rejectValue: string }
>(
  "groupGrade/fetchByReport",
  async (reportId, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get<{ success: boolean; data: GradeDistribution | null }>(
        GET_GRADE_DISTRIBUTION_ENDPOINT(reportId.toString()),
      );
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Không thể tải thông tin phân chia điểm");
    }
  },
);

export const fetchGradeDistributionsByGroup = createAsyncThunk<
  GradeDistribution[],
  number,
  { rejectValue: string }
>(
  "groupGrade/fetchByGroup",
  async (groupId, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get<{ success: boolean; data: GradeDistribution[] }>(
        GROUP_GRADE_DISTRIBUTIONS_ENDPOINT(groupId.toString()),
      );
      return response.data.data ?? [];
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Không thể tải danh sách phân chia điểm");
    }
  },
);

export const fetchMemberGradesInGroup = createAsyncThunk<
  GradeDistribution[],
  { groupId: number; studentId: number },
  { rejectValue: string }
>(
  "groupGrade/fetchMemberGrades",
  async ({ groupId, studentId }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get<{ success: boolean; data: GradeDistribution[] }>(
        GROUP_MEMBER_GRADES_ENDPOINT(groupId.toString(), studentId.toString()),
      );
      return response.data.data ?? [];
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Không thể tải điểm của thành viên");
    }
  },
);

export const submitMemberFeedback = createAsyncThunk<
  GradeDistributionMember,
  { groupId: number; distributionId: number; feedback: string },
  { rejectValue: string }
>(
  "groupGrade/submitFeedback",
  async ({ groupId, distributionId, feedback }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post<{ success: boolean; data: GradeDistributionMember }>(
        GRADE_DISTRIBUTION_FEEDBACK_ENDPOINT(groupId.toString(), distributionId.toString()),
        { feedback },
      );
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Không thể gửi phản hồi");
    }
  },
);

export const reopenDistribution = createAsyncThunk<
  GradeDistribution,
  { groupId: number; distributionId: number },
  { rejectValue: string }
>(
  "groupGrade/reopen",
  async ({ groupId, distributionId }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put<{ success: boolean; data: GradeDistribution }>(
        GRADE_DISTRIBUTION_REOPEN_ENDPOINT(groupId.toString(), distributionId.toString()),
      );
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Không thể mở lại phân chia điểm");
    }
  },
);

export const finalizeDistribution = createAsyncThunk<
  GradeDistribution,
  { groupId: number; distributionId: number },
  { rejectValue: string }
>(
  "groupGrade/finalize",
  async ({ groupId, distributionId }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put<{ success: boolean; data: GradeDistribution }>(
        GRADE_DISTRIBUTION_FINALIZE_ENDPOINT(groupId.toString(), distributionId.toString()),
      );
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Không thể chốt điểm");
    }
  },
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const upsertDistribution = (list: GradeDistribution[], item: GradeDistribution) => {
  const idx = list.findIndex((d) => d.id === item.id);
  if (idx >= 0) list[idx] = item;
  else list.unshift(item);
};

// ─── Slice ────────────────────────────────────────────────────────────────────

const groupGradeSlice = createSlice({
  name: "groupGrade",
  initialState,
  reducers: {
    clearGroupGradeError: (state) => { state.error = null; },
    clearCurrentDistribution: (state) => { state.currentDistribution = null; },
    clearDistributions: (state) => { state.distributions = []; },
    clearMemberGrades: (state) => { state.memberGrades = []; },
  },
  extraReducers: (builder) => {
    builder
      // distributeGrade
      .addCase(distributeGrade.pending, (state) => { state.actionLoading = true; state.error = null; })
      .addCase(distributeGrade.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.currentDistribution = action.payload;
        upsertDistribution(state.distributions, action.payload);
      })
      .addCase(distributeGrade.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload as string;
      })

      // fetchGradeDistributionByReport
      .addCase(fetchGradeDistributionByReport.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchGradeDistributionByReport.fulfilled, (state, action) => {
        state.loading = false;
        state.currentDistribution = action.payload;
      })
      .addCase(fetchGradeDistributionByReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // fetchGradeDistributionsByGroup
      .addCase(fetchGradeDistributionsByGroup.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchGradeDistributionsByGroup.fulfilled, (state, action) => {
        state.loading = false;
        state.distributions = action.payload;
      })
      .addCase(fetchGradeDistributionsByGroup.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // fetchMemberGradesInGroup
      .addCase(fetchMemberGradesInGroup.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchMemberGradesInGroup.fulfilled, (state, action) => {
        state.loading = false;
        state.memberGrades = action.payload;
      })
      .addCase(fetchMemberGradesInGroup.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // submitMemberFeedback
      .addCase(submitMemberFeedback.pending, (state) => { state.actionLoading = true; state.error = null; })
      .addCase(submitMemberFeedback.fulfilled, (state, action) => {
        state.actionLoading = false;
        // Update member in currentDistribution
        if (state.currentDistribution?.members) {
          const idx = state.currentDistribution.members.findIndex(
            (m) => m.studentId === action.payload.studentId,
          );
          if (idx >= 0) state.currentDistribution.members[idx] = { ...state.currentDistribution.members[idx], ...action.payload };
        }
      })
      .addCase(submitMemberFeedback.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload as string;
      })

      // reopenDistribution
      .addCase(reopenDistribution.pending, (state) => { state.actionLoading = true; state.error = null; })
      .addCase(reopenDistribution.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.currentDistribution = action.payload;
        upsertDistribution(state.distributions, action.payload);
      })
      .addCase(reopenDistribution.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload as string;
      })

      // finalizeDistribution
      .addCase(finalizeDistribution.pending, (state) => { state.actionLoading = true; state.error = null; })
      .addCase(finalizeDistribution.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.currentDistribution = action.payload;
        upsertDistribution(state.distributions, action.payload);
      })
      .addCase(finalizeDistribution.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearGroupGradeError,
  clearCurrentDistribution,
  clearDistributions,
  clearMemberGrades,
} = groupGradeSlice.actions;

export default groupGradeSlice.reducer;
