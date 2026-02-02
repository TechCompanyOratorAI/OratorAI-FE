import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../constant/axiosInstance";
import {
  ENROLL_COURSE_ENDPOINT,
  GET_ENROLLED_COURSES_ENDPOINT,
  DROP_COURSE_ENDPOINT,
  ENROLL_TOPIC_ENDPOINT,
  GET_ENROLLED_TOPICS_ENDPOINT,
  DROP_TOPIC_ENDPOINT,
  GET_ENROLLED_CLASSES_ENDPOINT
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

export interface DropCourseResponse {
  success: boolean;
  message: string;
}

export interface DropTopicResponse {
  success: boolean;
  message: string;
}

export interface EnrollmentState {
  enrolledCourses: EnrolledCourse[];
  enrolledCourseIds: number[]; // For quick lookup
  enrolledClasses: EnrolledClass[];
  enrolledClassIds: number[]; // For quick lookup
  enrolledTopics: EnrolledTopic[];
  enrolledTopicIds: number[]; // For quick lookup
  loading: boolean;
  error: string | null;
}

const initialState: EnrollmentState = {
  enrolledCourses: [],
  enrolledCourseIds: [],
  enrolledClasses: [],
  enrolledClassIds: [],
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

// Fetch enrolled classes
export const fetchEnrolledClasses = createAsyncThunk(
  "enrollment/fetchEnrolledClasses",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get<EnrolledClassesResponse>(
        GET_ENROLLED_CLASSES_ENDPOINT
      );
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch enrolled classes"
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

// Drop course (unenroll from course)
export const dropCourse = createAsyncThunk(
  "enrollment/dropCourse",
  async (courseId: number, { rejectWithValue }) => {
    try {
      await axiosInstance.delete<DropCourseResponse>(
        DROP_COURSE_ENDPOINT(courseId.toString())
      );
      return courseId;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to drop course"
      );
    }
  }
);

// Drop topic (unenroll from topic)
export const dropTopic = createAsyncThunk(
  "enrollment/dropTopic",
  async (topicId: number, { rejectWithValue }) => {
    try {
      await axiosInstance.delete<DropTopicResponse>(
        DROP_TOPIC_ENDPOINT(topicId.toString())
      );
      return topicId;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to drop topic"
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

    // Fetch enrolled classes
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

    // Drop course
    builder
      .addCase(dropCourse.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(dropCourse.fulfilled, (state, action) => {
        state.loading = false;
        // Remove courseId from enrolledCourseIds
        state.enrolledCourseIds = state.enrolledCourseIds.filter(
          (id) => id !== action.payload
        );
        // Remove course from enrolledCourses
        state.enrolledCourses = state.enrolledCourses.filter(
          (course) => course.courseId !== action.payload
        );
      })
      .addCase(dropCourse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Drop topic
    builder
      .addCase(dropTopic.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(dropTopic.fulfilled, (state, action) => {
        state.loading = false;
        // Remove topicId from enrolledTopicIds
        state.enrolledTopicIds = state.enrolledTopicIds.filter(
          (id) => id !== action.payload
        );
        // Remove topic from enrolledTopics
        state.enrolledTopics = state.enrolledTopics.filter(
          (topic) => topic.topicId !== action.payload
        );
      })
      .addCase(dropTopic.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = enrollmentSlice.actions;
export default enrollmentSlice.reducer;
