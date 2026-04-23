import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const backendMessageMap: Record<string, string> = {
  "Department already exists": "Bộ môn đã tồn tại",
  "Course already exists": "Khóa học đã tồn tại",
  "Class already exists": "Lớp học đã tồn tại",
  "Rubric template already exists": "Mẫu tiêu chí đã tồn tại",
  "Not found": "Không tìm thấy dữ liệu",
  Unauthorized: "Bạn không có quyền thực hiện thao tác này",
  Forbidden: "Bạn không có quyền truy cập",
  "Invalid request data": "Dữ liệu gửi lên không hợp lệ",
  "Validation failed": "Dữ liệu không hợp lệ",
};

const backendMessagePatternMap: Array<[RegExp, string]> = [
  [/already exists/i, "Dữ liệu đã tồn tại"],
  [/not found/i, "Không tìm thấy dữ liệu"],
  [/unauthorized/i, "Bạn không có quyền thực hiện thao tác này"],
  [/forbidden/i, "Bạn không có quyền truy cập"],
  [/invalid/i, "Dữ liệu không hợp lệ"],
  [/failed to create/i, "Tạo dữ liệu thất bại"],
  [/failed to update/i, "Cập nhật dữ liệu thất bại"],
  [/failed to delete/i, "Xóa dữ liệu thất bại"],
  [/failed to fetch|failed to load/i, "Không thể tải dữ liệu"],
];

export const localizeBackendMessage = (message?: string | null): string => {
  const rawMessage = (message || "").trim();
  if (!rawMessage) return "";

  const exactMatch = backendMessageMap[rawMessage];
  if (exactMatch) return exactMatch;

  const patternMatch = backendMessagePatternMap.find(([pattern]) =>
    pattern.test(rawMessage),
  );
  if (patternMatch) return patternMatch[1];

  return rawMessage;
};

export const extractLocalizedMessage = (
  payload: unknown,
  fallback: string,
): string => {
  if (typeof payload === "string" && payload.trim()) {
    return localizeBackendMessage(payload);
  }

  if (payload && typeof payload === "object") {
    const record = payload as {
      message?: unknown;
      data?: { message?: unknown };
    };

    if (typeof record.message === "string" && record.message.trim()) {
      return localizeBackendMessage(record.message);
    }

    if (
      record.data &&
      typeof record.data.message === "string" &&
      record.data.message.trim()
    ) {
      return localizeBackendMessage(record.data.message);
    }
  }

  return fallback;
};
