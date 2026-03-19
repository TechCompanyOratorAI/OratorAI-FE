import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../constant/axiosInstance";
import {
  GET_RUBRIC_BY_CLASS_ENDPOINT,
  CREATE_RUBRIC_BY_CLASS_ENDPOINT,
  UPDATE_CLASS_RUBRIC_ENDPOINT,
  DELETE_CLASS_RUBRIC_ENDPOINT,
} from "../../constant/apiConfig";

export interface RubricTemplateSummary {
  rubricTemplateId: number;
  templateName: string;
}

export interface RubricSourceCriteria {
  criteriaId: number;
  criteriaName: string;
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

interface RubricState {
  criteria: ClassRubricCriteria[];
  loading: boolean;
  actionLoading: boolean;
  error: string | null;
}

interface RubricByClassResponse {
  success: boolean;
  data: ClassRubricCriteria[];
}

const initialState: RubricState = {
  criteria: [],
  loading: false,
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

interface RubricMutationResponse {
  success: boolean;
  data?: ClassRubricCriteria;
  message?: string;
}

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
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRubricByClass.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRubricByClass.fulfilled, (state, action) => {
        state.loading = false;
        state.criteria = action.payload;
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

export const { clearRubricError, clearRubricCriteria } = rubricSlice.actions;
export default rubricSlice.reducer;
