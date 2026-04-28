import { message } from "antd";
import type { ReactNode } from "react";

const DEFAULT_DURATION = 3;

type ToastType = "success" | "error" | "info" | "warning";

type ToastOptions = {
  duration?: number;
  [key: string]: unknown;
};

const resolveDuration = (options?: number | ToastOptions) => {
  if (typeof options === "number") return options;
  return options?.duration ?? DEFAULT_DURATION;
};

const open = (
  type: ToastType,
  content: ReactNode,
  options?: number | ToastOptions,
) => {
  const duration = resolveDuration(options);
  message[type]({ content, duration });
};

export type ApiResponseBase = {
  success?: boolean;
  message?: string;
};

type UnknownError = {
  response?: { data?: { message?: string } };
  data?: { message?: string };
  payload?: ApiResponseBase;
  message?: string;
};

export const getResponseMessage = (
  response: unknown,
  fallback = "Thao tác thành công",
) => {
  const data = response as ApiResponseBase | null | undefined;
  return data?.message || fallback;
};

export const getErrorMessage = (error: unknown, fallback = "Có lỗi xảy ra") => {
  const maybe = error as UnknownError;
  return (
    maybe?.response?.data?.message ||
    maybe?.data?.message ||
    maybe?.payload?.message ||
    maybe?.message ||
    fallback
  );
};

export const toast = {
  success: (content: ReactNode, options?: number | ToastOptions) =>
    open("success", content, options),
  error: (content: ReactNode, options?: number | ToastOptions) =>
    open("error", content, options),
  info: (content: ReactNode, options?: number | ToastOptions) =>
    open("info", content, options),
  warning: (content: ReactNode, options?: number | ToastOptions) =>
    open("warning", content, options),
  message: (content: ReactNode, options?: number | ToastOptions) =>
    open("info", content, options),
  fromError: (error: unknown, fallback = "Có lỗi xảy ra") => {
    open("error", getErrorMessage(error, fallback));
  },
};

export default toast;
