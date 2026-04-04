import {
  SHARE_PUBLIC_ENDPOINT,
  SHARE_LIST_ENDPOINT,
  SHARE_INVITE_ENDPOINT,
  SHARE_REVOKE_PUBLIC_ENDPOINT,
  SHARE_REVOKE_INVITE_ENDPOINT,
  SHARE_VIEW_ENDPOINT,
} from "@/services/constant/apiConfig";
import axiosInstance from "@/services/constant/axiosInstance";
import { publicApi } from "@/services/constant/axiosInstance";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ShareUser {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
}

export interface ShareRecord {
  accessId: number;
  shareType: "public" | "private";
  shareToken: string;
  shareUrl: string;
  accessLevel: string;
  expiresAt: string | null;
  grantedAt: string;
  user: ShareUser | null;
}

export interface InviteResult {
  email: string;
  userId: number | null;
  success: boolean;
  message: string;
  shareToken: string | null;
  shareUrl: string | null;
  expiresAt: string | null;
  accessId: number | null;
}

export interface PublicShareResponse {
  success: boolean;
  message: string;
  shareToken: string;
  shareUrl: string;
  shareType: "public";
  expiresAt: string | null;
  accessId: number;
}

export interface InviteResponse {
  success: boolean;
  message: string;
  results: InviteResult[];
}

export interface ShareListResponse {
  success: boolean;
  presentationId: number;
  shares: ShareRecord[];
}

// Shared presentation view (public — no auth required)
export interface SharedPresentationData {
  presentation: {
    presentationId: number;
    title: string;
    description: string;
    status: string;
    durationSeconds: number | null;
    createdAt: string;
    slides: Array<{
      slideId: number;
      slideNumber: number;
      filePath: string;
      fileName: string;
      fileFormat: string;
      fileSizeBytes: number;
      uploadedAt: string;
      updatedAt: string;
      createdAt: string;
    }>;
    audioRecord: {
      audioId: number;
      filePath: string;
      fileName: string;
      durationSeconds: number | null;
    } | null;
    student: { userId: number; firstName: string; lastName: string; email: string } | null;
    topic: { topicId: number; topicName: string } | null;
    course: { courseId: number; courseName: string } | null;
    class: { classId: number; classCode: string } | null;
  };
  aiReport: {
    reportId: number;
    overallScore: string;
    criterionScores: Record<string, {
      score: number;
      maxScore: number;
      comment: string;
      suggestions: string[];
      criteriaName: string;
      criteriaId: number;
      weight: number;
    }>;
    reportContent: string;
    generatedAt: string;
  } | null;
}

export interface SharedViewResponse {
  success: boolean;
  shareType: "public" | "private";
  accessLevel: string;
  data: SharedPresentationData;
}

export interface ShareState {
  shares: ShareRecord[];
  publicShare: ShareRecord | null;
  loading: boolean;
  inviteLoading: boolean;
  revokeLoading: boolean;
  error: string | null;
  // Public share view (no auth)
  sharedPresentation: SharedPresentationData | null;
  sharedLoading: boolean;
  sharedError: string | null;
}

// ─── Initial State ────────────────────────────────────────────────────────────

const initialState: ShareState = {
  shares: [],
  publicShare: null,
  loading: false,
  inviteLoading: false,
  revokeLoading: false,
  error: null,
  sharedPresentation: null,
  sharedLoading: false,
  sharedError: null,
};

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const fetchShareList = createAsyncThunk(
  "share/fetchShareList",
  async (presentationId: number, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get<ShareListResponse>(
        SHARE_LIST_ENDPOINT(presentationId.toString()),
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Không thể tải danh sách chia sẻ",
      );
    }
  },
);

export const createPublicShare = createAsyncThunk(
  "share/createPublicShare",
  async (
    { presentationId, expiresAt }: { presentationId: number; expiresAt?: string },
    { rejectWithValue },
  ) => {
    try {
      const body = expiresAt ? { expiresAt } : {};
      const response = await axiosInstance.post<PublicShareResponse>(
        SHARE_PUBLIC_ENDPOINT(presentationId.toString()),
        body,
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Không thể tạo link chia sẻ công khai",
      );
    }
  },
);

export const revokePublicShare = createAsyncThunk(
  "share/revokePublicShare",
  async (presentationId: number, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(SHARE_REVOKE_PUBLIC_ENDPOINT(presentationId.toString()));
      return presentationId;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Không thể thu hồi link chia sẻ công khai",
      );
    }
  },
);

export const inviteByEmails = createAsyncThunk(
  "share/inviteByEmails",
  async (
    {
      presentationId,
      emails,
      expiresAt,
    }: { presentationId: number; emails: string[]; expiresAt?: string },
    { rejectWithValue },
  ) => {
    try {
      const body: Record<string, unknown> = { emails };
      if (expiresAt) body.expiresAt = expiresAt;
      const response = await axiosInstance.post<InviteResponse>(
        SHARE_INVITE_ENDPOINT(presentationId.toString()),
        body,
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Không thể gửi lời mời",
      );
    }
  },
);

export const revokeInvite = createAsyncThunk(
  "share/revokeInvite",
  async (
    { presentationId, accessId }: { presentationId: number; accessId: number },
    { rejectWithValue },
  ) => {
    try {
      await axiosInstance.delete(
        SHARE_REVOKE_INVITE_ENDPOINT(presentationId.toString(), accessId.toString()),
      );
      return accessId;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Không thể thu hồi lời mời",
      );
    }
  },
);

// Fetch shared presentation by token — public endpoint, no auth
export const fetchSharedPresentation = createAsyncThunk(
  "share/fetchSharedPresentation",
  async (token: string, { rejectWithValue }) => {
    try {
      const response = await publicApi.get<SharedViewResponse>(
        SHARE_VIEW_ENDPOINT(token),
      );
      return response.data.data;
    } catch (error: any) {
      const msg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Link chia sẻ không hợp lệ hoặc đã hết hạn.";
      return rejectWithValue(msg);
    }
  },
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const shareSlice = createSlice({
  name: "share",
  initialState,
  reducers: {
    clearShareError: (state) => {
      state.error = null;
    },
    clearShares: (state) => {
      state.shares = [];
      state.publicShare = null;
      state.loading = false;
      state.inviteLoading = false;
      state.revokeLoading = false;
      state.error = null;
    },
    clearSharedPresentation: (state) => {
      state.sharedPresentation = null;
      state.sharedLoading = false;
      state.sharedError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchShareList
      .addCase(fetchShareList.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchShareList.fulfilled, (state, action) => {
        state.loading = false;
        state.shares = action.payload.shares;
        state.publicShare =
          action.payload.shares.find((s) => s.shareType === "public") ?? null;
      })
      .addCase(fetchShareList.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // createPublicShare
      .addCase(createPublicShare.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPublicShare.fulfilled, (state, action) => {
        state.loading = false;
        const record: ShareRecord = {
          accessId: action.payload.accessId,
          shareType: "public",
          shareToken: action.payload.shareToken,
          shareUrl: action.payload.shareUrl,
          accessLevel: "view",
          expiresAt: action.payload.expiresAt,
          grantedAt: new Date().toISOString(),
          user: null,
        };
        const idx = state.shares.findIndex((s) => s.shareType === "public");
        if (idx !== -1) {
          state.shares[idx] = record;
        } else {
          state.shares.unshift(record);
        }
        state.publicShare = record;
      })
      .addCase(createPublicShare.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // revokePublicShare
      .addCase(revokePublicShare.pending, (state) => {
        state.revokeLoading = true;
        state.error = null;
      })
      .addCase(revokePublicShare.fulfilled, (state) => {
        state.revokeLoading = false;
        state.shares = state.shares.filter((s) => s.shareType !== "public");
        state.publicShare = null;
      })
      .addCase(revokePublicShare.rejected, (state, action) => {
        state.revokeLoading = false;
        state.error = action.payload as string;
      })

      // inviteByEmails
      .addCase(inviteByEmails.pending, (state) => {
        state.inviteLoading = true;
        state.error = null;
      })
      .addCase(inviteByEmails.fulfilled, (state) => {
        state.inviteLoading = false;
      })
      .addCase(inviteByEmails.rejected, (state, action) => {
        state.inviteLoading = false;
        state.error = action.payload as string;
      })

      // revokeInvite
      .addCase(revokeInvite.pending, (state) => {
        state.revokeLoading = true;
        state.error = null;
      })
      .addCase(revokeInvite.fulfilled, (state, action) => {
        state.revokeLoading = false;
        state.shares = state.shares.filter((s) => s.accessId !== action.payload);
      })
      .addCase(revokeInvite.rejected, (state, action) => {
        state.revokeLoading = false;
        state.error = action.payload as string;
      })
      // fetchSharedPresentation
      .addCase(fetchSharedPresentation.pending, (state) => {
        state.sharedLoading = true;
        state.sharedError = null;
      })
      .addCase(fetchSharedPresentation.fulfilled, (state, action) => {
        state.sharedLoading = false;
        state.sharedPresentation = action.payload;
      })
      .addCase(fetchSharedPresentation.rejected, (state, action) => {
        state.sharedLoading = false;
        state.sharedError = action.payload as string;
      });
  },
});

export const { clearShareError, clearShares, clearSharedPresentation } =
  shareSlice.actions;
export default shareSlice.reducer;
