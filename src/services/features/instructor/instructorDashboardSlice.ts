import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "@/services/constant/axiosInstance";
import {
  GET_CLASSES_BY_INSTRUCTOR_ENDPOINT,
  CLASS_STUDENTS_ENDPOINT,
  AI_REPORTS_BY_CLASS_ENDPOINT,
  CLASS_SCORES_ENDPOINT,
  INSTRUCTOR_DASHBOARD_ENDPOINT,
} from "@/services/constant/apiConfig";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface TeachingClassInfo {
  classId: number;
  classCode: string;
  status: "active" | "inactive" | "archived";
  startDate: string;
  endDate: string;
  maxStudents: number;
  maxGroupMembers: number | null;
  enrollmentCount: number;
  course: {
    courseId: number;
    courseCode: string;
    courseName: string;
    semester: string;
    academicYear: number;
  };
  instructors: Array<{
    userId: number;
    username: string;
    firstName: string;
    lastName: string;
    email: string;
  }>;
  activeKeys: Array<{
    keyId: number;
    keyValue: string;
    isActive: boolean;
    expiresAt: string | null;
    maxUses: number | null;
    usedCount: number;
  }>;
  createdAt: string;
}

export interface AIRReportSummary {
  reportId: number;
  submissionId: number;
  classId: number;
  overallScore: string | null;
  reportStatus: "pending" | "confirmed" | "rejected" | "processing" | string;
  gradeForInstructor: number | null;
  confirmedAt: string | null;
  feedbackOfInstructor: string | null;
  generatedAt: string;
  submission: {
    presentationId: number;
    title: string;
    status: string;
  };
  student: {
    userId: number;
    username: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
}

export interface ClassStudentSummary {
  enrollmentId: number;
  enrolledAt: string;
  student: {
    userId: number;
    username: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface TeachingClassStats {
  classId: number;
  classCode: string;
  totalStudents: number;
  pendingReports: number;
  needsFeedback: number;   // reports with status "pending" — AI done, instructor must review
  reviewedReports: number;
  totalReports: number;
  averageScore: number | null;
}

export interface InstructorDashboardState {
  metrics: any | null;
  teachingClasses: TeachingClassInfo[];
  classStats: Record<number, TeachingClassStats>;
  recentReports: AIRReportSummary[];
  loading: boolean;
  reportsLoading: boolean;
  error: string | null;
}

// ── Thunks ────────────────────────────────────────────────────────────────────

export const fetchTeachingClasses = createAsyncThunk(
  "instructorDashboard/fetchTeachingClasses",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get<{ success: boolean; data: TeachingClassInfo[] }>(
        GET_CLASSES_BY_INSTRUCTOR_ENDPOINT,
      );
      return response.data.data || [];
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch teaching classes",
      );
    }
  },
);

export const fetchClassStudentCount = createAsyncThunk(
  "instructorDashboard/fetchClassStudentCount",
  async (classId: number, { rejectWithValue }) => {
    try {
      const response = await api.get<{ success: boolean; total: number; data: ClassStudentSummary[] }>(
        CLASS_STUDENTS_ENDPOINT(classId.toString()),
      );
      return { classId, total: response.data.total || response.data.data?.length || 0 };
    } catch {
      return rejectWithValue("");
    }
  },
);

export const fetchClassAIRReports = createAsyncThunk(
  "instructorDashboard/fetchClassAIRReports",
  async (classId: number, { rejectWithValue }) => {
    try {
      const response = await api.get<{
        success: boolean;
        data: AIRReportSummary[];
        pagination?: { total: number };
      }>(
        AI_REPORTS_BY_CLASS_ENDPOINT(classId.toString()),
        { params: { page: 1, limit: 100 } },
      );
      return { classId, reports: response.data.data || [], total: response.data.pagination?.total || 0 };
    } catch {
      return rejectWithValue("");
    }
  },
);

export const fetchClassAverageScore = createAsyncThunk(
  "instructorDashboard/fetchClassAverageScore",
  async (classId: number, { rejectWithValue }) => {
    try {
      const response = await api.get<{
        success: boolean;
        students: Array<{ overallAverageScore: number | null }>;
        totalStudents: number;
      }>(CLASS_SCORES_ENDPOINT(classId.toString()));
      const students = response.data.students || [];
      const withScores = students.filter((s) => s.overallAverageScore !== null);
      const avg = withScores.length > 0
        ? withScores.reduce((sum, s) => sum + (s.overallAverageScore || 0), 0) / withScores.length
        : null;
      return { classId, averageScore: avg };
    } catch {
      return rejectWithValue("");
    }
  },
);

export const fetchInstructorDashboard = createAsyncThunk(
  "instructorDashboard/fetchInstructorDashboard",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get<{ success: boolean; data: any }>(
        INSTRUCTOR_DASHBOARD_ENDPOINT,
      );
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch instructor dashboard",
      );
    }
  },
);

// ── Slice ─────────────────────────────────────────────────────────────────────

const initialState: InstructorDashboardState = {
  metrics: null,
  teachingClasses: [],
  classStats: {},
  recentReports: [],
  loading: false,
  reportsLoading: false,
  error: null,
};

const instructorDashboardSlice = createSlice({
  name: "instructorDashboard",
  initialState,
  reducers: {
    clearDashboardError: (state) => {
      state.error = null;
    },
    clearDashboard: (state) => {
      state.metrics = null;
      state.teachingClasses = [];
      state.classStats = {};
      state.recentReports = [];
      state.loading = false;
      state.reportsLoading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch teaching classes
      .addCase(fetchTeachingClasses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTeachingClasses.fulfilled, (state, action) => {
        state.loading = false;
        state.teachingClasses = action.payload;
        // Initialize empty stats for each class
        action.payload.forEach((cls) => {
          if (!state.classStats[cls.classId]) {
            state.classStats[cls.classId] = {
              classId: cls.classId,
              classCode: cls.classCode,
              totalStudents: cls.enrollmentCount || 0,
              pendingReports: 0,
              needsFeedback: 0,
              reviewedReports: 0,
              totalReports: 0,
              averageScore: null,
            };
          }
        });
      })
      .addCase(fetchTeachingClasses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    builder
      .addCase(fetchInstructorDashboard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInstructorDashboard.fulfilled, (state, action) => {
        state.loading = false;
        state.metrics = action.payload;
      })
      .addCase(fetchInstructorDashboard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch class student count
    builder.addCase(fetchClassStudentCount.fulfilled, (state, action) => {
      const { classId, total } = action.payload;
      if (state.classStats[classId]) {
        state.classStats[classId].totalStudents = total;
      }
    });

    // Fetch class AI reports
    builder.addCase(fetchClassAIRReports.pending, (state) => {
      state.reportsLoading = true;
    });
    builder.addCase(fetchClassAIRReports.fulfilled, (state, action) => {
      state.reportsLoading = false;
      const { classId, reports } = action.payload;
      if (state.classStats[classId]) {
        state.classStats[classId].totalReports = reports.length;
        state.classStats[classId].pendingReports = reports.filter(
          (r) => r.reportStatus === "pending" || r.reportStatus === "processing",
        ).length;
        state.classStats[classId].needsFeedback = reports.filter(
          (r) => r.reportStatus === "pending",
        ).length;
        state.classStats[classId].reviewedReports = reports.filter(
          (r) => r.reportStatus === "confirmed",
        ).length;
      }
      // Collect all reports and sort by date
      const newReports = reports.map((r) => ({ ...r, classId }));
      state.recentReports = [...state.recentReports.filter((r) => r.classId !== classId), ...newReports]
        .sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime())
        .slice(0, 20);
    });
    builder.addCase(fetchClassAIRReports.rejected, (state) => {
      state.reportsLoading = false;
    });

    // Fetch class average score
    builder.addCase(fetchClassAverageScore.fulfilled, (state, action) => {
      const { classId, averageScore } = action.payload;
      if (state.classStats[classId]) {
        state.classStats[classId].averageScore = averageScore;
      }
    });
  },
});

export const { clearDashboardError, clearDashboard } = instructorDashboardSlice.actions;
export default instructorDashboardSlice.reducer;
