import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../constant/axiosInstance";
import {
  DISTRIBUTE_GRADE_ENDPOINT,
  GET_GRADE_DISTRIBUTION_ENDPOINT,
  GROUP_GRADE_DISTRIBUTIONS_ENDPOINT,
  GROUP_MEMBER_GRADES_ENDPOINT,
} from "../../constant/apiConfig";

// ─── Interfaces ────────────────────────────────────────────────────────────────

export interface GradeDistributionMember {
  id?: number;
  studentId: number;
  percentage: number;
  receivedGrade: number;
  reason: string | null;
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
  /** Danh sách tất cả phân chia điểm của 1 nhóm */
  distributions: GradeDistribution[];
  /** Thông tin phân chia điểm của 1 report cụ thể */
  currentDistribution: GradeDistribution | null;
  /** Điểm cá nhân của thành viên trong nhóm */
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
      return rejectWithValue(
        error.response?.data?.message || "Không thể phân chia điểm",
      );
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
      return rejectWithValue(
        error.response?.data?.message || "Không thể tải thông tin phân chia điểm",
      );
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
      return rejectWithValue(
        error.response?.data?.message || "Không thể tải danh sách phân chia điểm",
      );
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
      return rejectWithValue(
        error.response?.data?.message || "Không thể tải điểm của thành viên",
      );
    }
  },
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const groupGradeSlice = createSlice({
  name: "groupGrade",
  initialState,
  reducers: {
    clearGroupGradeError: (state) => {
      state.error = null;
    },
    clearCurrentDistribution: (state) => {
      state.currentDistribution = null;
    },
    clearDistributions: (state) => {
      state.distributions = [];
    },
    clearMemberGrades: (state) => {
      state.memberGrades = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // distributeGrade
      .addCase(distributeGrade.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(distributeGrade.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.currentDistribution = action.payload;
        // Cập nhật trong danh sách distributions
        const idx = state.distributions.findIndex(
          (d) => d.id === action.payload.id,
        );
        if (idx >= 0) {
          state.distributions[idx] = action.payload;
        } else {
          state.distributions.unshift(action.payload);
        }
      })
      .addCase(distributeGrade.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload as string;
      })
      // fetchGradeDistributionByReport
      .addCase(fetchGradeDistributionByReport.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGradeDistributionByReport.fulfilled, (state, action) => {
        state.loading = false;
        state.currentDistribution = action.payload;
      })
      .addCase(fetchGradeDistributionByReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // fetchGradeDistributionsByGroup
      .addCase(fetchGradeDistributionsByGroup.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGradeDistributionsByGroup.fulfilled, (state, action) => {
        state.loading = false;
        state.distributions = action.payload;
      })
      .addCase(fetchGradeDistributionsByGroup.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // fetchMemberGradesInGroup
      .addCase(fetchMemberGradesInGroup.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMemberGradesInGroup.fulfilled, (state, action) => {
        state.loading = false;
        state.memberGrades = action.payload;
      })
      .addCase(fetchMemberGradesInGroup.rejected, (state, action) => {
        state.loading = false;
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
