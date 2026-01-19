import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { api } from "@/services/constant/axiosInstance";
import { GET_ALL_USERS_ENDPOINT } from "@/services/constant/apiConfig";

export type UserRoleName = "Student" | "Instructor" | string;

export interface UserRole {
	userRoleId: number;
	userId: number;
	roleId: number;
	assignedAt?: string;
	createdAt?: string;
	updatedAt?: string;
	role?: {
		roleId: number;
		roleName: UserRoleName;
		description?: string;
		createdAt?: string;
		updatedAt?: string;
	};
}

export interface AdminUser {
	userId: number;
	username: string;
	email: string;
	firstName?: string | null;
	lastName?: string | null;
	isActive: boolean;
	isEmailVerified: boolean;
	lastLoginAt?: string | null;
	createdAt?: string;
	updatedAt?: string;
	userRoles?: UserRole[];
	avatar?: string | null;
}

export interface AdminState {
	users: AdminUser[];
	loading: boolean;
	error: string | null;
}

const initialState: AdminState = {
	users: [],
	loading: false,
	error: null,
};

export const fetchAllUsers = createAsyncThunk<AdminUser[]>(
	"admin/fetchAllUsers",
	async (_, { rejectWithValue }) => 
		api
			.get(GET_ALL_USERS_ENDPOINT)
			.then((res) => {
				const raw = res.data as unknown;
				// Normalize possible API shapes: array or { data: [...] }
				if (Array.isArray(raw)) return raw as AdminUser[];
				if (raw && typeof raw === "object" && Array.isArray((raw as any).data)) {
					return (raw as any).data as AdminUser[];
				}
				return [] as AdminUser[];
			})
			.catch((err) => rejectWithValue(err.response?.data?.message || "Failed to load users"))
);

const adminSlice = createSlice({
	name: "admin",
	initialState,
	reducers: {},
	extraReducers: (builder) => {
		builder
			.addCase(fetchAllUsers.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(
				fetchAllUsers.fulfilled,
				(state, action: PayloadAction<AdminUser[]>) => {
					state.loading = false;
					state.users = action.payload;
				}
			)
			.addCase(fetchAllUsers.rejected, (state, action) => {
				state.loading = false;
				state.error = (action.payload as string) || "Failed to load users";
			});
	},
});

export default adminSlice.reducer;
