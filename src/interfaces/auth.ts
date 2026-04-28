export type UserRole = "Student" | "Instructor" | "Admin";

export interface Role {
  roleId: number;
  roleName: UserRole;
  description: string;
}

export interface User {
  userId?: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  avatar?: string | null;
  isEmailVerified: boolean;
  lastLoginAt?: string;
  roles?: Role[];
  dob?: string | null;
  studyMajor?: string | null;
  isCensored?: boolean;
}

export interface LoginCredentials {
  usernameOrEmail: string;
  password: string;
  selectedRole?: string;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface RegisterInstructorCredentials {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  departmentId: number;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  user: User;
  tokens: {
    accessToken: string;
  };
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  user: User;
}

export interface RegisterInstructorResponse {
  success: boolean;
  message: string;
  user: User;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

export interface ProfileUser {
  userId: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  avatar?: string | null;
  dob?: string | null;
  studyMajor?: string | null;
  isCensored?: boolean;
  isActive: boolean;
  isEmailVerified: boolean;
}

export interface ProfileResponse {
  success: boolean;
  message: string;
  data: ProfileUser;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ChangePasswordResponse {
  success: boolean;
  message: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
}

export interface ResendVerificationRequest {
  email: string;
}

export interface ResendVerificationResponse {
  success: boolean;
  message: string;
}

export interface ApiValidationError {
  type?: string;
  value?: string;
  msg: string;
  path?: string;
  location?: string;
}

export interface VerifyEmailResponse {
  success: boolean;
  message: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

export interface UploadAvatarResponse {
  success: boolean;
  message: string;
  data: {
    avatarUrl: string;
  };
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  dob?: string | null;
  studyMajor?: string | null;
  isCensored?: boolean;
}

export interface UpdateProfileResponse {
  success: boolean;
  message: string;
  data: ProfileUser;
}
