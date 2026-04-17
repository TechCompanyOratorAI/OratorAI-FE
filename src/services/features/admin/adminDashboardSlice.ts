import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/services/constant/axiosInstance";
import { ADMIN_DASHBOARD_ENDPOINT } from "@/services/constant/apiConfig";

// ── Types ────────────────────────────────────────────────────────────────────

export interface DashboardUser {
  userId: number;
  name: string;
  email: string;
  initials: string;
  role: string;
  createdAt: string;
}

export interface DashboardPresentation {
  presentationId: number;
  title: string;
  studentName: string;
  score: string | null;
  reportStatus: string | null;
  createdAt: string;
}

export interface DashboardInstructor {
  userId: number;
  name: string;
  initials: string;
  classCount: number;
}

export interface DashboardClass {
  classId: number;
  classCode: string;
  courseName: string;
  enrollmentCount: number;
}

export interface ChartItem {
  label: string;
  count: number;
  key: string;
}

export interface ChartItemStatus {
  status: string;
  count: number;
  key: string;
}

export interface ScoreRangeItem {
  range: string;
  count: number;
  key: string;
}

export interface DashboardCharts {
  presentationsPerDay: Array<{ date: string; label: string; presentations: number }>;
  reportsPerDay:      Array<{ date: string; label: string; reports: number }>;
  reportStatus:        ChartItem[];
  usersByRole:         ChartItem[];
  presentationsByStatus: ChartItem[];
  scoreDistribution:  ScoreRangeItem[];
  jobQueue:            ChartItem[];
}

export interface DashboardStats {
  users: {
    total: number;
    students: number;
    instructors: number;
    admins: number;
    newThisWeek: number;
  };
  presentations: {
    total: number;
    thisWeek: number;
    today: number;
  };
  reports: {
    total: number;
    confirmed: number;
    pending: number;
  };
  courses: {
    total: number;
    classes: number;
    active: number;
    enrollments: number;
  };
  groups: {
    total: number;
    finalized: number;
  };
  jobs: {
    pending: number;
    processing: number;
  };
  avgScore: number | null;
}

export interface DashboardMetrics {
  stats: DashboardStats;
  charts: DashboardCharts;
  topClasses: DashboardClass[];
  topInstructors: DashboardInstructor[];
  recentUsers: DashboardUser[];
  recentPresentations: DashboardPresentation[];
}

export interface AdminDashboardState {
  metrics: DashboardMetrics | null;
  loading: boolean;
  error: string | null;
}

// ── Thunk ───────────────────────────────────────────────────────────────────

export const fetchAdminDashboard = createAsyncThunk<
  DashboardMetrics,
  void,
  { rejectValue: string }
>(
  "adminDashboard/fetchDashboard",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get<{ success: boolean; data: DashboardMetrics }>(
        ADMIN_DASHBOARD_ENDPOINT,
      );
      return response.data.data;
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as Error)?.message ||
        "Failed to fetch dashboard metrics";
      return rejectWithValue(message);
    }
  },
);

// ── Slice ────────────────────────────────────────────────────────────────────

const initialState: AdminDashboardState = {
  metrics: null,
  loading: false,
  error: null,
};

const adminDashboardSlice = createSlice({
  name: "adminDashboard",
  initialState,
  reducers: {
    clearDashboard: (state) => {
      state.metrics = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminDashboard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminDashboard.fulfilled, (state, action) => {
        state.loading = false;
        state.metrics = action.payload;
      })
      .addCase(fetchAdminDashboard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Unknown error";
      });
  },
});

export const { clearDashboard } = adminDashboardSlice.actions;
export default adminDashboardSlice.reducer;
