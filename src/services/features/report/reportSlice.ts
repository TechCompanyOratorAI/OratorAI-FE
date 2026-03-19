import { REPORT_PRESENTATION_ENDPOINT } from "@/services/constant/apiConfig";
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

interface CriterionScore {
  score: number;
  weight: number;
  comment: string;
  maxScore: number;
  criteriaId: number;
  suggestions: string[];
  criteriaName: string;
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
}

interface ReportResponse {
  success: boolean;
  data: PresentationReport;
}

interface ReportState {
  currentReport: PresentationReport | null;
  loading: boolean;
  error: string | null;
}

const initialState: ReportState = {
  currentReport: null,
  loading: false,
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

const reportSlice = createSlice({
  name: "report",
  initialState,
  reducers: {
    clearReportError: (state) => {
      state.error = null;
    },
    clearCurrentReport: (state) => {
      state.currentReport = null;
      state.error = null;
      state.loading = false;
    },
    setCurrentReport: (
      state,
      action: PayloadAction<PresentationReport | null>,
    ) => {
      state.currentReport = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
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
      });
  },
});

export const { clearReportError, clearCurrentReport, setCurrentReport } =
  reportSlice.actions;
export default reportSlice.reducer;
