import apiClient from "@/services/constant/axiosInstance";
import {
  INSTRUCTOR_PRESENTATIONS_ENDPOINT,
  INSTRUCTOR_PENDING_APPROVALS_ENDPOINT,
  INSTRUCTOR_APPROVED_PRESENTATIONS_ENDPOINT,
  INSTRUCTOR_APPROVAL_STATUS_ENDPOINT,
  INSTRUCTOR_APPROVE_ENDPOINT,
  INSTRUCTOR_UNAPPROVE_ENDPOINT,
} from "@/services/constant/apiConfig";

// Types
export interface ApprovalStatus {
  presentationId: number;
  instructorApproved: boolean;
  approvedBy: {
    userId: number;
    firstName: string;
    lastName: string;
  } | null;
  approvedAt: string | null;
}

export interface PresentationApprovalInfo {
  presentationId: number;
  instructorApproved: boolean;
  approvedBy: {
    userId: number;
    firstName: string;
    lastName: string;
  } | null;
  approvedAt: string | null;
}

export interface InstructorApprovalResponse {
  success: boolean;
  message: string;
  data?: {
    presentationId: number;
    instructorApproved: boolean;
    approvedBy?: {
      userId: number;
      firstName: string;
      lastName: string;
    };
    approvedAt?: string;
  };
}

export interface PendingApprovalsResponse {
  success: boolean;
  data?: {
    presentations: PresentationApprovalInfo[];
    total: number;
    limit: number;
    offset: number;
  };
  message?: string;
}

export interface InstructorPresentationListParams {
  search?: string;
  status?: string;
  classId?: string;
  courseId?: string;
  page?: number;
  limit?: number;
}

// API functions
export const instructorApi = {
  getPresentations: (params?: InstructorPresentationListParams) => {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append("search", params.search);
    if (params?.status) queryParams.append("status", params.status);
    if (params?.classId) queryParams.append("classId", params.classId);
    if (params?.courseId) queryParams.append("courseId", params.courseId);
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());

    const query = queryParams.toString();
    const endpoint = query
      ? `${INSTRUCTOR_PRESENTATIONS_ENDPOINT}?${query}`
      : INSTRUCTOR_PRESENTATIONS_ENDPOINT;

    return apiClient.get(endpoint);
  },

  // Lấy danh sách presentations chờ duyệt
  getPendingApprovals: (params?: {
    classId?: string;
    courseId?: string;
    limit?: number;
    offset?: number;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.classId) queryParams.append("classId", params.classId);
    if (params?.courseId) queryParams.append("courseId", params.courseId);
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.offset) queryParams.append("offset", params.offset.toString());

    const query = queryParams.toString();
    const endpoint = query
      ? `${INSTRUCTOR_PENDING_APPROVALS_ENDPOINT}?${query}`
      : INSTRUCTOR_PENDING_APPROVALS_ENDPOINT;

    return apiClient.get(endpoint);
  },

  // Lấy danh sách presentations đã duyệt
  getApprovedPresentations: (params?: {
    classId?: string;
    courseId?: string;
    limit?: number;
    offset?: number;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.classId) queryParams.append("classId", params.classId);
    if (params?.courseId) queryParams.append("courseId", params.courseId);
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.offset) queryParams.append("offset", params.offset.toString());

    const query = queryParams.toString();
    const endpoint = query
      ? `${INSTRUCTOR_APPROVED_PRESENTATIONS_ENDPOINT}?${query}`
      : INSTRUCTOR_APPROVED_PRESENTATIONS_ENDPOINT;

    return apiClient.get(endpoint);
  },

  // Lấy trạng thái duyệt của một presentation
  getApprovalStatus: (presentationId: number) => {
    return apiClient.get(INSTRUCTOR_APPROVAL_STATUS_ENDPOINT(presentationId.toString()));
  },

  // Duyệt presentation
  approvePresentation: (presentationId: number, note?: string) => {
    return apiClient.post(INSTRUCTOR_APPROVE_ENDPOINT(presentationId.toString()), {
      note,
    });
  },

  // Huỷ duyệt presentation
  unapprovePresentation: (presentationId: number) => {
    return apiClient.post(INSTRUCTOR_UNAPPROVE_ENDPOINT(presentationId.toString()));
  },
};

export default instructorApi;
