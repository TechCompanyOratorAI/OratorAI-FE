import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosInstance from "@/services/constant/axiosInstance";
import {
  CREATE_CRITERIA_BY_RUBRIC_TEMPLATE_ENDPOINT,
  CREATE_RUBRIC_TEMPLATE_ENDPOINT,
  DELETE_CRITERIA_BY_RUBRIC_TEMPLATE_ENDPOINT,
  DELETE_RUBRIC_TEMPLATE_ENDPOINT,
  GET_ALL_RUBRIC_TEMPLATES_ENDPOINT,
  UPDATE_CRITERIA_BY_RUBRIC_TEMPLATE_ENDPOINT,
  UPDATE_RUBRIC_TEMPLATE_ENDPOINT,
} from "@/services/constant/apiConfig";

export interface RubricTemplateCriterion {
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

export interface RubricTemplateState {
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
interface RubricTemplateMutationPayload {
  template?: RubricTemplate;
  message?: string;
}

export interface RubricTemplatePayload {
  templateName: string;
  description: string;
  assignmentType: string;
  isDefault: boolean;
}

export interface RubricTemplateCriterionPayload {
  criteriaName: string;
  criteriaDescription: string;
  weight: number;
  maxScore: number;
  displayOrder: number;
  evaluationGuide: string;
  isActive?: boolean;
}

export interface RubricTemplateCriteriaBatchUpdatePayload {
  criteriaName: string;
  criteriaDescription: string;
  weight: number;
  maxScore: number;
  displayOrder: number;
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
  RubricTemplateMutationPayload,
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

    return { template: response.data.data, message: response.data.message };
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Failed to create rubric template",
    );
  }
});

export const updateRubricTemplate = createAsyncThunk<
  RubricTemplateMutationPayload,
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

      return { template: response.data.data, message: response.data.message };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update rubric template",
      );
    }
  },
);

export const deleteRubricTemplate = createAsyncThunk<
  { rubricTemplateId: number; message?: string },
  number,
  { rejectValue: string }
>("rubricTemplate/delete", async (rubricTemplateId, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.delete<RubricTemplateMutationResponse>(
      DELETE_RUBRIC_TEMPLATE_ENDPOINT(rubricTemplateId.toString()),
    );
    return { rubricTemplateId, message: response.data?.message };
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Failed to delete rubric template",
    );
  }
});

export const createRubricTemplateCriterion = createAsyncThunk<
  RubricTemplateCriterion,
  { rubricTemplateId: number; data: RubricTemplateCriterionPayload },
  { rejectValue: string }
>(
  "rubricTemplate/createCriterion",
  async ({ rubricTemplateId, data }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post<{
        success: boolean;
        data?: RubricTemplateCriterion;
        message?: string;
      }>(
        CREATE_CRITERIA_BY_RUBRIC_TEMPLATE_ENDPOINT(
          rubricTemplateId.toString(),
        ),
        data,
      );

      if (!response.data?.data) {
        throw new Error("Invalid create criterion response");
      }

      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create rubric criterion",
      );
    }
  },
);

export const updateRubricTemplateCriterion = createAsyncThunk<
  RubricTemplateCriterion,
  { criteriaId: number; data: RubricTemplateCriteriaBatchUpdatePayload },
  { rejectValue: string }
>(
  "rubricTemplate/updateCriterion",
  async ({ criteriaId, data }, { rejectWithValue }) => {
    try {
      const normalizedData: RubricTemplateCriteriaBatchUpdatePayload = {
        criteriaName: data.criteriaName.trim(),
        criteriaDescription: data.criteriaDescription.trim(),
        weight: Number(data.weight),
        maxScore: Number(data.maxScore),
        displayOrder: Number(data.displayOrder),
      };

      const response = await axiosInstance.put<{
        success: boolean;
        data?: RubricTemplateCriterion;
        message?: string;
      }>(
        UPDATE_CRITERIA_BY_RUBRIC_TEMPLATE_ENDPOINT(criteriaId.toString()),
        normalizedData,
      );

      if (!response.data?.data) {
        throw new Error("Invalid update criterion response");
      }

      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update rubric criterion",
      );
    }
  },
);

export const deleteRubricTemplateCriterion = createAsyncThunk<
  { criteriaId: number; rubricTemplateId: number },
  { criteriaId: number; rubricTemplateId: number },
  { rejectValue: string }
>(
  "rubricTemplate/deleteCriterion",
  async ({ criteriaId, rubricTemplateId }, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(
        DELETE_CRITERIA_BY_RUBRIC_TEMPLATE_ENDPOINT(criteriaId.toString()),
      );

      return { criteriaId, rubricTemplateId };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete rubric criterion",
      );
    }
  },
);

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
        if (action.payload.template) {
          state.templates = [action.payload.template, ...state.templates];
        }
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
        const updatedTemplate = action.payload.template;
        if (!updatedTemplate) {
          return;
        }
        state.templates = state.templates.map((template) =>
          template.rubricTemplateId === updatedTemplate.rubricTemplateId
            ? updatedTemplate
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
          (template) => template.rubricTemplateId !== action.payload.rubricTemplateId,
        );
      })
      .addCase(deleteRubricTemplate.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || "Failed to delete rubric template";
      })
      .addCase(createRubricTemplateCriterion.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(createRubricTemplateCriterion.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.templates = state.templates.map((template) => {
          if (template.rubricTemplateId !== action.payload.rubricTemplateId) {
            return template;
          }

          return {
            ...template,
            criteria: [...(template.criteria || []), action.payload],
          };
        });
      })
      .addCase(createRubricTemplateCriterion.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || "Failed to create rubric criterion";
      })
      .addCase(updateRubricTemplateCriterion.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(updateRubricTemplateCriterion.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.templates = state.templates.map((template) => ({
          ...template,
          criteria: (template.criteria || []).map((criterion) =>
            criterion.criteriaId === action.payload.criteriaId
              ? action.payload
              : criterion,
          ),
        }));
      })
      .addCase(updateRubricTemplateCriterion.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || "Failed to update rubric criterion";
      })
      .addCase(deleteRubricTemplateCriterion.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(deleteRubricTemplateCriterion.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.templates = state.templates.map((template) => {
          if (template.rubricTemplateId !== action.payload.rubricTemplateId) {
            return template;
          }

          return {
            ...template,
            criteria: (template.criteria || []).filter(
              (criterion) => criterion.criteriaId !== action.payload.criteriaId,
            ),
          };
        });
      })
      .addCase(deleteRubricTemplateCriterion.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || "Failed to delete rubric criterion";
      });
  },
});

export const { clearRubricTemplateError } = rubricTemplateSlice.actions;
export default rubricTemplateSlice.reducer;
