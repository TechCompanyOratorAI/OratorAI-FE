import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { message } from "antd";
import axiosInstance from "../../constant/axiosInstance";
import {
  LOGIN_ENDPOINT,
  REGISTER_ENDPOINT,
  REGISTER_INSTRUCTOR_ENDPOINT,
  PROFILE_ENDPOINT,
  CHANGE_PASSWORD_ENDPOINT,
  FORGOT_PASSWORD_ENDPOINT,
  RESET_PASSWORD_ENDPOINT,
  RESEND_VERIFICATION_ENDPOINT,
  VERIFY_EMAIL_ENDPOINT,
  LOGOUT_ENDPOINT,
} from "../../constant/apiConfig";
import {
  AuthState,
  LoginCredentials,
  LoginResponse,
  RegisterCredentials,
  RegisterResponse,
  RegisterInstructorCredentials,
  RegisterInstructorResponse,
  User,
  ProfileResponse,
  ChangePasswordRequest,
  ChangePasswordResponse,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  ResendVerificationRequest,
  ResendVerificationResponse,
  VerifyEmailResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
} from "../../../interfaces/auth";

// Helper function to get user from localStorage
const getUserFromStorage = (): User | null => {
  try {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      return JSON.parse(userStr) as User;
    }
  } catch (error) {
    console.error("Error parsing user from localStorage:", error);
  }
  return null;
};

// Initial state
const initialState: AuthState = {
  user: getUserFromStorage(),
  token: localStorage.getItem("accessToken"),
  isAuthenticated: !!localStorage.getItem("accessToken"),
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
    const requestBody = {
      emailOrUsername: credentials.usernameOrEmail,
      password: credentials.password,
    };

    const response = await axiosInstance.post(LOGIN_ENDPOINT, requestBody);
    // Nếu backend trả về 200 nhưng success = false thì coi như lỗi
    if (response.data && response.data.success === false) {
      const errorMessage =
        response.data.message || "Đăng nhập thất bại";
      return rejectWithValue({ message: errorMessage });
    }

    return response.data;
  } catch (err: unknown) {
    const error = err as { response?: { data?: { message?: string } }; message?: string };
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
    const error = err as { response?: { data?: { message?: string } }; message?: string };
    const errorMessage =
      error.response?.data?.message || error.message || "Đăng ký thất bại";
    return rejectWithValue({ message: errorMessage });
  }
});

export const registerInstructor = createAsyncThunk<
  RegisterInstructorResponse,
  RegisterInstructorCredentials,
  { rejectValue: { message: string } }
>("auth/registerInstructor", async (credentials, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.post(REGISTER_INSTRUCTOR_ENDPOINT, credentials);
    return response.data;
  } catch (err: unknown) {
    const error = err as { response?: { data?: { message?: string } }; message?: string };
    const errorMessage =
      error.response?.data?.message || error.message || "Đăng ký Instructor thất bại";
    return rejectWithValue({ message: errorMessage });
  }
});

export const logoutUser = createAsyncThunk<
  { success: boolean; message: string },
  void,
  { rejectValue: { message: string } }
>("auth/logoutUser", async (_, { rejectWithValue }) => {
  try {
    // Gọi API logout để server xóa httpOnly cookie
    await axiosInstance.post(LOGOUT_ENDPOINT);
    // Dọn localStorage phía FE
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    return { success: true, message: "Đăng xuất thành công" };
  } catch (err: unknown) {
    // Dù API thất bại hay không, vẫn dọn localStorage
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    const error = err as { response?: { data?: { message?: string } }; message?: string };
    const msg = error.response?.data?.message ?? "Đăng xuất thất bại";
    return rejectWithValue({ message: msg });
  }
});

export const getProfile = createAsyncThunk<
  ProfileResponse,
  void,
  { rejectValue: { message: string } }
>("auth/getProfile", async (_, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.get(PROFILE_ENDPOINT);
    return response.data;
  } catch (err: unknown) {
    const error = err as { response?: { data?: { message?: string } }; message?: string };
    const errorMessage =
      error.response?.data?.message || error.message || "Lấy thông tin profile thất bại";
    return rejectWithValue({ message: errorMessage });
  }
});

export const changePassword = createAsyncThunk<
  ChangePasswordResponse,
  ChangePasswordRequest,
  { rejectValue: { message: string } }
>("auth/changePassword", async (credentials, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.post(
      CHANGE_PASSWORD_ENDPOINT,
      credentials
    );
    return response.data;
  } catch (err: unknown) {
    const error = err as { response?: { data?: { message?: string } }; message?: string };
    const errorMessage =
      error.response?.data?.message || error.message || "Đổi mật khẩu thất bại";
    return rejectWithValue({ message: errorMessage });
  }
});

export const forgotPassword = createAsyncThunk<
  ForgotPasswordResponse,
  ForgotPasswordRequest,
  { rejectValue: { message: string } }
>("auth/forgotPassword", async (request, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.post(
      FORGOT_PASSWORD_ENDPOINT,
      request
    );
    return response.data;
  } catch (err: unknown) {
    const error = err as { response?: { data?: { message?: string } }; message?: string };
    const errorMessage =
      error.response?.data?.message || error.message || "Gửi email đặt lại mật khẩu thất bại";
    return rejectWithValue({ message: errorMessage });
  }
});

export type ResendVerificationReject = {
  message?: string;
  errors?: Array<{ msg: string }>;
};

export const resendVerification = createAsyncThunk<
  ResendVerificationResponse,
  ResendVerificationRequest,
  { rejectValue: ResendVerificationReject }
>("auth/resendVerification", async (request, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.post(
      RESEND_VERIFICATION_ENDPOINT,
      request
    );
    return response.data;
  } catch (err: unknown) {
    const error = err as { response?: { data?: { message?: string; errors?: Array<{ msg: string }> } }; message?: string };
    const data = error.response?.data;
    return rejectWithValue({
      message: data?.message,
      errors: data?.errors,
    });
  }
});

export const verifyEmail = createAsyncThunk<
  VerifyEmailResponse,
  string,
  { rejectValue: { message: string } }
>("auth/verifyEmail", async (token, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.get(VERIFY_EMAIL_ENDPOINT(token));
    if (response.data && response.data.success === false) {
      return rejectWithValue({
        message: response.data.message ?? "Invalid or expired verification token",
      });
    }
    return response.data;
  } catch (err: unknown) {
    const error = err as { response?: { data?: { message?: string } }; message?: string };
    const msg =
      error.response?.data?.message ?? error.message ?? "Invalid or expired verification token";
    return rejectWithValue({ message: msg });
  }
});

export const resetPassword = createAsyncThunk<
  ResetPasswordResponse,
  ResetPasswordRequest,
  { rejectValue: { message: string } }
>("auth/resetPassword", async (request, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.post(
      RESET_PASSWORD_ENDPOINT,
      request
    );
    if (response.data && response.data.success === false) {
      return rejectWithValue({
        message: response.data.message ?? "Invalid or expired password reset token",
      });
    }
    return response.data;
  } catch (err: unknown) {
    const error = err as { response?: { data?: { message?: string } }; message?: string };
    const msg =
      error.response?.data?.message ?? error.message ?? "Invalid or expired password reset token";
    return rejectWithValue({ message: msg });
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
      localStorage.removeItem("accessToken");
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
        // Lưu accessToken vào localStorage để interceptor đọc được
        localStorage.setItem("accessToken", action.payload.tokens.accessToken);
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
      // Register Instructor cases
      .addCase(registerInstructor.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerInstructor.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.isAuthenticated = false; // Chưa đăng nhập, cần verify email
        state.error = null;
        message.success(
          action.payload.message ||
            "Đăng ký Instructor thành công. Vui lòng kiểm tra email để xác thực."
        );
      })
      .addCase(registerInstructor.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Đăng ký Instructor thất bại";
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
        // Vẫn logout cục bộ dù API thất bại
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = null;
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        message.error(action.payload?.message || "Đăng xuất thất bại");
      })
      // Get Profile cases
      .addCase(getProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getProfile.fulfilled, (state, action) => {
        state.loading = false;
        // Update user info if needed
        if (state.user) {
          state.user.firstName = action.payload.user.firstName;
          state.user.lastName = action.payload.user.lastName;
          state.user.email = action.payload.user.email;
          state.user.username = action.payload.user.username;
          state.user.isEmailVerified = action.payload.user.isEmailVerified;
          localStorage.setItem("user", JSON.stringify(state.user));
        }
        state.error = null;
      })
      .addCase(getProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Lấy thông tin profile thất bại";
        message.error(state.error);
      })
      // Change Password cases
      .addCase(changePassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(changePassword.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        message.success(action.payload.message || "Đổi mật khẩu thành công");
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Đổi mật khẩu thất bại";
        message.error(state.error);
      })
      // Forgot Password cases
      .addCase(forgotPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(forgotPassword.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        message.success(
          action.payload.message ||
            "Nếu tài khoản với email này tồn tại, liên kết đặt lại mật khẩu đã được gửi."
        );
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Gửi email đặt lại mật khẩu thất bại";
        message.error(state.error);
      })
      // Resend Verification cases (no toast - message shown on page from API)
      .addCase(resendVerification.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resendVerification.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(resendVerification.rejected, (state) => {
        state.loading = false;
      })
      // Verify Email (token from link) - message shown on page from API
      .addCase(verifyEmail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyEmail.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(verifyEmail.rejected, (state) => {
        state.loading = false;
      })
      .addCase(resetPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(resetPassword.rejected, (state) => {
        state.loading = false;
      });
  },
});

export const { logout, clearError, setUser } = authSlice.actions;
export default authSlice.reducer;

