import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { api } from "@/services/constant/axiosInstance";
import {
  CLASSES_ENDPOINT,
  CREATE_CLASS_ENDPOINT,
  UPDATE_CLASS_ENDPOINT,
  DELETE_CLASS_ENDPOINT,
  ADD_INSTRUCTOR_TO_CLASS_ENDPOINT,
  REMOVE_INSTRUCTOR_FROM_CLASS_ENDPOINT,
  GET_CLASSES_BY_INSTRUCTOR_ENDPOINT,
  CLASS_DETAIL_ENDPOINT,
} from "@/services/constant/apiConfig";

export interface EnrollKey {
  keyId: number;
  isActive: boolean;
  keyValue?: string;
  expiresAt?: string;
  maxUses?: number;
  usedCount?: number;
}

export interface Enrollment {
  enrollmentId: number;
}

export interface CourseInfo {
  courseId: number;
  courseCode: string;
  courseName: string;
  semester?: string;
  academicYear?: number;
}

export interface InstructorInfo {
  userId: number;
  username: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

export interface ClassData {
  classId: number;
  courseId: number;
  classCode: string;
  className: string;
  description: string;
  status: "active" | "inactive" | "archived";
  startDate: string;
  endDate: string;
  maxStudents: number;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  course?: CourseInfo;
  instructors?: InstructorInfo[];
  enrollments?: Enrollment[];
  enrollKeys?: EnrollKey[];
  activeKeys?: EnrollKey[];
  enrollmentCount?: number;
  activeKeyCount?: number;
}

export interface ClassResponse {
  success: boolean;
  data: ClassData | ClassData[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ClassState {
  classes: ClassData[];
  selectedClass: ClassData | null;
  loading: boolean;
  error: string | null;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const initialState: ClassState = {
  classes: [],
  selectedClass: null,
  loading: false,
  error: null,
  pagination: {
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  },
};
//Fetch classes by instructor
export const fetchClassesByInstructor = createAsyncThunk(
  "class/fetchClassesByInstructor",
  async (
    params: { page?: number; limit?: number } = {},
    { rejectWithValue },
  ) => {
    try {
      const response = await api.get<ClassResponse>(
        GET_CLASSES_BY_INSTRUCTOR_ENDPOINT,
        { params },
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message ||
          "Failed to fetch classes by instructor",
      );
    }
  },
);

// Fetch class detail
export const fetchClassDetail = createAsyncThunk(
  "class/fetchClassDetail",
  async (classId: number, { rejectWithValue }) => {
    try {
      const response = await api.get(CLASS_DETAIL_ENDPOINT(classId.toString()));
      const data = response.data;
      return data?.class || data?.data || data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch class detail",
      );
    }
  },
);

// Fetch all classes
export const fetchClasses = createAsyncThunk(
  "class/fetchClasses",
  async (
    params: { page?: number; limit?: number } = {},
    { rejectWithValue },
  ) => {
    try {
      const response = await api.get<ClassResponse>(CLASSES_ENDPOINT, {
        params,
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch classes",
      );
    }
  },
);

// Create class
export const createClass = createAsyncThunk(
  "class/createClass",
  async (
    classData: Omit<
      ClassData,
      | "classId"
      | "courseId"
      | "createdAt"
      | "updatedAt"
      | "createdBy"
      | "status"
    > & { courseId: number },
    { rejectWithValue },
  ) => {
    try {
      const { courseId, ...requestBody } = classData;
      const response = await api.post<ClassResponse>(
        CREATE_CLASS_ENDPOINT(courseId.toString()),
        requestBody,
      );
      return (
        (Array.isArray(response.data.data)
          ? response.data.data[0]
          : response.data.data) || response.data
      );
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create class",
      );
    }
  },
);

// Update class
export const updateClass = createAsyncThunk(
  "class/updateClass",
  async (
    {
      classId,
      classData,
    }: {
      classId: number;
      classData: Partial<ClassData>;
    },
    { rejectWithValue },
  ) => {
    try {
      const response = await api.put<ClassResponse>(
        UPDATE_CLASS_ENDPOINT(classId.toString()),
        classData,
      );
      return (
        (Array.isArray(response.data.data)
          ? response.data.data[0]
          : response.data.data) || response.data
      );
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update class",
      );
    }
  },
);

// Delete class
export const deleteClass = createAsyncThunk(
  "class/deleteClass",
  async (classId: number, { rejectWithValue }) => {
    try {
      await api.delete(DELETE_CLASS_ENDPOINT(classId.toString()));
      return classId;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete class",
      );
    }
  },
);

// Add instructor to class
export const addInstructorToClass = createAsyncThunk(
  "class/addInstructorToClass",
  async (
    { classId, userId }: { classId: number; userId: number },
    { rejectWithValue },
  ) => {
    try {
      const response = await api.post(
        ADD_INSTRUCTOR_TO_CLASS_ENDPOINT(classId.toString()),
        { instructorIds: [userId] },
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to add instructor to class",
      );
    }
  },
);

// Remove instructor from class
export const removeInstructorFromClass = createAsyncThunk(
  "class/removeInstructorFromClass",
  async (
    { classId, userId }: { classId: number; userId: number },
    { rejectWithValue },
  ) => {
    try {
      await api.delete(
        REMOVE_INSTRUCTOR_FROM_CLASS_ENDPOINT(
          classId.toString(),
          userId.toString(),
        ),
      );
      return { classId, userId };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message ||
          "Failed to remove instructor from class",
      );
    }
  },
);

const classSlice = createSlice({
  name: "class",
  initialState,
  reducers: {
    setSelectedClass: (state, action: PayloadAction<ClassData | null>) => {
      state.selectedClass = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch classes
    builder
      .addCase(fetchClasses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchClasses.fulfilled,
        (state, action: PayloadAction<ClassResponse>) => {
          state.loading = false;
          const data = Array.isArray(action.payload.data)
            ? action.payload.data
            : [action.payload.data];
          state.classes = data;
          if (action.payload.pagination) {
            state.pagination = action.payload.pagination;
          }
        },
      )
      .addCase(fetchClasses.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to fetch classes";
      });

    // Create class
    builder
      .addCase(createClass.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createClass.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        const newClass = action.payload as ClassData;
        state.classes.unshift(newClass);
        if (state.pagination.total !== undefined) {
          state.pagination.total += 1;
        }
      })
      .addCase(createClass.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to create class";
      });

    // Update class
    builder
      .addCase(updateClass.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateClass.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        const updatedClass = action.payload as ClassData;
        const index = state.classes.findIndex(
          (c) => c.classId === updatedClass.classId,
        );
        if (index !== -1) {
          state.classes[index] = updatedClass;
        }
        if (state.selectedClass?.classId === updatedClass.classId) {
          state.selectedClass = updatedClass;
        }
      })
      .addCase(updateClass.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to update class";
      });

    // Delete class
    builder
      .addCase(deleteClass.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        deleteClass.fulfilled,
        (state, action: PayloadAction<number>) => {
          state.loading = false;
          state.classes = state.classes.filter(
            (c) => c.classId !== action.payload,
          );
          if (state.selectedClass?.classId === action.payload) {
            state.selectedClass = null;
          }
          if (state.pagination.total > 0) {
            state.pagination.total -= 1;
          }
        },
      )
      .addCase(deleteClass.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to delete class";
      });

    // Add instructor to class
    builder
      .addCase(addInstructorToClass.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addInstructorToClass.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(addInstructorToClass.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) || "Failed to add instructor to class";
      });

    // Remove instructor from class
    builder
      .addCase(removeInstructorFromClass.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        removeInstructorFromClass.fulfilled,
        (state, action: PayloadAction<{ classId: number; userId: number }>) => {
          state.loading = false;
          const classToUpdate = state.classes.find(
            (c) => c.classId === action.payload.classId,
          );
          if (classToUpdate && classToUpdate.instructors) {
            classToUpdate.instructors = classToUpdate.instructors.filter(
              (i) => i.userId !== action.payload.userId,
            );
          }
          if (state.selectedClass?.classId === action.payload.classId) {
            if (state.selectedClass.instructors) {
              state.selectedClass.instructors =
                state.selectedClass.instructors.filter(
                  (i) => i.userId !== action.payload.userId,
                );
            }
          }
        },
      )
      .addCase(removeInstructorFromClass.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) ||
          "Failed to remove instructor from class";
      });
    // Fetch classes by instructor
    builder
      .addCase(fetchClassesByInstructor.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchClassesByInstructor.fulfilled,
        (state, action: PayloadAction<ClassResponse>) => {
          state.loading = false;
          const data = Array.isArray(action.payload.data)
            ? action.payload.data
            : [action.payload.data];
          state.classes = data;
          if (action.payload.pagination) {
            state.pagination = action.payload.pagination;
          }
        },
      )
      .addCase(fetchClassesByInstructor.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) || "Failed to fetch classes by instructor";
      });
    // Fetch class detail
    builder
      .addCase(fetchClassDetail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchClassDetail.fulfilled,
        (state, action: PayloadAction<ClassData | null>) => {
          state.loading = false;
          state.selectedClass = action.payload || null;
        },
      )
      .addCase(fetchClassDetail.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) || "Failed to fetch class detail";
      });
  },
});

export const { setSelectedClass, clearError } = classSlice.actions;
export default classSlice.reducer;
