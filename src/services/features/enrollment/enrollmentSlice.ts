import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../constant/axiosInstance";
import { 
  ENROLL_COURSE_ENDPOINT, 
  GET_ENROLLED_COURSES_ENDPOINT,
  ENROLL_TOPIC_ENDPOINT,
  GET_ENROLLED_TOPICS_ENDPOINT
} from "../../constant/apiConfig";

export interface EnrolledCourse {
  enrollmentId: number;
  courseId: number;
  courseCode: string;
  courseName: string;
  description: string;
  semester: string;
  academicYear: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  enrolledAt: string;
  instructor: {
    userId: number;
    username: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface EnrollCourseResponse {
  success: boolean;
  message: string;
  enrollmentId: number;
}

export interface EnrolledCoursesResponse {
  success: boolean;
  courses: EnrolledCourse[];
}

export interface EnrolledTopic {
  topicEnrollmentId: number;
  topicId: number;
  topicName: string;
  description: string;
  sequenceNumber: number;
  dueDate: string;
  maxDurationMinutes: number;
  enrolledAt: string;
  course: {
    courseId: number;
    courseCode: string;
    courseName: string;
    instructor: {
      userId: number;
      username: string;
      firstName: string;
      lastName: string;
      email: string;
    };
  };
}

export interface EnrollTopicResponse {
  success: boolean;
  message: string;
  topicEnrollmentId: number;
}

export interface EnrolledTopicsResponse {
  success: boolean;
  topics: EnrolledTopic[];
}

export interface EnrollmentState {
  enrolledCourses: EnrolledCourse[];
  enrolledCourseIds: number[]; // For quick lookup
  enrolledTopics: EnrolledTopic[];
  enrolledTopicIds: number[]; // For quick lookup
  loading: boolean;
  error: string | null;
}

const initialState: EnrollmentState = {
  enrolledCourses: [],
  enrolledCourseIds: [],
  enrolledTopics: [],
  enrolledTopicIds: [],
  loading: false,
  error: null,
};

// Enroll in a course
export const enrollCourse = createAsyncThunk(
  "enrollment/enrollCourse",
  async (courseId: number, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post<EnrollCourseResponse>(
        ENROLL_COURSE_ENDPOINT(courseId.toString())
      );
      return { courseId, enrollmentId: response.data.enrollmentId };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to enroll in course"
      );
    }
  }
);

// Fetch enrolled courses
export const fetchEnrolledCourses = createAsyncThunk(
  "enrollment/fetchEnrolledCourses",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get<EnrolledCoursesResponse>(
        GET_ENROLLED_COURSES_ENDPOINT
      );
      return response.data.courses;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch enrolled courses"
      );
    }
  }
);

// Enroll in a topic
export const enrollTopic = createAsyncThunk(
  "enrollment/enrollTopic",
  async (topicId: number, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post<EnrollTopicResponse>(
        ENROLL_TOPIC_ENDPOINT(topicId.toString())
      );
      return { topicId, topicEnrollmentId: response.data.topicEnrollmentId };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to enroll in topic"
      );
    }
  }
);

// Fetch enrolled topics
export const fetchEnrolledTopics = createAsyncThunk(
  "enrollment/fetchEnrolledTopics",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get<EnrolledTopicsResponse>(
        GET_ENROLLED_TOPICS_ENDPOINT
      );
      return response.data.topics;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch enrolled topics"
      );
    }
  }
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
    // Enroll course
    builder
      .addCase(enrollCourse.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(enrollCourse.fulfilled, (state, action) => {
        state.loading = false;
        // Add courseId to enrolledCourseIds if not already present
        if (!state.enrolledCourseIds.includes(action.payload.courseId)) {
          state.enrolledCourseIds.push(action.payload.courseId);
        }
      })
      .addCase(enrollCourse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch enrolled courses
    builder
      .addCase(fetchEnrolledCourses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEnrolledCourses.fulfilled, (state, action) => {
        state.loading = false;
        state.enrolledCourses = action.payload;
        state.enrolledCourseIds = action.payload.map((course) => course.courseId);
      })
      .addCase(fetchEnrolledCourses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Enroll topic
    builder
      .addCase(enrollTopic.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(enrollTopic.fulfilled, (state, action) => {
        state.loading = false;
        // Add topicId to enrolledTopicIds if not already present
        if (!state.enrolledTopicIds.includes(action.payload.topicId)) {
          state.enrolledTopicIds.push(action.payload.topicId);
        }
      })
      .addCase(enrollTopic.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch enrolled topics
    builder
      .addCase(fetchEnrolledTopics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEnrolledTopics.fulfilled, (state, action) => {
        state.loading = false;
        state.enrolledTopics = action.payload;
        state.enrolledTopicIds = action.payload.map((topic) => topic.topicId);
      })
      .addCase(fetchEnrolledTopics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = enrollmentSlice.actions;
export default enrollmentSlice.reducer;
