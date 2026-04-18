import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../constant/axiosInstance";
import {
  SPEAKERS_BY_PRESENTATION_ENDPOINT,
  SPEAKER_SUGGESTIONS_ENDPOINT,
  SPEAKER_GROUP_MEMBERS_ENDPOINT,
  SPEAKER_BATCH_MAP_ENDPOINT,
  SPEAKER_UNMAP_ENDPOINT,
} from "../../constant/apiConfig";

// ─── Interfaces ────────────────────────────────────────────────────────────────

export interface MappedStudent {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
}

export interface Speaker {
  speakerId: number;
  presentationId: number;
  aiSpeakerLabel: string;
  studentId: number | null;
  isMapped: boolean;
  totalDurationSeconds: number;
  segmentCount: number;
  metadata?: Record<string, unknown>;
  mappedStudent?: MappedStudent | null;
}

export interface SpeakerSuggestion {
  speakerId: number;
  aiSpeakerLabel: string;
  suggestedStudent: {
    userId: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  confidence: "low" | "medium" | "high";
  reason: string;
}

export interface GroupMember {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  role: "member" | "leader";
}

export interface BatchMappingItem {
  speakerId: number;
  studentId: number;
}

// ─── State ────────────────────────────────────────────────────────────────────

export interface SpeakerState {
  speakers: Speaker[];
  suggestions: SpeakerSuggestion[];
  groupMembers: GroupMember[];
  loading: boolean;
  suggestLoading: boolean;
  membersLoading: boolean;
  mappingLoading: boolean;
  error: string | null;
}

const initialState: SpeakerState = {
  speakers: [],
  suggestions: [],
  groupMembers: [],
  loading: false,
  suggestLoading: false,
  membersLoading: false,
  mappingLoading: false,
  error: null,
};

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const fetchSpeakers = createAsyncThunk<
  Speaker[],
  number,
  { rejectValue: string }
>("speaker/fetchSpeakers", async (presentationId, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.get(
      SPEAKERS_BY_PRESENTATION_ENDPOINT(String(presentationId))
    );
    return res.data.speakers as Speaker[];
  } catch (err: unknown) {
    const e = err as { response?: { data?: { message?: string } }; message?: string };
    return rejectWithValue(e.response?.data?.message ?? e.message ?? "Lỗi tải danh sách diễn giả");
  }
});

export const fetchSuggestions = createAsyncThunk<
  SpeakerSuggestion[],
  number,
  { rejectValue: string }
>("speaker/fetchSuggestions", async (presentationId, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.get(
      SPEAKER_SUGGESTIONS_ENDPOINT(String(presentationId))
    );
    return res.data.suggestions as SpeakerSuggestion[];
  } catch (err: unknown) {
    const e = err as { response?: { data?: { message?: string } }; message?: string };
    return rejectWithValue(e.response?.data?.message ?? e.message ?? "Lỗi tải gợi ý");
  }
});

export const fetchGroupMembers = createAsyncThunk<
  GroupMember[],
  number,
  { rejectValue: string }
>("speaker/fetchGroupMembers", async (presentationId, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.get(
      SPEAKER_GROUP_MEMBERS_ENDPOINT(String(presentationId))
    );
    return res.data.members as GroupMember[];
  } catch (err: unknown) {
    const e = err as { response?: { data?: { message?: string } }; message?: string };
    return rejectWithValue(e.response?.data?.message ?? e.message ?? "Lỗi tải thành viên nhóm");
  }
});

export const batchMapSpeakers = createAsyncThunk<
  void,
  BatchMappingItem[],
  { rejectValue: string }
>("speaker/batchMapSpeakers", async (mappings, { rejectWithValue }) => {
  try {
    await axiosInstance.post(SPEAKER_BATCH_MAP_ENDPOINT, { mappings });
  } catch (err: unknown) {
    const e = err as { response?: { data?: { message?: string } }; message?: string };
    return rejectWithValue(e.response?.data?.message ?? e.message ?? "Lỗi lưu ánh xạ");
  }
});

export const unmapSpeaker = createAsyncThunk<
  number,
  number,
  { rejectValue: string }
>("speaker/unmapSpeaker", async (speakerId, { rejectWithValue }) => {
  try {
    await axiosInstance.post(SPEAKER_UNMAP_ENDPOINT(String(speakerId)));
    return speakerId;
  } catch (err: unknown) {
    const e = err as { response?: { data?: { message?: string } }; message?: string };
    return rejectWithValue(e.response?.data?.message ?? e.message ?? "Lỗi hủy ánh xạ");
  }
});

// ─── Slice ────────────────────────────────────────────────────────────────────

const speakerSlice = createSlice({
  name: "speaker",
  initialState,
  reducers: {
    clearSpeakerState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // fetchSpeakers
      .addCase(fetchSpeakers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSpeakers.fulfilled, (state, action) => {
        state.loading = false;
        state.speakers = action.payload;
      })
      .addCase(fetchSpeakers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Lỗi không xác định";
      })

      // fetchSuggestions
      .addCase(fetchSuggestions.pending, (state) => {
        state.suggestLoading = true;
        state.error = null;
      })
      .addCase(fetchSuggestions.fulfilled, (state, action) => {
        state.suggestLoading = false;
        state.suggestions = action.payload;
      })
      .addCase(fetchSuggestions.rejected, (state, action) => {
        state.suggestLoading = false;
        state.error = action.payload ?? "Lỗi không xác định";
      })

      // fetchGroupMembers
      .addCase(fetchGroupMembers.pending, (state) => {
        state.membersLoading = true;
      })
      .addCase(fetchGroupMembers.fulfilled, (state, action) => {
        state.membersLoading = false;
        state.groupMembers = action.payload;
      })
      .addCase(fetchGroupMembers.rejected, (state, action) => {
        state.membersLoading = false;
        state.error = action.payload ?? "Lỗi không xác định";
      })

      // batchMapSpeakers
      .addCase(batchMapSpeakers.pending, (state) => {
        state.mappingLoading = true;
        state.error = null;
      })
      .addCase(batchMapSpeakers.fulfilled, (state) => {
        state.mappingLoading = false;
      })
      .addCase(batchMapSpeakers.rejected, (state, action) => {
        state.mappingLoading = false;
        state.error = action.payload ?? "Lỗi không xác định";
      })

      // unmapSpeaker
      .addCase(unmapSpeaker.pending, (state) => {
        state.mappingLoading = true;
      })
      .addCase(unmapSpeaker.fulfilled, (state, action) => {
        state.mappingLoading = false;
        const idx = state.speakers.findIndex(
          (s) => s.speakerId === action.payload
        );
        if (idx !== -1) {
          state.speakers[idx] = {
            ...state.speakers[idx],
            isMapped: false,
            studentId: null,
            mappedStudent: null,
          };
        }
      })
      .addCase(unmapSpeaker.rejected, (state, action) => {
        state.mappingLoading = false;
        state.error = action.payload ?? "Lỗi không xác định";
      });
  },
});

export const { clearSpeakerState } = speakerSlice.actions;
export default speakerSlice.reducer;
