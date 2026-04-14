import apiClient from "@/services/constant/axiosInstance";
import { CLASS_UPLOAD_PERMISSION_ENDPOINT } from "@/services/constant/apiConfig";

// Types
export interface UploadPermission {
  classId: number;
  isUploadEnabled: boolean;
  uploadStartDate: string | null;
  uploadEndDate: string | null;
}

export interface SetUploadPermissionData {
  isUploadEnabled: boolean;
  uploadStartDate?: string | null;
  uploadEndDate?: string | null;
}

export interface UploadPermissionResponse {
  success: boolean;
  message?: string;
  data?: UploadPermission;
}

// API functions
export const classApi = {
  // Lấy trạng thái upload permission
  getUploadPermission: (classId: number) => {
    return apiClient.get(CLASS_UPLOAD_PERMISSION_ENDPOINT(classId.toString()));
  },

  // Bật/tắt upload permission
  setUploadPermission: (classId: number, data: SetUploadPermissionData) => {
    return apiClient.post(CLASS_UPLOAD_PERMISSION_ENDPOINT(classId.toString()), data);
  },

  // Mở upload
  enableUpload: (classId: number) => {
    return classApi.setUploadPermission(classId, { isUploadEnabled: true });
  },

  // Đóng upload
  disableUpload: (classId: number) => {
    return classApi.setUploadPermission(classId, { isUploadEnabled: false });
  },
};

export default classApi;
