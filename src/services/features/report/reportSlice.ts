import {
  CONFIRM_REPORT_ENDPOINT,
  REJECT_REPORT_ENDPOINT,
  REPORT_PRESENTATION_ENDPOINT,
  CRITERION_FEEDBACKS_ENDPOINT,
  CRITERION_FEEDBACK_ENDPOINT,
} from "@/services/constant/apiConfig";
import axiosInstance from "@/services/constant/axiosInstance";
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

interface SubmissionSummary {
  presentationId: number;
  title: string;
  status: string;
}

interface ClassSummary {
  classId: number;
  classCode: string;
}

interface RubricTemplateSummary {
  rubricTemplateId: number;
  templateName: string;
}

export interface CriterionScore {
  score: number;
  weight: number;
  comment: string;
  maxScore: number;
  criteriaId: number;
  suggestions: string[];
  criteriaName: string;
}

interface CriterionFeedbackInstructor {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
}

interface CriterionFeedbackCriteria {
  classRubricCriteriaId: number;
  criteriaName: string;
  criteriaDescription: string;
  maxScore: number;
}

export interface CriterionFeedback {
  criterionFeedbackId: number;
  reportId: number;
  classRubricCriteriaId: number;
  instructorId: number;
  score: string | null;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
  instructor: CriterionFeedbackInstructor;
  classRubricCriteria: CriterionFeedbackCriteria;
}

export interface PresentationReport {
  reportId: number;
  submissionId: number;
  classId: number;
  configId: number | null;
  rubricTemplateId: number | null;
  classAiSettingId: number | null;
  overallScore: string;
  criterionScores: Record<string, CriterionScore>;
  reportContent: string;
  reportStatus: string;
  confirmedByInstructorId: number | null;
  confirmedAt: string | null;
  generatedByModel: string | null;
  generatedAt: string;
  createdAt: string;
  updatedAt: string;
  submission: SubmissionSummary;
  class: ClassSummary;
  rubricTemplate: RubricTemplateSummary | null;
  confirmer: unknown;
  criterionFeedbacks?: CriterionFeedback[];
}

interface ReportResponse {
  success: boolean;
  data: PresentationReport;
}

interface CriterionFeedbackListResponse {
  success: boolean;
  data: CriterionFeedback[];
  message?: string;
}

interface CriterionFeedbackResponse {
  success: boolean;
  data: CriterionFeedback;
  message?: string;
}

interface ReportState {
  currentReport: PresentationReport | null;
  criterionFeedbacks: CriterionFeedback[];
  loading: boolean;
  confirmLoading: boolean;
  rejectLoading: boolean;
  feedbackLoading: boolean;
  feedbackMutating: boolean;
  error: string | null;
}

const initialState: ReportState = {
  currentReport: null,
  criterionFeedbacks: [],
  loading: false,
  confirmLoading: false,
  rejectLoading: false,
  feedbackLoading: false,
  feedbackMutating: false,
  error: null,
};

export const fetchPresentationReport = createAsyncThunk(
  "report/fetchPresentationReport",
  async (presentationId: number, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get<ReportResponse>(
        REPORT_PRESENTATION_ENDPOINT(presentationId.toString()),
      );
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Không thể tải kết quả AI report",
      );
    }
  },
);

export const confirmPresentationReport = createAsyncThunk(
  "report/confirmPresentationReport",
  async (reportId: number, { rejectWithValue }) => {
    try {
      await axiosInstance.put(CONFIRM_REPORT_ENDPOINT(reportId.toString()));
      return reportId;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Không thể xác nhận AI report",
      );
    }
  },
);

export const rejectPresentationReport = createAsyncThunk(
  "report/rejectPresentationReport",
  async (reportId: number, { rejectWithValue }) => {
    try {
      await axiosInstance.put(REJECT_REPORT_ENDPOINT(reportId.toString()));
      return reportId;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Không thể từ chối AI report",
      );
    }
  },
);

export const fetchCriterionFeedbacks = createAsyncThunk(
  "report/fetchCriterionFeedbacks",
  async (reportId: number, { rejectWithValue }) => {
    try {
      const response =
        await axiosInstance.get<CriterionFeedbackListResponse>(
          CRITERION_FEEDBACKS_ENDPOINT(reportId.toString()),
        );
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message ||
          "Không thể tải danh sách criterion feedback",
      );
    }
  },
);

export interface CreateCriterionFeedbackPayload {
  reportId: number;
  classRubricCriteriaId: number;
  score?: number;
  comment?: string;
}

export const createCriterionFeedback = createAsyncThunk(
  "report/createCriterionFeedback",
  async (payload: CreateCriterionFeedbackPayload, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post<CriterionFeedbackResponse>(
        CRITERION_FEEDBACKS_ENDPOINT(payload.reportId.toString()),
        {
          classRubricCriteriaId: payload.classRubricCriteriaId,
          ...(payload.score !== undefined && { score: payload.score }),
          ...(payload.comment !== undefined && { comment: payload.comment }),
        },
      );
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Không thể tạo criterion feedback",
      );
    }
  },
);

export interface UpsertCriterionFeedbackPayload {
  reportId: number;
  classRubricCriteriaId: number;
  score?: number;
  comment?: string;
}

export const upsertCriterionFeedback = createAsyncThunk(
  "report/upsertCriterionFeedback",
  async (payload: UpsertCriterionFeedbackPayload, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put<CriterionFeedbackResponse>(
        CRITERION_FEEDBACK_ENDPOINT(
          payload.reportId.toString(),
          payload.classRubricCriteriaId.toString(),
        ),
        {
          ...(payload.score !== undefined && { score: payload.score }),
          ...(payload.comment !== undefined && { comment: payload.comment }),
        },
      );
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message ||
          "Không thể cập nhật criterion feedback",
      );
    }
  },
);

export const deleteCriterionFeedback = createAsyncThunk(
  "report/deleteCriterionFeedback",
  async (
    { reportId, classRubricCriteriaId }: { reportId: number; classRubricCriteriaId: number },
    { rejectWithValue },
  ) => {
    try {
      await axiosInstance.delete(
        CRITERION_FEEDBACK_ENDPOINT(
          reportId.toString(),
          classRubricCriteriaId.toString(),
        ),
      );
      return classRubricCriteriaId;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Không thể xóa criterion feedback",
      );
    }
  },
);

const reportSlice = createSlice({
  name: "report",
  initialState,
  reducers: {
    clearReportError: (state) => {
      state.error = null;
    },
    clearCurrentReport: (state) => {
      state.currentReport = null;
      state.criterionFeedbacks = [];
      state.error = null;
      state.loading = false;
      state.confirmLoading = false;
      state.rejectLoading = false;
      state.feedbackLoading = false;
      state.feedbackMutating = false;
    },
    setCurrentReport: (
      state,
      action: PayloadAction<PresentationReport | null>,
    ) => {
      state.currentReport = action.payload;
    },
    clearCriterionFeedbacks: (state) => {
      state.criterionFeedbacks = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchPresentationReport
      .addCase(fetchPresentationReport.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPresentationReport.fulfilled, (state, action) => {
        state.loading = false;
        state.currentReport = action.payload;
      })
      .addCase(fetchPresentationReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // confirmPresentationReport
      .addCase(confirmPresentationReport.pending, (state) => {
        state.confirmLoading = true;
        state.error = null;
      })
      .addCase(confirmPresentationReport.fulfilled, (state) => {
        state.confirmLoading = false;
      })
      .addCase(confirmPresentationReport.rejected, (state, action) => {
        state.confirmLoading = false;
        state.error = action.payload as string;
      })
      // rejectPresentationReport
      .addCase(rejectPresentationReport.pending, (state) => {
        state.rejectLoading = true;
        state.error = null;
      })
      .addCase(rejectPresentationReport.fulfilled, (state) => {
        state.rejectLoading = false;
      })
      .addCase(rejectPresentationReport.rejected, (state, action) => {
        state.rejectLoading = false;
        state.error = action.payload as string;
      })
      // fetchCriterionFeedbacks
      .addCase(fetchCriterionFeedbacks.pending, (state) => {
        state.feedbackLoading = true;
        state.error = null;
      })
      .addCase(fetchCriterionFeedbacks.fulfilled, (state, action) => {
        state.feedbackLoading = false;
        state.criterionFeedbacks = action.payload;
      })
      .addCase(fetchCriterionFeedbacks.rejected, (state, action) => {
        state.feedbackLoading = false;
        state.error = action.payload as string;
      })
      // createCriterionFeedback
      .addCase(createCriterionFeedback.pending, (state) => {
        state.feedbackMutating = true;
        state.error = null;
      })
      .addCase(createCriterionFeedback.fulfilled, (state, action) => {
        state.feedbackMutating = false;
        const idx = state.criterionFeedbacks.findIndex(
          (f) => f.criterionFeedbackId === action.payload.criterionFeedbackId,
        );
        if (idx >= 0) {
          state.criterionFeedbacks[idx] = action.payload;
        } else {
          state.criterionFeedbacks.push(action.payload);
        }
      })
      .addCase(createCriterionFeedback.rejected, (state, action) => {
        state.feedbackMutating = false;
        state.error = action.payload as string;
      })
      // upsertCriterionFeedback
      .addCase(upsertCriterionFeedback.pending, (state) => {
        state.feedbackMutating = true;
        state.error = null;
      })
      .addCase(upsertCriterionFeedback.fulfilled, (state, action) => {
        state.feedbackMutating = false;
        const idx = state.criterionFeedbacks.findIndex(
          (f) =>
            f.classRubricCriteriaId === action.payload.classRubricCriteriaId,
        );
        if (idx >= 0) {
          state.criterionFeedbacks[idx] = action.payload;
        } else {
          state.criterionFeedbacks.push(action.payload);
        }
      })
      .addCase(upsertCriterionFeedback.rejected, (state, action) => {
        state.feedbackMutating = false;
        state.error = action.payload as string;
      })
      // deleteCriterionFeedback
      .addCase(deleteCriterionFeedback.pending, (state) => {
        state.feedbackMutating = true;
        state.error = null;
      })
      .addCase(deleteCriterionFeedback.fulfilled, (state, action) => {
        state.feedbackMutating = false;
        state.criterionFeedbacks = state.criterionFeedbacks.filter(
          (f) => f.classRubricCriteriaId !== action.payload,
        );
      })
      .addCase(deleteCriterionFeedback.rejected, (state, action) => {
        state.feedbackMutating = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearReportError,
  clearCurrentReport,
  setCurrentReport,
  clearCriterionFeedbacks,
} = reportSlice.actions;
export default reportSlice.reducer;
