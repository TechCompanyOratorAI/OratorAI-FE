import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../constant/axiosInstance";
import { TOPICS_ENDPOINT, TOPIC_DETAIL_ENDPOINT } from "../../constant/apiConfig";

export interface Presentation {
  presentationId: number;
  title: string;
  status: string;
  studentId: number;
  submissionDate: string | null;
}

export interface TopicCourse {
  courseId: number;
  courseCode: string;
  courseName: string;
  instructorId: number;
  instructor: {
    userId: number;
    username: string;
    firstName: string;
    lastName: string;
  };
}

export interface TopicDetail {
  topicId: number;
  courseId: number;
  topicName: string;
  description: string;
  sequenceNumber: number;
  dueDate: string;
  maxDurationMinutes: number;
  requirements?: string;
  course: TopicCourse;
  presentations: Presentation[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateTopicData {
  topicName: string;
  description: string;
  sequenceNumber: number;
  dueDate: string;
  maxDurationMinutes: number;
  requirements?: string;
}

export interface TopicState {
  selectedTopic: TopicDetail | null;
  loading: boolean;
  error: string | null;
}

const initialState: TopicState = {
  selectedTopic: null,
  loading: false,
  error: null,
};

// Create topic
export const createTopic = createAsyncThunk(
  "topic/createTopic",
  async (
    { courseId, topicData }: { courseId: number; topicData: CreateTopicData },
    { rejectWithValue }
  ) => {
    try {
      const response = await axiosInstance.post(
        TOPICS_ENDPOINT(courseId.toString()),
        topicData
      );
      // API returns { success: true, topic: {...} }
      return response.data.topic || response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create topic"
      );
    }
  }
);

// Fetch topic detail
export const fetchTopicDetail = createAsyncThunk(
  "topic/fetchTopicDetail",
  async (topicId: number, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(
        TOPIC_DETAIL_ENDPOINT(topicId.toString())
      );
      // API returns { success: true, topic: {...} }
      return response.data.topic || response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch topic detail"
      );
    }
  }
);

const topicSlice = createSlice({
  name: "topic",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSelectedTopic: (state) => {
      state.selectedTopic = null;
    },
  },
  extraReducers: (builder) => {
    // Create topic
    builder
      .addCase(createTopic.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTopic.fulfilled, (state) => {
        state.loading = false;
        // Topic creation doesn't set selectedTopic, it's handled by refetching course
      })
      .addCase(createTopic.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch topic detail
    builder
      .addCase(fetchTopicDetail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTopicDetail.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedTopic = action.payload;
      })
      .addCase(fetchTopicDetail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearSelectedTopic } = topicSlice.actions;
export default topicSlice.reducer;
