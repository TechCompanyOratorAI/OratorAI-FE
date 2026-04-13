import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axiosInstance from "@/services/constant/axiosInstance";
import { CLASS_SCORES_ENDPOINT } from "@/services/constant/apiConfig";

// ── Types ────────────────────────────────────────────────────────────────────

export interface ClassScoreInstructor {
  userId: number;
  firstName: string;
  lastName: string;
  fullName: string;
}

export interface ClassScoreCriterion {
  classRubricCriteriaId: number;
  criteriaName: string;
  maxScore: number;
  weight: number;
  displayOrder: number;
}

export interface StudentRubricScore {
  classRubricCriteriaId: number;
  criteriaName: string;
  maxScore: number;
  weight: number;
  averageScore: number | null;
}

export interface StudentPresentation {
  presentationId: number;
  title: string;
  submittedAt: string | null;
  status: string;
  hasReport: boolean;
  overallScore: number | null;
  gradeForInstructor: number | null;
  receivedGrade: number | null;
  percentage: number | null;
  reportStatus: string | null;
  confirmedAt: string | null;
}

export interface StudentScoreData {
  enrollmentId: number;
  enrolledAt: string;
  finalGrade: number | null;
  student: {
    userId: number;
    username: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  overallAverageScore: number | null;
  instructorAverageScore: number | null;
  rubricScores: StudentRubricScore[];
  presentations: StudentPresentation[];
  totalPresentations: number;
  totalReports: number;
}

export interface ClassScoreResponse {
  class: {
    classId: number;
    classCode: string;
    courseId: number;
    status: string;
    instructors: ClassScoreInstructor[];
  };
  criteria: ClassScoreCriterion[];
  students: StudentScoreData[];
  totalStudents: number;
}

export interface ClassScoreState {
  classScores: Record<number, ClassScoreResponse>; // keyed by classId
  loading: Record<number, boolean>;
  error: Record<number, string | null>;
}

// ── Thunk ─────────────────────────────────────────────────────────────────────

export const fetchClassScores = createAsyncThunk<
  ClassScoreResponse,
  number,
  { rejectValue: string }
>(
  "classScore/fetchClassScores",
  async (classId, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(
        CLASS_SCORES_ENDPOINT(classId.toString()),
      );
      return response.data.data as ClassScoreResponse;
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as Error)?.message ||
        "Failed to fetch class scores";
      return rejectWithValue(message);
    }
  },
);

// ── Slice ─────────────────────────────────────────────────────────────────────

const initialState: ClassScoreState = {
  classScores: {},
  loading: {},
  error: {},
};

const classScoreSlice = createSlice({
  name: "classScore",
  initialState,
  reducers: {
    clearClassScore(state, action: PayloadAction<number>) {
      delete state.classScores[action.payload];
      delete state.loading[action.payload];
      delete state.error[action.payload];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchClassScores.pending, (state, action) => {
        const classId = action.meta.arg;
        state.loading[classId] = true;
        state.error[classId] = null;
      })
      .addCase(fetchClassScores.fulfilled, (state, action) => {
        const classId = action.payload.class.classId;
        state.loading[classId] = false;
        state.classScores[classId] = action.payload;
      })
      .addCase(fetchClassScores.rejected, (state, action) => {
        const classId = action.meta.arg;
        state.loading[classId] = false;
        state.error[classId] = action.payload ?? "Unknown error";
      });
  },
});

export const { clearClassScore } = classScoreSlice.actions;
export default classScoreSlice.reducer;
