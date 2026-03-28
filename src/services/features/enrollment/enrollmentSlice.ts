import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../constant/axiosInstance";
import {
  GET_ENROLLED_CLASSES_ENDPOINT,
  ENROLL_CLASS_BY_KEY_ENDPOINT,
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

export interface EnrolledClassesResponse {
  success: boolean;
  data: EnrolledClass[];
}

export interface EnrollClassResponse {
  success: boolean;
  message: string;
  enrollmentId: number;
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

export const enrollClassByKey = createAsyncThunk(
  "enrollment/enrollClassByKey",
  async (
    { classId, enrollKey }: { classId: number; enrollKey: string },
    { rejectWithValue },
  ) => {
    try {
      const response = await axiosInstance.post<EnrollClassResponse>(
        ENROLL_CLASS_BY_KEY_ENDPOINT,
        { classId, enrollKey },
      );
      return { enrollmentId: response.data.enrollmentId };
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
