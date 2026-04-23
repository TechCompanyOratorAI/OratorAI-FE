import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/services/constant/axiosInstance";
import { TRANSCRIPT_BY_PRESENTATION_ENDPOINT } from "@/services/constant/apiConfig";

export interface TranscriptSpeaker {
  speakerId: number;
  aiSpeakerLabel: string;
  isMapped: boolean;
  totalDurationSeconds: number;
  segmentCount: number;
  mappedStudent?: { userId: number; firstName: string; lastName: string };
}

export interface TranscriptSegment {
  segmentId: number;
  transcriptId: number;
  speakerId: number;
  segmentNumber: number;
  segmentText: string;
  startTimestamp: number;
  endTimestamp: number;
  confidenceScore: number | null;
  speaker: TranscriptSpeaker;
}

export interface Transcript {
  transcriptId: number;
  presentationId: number;
  audioId: number;
  fullTranscript: string;
  language: string;
  confidenceScore: number | null;
  generatedAt: string;
  segments: TranscriptSegment[];
  audioRecord: {
    audioId: number;
    fileName: string;
    durationSeconds: number;
    fileFormat: string;
  };
}

interface TranscriptState {
  currentTranscript: Transcript | null;
  loading: boolean;
  error: string | null;
}

const initialState: TranscriptState = {
  currentTranscript: null,
  loading: false,
  error: null,
};

export const fetchTranscript = createAsyncThunk(
  "transcript/fetchByPresentation",
  async (presentationId: number, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(
        TRANSCRIPT_BY_PRESENTATION_ENDPOINT(String(presentationId)),
      );
      return res.data.data as Transcript;
    } catch (err: any) {
      return rejectWithValue(
        err?.response?.data?.message || "Không thể tải bản ghi lời.",
      );
    }
  },
);

const transcriptSlice = createSlice({
  name: "transcript",
  initialState,
  reducers: {
    clearTranscript(state) {
      state.currentTranscript = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTranscript.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTranscript.fulfilled, (state, action) => {
        state.loading = false;
        state.currentTranscript = action.payload;
      })
      .addCase(fetchTranscript.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearTranscript } = transcriptSlice.actions;
export default transcriptSlice.reducer;
