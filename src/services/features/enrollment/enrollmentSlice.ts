import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../constant/axiosInstance";
import {
  ENROLL_TOPIC_ENDPOINT,
  GET_ENROLLED_TOPICS_ENDPOINT,
  DROP_TOPIC_ENDPOINT,
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

export interface EnrollClassResponse {
  success: boolean;
  message: string;
  enrollmentId: number;
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

export interface DropTopicResponse {
  success: boolean;
  message: string;
}

export interface EnrollmentState {
  enrolledClasses: EnrolledClass[];
  enrolledClassIds: number[]; // For quick lookup
  enrolledTopics: EnrolledTopic[];
  enrolledTopicIds: number[]; // For quick lookup
  loading: boolean;
  error: string | null;
}

const initialState: EnrollmentState = {
  enrolledClasses: [],
  enrolledClassIds: [],
  enrolledTopics: [],
  enrolledTopicIds: [],
  loading: false,
  error: null,
};

//Enroll class by Key
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

// Fetch enrolled classes
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

// Enroll in a topic
export const enrollTopic = createAsyncThunk(
  "enrollment/enrollTopic",
  async (topicId: number, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post<EnrollTopicResponse>(
        ENROLL_TOPIC_ENDPOINT(topicId.toString()),
      );
      return { topicId, topicEnrollmentId: response.data.topicEnrollmentId };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to enroll in topic",
      );
    }
  },
);

// Fetch enrolled topics
export const fetchEnrolledTopics = createAsyncThunk(
  "enrollment/fetchEnrolledTopics",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get<EnrolledTopicsResponse>(
        GET_ENROLLED_TOPICS_ENDPOINT,
      );
      return response.data.topics;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch enrolled topics",
      );
    }
  },
);

// Drop topic (unenroll from topic)
export const dropTopic = createAsyncThunk(
  "enrollment/dropTopic",
  async (topicId: number, { rejectWithValue }) => {
    try {
      await axiosInstance.delete<DropTopicResponse>(
        DROP_TOPIC_ENDPOINT(topicId.toString()),
      );
      return topicId;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to drop topic",
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
    // Enroll class by key
    builder
      .addCase(enrollClassByKey.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(enrollClassByKey.fulfilled, (state) => {
        state.loading = false;
        // No specific state update needed here unless you want to track by enrollmentId
      })
      .addCase(enrollClassByKey.rejected, (state, action) => {
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
          (id) => id !== action.payload,
        );
        // Remove topic from enrolledTopics
        state.enrolledTopics = state.enrolledTopics.filter(
          (topic) => topic.topicId !== action.payload,
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
