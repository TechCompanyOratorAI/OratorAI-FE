import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { api } from "@/services/constant/axiosInstance";
import {
  FILTER_INSTRUCTORS_BY_CLASS_ENDPOINT,
  FILTER_INSTRUCTORS_BY_COURSE_ENDPOINT,
  GET_ALL_USERS_ENDPOINT,
  DEPARTMENTS_ENDPOINT,
  CREATE_DEPARTMENT_ENDPOINT,
  UPDATE_DEPARTMENT_ENDPOINT,
  DELETE_DEPARTMENT_ENDPOINT,
} from "@/services/constant/apiConfig";

export type UserRoleName = "Student" | "Instructor" | string;

export interface UserRole {
  userRoleId: number;
  userId: number;
  roleId: number;
  assignedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  role?: {
    roleId: number;
    roleName: UserRoleName;
    description?: string;
    createdAt?: string;
    updatedAt?: string;
  };
}

export interface AdminUser {
  userId: number;
  username: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  isActive: boolean;
  isEmailVerified: boolean;
  lastLoginAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  userRoles?: UserRole[];
  avatar?: string | null;
}

export interface AdminState {
  users: AdminUser[];
  departments: Department[];
  loading: boolean;
  error: string | null;
}

export interface Department {
  departmentId: number;
  departmentCode: string;
  departmentName: string;
  description?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const initialState: AdminState = {
  users: [],
  departments: [],
  loading: false,
  error: null,
};

export const fetchAllUsers = createAsyncThunk<AdminUser[]>(
  "admin/fetchAllUsers",
  async (_, { rejectWithValue }) =>
    api
      .get(GET_ALL_USERS_ENDPOINT)
      .then((res) => {
        const raw = res.data as unknown;
        // Normalize possible API shapes: array or { data: [...] }
        if (Array.isArray(raw)) return raw as AdminUser[];
        if (
          raw &&
          typeof raw === "object" &&
          Array.isArray((raw as any).data)
        ) {
          return (raw as any).data as AdminUser[];
        }
        return [] as AdminUser[];
      })
      .catch((err) =>
        rejectWithValue(err.response?.data?.message || "Failed to load users"),
      ),
);
export const fetchInstructorByCourse = createAsyncThunk<AdminUser[], string>(
  "admin/fetchInstructorByCourse",
  async (courseId, { rejectWithValue }) =>
    api
      .get(FILTER_INSTRUCTORS_BY_COURSE_ENDPOINT(courseId))
      .then((res) => {
        const raw = res.data as unknown;
        // Normalize possible API shapes: array or { data: [...] }
        if (Array.isArray(raw)) return raw as AdminUser[];
        if (
          raw &&
          typeof raw === "object" &&
          Array.isArray((raw as any).data)
        ) {
          return (raw as any).data as AdminUser[];
        }
        return [] as AdminUser[];
      })
      .catch((err) =>
        rejectWithValue(
          err.response?.data?.message || "Failed to load instructors",
        ),
      ),
);
export const fetchInstructorByClass = createAsyncThunk<AdminUser[], string>(
  "admin/fetchInstructorByClass",
  async (courseId, { rejectWithValue }) =>
    api
      .get(FILTER_INSTRUCTORS_BY_CLASS_ENDPOINT(courseId))
      .then((res) => {
        const raw = res.data as unknown;
        // Normalize possible API shapes: array or { data: [...] }
        if (Array.isArray(raw)) return raw as AdminUser[];
        if (
          raw &&
          typeof raw === "object" &&
          Array.isArray((raw as any).data)
        ) {
          return (raw as any).data as AdminUser[];
        }
        return [] as AdminUser[];
      })
      .catch((err) =>
        rejectWithValue(
          err.response?.data?.message || "Failed to load instructors",
        ),
      ),
);
//Department fetch
export const fetchDepartments = createAsyncThunk<Department[]>(
  "admin/fetchDepartments",
  async (_, { rejectWithValue }) =>
    api
      .get(DEPARTMENTS_ENDPOINT)
      .then((res) => {
        const raw = res.data as unknown;
        // Normalize possible API shapes: array or { data: [...] }
        if (Array.isArray(raw)) return raw as Department[];
        if (
          raw &&
          typeof raw === "object" &&
          Array.isArray((raw as any).data)
        ) {
          return (raw as any).data as Department[];
        }
        return [] as Department[];
      })
      .catch((err) =>
        rejectWithValue(
          err.response?.data?.message || "Failed to load departments",
        ),
      ),
);
export const createDepartment = createAsyncThunk<
  Department,
  { departmentCode: string; departmentName?: string; description?: string }
>("admin/createDepartment", async (departmentData, { rejectWithValue }) =>
  api
    .post(CREATE_DEPARTMENT_ENDPOINT, departmentData)
    .then((res) => res.data)
    .catch((err) =>
      rejectWithValue(
        err.response?.data?.message || "Failed to create department",
      ),
    ),
);
export const updateDepartment = createAsyncThunk<
  Department,
  {
    departmentId: string;
    departmentName?: string;
    description?: string;
    isActive?: boolean;
  }
>(
  "admin/updateDepartment",
  async ({ departmentId, ...departmentData }, { rejectWithValue }) =>
    api
      .put(UPDATE_DEPARTMENT_ENDPOINT(departmentId), departmentData)
      .then((res) => res.data)
      .catch((err) =>
        rejectWithValue(
          err.response?.data?.message || "Failed to update department",
        ),
      ),
);
export const deleteDepartment = createAsyncThunk<Department, string>(
  "admin/deleteDepartment",
  async (departmentId, { rejectWithValue }) =>
    api
      .delete(DELETE_DEPARTMENT_ENDPOINT(departmentId))
      .then((res) => res.data)
      .catch((err) =>
        rejectWithValue(
          err.response?.data?.message || "Failed to delete department",
        ),
      ),
);

const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchAllUsers.fulfilled,
        (state, action: PayloadAction<AdminUser[]>) => {
          state.loading = false;
          state.users = action.payload;
        },
      )
      .addCase(fetchAllUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to load users";
      });
    builder
      .addCase(fetchInstructorByCourse.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchInstructorByCourse.fulfilled,
        (state, action: PayloadAction<AdminUser[]>) => {
          state.loading = false;
          state.users = action.payload;
        },
      )
      .addCase(fetchInstructorByCourse.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) || "Failed to load instructors";
      });
    builder
      .addCase(fetchInstructorByClass.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchInstructorByClass.fulfilled,
        (state, action: PayloadAction<AdminUser[]>) => {
          state.loading = false;
          state.users = action.payload;
        },
      )
      .addCase(fetchInstructorByClass.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) || "Failed to load instructors";
      });
    builder
      .addCase(fetchDepartments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchDepartments.fulfilled,
        (state, action: PayloadAction<Department[]>) => {
          state.loading = false;
          state.departments = action.payload;
        },
      )
      .addCase(fetchDepartments.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) || "Failed to load departments";
      });
  },
});

export default adminSlice.reducer;
