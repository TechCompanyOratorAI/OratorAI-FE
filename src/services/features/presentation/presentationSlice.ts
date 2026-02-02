import { PRESENTATIONS_ENDPOINT, PRESENTATION_MEDIA_ENDPOINT, PRESENTATION_SLIDES_ENDPOINT, PRESENTATION_SUBMIT_ENDPOINT } from "@/services/constant/apiConfig";
import axiosInstance from "@/services/constant/axiosInstance";
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

interface AudioRecord {
  audioId: number;
  presentationId: number;
  filePath: string;
  fileName: string;
  fileFormat: string;
  fileSizeBytes: number;
  durationSeconds: number | null;
  sampleRate: number | null;
  recordingMethod: string;
  uploadedAt: string;
  createdAt: string;
  updatedAt: string;
}

interface Slide {
  slideId: number;
  slideNumber: number;
  filePath: string;
  fileName: string;
  fileFormat: string;
  fileSizeBytes: number;
  uploadedAt: string;
  updatedAt: string;
  createdAt: string;
}

interface Topic {
  topicId: number;
  topicName: string;
  courseId?: number;
}

interface Student {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
}

interface Course {
  courseId: number;
  courseName: string;
}

interface Presentation {
  presentationId: number;
  studentId: number;
  courseId: number;
  classId: number | null;
  topicId: number;
  groupCode: string | null;
  title: string;
  description: string;
  submissionDate: string | null;
  status: "draft" | "processing" | "submitted" | "analyzed";
  durationSeconds: number | null;
  visibility: string;
  versionNumber: number;
  createdAt: string;
  updatedAt: string;
  topic?: Topic;
  audioRecord?: AudioRecord;
  slides?: Slide[];
  student?: Student;
  course?: Course;
}

interface PresentationResponse {
  success: boolean;
  presentations: Presentation[];
  total: number;
  limit: number;
  offset: number;
}

interface SlideResponse {
  success: boolean;
  slide: Slide;
}

interface MediaResponse {
  success: boolean;
  audioRecord: AudioRecord;
}

interface SubmitResponse {
  success: boolean;
  message: string;
  presentation: {
    success: boolean;
    presentation: Presentation;
  };
  job: {
    jobId: number;
    presentationId: number;
    jobType: string;
    status: string;
    sqsMessageId: string;
    metadata: {
      submittedBy: number;
      submittedAt: string;
    };
    retryCount: number;
    updatedAt: string;
    createdAt: string;
  };
}

interface PresentationState {
  presentations: Presentation[];
  total: number;
  loading: boolean;
  uploading: boolean;
  uploadProgress: number;
  error: string | null;
  currentPresentation: Presentation | null;
}

const initialState: PresentationState = {
  presentations: [],
  total: 0,
  loading: false,
  uploading: false,
  uploadProgress: 0,
  error: null,
  currentPresentation: null,
};

// Thunk to fetch presentations
export const fetchPresentations = createAsyncThunk(
  "presentation/fetchPresentations",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get<PresentationResponse>(PRESENTATIONS_ENDPOINT);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch presentations");
    }
  }
);

// Thunk to upload slide
export const uploadSlide = createAsyncThunk(
  "presentation/uploadSlide",
  async (
    { presentationId, file }: { presentationId: number; file: File },
    { rejectWithValue }
  ) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await axiosInstance.post<SlideResponse>(
        PRESENTATION_SLIDES_ENDPOINT(presentationId.toString()),
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to upload slide");
    }
  }
);

// Thunk to upload media (video)
export const uploadMedia = createAsyncThunk(
  "presentation/uploadMedia",
  async (
    { presentationId, file }: { presentationId: number; file: File },
    { rejectWithValue }
  ) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await axiosInstance.post<MediaResponse>(
        PRESENTATION_MEDIA_ENDPOINT(presentationId.toString()),
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to upload media");
    }
  }
);

// Thunk to submit presentation
export const submitPresentation = createAsyncThunk(
  "presentation/submitPresentation",
  async (presentationId: number, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post<SubmitResponse>(
        PRESENTATION_SUBMIT_ENDPOINT(presentationId.toString())
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to submit presentation");
    }
  }
);

const presentationSlice = createSlice({
  name: "presentation",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentPresentation: (state, action: PayloadAction<Presentation | null>) => {
      state.currentPresentation = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch presentations
      .addCase(fetchPresentations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPresentations.fulfilled, (state, action) => {
        state.loading = false;
        state.presentations = action.payload.presentations;
        state.total = action.payload.total;
      })
      .addCase(fetchPresentations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Upload slide
      .addCase(uploadSlide.pending, (state) => {
        state.uploading = true;
        state.uploadProgress = 0;
        state.error = null;
      })
      .addCase(uploadSlide.fulfilled, (state, action) => {
        state.uploading = false;
        state.uploadProgress = 100;
        if (state.currentPresentation) {
          const newSlide = action.payload.slide;
          if (!state.currentPresentation.slides) {
            state.currentPresentation.slides = [];
          }
          state.currentPresentation.slides.push(newSlide);
        }
      })
      .addCase(uploadSlide.rejected, (state, action) => {
        state.uploading = false;
        state.error = action.payload as string;
      })
      // Upload media
      .addCase(uploadMedia.pending, (state) => {
        state.uploading = true;
        state.uploadProgress = 0;
        state.error = null;
      })
      .addCase(uploadMedia.fulfilled, (state, action) => {
        state.uploading = false;
        state.uploadProgress = 100;
        if (state.currentPresentation) {
          state.currentPresentation.audioRecord = action.payload.audioRecord;
        }
      })
      .addCase(uploadMedia.rejected, (state, action) => {
        state.uploading = false;
        state.error = action.payload as string;
      })
      // Submit presentation
      .addCase(submitPresentation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(submitPresentation.fulfilled, (state, action) => {
        state.loading = false;
        // Update the presentation in the list with submitted status
        const submittedPresentation = action.payload.presentation.presentation;
        const index = state.presentations.findIndex(
          (p) => p.presentationId === submittedPresentation.presentationId
        );
        if (index !== -1) {
          state.presentations[index] = submittedPresentation;
        }
        state.currentPresentation = submittedPresentation;
      })
      .addCase(submitPresentation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, setCurrentPresentation } = presentationSlice.actions;
export default presentationSlice.reducer;
