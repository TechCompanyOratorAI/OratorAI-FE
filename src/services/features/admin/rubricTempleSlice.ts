import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosInstance from "@/services/constant/axiosInstance";
import {
  CREATE_RUBRIC_TEMPLATE_ENDPOINT,
  DELETE_RUBRIC_TEMPLATE_ENDPOINT,
  GET_ALL_RUBRIC_TEMPLATES_ENDPOINT,
  UPDATE_RUBRIC_TEMPLATE_ENDPOINT,
} from "@/services/constant/apiConfig";

export interface RubricTemplateCriterion {
  criteriaId: number;
  rubricTemplateId: number;
  criteriaName: string;
  criteriaDescription: string;
  weight: string;
  maxScore: number;
  displayOrder: number;
  evaluationGuide: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface RubricTemplate {
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
  creator: unknown;
  criteria: RubricTemplateCriterion[];
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface RubricTemplateState {
  templates: RubricTemplate[];
  pagination: Pagination | null;
  loading: boolean;
  actionLoading: boolean;
  error: string | null;
}

interface RubricTemplateListResponse {
  success: boolean;
  data: {
    templates: RubricTemplate[];
    pagination: Pagination;
  };
}

interface RubricTemplateMutationResponse {
  success: boolean;
  data?: RubricTemplate;
  message?: string;
}

export interface RubricTemplatePayload {
  templateName: string;
  description: string;
  assignmentType: string;
  isDefault: boolean;
}

const initialState: RubricTemplateState = {
  templates: [],
  pagination: null,
  loading: false,
  actionLoading: false,
  error: null,
};

export const fetchRubricTemplates = createAsyncThunk<
  { templates: RubricTemplate[]; pagination: Pagination },
  { page?: number; limit?: number } | void,
  { rejectValue: string }
>("rubricTemplate/fetchAll", async (params, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.get<RubricTemplateListResponse>(
      GET_ALL_RUBRIC_TEMPLATES_ENDPOINT,
      {
        params: {
          page: params?.page ?? 1,
          limit: params?.limit ?? 20,
        },
      },
    );

    return {
      templates: response.data?.data?.templates || [],
      pagination: response.data?.data?.pagination || {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      },
    };
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Failed to fetch rubric templates",
    );
  }
});

export const createRubricTemplate = createAsyncThunk<
  RubricTemplate,
  RubricTemplatePayload,
  { rejectValue: string }
>("rubricTemplate/create", async (payload, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.post<RubricTemplateMutationResponse>(
      CREATE_RUBRIC_TEMPLATE_ENDPOINT,
      payload,
    );

    if (!response.data?.data) {
      throw new Error("Invalid create response");
    }

    return response.data.data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Failed to create rubric template",
    );
  }
});

export const updateRubricTemplate = createAsyncThunk<
  RubricTemplate,
  { rubricTemplateId: number; data: RubricTemplatePayload },
  { rejectValue: string }
>(
  "rubricTemplate/update",
  async ({ rubricTemplateId, data }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put<RubricTemplateMutationResponse>(
        UPDATE_RUBRIC_TEMPLATE_ENDPOINT(rubricTemplateId.toString()),
        data,
      );

      if (!response.data?.data) {
        throw new Error("Invalid update response");
      }

      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update rubric template",
      );
    }
  },
);

export const deleteRubricTemplate = createAsyncThunk<
  number,
  number,
  { rejectValue: string }
>("rubricTemplate/delete", async (rubricTemplateId, { rejectWithValue }) => {
  try {
    await axiosInstance.delete(
      DELETE_RUBRIC_TEMPLATE_ENDPOINT(rubricTemplateId.toString()),
    );
    return rubricTemplateId;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Failed to delete rubric template",
    );
  }
});

const rubricTemplateSlice = createSlice({
  name: "rubricTemplate",
  initialState,
  reducers: {
    clearRubricTemplateError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRubricTemplates.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRubricTemplates.fulfilled, (state, action) => {
        state.loading = false;
        state.templates = action.payload.templates;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchRubricTemplates.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch rubric templates";
      })
      .addCase(createRubricTemplate.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(createRubricTemplate.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.templates = [action.payload, ...state.templates];
      })
      .addCase(createRubricTemplate.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || "Failed to create rubric template";
      })
      .addCase(updateRubricTemplate.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(updateRubricTemplate.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.templates = state.templates.map((template) =>
          template.rubricTemplateId === action.payload.rubricTemplateId
            ? action.payload
            : template,
        );
      })
      .addCase(updateRubricTemplate.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || "Failed to update rubric template";
      })
      .addCase(deleteRubricTemplate.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(deleteRubricTemplate.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.templates = state.templates.filter(
          (template) => template.rubricTemplateId !== action.payload,
        );
      })
      .addCase(deleteRubricTemplate.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || "Failed to delete rubric template";
      });
  },
});

export const { clearRubricTemplateError } = rubricTemplateSlice.actions;
export default rubricTemplateSlice.reducer;
