import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../constant/axiosInstance";
import {
  GET_ALL_GROUPS_BY_CLASS_ENDPOINT,
  GET_MY_GROUP_BY_CLASS_ENDPOINT,
  CREATE_GROUP_ENDPOINT,
  UPDATE_GROUP_ENDPOINT,
  DELETE_GROUP_ENDPOINT,
  GET_MY_GROUP_ENDPOINT,
  JOIN_GROUP_ENDPOINT,
  LEAVE_GROUP_ENDPOINT,
  REMOVE_MEMBER_FROM_GROUP_ENDPOINT,
  CHANGE_LEADER_OF_GROUP_ENDPOINT,
  GROUP_DETAIL_ENDPOINT,
} from "../../constant/apiConfig";

export interface GroupStudentMeta {
  role?: string;
  joinedAt?: string;
}

export interface GroupStudent {
  id?: string | number;
  userId?: string | number;
  username?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  avatar?: string | null;
  GroupStudent?: GroupStudentMeta;
}

export interface GroupClassInfo {
  classId?: number;
  classCode?: string;
  maxGroupMembers?: number | null;
  courseId?: number;
}

export interface Group {
  id?: string | number;
  groupId?: string | number;
  name?: string;
  groupName?: string;
  classId?: string | number;
  description?: string | null;
  students?: GroupStudent[];
  memberCount?: number;
  maxGroupMembers?: number | null;
  isMember?: boolean;
  myRole?: string | null;
  class?: GroupClassInfo;
}

export interface GroupState {
  groups: Group[];
  myGroup: Group | null;
  myGroupForClass: Group | null;
  groupDetail: Group | null;
  classInfo: GroupClassInfo | null;
  isEnrolled: boolean;
  loading: boolean;
  actionLoading: boolean;
  error: string | null;
}

const initialState: GroupState = {
  groups: [],
  myGroup: null,
  myGroupForClass: null,
  groupDetail: null,
  classInfo: null,
  isEnrolled: false,
  loading: false,
  actionLoading: false,
  error: null,
};

const extractGroupArray = (payload: any): Group[] => {
  const data = payload?.data ?? payload?.groups ?? payload;
  if (Array.isArray(data)) {
    return data;
  }
  if (Array.isArray(data?.groups)) {
    return data.groups;
  }
  return [];
};

const extractGroup = (payload: any): Group | null => {
  const data = payload?.data ?? payload?.group ?? payload;
  if (!data || Array.isArray(data)) {
    return null;
  }
  return data;
};

const extractMyGroup = (payload: any): Group | null => {
  const groups = extractGroupArray(payload);
  return groups.length ? groups[0] : null;
};

export const fetchGroupsByClass = createAsyncThunk<
  { groups: Group[]; classInfo: GroupClassInfo | null; isEnrolled: boolean },
  number,
  { rejectValue: string }
>("group/fetchGroupsByClass", async (classId, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.get(
      GET_ALL_GROUPS_BY_CLASS_ENDPOINT(classId.toString()),
    );
    const payload = response.data;
    return {
      groups: extractGroupArray(payload),
      classInfo: payload?.class || null,
      isEnrolled: Boolean(payload?.isEnrolled),
    };
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Failed to fetch groups",
    );
  }
});

export const fetchMyGroup = createAsyncThunk<
  Group | null,
  void,
  { rejectValue: string }
>("group/fetchMyGroup", async (_, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.get(GET_MY_GROUP_ENDPOINT);
    return extractMyGroup(response.data);
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Failed to fetch my group",
    );
  }
});

export const fetchMyGroupByClass = createAsyncThunk<
  Group | null,
  number,
  { rejectValue: string }
>("group/fetchMyGroupByClass", async (classId, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.get(
      GET_MY_GROUP_BY_CLASS_ENDPOINT(classId.toString()),
    );
    const payload = response.data;
    // API trả về {success, group: null, message} khi chưa có nhóm
    // Hoặc {success, group: {...}} khi đã có nhóm
    if (payload?.group === null) {
      return null;
    }
    const data = payload?.data ?? payload?.group ?? payload;
    return data || null;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Failed to fetch my group",
    );
  }
});

export const fetchGroupDetail = createAsyncThunk<
  Group | null,
  number,
  { rejectValue: string }
>("group/fetchGroupDetail", async (groupId, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.get(
      GROUP_DETAIL_ENDPOINT(groupId.toString()),
    );
    const payload = response.data;
    const data = payload?.data ?? payload?.group ?? payload;
    return data || null;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Failed to fetch group detail",
    );
  }
});

export const createGroup = createAsyncThunk<
  Group | null,
  { classId: number; groupName: string; description?: string },
  { rejectValue: string }
>(
  "group/createGroup",
  async ({ classId, groupName, description }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(CREATE_GROUP_ENDPOINT, {
        classId,
        groupName,
        description,
      });
      return extractGroup(response.data);
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create group",
      );
    }
  },
);

export const updateGroup = createAsyncThunk<
  Group | null,
  { groupId: string | number; groupName: string; description?: string },
  { rejectValue: string }
>(
  "group/updateGroup",
  async ({ groupId, groupName, description }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(
        UPDATE_GROUP_ENDPOINT(groupId.toString()),
        { groupName, description },
      );
      return extractGroup(response.data);
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update group",
      );
    }
  },
);

export const deleteGroup = createAsyncThunk<
  string | number,
  string | number,
  { rejectValue: string }
>("group/deleteGroup", async (groupId, { rejectWithValue }) => {
  try {
    await axiosInstance.delete(DELETE_GROUP_ENDPOINT(groupId.toString()));
    return groupId;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Failed to delete group",
    );
  }
});

export const joinGroup = createAsyncThunk<
  Group | null,
  string | number,
  { rejectValue: string }
>("group/joinGroup", async (groupId, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.post(
      JOIN_GROUP_ENDPOINT(groupId.toString()),
    );
    return extractGroup(response.data);
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Failed to join group",
    );
  }
});

export const leaveGroup = createAsyncThunk<
  { message: string } | null,
  string | number,
  { rejectValue: string }
>("group/leaveGroup", async (groupId, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.post<{ message: string }>(
      LEAVE_GROUP_ENDPOINT(groupId.toString()),
    );
    return { message: response.data.message };
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Failed to leave group",
    );
  }
});

export const removeMemberFromGroup = createAsyncThunk<
  void,
  { groupId: string | number; userId: string | number },
  { rejectValue: string }
>(
  "group/removeMemberFromGroup",
  async ({ groupId, userId }, { rejectWithValue }) => {
    try {
      await axiosInstance.post(
        REMOVE_MEMBER_FROM_GROUP_ENDPOINT(
          groupId.toString(),
          userId.toString(),
        ),
      );
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to remove member",
      );
    }
  },
);

export const changeLeaderOfGroup = createAsyncThunk<
  Group | null,
  { groupId: string | number; userId: string | number },
  { rejectValue: string }
>(
  "group/changeLeaderOfGroup",
  async ({ groupId, userId }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(
        CHANGE_LEADER_OF_GROUP_ENDPOINT(groupId.toString(), userId.toString()),
      );
      return extractGroup(response.data);
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to change leader",
      );
    }
  },
);

const groupSlice = createSlice({
  name: "group",
  initialState,
  reducers: {
    clearGroupError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchGroupsByClass.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGroupsByClass.fulfilled, (state, action) => {
        state.loading = false;
        state.groups = action.payload.groups;
        state.classInfo = action.payload.classInfo;
        state.isEnrolled = action.payload.isEnrolled;
      })
      .addCase(fetchGroupsByClass.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch groups";
      })
      .addCase(fetchMyGroup.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyGroup.fulfilled, (state, action) => {
        state.loading = false;
        state.myGroup = action.payload;
      })
      .addCase(fetchMyGroup.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch my group";
      })
      // Fetch my group by class
      .addCase(fetchMyGroupByClass.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyGroupByClass.fulfilled, (state, action) => {
        state.loading = false;
        state.myGroupForClass = action.payload;
      })
      .addCase(fetchMyGroupByClass.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch my group for class";
      })
      // Fetch group detail
      .addCase(fetchGroupDetail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGroupDetail.fulfilled, (state, action) => {
        state.loading = false;
        state.groupDetail = action.payload;
      })
      .addCase(fetchGroupDetail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch group detail";
      })
      .addCase(createGroup.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(createGroup.fulfilled, (state, action) => {
        state.actionLoading = false;
        if (action.payload) {
          state.myGroup = action.payload;
          state.groups = [action.payload, ...state.groups];
        }
      })
      .addCase(createGroup.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || "Failed to create group";
      })
      .addCase(updateGroup.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(updateGroup.fulfilled, (state, action) => {
        state.actionLoading = false;
        if (action.payload) {
          state.groups = state.groups
            .map((group) => {
              const groupId = group.groupId ?? group.id;
              const updatedId = action.payload?.groupId ?? action.payload?.id;
              if (`${groupId}` === `${updatedId}`) {
                return action.payload;
              }
              return group;
            })
            .filter((group): group is Group => group !== null);
          if (state.myGroup) {
            const myGroupId = state.myGroup.groupId ?? state.myGroup.id;
            const updatedId = action.payload.groupId ?? action.payload.id;
            if (`${myGroupId}` === `${updatedId}`) {
              state.myGroup = action.payload;
            }
          }
        }
      })
      .addCase(updateGroup.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || "Failed to update group";
      })
      .addCase(deleteGroup.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(deleteGroup.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.groups = state.groups.filter((group) => {
          const groupId = group.groupId ?? group.id;
          return `${groupId}` !== `${action.payload}`;
        });
        if (state.myGroup) {
          const myGroupId = state.myGroup.groupId ?? state.myGroup.id;
          if (`${myGroupId}` === `${action.payload}`) {
            state.myGroup = null;
          }
        }
      })
      .addCase(deleteGroup.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || "Failed to delete group";
      })
      .addCase(joinGroup.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(joinGroup.fulfilled, (state, action) => {
        state.actionLoading = false;
        if (action.payload) {
          state.myGroup = action.payload;
        }
      })
      .addCase(joinGroup.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || "Failed to join group";
      })
      .addCase(leaveGroup.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(leaveGroup.fulfilled, (state) => {
        state.actionLoading = false;
        state.myGroup = null;
        state.myGroupForClass = null;
      })
      .addCase(leaveGroup.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || "Failed to leave group";
      })
      .addCase(removeMemberFromGroup.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(removeMemberFromGroup.fulfilled, (state) => {
        state.actionLoading = false;
      })
      .addCase(removeMemberFromGroup.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || "Failed to remove member";
      })
      .addCase(changeLeaderOfGroup.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(changeLeaderOfGroup.fulfilled, (state, action) => {
        state.actionLoading = false;
        if (action.payload) {
          state.myGroup = action.payload;
        }
      })
      .addCase(changeLeaderOfGroup.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || "Failed to change leader";
      });
  },
});

export const { clearGroupError } = groupSlice.actions;
export default groupSlice.reducer;
