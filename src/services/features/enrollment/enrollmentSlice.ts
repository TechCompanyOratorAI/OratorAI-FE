import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../constant/axiosInstance";
import {
  GET_ENROLLED_CLASSES_ENDPOINT,
  ENROLL_CLASS_BY_KEY_ENDPOINT,
  VALIDATE_ENROLL_KEY_ENDPOINT,
} from "../../constant/apiConfig";

export interface EnrolledClass {
  enrollmentId: number;
  studentId: number;
  classId: number;
  enrolledAt: string;
  status: string;
  finalGrade: string | null;
  createdAt: string;
  updatedAt: string;
  class: {
    classId: number;
    courseId: number;
    classCode: string;
    className: string;
    description: string;
    status: string;
    startDate: string;
    endDate: string;
    maxStudents: number;
    createdBy: number;
    createdAt: string;
    updatedAt: string;
    course: {
      courseId: number;
      courseCode: string;
      courseName: string;
      majorCode: string;
      description: string;
      semester: string;
      academicYear: number;
      startDate: string;
      endDate: string;
      isActive: boolean;
      createdAt: string;
      updatedAt: string;
    };
    instructors: {
      userId: number;
      username: string;
      firstName: string;
      lastName: string;
    }[];
  };
}

export interface ClassPreview {
  classId: number;
  classCode: string;
  className: string;
  status: string;
  maxStudents?: number;
  course?: {
    courseCode: string;
    courseName: string;
    semester?: string;
    academicYear?: number;
  };
  instructors?: {
    userId: number;
    username: string;
    firstName: string;
    lastName: string;
  }[];
}

export interface EnrolledClassesResponse {
  success: boolean;
  data: EnrolledClass[];
}

export interface EnrollClassResponse {
  success: boolean;
  message: string;
  enrollmentId?: number;
  enrollment?: { enrollmentId: number };
  alreadyEnrolled?: boolean;
}

export interface EnrollmentState {
  enrolledClasses: EnrolledClass[];
  enrolledClassIds: number[];
  loading: boolean;
  error: string | null;
}

const initialState: EnrollmentState = {
  enrolledClasses: [],
  enrolledClassIds: [],
  loading: false,
  error: null,
};

/**
 * Preview class info by enroll key (before joining)
 */
export const previewClassByKey = createAsyncThunk(
  "enrollment/previewClassByKey",
  async (enrollKey: string, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post<{
        success: boolean;
        key: { classId: number; class: ClassPreview };
      }>(VALIDATE_ENROLL_KEY_ENDPOINT, { keyValue: enrollKey });
      return response.data.key;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Mã đăng ký không hợp lệ",
      );
    }
  },
);

/**
 * Enroll in class using only the enroll key (globally unique — no classId needed)
 */
export const enrollClassByKey = createAsyncThunk(
  "enrollment/enrollClassByKey",
  async (
    { enrollKey }: { enrollKey: string },
    { rejectWithValue },
  ) => {
    try {
      const response = await axiosInstance.post<EnrollClassResponse>(
        ENROLL_CLASS_BY_KEY_ENDPOINT,
        { enrollKey },
      );
      return {
        enrollmentId: response.data.enrollment?.enrollmentId ?? response.data.enrollmentId,
        alreadyEnrolled: response.data.alreadyEnrolled ?? false,
        message: response.data.message,
      };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to enroll in class with key",
      );
    }
  },
);

export const fetchEnrolledClasses = createAsyncThunk(
  "enrollment/fetchEnrolledClasses",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get<EnrolledClassesResponse>(
        GET_ENROLLED_CLASSES_ENDPOINT,
      );
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch enrolled classes",
      );
    }
  },
);

const enrollmentSlice = createSlice({
  name: "enrollment",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(enrollClassByKey.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(enrollClassByKey.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(enrollClassByKey.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    builder
      .addCase(fetchEnrolledClasses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEnrolledClasses.fulfilled, (state, action) => {
        state.loading = false;
        state.enrolledClasses = action.payload;
        state.enrolledClassIds = action.payload.map((cls) => cls.classId);
      })
      .addCase(fetchEnrolledClasses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = enrollmentSlice.actions;
export default enrollmentSlice.reducer;
