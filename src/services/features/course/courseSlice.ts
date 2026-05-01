import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../constant/axiosInstance";
import {
  COURSES_ENDPOINT,
  MY_COURSES_ENDPOINT,
  COURSE_DETAIL_ENDPOINT,
} from "../../constant/apiConfig";

export interface Topic {
  topicId: number;
  topicName: string;
  description?: string;
  submissionStartDate?: string;
  submissionDeadline?: string;
  minGroups?: number;
  maxGroups?: number;
  maxDurationMinutes?: number;
  requirements?: string;
}

export interface Instructor {
  userId: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface CourseData {
  courseId: number;
  courseCode: string;
  courseName: string;
  departmentId: number;
  subjectAreaId?: number | null;
  subjectAreaIds?: number[];
  description: string;
  instructorId: number;
  semester: string;
  academicYear: number;
  academicBlockId?: number | null;
  academicBlocks?: Array<{
    academicBlockId: number;
    blockCode: string;
    term: string;
    half?: string | null;
    blockType: string;
    startDate: string;
    endDate: string;
    isActive: boolean;
    academicYear?: {
      academicYearId: number;
      year: number;
      name: string;
      startDate?: string;
      endDate?: string;
      isActive?: boolean;
      createdAt?: string;
      updatedAt?: string;
    };
    CourseAcademicBlock?: {
      isPrimary: boolean;
    };
  }>;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  majorCode?: string;
  instructor?: Instructor;
  instructors?: Instructor[];
  topics?: Topic[];
  enrollmentCount?: number;
  totalActiveClasses?: number;
}

export interface CreateCourseData {
  courseCode: string;
  courseName: string;
  departmentId: number;
  subjectAreaIds?: number[];
  academicBlockIds?: number[];
  description: string;
}

export interface CoursesResponse {
  success: boolean;
  data: CourseData[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  instructor?: Instructor; // Only present in my-class response
}

interface CourseMutationResponse {
  success?: boolean;
  message?: string;
  course?: CourseData;
  data?: CourseData;
}

export interface CourseState {
  courses: CourseData[];
  selectedCourse: CourseData | null;
  loading: boolean;
  error: string | null;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const initialState: CourseState = {
  courses: [],
  selectedCourse: null,
  loading: false,
  error: null,
  pagination: {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  },
};

// Fetch all courses
export const fetchCourses = createAsyncThunk(
  "course/fetchCourses",
  async (
    params: { page?: number; limit?: number } = {},
    { rejectWithValue },
  ) => {
    try {
      const response = await axiosInstance.get<CoursesResponse>(
        COURSES_ENDPOINT,
        {
          params: params,
        },
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch courses",
      );
    }
  },
);

// Fetch instructor's courses
export const fetchMyCourses = createAsyncThunk(
  "course/fetchMyCourses",
  async (
    params: { page?: number; limit?: number } = {},
    { rejectWithValue },
  ) => {
    try {
      const response = await axiosInstance.get<CoursesResponse>(
        MY_COURSES_ENDPOINT,
        {
          params: params,
        },
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch my courses",
      );
    }
  },
);

// Fetch course detail
export const fetchCourseDetail = createAsyncThunk(
  "course/fetchCourseDetail",
  async (courseId: number, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(
        COURSE_DETAIL_ENDPOINT(courseId.toString()),
      );
      // Support multiple backend response shapes.
      return response.data.course || response.data.data || response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch course detail",
      );
    }
  },
);

// Create course
export const createCourse = createAsyncThunk(
  "course/createCourse",
  async (courseData: CreateCourseData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post<CourseMutationResponse>(
        COURSES_ENDPOINT,
        courseData,
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create course",
      );
    }
  },
);

// Update course
export const updateCourse = createAsyncThunk(
  "course/updateCourse",
  async (
    {
      courseId,
      data,
    }: {
      courseId: number;
      data: Partial<CreateCourseData>;
    },
    { rejectWithValue },
  ) => {
    try {
      const response = await axiosInstance.patch<CourseMutationResponse>(
        COURSE_DETAIL_ENDPOINT(courseId.toString()),
        data,
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update course",
      );
    }
  },
);

// Delete course
export const deleteCourse = createAsyncThunk(
  "course/deleteCourse",
  async (courseId: number, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.delete<{
        success?: boolean;
        message?: string;
        data?: { courseId?: number };
      }>(COURSE_DETAIL_ENDPOINT(courseId.toString()));
      return {
        courseId: response.data?.data?.courseId ?? courseId,
        message: response.data?.message,
      };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete course",
      );
    }
  },
);

const courseSlice = createSlice({
  name: "course",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSelectedCourse: (state) => {
      state.selectedCourse = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch courses
    builder
      .addCase(fetchCourses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCourses.fulfilled, (state, action) => {
        state.loading = false;
        state.courses = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchCourses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch instructor's courses
    builder
      .addCase(fetchMyCourses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyCourses.fulfilled, (state, action) => {
        state.loading = false;
        state.courses = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchMyCourses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch course detail
    builder
      .addCase(fetchCourseDetail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCourseDetail.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedCourse = action.payload;
      })
      .addCase(fetchCourseDetail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Create course
    builder
      .addCase(createCourse.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCourse.fulfilled, (state, action) => {
        state.loading = false;
        const createdCourse = action.payload.course || action.payload.data;
        if (createdCourse) {
          state.courses.unshift(createdCourse);
        }
      })
      .addCase(createCourse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Update course
    builder
      .addCase(updateCourse.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCourse.fulfilled, (state, action) => {
        state.loading = false;
        const updatedCourse = action.payload.course || action.payload.data;
        if (!updatedCourse) {
          return;
        }
        const index = state.courses.findIndex(
          (course) => course.courseId === updatedCourse.courseId,
        );
        if (index !== -1) {
          state.courses[index] = updatedCourse;
        }
        if (
          state.selectedCourse &&
          state.selectedCourse.courseId === updatedCourse.courseId
        ) {
          state.selectedCourse = updatedCourse;
        }
      })
      .addCase(updateCourse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Delete course
    builder
      .addCase(deleteCourse.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCourse.fulfilled, (state, action) => {
        state.loading = false;
        state.courses = state.courses.filter(
          (course) => course.courseId !== action.payload.courseId,
        );
        if (
          state.selectedCourse &&
          state.selectedCourse.courseId === action.payload.courseId
        ) {
          state.selectedCourse = null;
        }
      })
      .addCase(deleteCourse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearSelectedCourse } = courseSlice.actions;
export default courseSlice.reducer;
