export type UserRole = "Student" | "Instructor" | "Admin";

export interface Role {
  roleId: number;
  roleName: UserRole;
  description: string;
}

export interface User {
  userId: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  isEmailVerified: boolean;
  lastLoginAt?: string;
  roles?: Role[];
}

export interface LoginCredentials {
  usernameOrEmail: string;
  password: string;
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
  isActive: boolean;
  isEmailVerified: boolean;
}

export interface ProfileResponse {
  success: boolean;
  user: ProfileUser;
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
