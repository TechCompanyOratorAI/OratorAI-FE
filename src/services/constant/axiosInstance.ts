import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import {
  BASE_URL,
  REFRESH_TOKEN_ENDPOINT,
  LOGIN_ENDPOINT,
  REGISTER_ENDPOINT,
} from "./apiConfig";

// ─── Token storage keys ────────────────────────────────────────────────────────
export const TOKEN_KEY = "accessToken";
// refreshToken KHÔNG lưu ở FE — nó nằm trong httpOnly cookie của browser

// ─── Subscriber queue — tránh gọi refresh nhiều lần cùng lúc ───────────────
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

const addRefreshSubscriber = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback);
};

const onRefreshed = (token: string) => {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
};

// ─── Refresh token ────────────────────────────────────────────────────────────
// Server dùng httpOnly cookie → browser tự động gửi, FE không cần làm gì.
// Chỉ cần POST rỗng đến endpoint refresh.
const refreshTokenRequest = async (): Promise<string | null> => {
  try {
    const response = await axios.post(
      REFRESH_TOKEN_ENDPOINT,
      {}, // body rỗng — cookie tự động được gửi kèm
      {
        baseURL: BASE_URL,
        headers: { "Content-Type": "application/json" },
        // withCredentials: true là cần thiết để browser gửi httpOnly cookie
        withCredentials: true,
      }
    );

    if (!response.data.success) {
      throw new Error(response.data.message ?? "Refresh failed");
    }

    const newAccessToken = response.data.tokens.accessToken;

    // Lưu accessToken mới
    localStorage.setItem(TOKEN_KEY, newAccessToken);

    return newAccessToken;
  } catch {
    // Refresh thất bại → xóa token và đá về login
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem("user");
    window.location.href = "/login";
    return null;
  }
};

// ─── Axios instance chính (có auth interceptor) ───────────────────────────────
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

// Request interceptor — gắn accessToken vào header
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — xử lý 401 → refresh token → retry request
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    const isAuthRequest =
      originalRequest.url === LOGIN_ENDPOINT ||
      originalRequest.url === REGISTER_ENDPOINT ||
      originalRequest.url === REFRESH_TOKEN_ENDPOINT;

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRequest) {
      originalRequest._retry = true;

      if (isRefreshing) {
        // Đợi refresh đang chạy hoàn thành
        return new Promise((resolve) => {
          addRefreshSubscriber((token: string) => {
            originalRequest.headers!.Authorization = `Bearer ${token}`;
            resolve(axiosInstance(originalRequest));
          });
        });
      }

      isRefreshing = true;

      try {
        const newToken = await refreshTokenRequest();
        if (newToken) {
          originalRequest.headers!.Authorization = `Bearer ${newToken}`;
          onRefreshed(newToken);
          return axiosInstance(originalRequest);
        }
      } catch {
        onRefreshed("");
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ─── Axios instance công khai — không có auth interceptor (dùng cho share page) ──
const publicAxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

// ─── API wrapper ──────────────────────────────────────────────────────────────
export const api = {
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
    axiosInstance.get(url, config),

  post: <T = any>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
    axiosInstance.post(url, data, config),

  put: <T = any>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
    axiosInstance.put(url, data, config),

  patch: <T = any>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
    axiosInstance.patch(url, data, config),

  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
    axiosInstance.delete(url, config),

  upload: <T = any>(url: string, formData: FormData, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
    axiosInstance.post(url, formData, {
      ...config,
      headers: { "Content-Type": "multipart/form-data", ...config?.headers },
    }),

  download: (url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<Blob>> =>
    axiosInstance.get(url, { ...config, responseType: "blob" }),
};

// ─── Public API wrapper (không auth interceptor) ───────────────────────────────
export const publicApi = {
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
    publicAxiosInstance.get<T>(url, config),
};

export { axiosInstance, publicAxiosInstance, refreshTokenRequest };
export default axiosInstance;
