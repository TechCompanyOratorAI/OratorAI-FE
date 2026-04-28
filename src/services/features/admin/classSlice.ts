import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { message } from "antd";
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
  GET_CLASSES_BY_COURSE_ENDPOINT,
  CLASS_UPLOAD_PERMISSION_ENDPOINT,
  ENROLL_KEYS_ENDPOINT,
  ENROLL_KEYS_BY_CLASS_ENDPOINT,
  ENROLL_KEYS_ROTATE_ENDPOINT,
  CLASS_EMAIL_WHITELIST_ENDPOINT,
} from "@/services/constant/apiConfig";

export interface EnrollKey {
  keyId: number;
  isActive: boolean;
  keyValue?: string;
  expiresAt?: string;
  maxUses?: number;
  usedCount?: number;
}

export interface CreateEnrollKeyResult {
  keyValue: string | null;
  alreadyExists: boolean;
  keyId?: number | null;
  expiresAt?: string;
  maxUses?: number;
  usedCount?: number;
}

export interface Enrollment {
  enrollmentId: number;
  studentId?: number;
}

export interface CourseInfo {
  courseId: number;
  courseCode: string;
  courseName: string;
  semester?: string;
  academicYear?: number;
  topics?: TopicInfo[];
}

export interface InstructorInfo {
  userId: number;
  username: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

export interface TopicInfo {
  topicId: number;
  topicName: string;
  description?: string;
  sequenceNumber: number;
  dueDate?: string;
  maxDurationMinutes?: number;
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
  maxGroupMembers: number | null;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  // Upload permission fields
  isUploadEnabled?: boolean;
  uploadStartDate?: string | null;
  uploadEndDate?: string | null;
  course?: CourseInfo;
  instructors?: InstructorInfo[];
  enrollments?: Enrollment[];
  enrollKeys?: EnrollKey[];
  activeKeys?: EnrollKey[];
  enrollmentCount?: number;
  activeKeyCount?: number;
  totalStudents?: number;
  topics?: TopicInfo[];
}

export interface ClassResponse {
  success: boolean;
  data: ClassData | ClassData[];
  message?: string;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateClassPayload {
  courseId: number;
  classCode: string;
  academicBlockIds: number[];
  maxStudents: number;
  status: "active" | "inactive" | "archived";
}

export interface ClassState {
  classes: ClassData[];
  selectedClass: ClassData | null;
  loading: boolean;
  error: string | null;
  lastCreatedKey: string | null;
  /** active key value per classId, null = no active key, undefined = not fetched yet */
  keysByClass: Record<number, string | null>;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  coursePagination: Record<number, {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;
}

const initialState: ClassState = {
  classes: [],
  selectedClass: null,
  loading: false,
  error: null,
  lastCreatedKey: null,
  keysByClass: {},
  pagination: {
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  },
  coursePagination: {},
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

export interface CreateEnrollKeyPayload {
  classId: number;
  customKey?: string;
  expiresAt?: string;
  maxUses?: number;
}

export const createEnrollKey = createAsyncThunk<
  CreateEnrollKeyResult,
  CreateEnrollKeyPayload,
  { rejectValue: string }
>(
  "class/createEnrollKey",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await api.post(ENROLL_KEYS_ENDPOINT, payload);
      const data = response.data;

      // Success: new key created
      if (data?.success !== false) {
        return {
          keyValue: data?.key?.keyValue ?? data?.keyValue ?? null,
          alreadyExists: false,
          keyId: data?.key?.keyId ?? null,
          expiresAt: data?.key?.expiresAt,
          maxUses: data?.key?.maxUses,
          usedCount: data?.key?.usedCount ?? 0,
        };
      }

      // Class already has an active key — treat as fulfilled (not an error)
      if (data?.existingKey) {
        return {
          keyValue: data.existingKey.keyValue ?? null,
          alreadyExists: true,
          keyId: data.existingKey.keyId ?? null,
          expiresAt: data.existingKey.expiresAt,
          maxUses: data.existingKey.maxUses,
          usedCount: data.existingKey.usedCount,
        };
      }

      return rejectWithValue(data?.message || "Không thể tạo mã đăng ký");
    } catch (error: any) {
      // Axios 4xx/5xx: check if response body has existingKey
      const data = error.response?.data;
      if (data?.existingKey) {
        return {
          keyValue: data.existingKey.keyValue ?? null,
          alreadyExists: true,
          keyId: data.existingKey.keyId ?? null,
          expiresAt: data.existingKey.expiresAt,
          maxUses: data.existingKey.maxUses,
          usedCount: data.existingKey.usedCount,
        };
      }
      return rejectWithValue(
        data?.message || "Failed to create enroll key",
      );
    }
  },
);

export const rotateEnrollKey = createAsyncThunk<
  CreateEnrollKeyResult,
  { classId: number; keyId: number },
  { rejectValue: string }
>(
  "class/rotateEnrollKey",
  async ({ classId, keyId }, { rejectWithValue }) => {
    try {
      const response = await api.post(
        ENROLL_KEYS_ROTATE_ENDPOINT(classId.toString()),
        { keyId },
      );
      const data = response.data;
      const key =
        data?.key ||
        data?.data?.key ||
        data?.data ||
        data;
      return {
        keyValue: key?.keyValue ?? null,
        keyId: key?.keyId ?? null,
        alreadyExists: false,
        expiresAt: key?.expiresAt,
        maxUses: key?.maxUses,
        usedCount: key?.usedCount ?? 0,
      };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Không thể đổi mã đăng ký",
      );
    }
  },
);

/** Fetch the active enrollment key for a class (returns null if none) */
export const fetchActiveKeysByClass = createAsyncThunk<
  { classId: number; keyValue: string | null; keyId: number | null },
  number,
  { rejectValue: string }
>(
  "class/fetchActiveKeysByClass",
  async (classId) => {
    try {
      const response = await api.get(ENROLL_KEYS_BY_CLASS_ENDPOINT(classId.toString()));
      const payload = response.data as
        | { success?: boolean; data?: EnrollKey[]; keys?: EnrollKey[] }
        | EnrollKey[];
      const keys: EnrollKey[] = Array.isArray(payload)
        ? payload
        : payload?.data ?? payload?.keys ?? [];
      const now = new Date();
      const active = keys.find(
        (k) =>
          k.isActive &&
          !(k as any).isRevoked &&
          (!k.expiresAt || new Date(k.expiresAt) > now) &&
          (!k.maxUses || (k.usedCount ?? 0) < k.maxUses),
      );
      return {
        classId,
        keyValue: active?.keyValue ?? null,
        keyId: active?.keyId ?? null,
      };
    } catch {
      return { classId, keyValue: null, keyId: null };
    }
  },
);

/** Revoke an enrollment key */
export const revokeEnrollKey = createAsyncThunk<
  { classId: number },
  { classId: number; keyId: number },
  { rejectValue: string }
>(
  "class/revokeEnrollKey",
  async ({ classId, keyId }, { rejectWithValue }) => {
    try {
      await api.delete(`${ENROLL_KEYS_ENDPOINT}/${keyId}`);
      return { classId };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Không thể thu hồi mã đăng ký",
      );
    }
  },
);

// Fetch classes by course (for students viewing classes of a selected course)
export const fetchClassesByCourse = createAsyncThunk(
  "class/fetchClassesByCourse",
  async (
    { courseId, page = 1, limit = 10 }: { courseId: number; page?: number; limit?: number },
    { rejectWithValue },
  ) => {
    try {
      const response = await api.get<ClassResponse>(
        GET_CLASSES_BY_COURSE_ENDPOINT(courseId.toString()),
        { params: { page, limit } },
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message ||
          "Failed to fetch classes for this course",
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
  async (classData: CreateClassPayload, { rejectWithValue }) => {
    try {
      const { courseId, ...requestBody } = classData;
      const response = await api.post<ClassResponse>(
        CREATE_CLASS_ENDPOINT(courseId.toString()),
        requestBody,
      );
      return (
        response.data || {
          success: true,
          data: [],
        }
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
        response.data || {
          success: true,
          data: [],
        }
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
      const response = await api.delete<{
        success?: boolean;
        message?: string;
        data?: { classId?: number };
      }>(DELETE_CLASS_ENDPOINT(classId.toString()));
      return {
        classId: response.data?.data?.classId ?? classId,
        message: response.data?.message,
      };
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
    { classId, userIds }: { classId: number; userIds: number[] },
    { rejectWithValue },
  ) => {
    try {
      const response = await api.post(
        ADD_INSTRUCTOR_TO_CLASS_ENDPOINT(classId.toString()),
        { instructorIds: userIds },
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

// ─── Email Whitelist thunks ────────────────────────────────────────────────

export const uploadEmailWhitelist = createAsyncThunk(
  "class/uploadEmailWhitelist",
  async (
    { classId, file }: { classId: number; file: File },
    { rejectWithValue },
  ) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await api.post(
        CLASS_EMAIL_WHITELIST_ENDPOINT(classId.toString()),
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Không thể upload danh sách email",
      );
    }
  },
);

export const fetchEmailWhitelist = createAsyncThunk(
  "class/fetchEmailWhitelist",
  async (classId: number, { rejectWithValue }) => {
    try {
      const response = await api.get(
        CLASS_EMAIL_WHITELIST_ENDPOINT(classId.toString()),
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Không thể lấy danh sách email",
      );
    }
  },
);

export const deleteEmailWhitelist = createAsyncThunk(
  "class/deleteEmailWhitelist",
  async (classId: number, { rejectWithValue }) => {
    try {
      const response = await api.delete(
        CLASS_EMAIL_WHITELIST_ENDPOINT(classId.toString()),
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Không thể xóa danh sách email",
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
    clearLastCreatedKey: (state) => {
      state.lastCreatedKey = null;
    },
    applyUploadPermissionUpdate: (
      state,
      action: PayloadAction<{
        classId: number;
        isUploadEnabled: boolean;
        uploadStartDate: string | null;
        uploadEndDate: string | null;
      }>,
    ) => {
      const { classId, isUploadEnabled, uploadStartDate, uploadEndDate } = action.payload;
      if (state.selectedClass?.classId === classId) {
        state.selectedClass.isUploadEnabled = isUploadEnabled;
        state.selectedClass.uploadStartDate = uploadStartDate;
        state.selectedClass.uploadEndDate = uploadEndDate;
      }

      const classIndex = state.classes.findIndex((c) => c.classId === classId);
      if (classIndex !== -1) {
        state.classes[classIndex].isUploadEnabled = isUploadEnabled;
        state.classes[classIndex].uploadStartDate = uploadStartDate;
        state.classes[classIndex].uploadEndDate = uploadEndDate;
      }
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

    // Fetch classes by course
    builder
      .addCase(fetchClassesByCourse.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchClassesByCourse.fulfilled,
        (state, action) => {
          state.loading = false;
          const newData = Array.isArray(action.payload.data)
            ? action.payload.data
            : [action.payload.data];

          const cid = newData[0]?.courseId;
          if (cid) {
            // Replace classes for this course only
            state.classes = [
              ...state.classes.filter((c) => c.courseId !== cid),
              ...newData,
            ];
          } else {
            state.classes = newData;
          }

          if (action.payload.pagination && cid) {
            state.coursePagination[cid] = action.payload.pagination;
          }
        },
      )
      .addCase(fetchClassesByCourse.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) ||
          "Failed to fetch classes for this course";
      });

    // Create class
    builder
      .addCase(createClass.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createClass.fulfilled, (state, action: PayloadAction<ClassResponse>) => {
        state.loading = false;
        const newClass = Array.isArray(action.payload.data)
          ? action.payload.data[0]
          : action.payload.data;
        if (!newClass) {
          return;
        }
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
      .addCase(updateClass.fulfilled, (state, action: PayloadAction<ClassResponse>) => {
        state.loading = false;
        const updatedClass = Array.isArray(action.payload.data)
          ? action.payload.data[0]
          : action.payload.data;
        if (!updatedClass) {
          return;
        }
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
        (state, action: PayloadAction<{ classId: number; message?: string }>) => {
          state.loading = false;
          state.classes = state.classes.filter(
            (c) => c.classId !== action.payload.classId,
          );
          if (state.selectedClass?.classId === action.payload.classId) {
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
          } else {
            state.pagination = {
              ...state.pagination,
              total: data.length,
              page: 1,
              totalPages: 1,
            };
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

    // Create enroll key — save keyValue for display (works for both new key and existing key)
    builder
      .addCase(createEnrollKey.fulfilled, (state, action) => {
        state.lastCreatedKey = action.payload.keyValue;
        // Also sync keysByClass so the table updates immediately
        if (action.meta.arg.classId) {
          state.keysByClass[action.meta.arg.classId] = action.payload.keyValue;
        }
      })
      .addCase(createEnrollKey.rejected, (state) => {
        state.lastCreatedKey = null;
      });

    builder
      .addCase(rotateEnrollKey.fulfilled, (state, action) => {
        state.lastCreatedKey = action.payload.keyValue;
        if (action.meta.arg.classId) {
          state.keysByClass[action.meta.arg.classId] = action.payload.keyValue;
        }
      })
      .addCase(rotateEnrollKey.rejected, (state) => {
        state.lastCreatedKey = null;
      });

    // Fetch active key per class
    builder
      .addCase(fetchActiveKeysByClass.fulfilled, (state, action) => {
        state.keysByClass[action.payload.classId] = action.payload.keyValue;
      });

    // Revoke enroll key → clear from keysByClass
    builder
      .addCase(revokeEnrollKey.fulfilled, (state, action) => {
        state.keysByClass[action.payload.classId] = null;
        // Also clear lastCreatedKey if it was for this class
        state.lastCreatedKey = null;
      });

    // Upload permission reducers
    builder
      .addCase(fetchUploadPermission.fulfilled, (state, action) => {
        const { classId, isUploadEnabled, uploadStartDate, uploadEndDate } =
          action.payload;
        // Update selectedClass if it matches
        if (state.selectedClass && state.selectedClass.classId === classId) {
          state.selectedClass.isUploadEnabled = isUploadEnabled;
          state.selectedClass.uploadStartDate = uploadStartDate;
          state.selectedClass.uploadEndDate = uploadEndDate;
        }
        // Always update in classes array if exists
        const classIndex = state.classes.findIndex(
          (c) => c.classId === classId,
        );
        if (classIndex !== -1) {
          state.classes[classIndex].isUploadEnabled = isUploadEnabled;
          state.classes[classIndex].uploadStartDate = uploadStartDate;
          state.classes[classIndex].uploadEndDate = uploadEndDate;
        }
      })
      .addCase(setUploadPermission.fulfilled, (state, action) => {
        const { classId, isUploadEnabled, uploadStartDate, uploadEndDate } =
          action.payload;
        // Update selectedClass if it matches
        if (state.selectedClass && state.selectedClass.classId === classId) {
          state.selectedClass.isUploadEnabled = isUploadEnabled;
          state.selectedClass.uploadStartDate = uploadStartDate;
          state.selectedClass.uploadEndDate = uploadEndDate;
        }
        // Also update in classes array
        const classIndex = state.classes.findIndex(
          (c) => c.classId === classId,
        );
        if (classIndex !== -1) {
          state.classes[classIndex].isUploadEnabled = isUploadEnabled;
          state.classes[classIndex].uploadStartDate = uploadStartDate;
          state.classes[classIndex].uploadEndDate = uploadEndDate;
        }
      });
  },
});

export const { setSelectedClass, clearError, clearLastCreatedKey, applyUploadPermissionUpdate } = classSlice.actions;

// Upload permission async thunks
export const fetchUploadPermission = createAsyncThunk(
  "class/fetchUploadPermission",
  async (classId: number, { rejectWithValue }) => {
    try {
      const response = await api.get(
        CLASS_UPLOAD_PERMISSION_ENDPOINT(classId.toString()),
      );
      return { classId, ...response.data.data };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch upload permission",
      );
    }
  },
);

export const setUploadPermission = createAsyncThunk(
  "class/setUploadPermission",
  async (
    { classId, isUploadEnabled }: { classId: number; isUploadEnabled: boolean },
    { rejectWithValue },
  ) => {
    try {
      const response = await api.post(
        CLASS_UPLOAD_PERMISSION_ENDPOINT(classId.toString()),
        {
          isUploadEnabled,
        },
      );
      void message.success(
        isUploadEnabled
          ? "Đã mở cho phép upload bài thuyết trình"
          : "Đã đóng không cho phép upload bài thuyết trình",
      );
      return { classId, ...response.data.data };
    } catch (error: any) {
      void message.error(
        error.response?.data?.message || "Failed to update upload permission",
      );
      return rejectWithValue(error.response?.data);
    }
  },
);

export default classSlice.reducer;
