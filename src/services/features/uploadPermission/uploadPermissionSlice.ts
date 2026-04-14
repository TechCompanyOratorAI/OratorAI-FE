import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "@/services/constant/axiosInstance";
import { CLASS_UPLOAD_PERMISSION_ENDPOINT } from "@/services/constant/apiConfig";

interface UploadPermission {
  classId: number;
  isUploadEnabled: boolean;
  uploadStartDate: string | null;
  uploadEndDate: string | null;
}

interface UploadPermissionState {
  permissions: Record<number, UploadPermission>;
  loading: boolean;
  error: string | null;
}

const initialState: UploadPermissionState = {
  permissions: {},
  loading: false,
  error: null,
};

export const fetchUploadPermissionByClass = createAsyncThunk(
  "uploadPermission/fetchByClass",
  async (classId: number, { rejectWithValue }) => {
    try {
      const response = await api.get(CLASS_UPLOAD_PERMISSION_ENDPOINT(String(classId)));
      return response.data.data as UploadPermission;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }, message?: string };
      return rejectWithValue(err.response?.data?.message || err.message || "Lỗi khi lấy quyền upload");
    }
  }
);

export const setUploadPermissionByClass = createAsyncThunk(
  "uploadPermission/set",
  async (
    payload: { classId: number; isUploadEnabled: boolean; uploadStartDate?: string | null; uploadEndDate?: string | null },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.post(CLASS_UPLOAD_PERMISSION_ENDPOINT(String(payload.classId)), {
        isUploadEnabled: payload.isUploadEnabled,
        uploadStartDate: payload.uploadStartDate,
        uploadEndDate: payload.uploadEndDate,
      });
      return response.data.data as UploadPermission;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }, message?: string };
      return rejectWithValue(err.response?.data?.message || err.message || "Lỗi khi cập nhật quyền upload");
    }
  }
);

const uploadPermissionSlice = createSlice({
  name: "uploadPermission",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchUploadPermissionByClass.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUploadPermissionByClass.fulfilled, (state, action) => {
        state.loading = false;
        state.permissions[action.payload.classId] = action.payload;
      })
      .addCase(fetchUploadPermissionByClass.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Set
      .addCase(setUploadPermissionByClass.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(setUploadPermissionByClass.fulfilled, (state, action) => {
        state.loading = false;
        state.permissions[action.payload.classId] = action.payload;
      })
      .addCase(setUploadPermissionByClass.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default uploadPermissionSlice.reducer;
export const {  } = uploadPermissionSlice.actions;
