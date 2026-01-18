import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { message } from "antd";
import axiosInstance from "../../constant/axiosInstance";
import { LOGIN_ENDPOINT, REGISTER_ENDPOINT } from "../../constant/apiConfig";
import {
  AuthState,
  LoginCredentials,
  LoginResponse,
  RegisterCredentials,
  RegisterResponse,
} from "../../../interfaces/auth";

// Initial state
const initialState: AuthState = {
  user: null,
  token: localStorage.getItem("token"),
  isAuthenticated: !!localStorage.getItem("token"),
  loading: false,
  error: null,
};

// Async thunks
export const loginUser = createAsyncThunk<
  LoginResponse,
  LoginCredentials,
  { rejectValue: { message: string } }
>("auth/loginUser", async (credentials, { rejectWithValue }) => {
  try {
    // Determine if input is email or username
    const isEmail = credentials.usernameOrEmail.includes("@");
    const requestBody = isEmail
      ? { email: credentials.usernameOrEmail, password: credentials.password }
      : { username: credentials.usernameOrEmail, password: credentials.password };

    const response = await axiosInstance.post(LOGIN_ENDPOINT, requestBody);
    return response.data;
  } catch (err: unknown) {
    const error = err as any;
    const errorMessage =
      error.response?.data?.message || error.message || "Đăng nhập thất bại";
    return rejectWithValue({ message: errorMessage });
  }
});

export const registerUser = createAsyncThunk<
  RegisterResponse,
  RegisterCredentials,
  { rejectValue: { message: string } }
>("auth/registerUser", async (credentials, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.post(REGISTER_ENDPOINT, credentials);
    return response.data;
  } catch (err: unknown) {
    const error = err as any;
    const errorMessage =
      error.response?.data?.message || error.message || "Đăng ký thất bại";
    return rejectWithValue({ message: errorMessage });
  }
});

export const logoutUser = createAsyncThunk<
  { success: boolean; message: string },
  void,
  { rejectValue: { message: string } }
>("auth/logoutUser", async (_, { rejectWithValue }) => {
  try {
    // Clear local storage
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    return { success: true, message: "Đăng xuất thành công" };
  } catch (err: unknown) {
    const error = err as any;
    const errorMessage =
      error.response?.data?.message || error.message || "Đăng xuất thất bại";
    return rejectWithValue({ message: errorMessage });
  }
});

// Auth slice
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      message.success("Đăng xuất thành công");
    },
    clearError: (state) => {
      state.error = null;
    },
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
  },
  extraReducers: (builder) => {
    // Login cases
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.tokens.accessToken;
        state.isAuthenticated = true;
        state.error = null;
        localStorage.setItem("token", action.payload.tokens.accessToken);
        localStorage.setItem("user", JSON.stringify(action.payload.user));
        message.success(action.payload.message || "Đăng nhập thành công");
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.error = action.payload?.message || "Đăng nhập thất bại";
        message.error(state.error);
      })
      // Register cases
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.isAuthenticated = false; // Chưa đăng nhập, cần verify email
        state.error = null;
        message.success(
          action.payload.message ||
            "Đăng ký thành công. Vui lòng kiểm tra email để xác thực."
        );
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Đăng ký thất bại";
        message.error(state.error);
      })
      // Logout cases
      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.loading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = null;
        message.success("Đăng xuất thành công");
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.loading = false;
        // Still logout locally even if API call fails
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = null;
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        message.error(action.payload?.message || "Đăng xuất thất bại");
      });
  },
});

export const { logout, clearError, setUser } = authSlice.actions;
export default authSlice.reducer;

