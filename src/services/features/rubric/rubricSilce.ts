import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../constant/axiosInstance";
import {
  GET_RUBRIC_BY_CLASS_ENDPOINT,
  CREATE_RUBRIC_BY_CLASS_ENDPOINT,
  UPDATE_CLASS_RUBRIC_ENDPOINT,
  DELETE_CLASS_RUBRIC_ENDPOINT,
  GET_RUBRIC_TEMPLATES_FOR_INSTRUCTOR_ENDPOINT,
  PICK_RUBRIC_TEMPLATE_FOR_CLASS_ENDPOINT,
  UPDATE_CRITERIA_BY_INSTRUCTOR_ENDPOINT,
} from "../../constant/apiConfig";

export interface RubricTemplateSummary {
  rubricTemplateId: number;
  templateName: string;
}

export interface RubricSourceCriteria {
  criteriaId: number;
  criteriaName: string;
}

export interface RubricTemplateCriteria {
  criteriaId: number;
  rubricTemplateId: number;
  criteriaName: string;
  criteriaDescription: string;
  weight: number | string;
  maxScore: number;
  displayOrder: number;
  evaluationGuide: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface RubricTemplateForInstructor {
  rubricTemplateId: number;
  templateName: string;
  description: string;
  assignmentType: string;
  isDefault: boolean;
  isActive: boolean;
  createdBy: number | null;
  updatedBy: number | null;
  createdAt: string;
  updatedAt: string | null;
  creator?: unknown;
  criteria: RubricTemplateCriteria[];
}

export interface PickRubricTemplatePayload {
  rubricTemplateId: number;
  feedbackLanguage: string;
  reportFormat: string;
  allowInstructorEdit: boolean;
  includeCriterionComments: boolean;
  includeOverallSummary: boolean;
  includeSuggestions: boolean;
}

export interface ClassRubricCriteria {
  classRubricCriteriaId: number;
  classId: number;
  rubricTemplateId: number;
  sourceCriteriaId: number;
  criteriaName: string;
  criteriaDescription: string;
  weight: string;
  maxScore: string;
  displayOrder: number;
  evaluationGuide: string;
  isActive: number;
  createdBy: number | null;
  updatedBy: number | null;
  createdAt: string;
  updatedAt: string | null;
  rubricTemplate?: RubricTemplateSummary;
  sourceCriteria?: RubricSourceCriteria;
}

export interface RubricState {
  criteria: ClassRubricCriteria[];
  templates: RubricTemplateForInstructor[];
  selectedTemplateId: number | null;
  loading: boolean;
  templatesLoading: boolean;
  pickLoading: boolean;
  actionLoading: boolean;
  error: string | null;
}

interface RubricByClassResponse {
  success: boolean;
  data: ClassRubricCriteria[];
}

interface RubricTemplateListResponse {
  success: boolean;
  data:
    | RubricTemplateForInstructor[]
    | {
        templates?: RubricTemplateForInstructor[];
      };
}

const initialState: RubricState = {
  criteria: [],
  templates: [],
  selectedTemplateId: null,
  loading: false,
  templatesLoading: false,
  pickLoading: false,
  actionLoading: false,
  error: null,
};

export interface RubricCriteriaPayload {
  criteriaName: string;
  criteriaDescription: string;
  weight: number;
  maxScore: number;
  displayOrder: number;
  evaluationGuide: string;
}

export interface UpdateCriteriaByInstructorPayload {
  classRubricCriteriaId?: number;
  criteriaName: string;
  criteriaDescription: string;
  weight: number;
  maxScore: number;
  displayOrder: number;
}

interface RubricMutationResponse {
  success: boolean;
  data?: ClassRubricCriteria;
  message?: string;
}

export const fetchRubricTemplatesForInstructor = createAsyncThunk<
  RubricTemplateForInstructor[],
  void,
  { rejectValue: string }
>("rubric/fetchTemplatesForInstructor", async (_, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.get<RubricTemplateListResponse>(
      GET_RUBRIC_TEMPLATES_FOR_INSTRUCTOR_ENDPOINT,
    );

    const rawData = response.data?.data;
    if (Array.isArray(rawData)) {
      return rawData;
    }

    return rawData?.templates || [];
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Failed to fetch rubric templates",
    );
  }
});

export const pickRubricTemplateForClass = createAsyncThunk<
  { selectedTemplateId: number },
  { classId: number; data: PickRubricTemplatePayload },
  { rejectValue: string }
>(
  "rubric/pickTemplateForClass",
  async ({ classId, data }, { rejectWithValue }) => {
    try {
      await axiosInstance.post(
        PICK_RUBRIC_TEMPLATE_FOR_CLASS_ENDPOINT(classId.toString()),
        data,
      );

      return { selectedTemplateId: data.rubricTemplateId };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to pick rubric template",
      );
    }
  },
);

export const fetchRubricByClass = createAsyncThunk<
  ClassRubricCriteria[],
  number,
  { rejectValue: string }
>("rubric/fetchRubricByClass", async (classId, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.get<RubricByClassResponse>(
      GET_RUBRIC_BY_CLASS_ENDPOINT(classId.toString()),
    );
    return response.data?.data || [];
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Failed to fetch class rubric",
    );
  }
});

export const createRubricCriteria = createAsyncThunk<
  ClassRubricCriteria,
  { classId: number; rubricData: RubricCriteriaPayload },
  { rejectValue: string }
>(
  "rubric/createRubricCriteria",
  async ({ classId, rubricData }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post<RubricMutationResponse>(
        CREATE_RUBRIC_BY_CLASS_ENDPOINT(classId.toString()),
        rubricData,
      );

      if (!response.data?.data) {
        throw new Error("Invalid create rubric response");
      }

      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create rubric criteria",
      );
    }
  },
);

export const updateRubricCriteria = createAsyncThunk<
  ClassRubricCriteria,
  {
    classRubricCriteriaId: number;
    rubricData: RubricCriteriaPayload;
  },
  { rejectValue: string }
>(
  "rubric/updateRubricCriteria",
  async ({ classRubricCriteriaId, rubricData }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put<RubricMutationResponse>(
        UPDATE_CLASS_RUBRIC_ENDPOINT(classRubricCriteriaId.toString()),
        rubricData,
      );

      if (!response.data?.data) {
        throw new Error("Invalid update rubric response");
      }

      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update rubric criteria",
      );
    }
  },
);

export const updateCriteriaByInstructor = createAsyncThunk<
  ClassRubricCriteria[] | null,
  { classId: number; criteriaData: UpdateCriteriaByInstructorPayload[] },
  { rejectValue: string }
>(
  "rubric/updateCriteriaByInstructor",
  async ({ classId, criteriaData }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put<{
        success: boolean;
        data?: ClassRubricCriteria[] | { updated?: number; created?: number };
      }>(UPDATE_CRITERIA_BY_INSTRUCTOR_ENDPOINT(classId.toString()), criteriaData);

      const responseData = response.data?.data;
      return Array.isArray(responseData) ? responseData : null;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update criteria by instructor",
      );
    }
  },
);

export const deleteRubricCriteria = createAsyncThunk<
  number,
  { classRubricCriteriaId: number },
  { rejectValue: string }
>(
  "rubric/deleteRubricCriteria",
  async ({ classRubricCriteriaId }, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(
        DELETE_CLASS_RUBRIC_ENDPOINT(classRubricCriteriaId.toString()),
      );
      return classRubricCriteriaId;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete rubric criteria",
      );
    }
  },
);

const rubricSlice = createSlice({
  name: "rubric",
  initialState,
  reducers: {
    clearRubricError: (state) => {
      state.error = null;
    },
    clearRubricCriteria: (state) => {
      state.criteria = [];
    },
    clearRubricTemplates: (state) => {
      state.templates = [];
      state.selectedTemplateId = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRubricTemplatesForInstructor.pending, (state) => {
        state.templatesLoading = true;
        state.error = null;
      })
      .addCase(fetchRubricTemplatesForInstructor.fulfilled, (state, action) => {
        state.templatesLoading = false;
        state.templates = action.payload;
      })
      .addCase(fetchRubricTemplatesForInstructor.rejected, (state, action) => {
        state.templatesLoading = false;
        state.error = action.payload || "Failed to fetch rubric templates";
      })
      .addCase(pickRubricTemplateForClass.pending, (state) => {
        state.pickLoading = true;
        state.error = null;
      })
      .addCase(pickRubricTemplateForClass.fulfilled, (state, action) => {
        state.pickLoading = false;
        state.selectedTemplateId = action.payload.selectedTemplateId;
      })
      .addCase(pickRubricTemplateForClass.rejected, (state, action) => {
        state.pickLoading = false;
        state.error = action.payload || "Failed to pick rubric template";
      })
      .addCase(fetchRubricByClass.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRubricByClass.fulfilled, (state, action) => {
        state.loading = false;
        state.criteria = action.payload;
        state.selectedTemplateId = action.payload[0]?.rubricTemplateId || null;
      })
      .addCase(fetchRubricByClass.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch class rubric";
      })
      .addCase(createRubricCriteria.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(createRubricCriteria.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.criteria = [...state.criteria, action.payload];
      })
      .addCase(createRubricCriteria.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || "Failed to create rubric criteria";
      })
      .addCase(updateRubricCriteria.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(updateRubricCriteria.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.criteria = state.criteria.map((item) =>
          item.classRubricCriteriaId === action.payload.classRubricCriteriaId
            ? action.payload
            : item,
        );
      })
      .addCase(updateRubricCriteria.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || "Failed to update rubric criteria";
      })
      .addCase(updateCriteriaByInstructor.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(updateCriteriaByInstructor.fulfilled, (state, action) => {
        state.actionLoading = false;
        if (Array.isArray(action.payload)) {
          state.criteria = action.payload;
        }
      })
      .addCase(updateCriteriaByInstructor.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || "Failed to update criteria by instructor";
      })
      .addCase(deleteRubricCriteria.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(deleteRubricCriteria.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.criteria = state.criteria.filter(
          (item) => item.classRubricCriteriaId !== action.payload,
        );
      })
      .addCase(deleteRubricCriteria.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || "Failed to delete rubric criteria";
      });
  },
});

export const { clearRubricError, clearRubricCriteria, clearRubricTemplates } =
  rubricSlice.actions;
export default rubricSlice.reducer;
