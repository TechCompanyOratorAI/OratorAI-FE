import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../constant/axiosInstance";
import { COURSES_ENDPOINT, MY_COURSES_ENDPOINT, COURSE_DETAIL_ENDPOINT } from "../../constant/apiConfig";

export interface Topic {
  topicId: number;
  topicName: string;
  sequenceNumber: number;
  description?: string;
  dueDate?: string;
  maxDurationMinutes?: number;
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
  description: string;
  instructorId: number;
  semester: string;
  academicYear: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  instructor?: Instructor;
  topics?: Topic[];
  enrollmentCount?: number;
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
  instructor?: Instructor; // Only present in my-courses response
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
    { rejectWithValue }
  ) => {
    try {
      const response = await axiosInstance.get<CoursesResponse>(
        COURSES_ENDPOINT,
        {
          params: params,
        }
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch courses"
      );
    }
  }
);

// Fetch instructor's courses
export const fetchMyCourses = createAsyncThunk(
  "course/fetchMyCourses",
  async (
    params: { page?: number; limit?: number } = {},
    { rejectWithValue }
  ) => {
    try {
      const response = await axiosInstance.get<CoursesResponse>(
        MY_COURSES_ENDPOINT,
        {
          params: params,
        }
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch my courses"
      );
    }
  }
);

// Fetch course detail
export const fetchCourseDetail = createAsyncThunk(
  "course/fetchCourseDetail",
  async (courseId: number, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(
        COURSE_DETAIL_ENDPOINT(courseId.toString())
      );
      // API returns { success: true, course: {...} }
      return response.data.course || response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch course detail"
      );
    }
  }
);

// Create course
export const createCourse = createAsyncThunk(
  "course/createCourse",
  async (
    courseData: Omit<CourseData, "courseId" | "createdAt" | "updatedAt">,
    { rejectWithValue }
  ) => {
    try {
      const response = await axiosInstance.post(
        COURSES_ENDPOINT,
        courseData
      );
      // API returns { success: true, course: {...} }
      return response.data.course || response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create course"
      );
    }
  }
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
      data: Partial<CourseData>;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await axiosInstance.patch(
        COURSE_DETAIL_ENDPOINT(courseId.toString()),
        data
      );
      // API returns { success: true, course: {...} }
      return response.data.course || response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update course"
      );
    }
  }
);

// Delete course
export const deleteCourse = createAsyncThunk(
  "course/deleteCourse",
  async (courseId: number, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(COURSE_DETAIL_ENDPOINT(courseId.toString()));
      return courseId;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete course"
      );
    }
  }
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
        state.courses.unshift(action.payload);
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
        const index = state.courses.findIndex(
          (course) => course.courseId === action.payload.courseId
        );
        if (index !== -1) {
          state.courses[index] = action.payload;
        }
        if (
          state.selectedCourse &&
          state.selectedCourse.courseId === action.payload.courseId
        ) {
          state.selectedCourse = action.payload;
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
          (course) => course.courseId !== action.payload
        );
        if (
          state.selectedCourse &&
          state.selectedCourse.courseId === action.payload
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
