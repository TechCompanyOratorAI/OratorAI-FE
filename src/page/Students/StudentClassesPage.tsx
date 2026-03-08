import React, { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import Toast from "@/components/Toast/Toast";
import {
  Search,
  ChevronDown,
  BookOpen,
  User,
  Calendar,
  CheckCircle2,
  Bell,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/services/store/store";
import {
  fetchClasses,
  fetchClassesByCourse,
} from "@/services/features/admin/classSlice";
import {
  enrollClassByKey,
  fetchEnrolledClasses,
} from "@/services/features/enrollment/enrollmentSlice";
import { logout } from "@/services/features/auth/authSlice";
import AppLogo from "@/components/AppLogo/AppLogo";
import type { ClassData } from "@/services/features/admin/classSlice";

interface ClassItem {
  classId: number;
  classCode: string;
  className: string;
  courseCode: string;
  courseName: string;
  semester: string;
  status: "active" | "inactive" | "archived";
  schedule: string;
  instructorName: string;
  description: string;
  enrollmentCount: number;
  maxStudents?: number;
}

const StudentClassesPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    classes: apiClasses,
    loading,
    error,
    pagination,
  } = useAppSelector((state) => state.class);
  const { enrolledClassIds } = useAppSelector((state) => state.enrollment);
  const { user } = useAppSelector((state) => state.auth);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<"All Classes" | "Active Classes" | "Inactive Classes">("All Classes");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);
  const [enrollKey, setEnrollKey] = useState("");
  const [enrollError, setEnrollError] = useState("");
  const [isEnrollSubmitting, setIsEnrollSubmitting] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const courseIdFilter = searchParams.get("courseId");
  const courseIdNumber = courseIdFilter ? parseInt(courseIdFilter, 10) : null;

  // Fetch classes: either all classes or classes of a specific course,
  // and enrolled classes for the current student.
  useEffect(() => {
    if (courseIdNumber) {
      dispatch(fetchClassesByCourse(courseIdNumber));
    } else {
      dispatch(fetchClasses({ page: currentPage, limit: pageSize }));
    }
    dispatch(fetchEnrolledClasses());
  }, [dispatch, currentPage, pageSize, courseIdNumber]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedFilter]);

  // Show error toast if there's an error
  useEffect(() => {
    if (error) {
      setToast({
        message: error,
        type: "error",
      });
    }
  }, [error]);

  // Transform API data to UI format
  const transformClassData = (apiClass: ClassData): ClassItem => {
    const instructorName = apiClass.instructors?.length
      ? apiClass.instructors
          .map(
            (instructor) =>
              `${instructor.firstName || ""} ${instructor.lastName || ""}`.trim() ||
              instructor.username ||
              "Unknown Instructor",
          )
          .join(", ")
      : "Unknown Instructor";
    const courseCode = apiClass.course?.courseCode || "";
    const courseName = apiClass.course?.courseName || "";
    const className = apiClass.className || courseName || apiClass.classCode;
    const semester =
      apiClass.course?.semester && apiClass.course?.academicYear
        ? `${apiClass.course.semester} • ${apiClass.course.academicYear}`
        : "";
    return {
      classId: apiClass.classId,
      classCode: apiClass.classCode,
      className,
      courseCode,
      courseName,
      semester,
      status: apiClass.status,
      schedule: `${new Date(apiClass.startDate).toLocaleDateString("vi-VN")} – ${new Date(apiClass.endDate).toLocaleDateString("vi-VN")}`,
      instructorName,
      description: apiClass.description || "",
      enrollmentCount: apiClass.enrollmentCount ?? 0,
      maxStudents: apiClass.maxStudents,
    };
  };

  const classes: ClassItem[] = apiClasses.map(transformClassData);

  // Filter courses based on selected filter and search query
  const filteredClasses = classes.filter((classItem) => {
    const matchesSearch =
      classItem.className.toLowerCase().includes(searchQuery.toLowerCase()) ||
      classItem.classCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      classItem.courseCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      classItem.courseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      classItem.instructorName
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

    if (selectedFilter === "All Classes") {
      return matchesSearch;
    } else if (selectedFilter === "Active Classes") {
      return matchesSearch && classItem.status === "active";
    } else if (selectedFilter === "Inactive Classes") {
      return matchesSearch && classItem.status !== "active";
    }

    return matchesSearch;
  });

  const isEnrolled = (classId: number): boolean => {
    return enrolledClassIds.includes(classId);
  };

  const openEnrollModal = (classItem: ClassItem) => {
    setSelectedClass(classItem);
    setEnrollKey("");
    setEnrollError("");
    setIsEnrollModalOpen(true);
  };

  const closeEnrollModal = () => {
    setIsEnrollModalOpen(false);
    setSelectedClass(null);
    setEnrollKey("");
    setEnrollError("");
  };

  const handleEnrollSubmit = async () => {
    if (!selectedClass) {
      return;
    }
    const trimmedKey = enrollKey.trim();
    if (!trimmedKey) {
      setEnrollError("Vui lòng nhập mã ghi danh");
      return;
    }

    try {
      setIsEnrollSubmitting(true);
      await dispatch(
        enrollClassByKey({
          classId: selectedClass.classId,
          enrollKey: trimmedKey,
        }),
      ).unwrap();
      await dispatch(fetchEnrolledClasses());
      setToast({
        message: "Successfully enrolled in class!",
        type: "success",
      });
      closeEnrollModal();
    } catch (error: unknown) {
      const errorMessage =
        typeof error === "string"
          ? error
          : (error as Error)?.message || "Ghi danh lớp thất bại";
      setToast({
        message: errorMessage,
        type: "error",
      });
    } finally {
      setIsEnrollSubmitting(false);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const userInitial =
    user?.firstName?.[0]?.toUpperCase() ||
    user?.username?.[0]?.toUpperCase() ||
    "S";

  const userDisplayName = user
    ? `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
      user.username ||
      "Student"
    : "Student";

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div>
                <AppLogo to="/" size="md" />
                <p className="text-xs text-slate-500 font-vn">Student workspace</p>
              </div>
            </div>
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8 font-vn">
              <Link
                to="/student/dashboard"
                className={
                  courseIdNumber
                    ? "text-sm font-medium text-slate-900 border-b-2 border-sky-500 pb-1"
                    : "text-sm font-medium text-slate-700 hover:text-slate-900"
                }
              >
                Khóa học
              </Link>
              <Link
                to="/student/my-class"
                className={
                  courseIdNumber
                    ? "text-sm font-medium text-slate-700 hover:text-slate-900"
                    : "text-sm font-medium text-slate-900 border-b-2 border-sky-500 pb-1"
                }
              >
                Lớp của tôi
              </Link>
              <Link
                to="/student/my-presentations"
                className="text-sm font-medium text-slate-700 hover:text-slate-900"
              >
                Bài thuyết trình
              </Link>
            </nav>

            {/* Right Side Actions */}
            <div className="flex items-center gap-4">
              <button className="relative p-2 hover:bg-sky-50 rounded-full transition">
                <Bell className="w-5 h-5 text-slate-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 p-1 hover:bg-sky-50 rounded-full transition"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-sky-500 to-cyan-500 flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {userInitial}
                    </span>
                  </div>
                </button>
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="text-sm font-semibold text-slate-900">
                        {userDisplayName}
                      </p>
                      <p className="text-xs text-slate-500">Student</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 hover:bg-slate-100 rounded-full"
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5 text-slate-600" />
                ) : (
                  <Menu className="w-5 h-5 text-slate-600" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2 font-vn">
                {courseIdNumber ? "Lớp thuộc khóa học" : "Tất cả lớp học"}
              </h1>
              <p className="text-sm sm:text-base text-slate-600 font-vn">
                {courseIdNumber
                  ? "Các lớp thuộc khóa học đã chọn."
                  : "Xem và khám phá các lớp có sẵn để cải thiện kỹ năng thuyết trình."}
              </p>
            </div>
            {courseIdNumber && (
              <button
                onClick={() => navigate("/student/classes")}
                className="rounded-full border border-sky-200 bg-sky-50 text-sky-700 px-4 py-2 text-sm font-semibold hover:bg-sky-100 transition font-vn"
              >
                Xem tất cả lớp
              </button>
            )}
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
            <div className="relative flex-1 w-full sm:max-w-[448px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm lớp học..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-[43px] pl-10 pr-4 border border-slate-200 bg-white rounded-full focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent font-vn placeholder:text-slate-500"
              />
            </div>
            <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto font-vn">
              <button
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 h-[34px] rounded-full border whitespace-nowrap transition ${
                  selectedFilter === "All Classes"
                    ? "bg-sky-100 border-sky-200 text-sky-800"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
                onClick={() => setSelectedFilter("All Classes")}
              >
                <span className="text-sm font-medium">Tất cả lớp</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              <button
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 h-[34px] rounded-full border whitespace-nowrap transition ${
                  selectedFilter === "Active Classes"
                    ? "bg-sky-100 border-sky-200 text-sky-800"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
                onClick={() => setSelectedFilter("Active Classes")}
              >
                <span className="text-sm font-medium">Đang mở</span>
              </button>
              <button
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 h-[34px] rounded-full border whitespace-nowrap transition ${
                  selectedFilter === "Inactive Classes"
                    ? "bg-sky-100 border-sky-200 text-sky-800"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
                onClick={() => setSelectedFilter("Inactive Classes")}
              >
                <span className="text-sm font-medium">Đã đóng</span>
              </button>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-sky-200 border-t-sky-500 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-600 font-vn">Đang tải danh sách lớp...</p>
              </div>
            </div>
          )}

          {/* Course Cards */}
          {!loading && (
            <div className="space-y-6">
              {filteredClasses.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-12 text-center">
                  <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-lg font-medium text-slate-900 mb-2 font-vn">
                    {searchQuery
                      ? "Không tìm thấy lớp phù hợp"
                      : "Chưa có lớp nào"}
                  </p>
                  <p className="text-sm text-slate-600 font-vn">
                    {searchQuery
                      ? "Thử đổi từ khóa hoặc bộ lọc"
                      : "Hãy quay lại sau để xem lớp mới"}
                  </p>
                </div>
              ) : (
                filteredClasses.map((classItem) => (
                  <div
                    key={classItem.classId}
                    className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden hover:shadow-lg hover:border-sky-100 transition"
                  >
                    {/* Course Info */}
                    <div className="p-5">
                      {/* Header */}
                      <div className="mb-4">
                        <div className="flex items-center gap-3 mb-2">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                              classItem.status === "active"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {classItem.status === "active"
                              ? "Đang mở"
                              : "Đã đóng"}
                          </span>
                          {classItem.semester && (
                            <span className="text-sm text-slate-600">
                              {classItem.semester}
                            </span>
                          )}
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-1 font-vn">
                          {classItem.className}
                        </h3>
                        <p className="text-sm text-slate-600 mb-2">
                          {classItem.classCode}
                          {classItem.courseCode &&
                            classItem.courseName &&
                            ` • ${classItem.courseCode} - ${classItem.courseName}`}
                        </p>
                        {classItem.description && (
                          <p className="text-sm text-slate-700 mb-3 line-clamp-2">
                            {classItem.description}
                          </p>
                        )}
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                        <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                          <User className="w-4 h-4 text-sky-600" />
                          <div>
                            <p className="text-xs text-slate-500 font-vn">Giảng viên</p>
                            <p className="text-sm font-medium text-slate-900">
                              {classItem.instructorName}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                          <BookOpen className="w-4 h-4 text-amber-600" />
                          <div>
                            <p className="text-xs text-slate-500 font-vn">Ghi danh</p>
                            <p className="text-sm font-medium text-slate-900">
                              {classItem.enrollmentCount}
                              {classItem.maxStudents
                                ? `/${classItem.maxStudents}`
                                : ""}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                          <Calendar className="w-4 h-4 text-sky-600" />
                          <div>
                            <p className="text-xs text-slate-500 font-vn">Lịch học</p>
                            <p className="text-sm font-medium text-slate-900">
                              {classItem.schedule}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
                        {isEnrolled(classItem.classId) ? (
                          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200 font-vn">
                            <CheckCircle2 className="w-4 h-4" />
                            <span className="text-sm font-medium">Đã ghi danh</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => openEnrollModal(classItem)}
                            className="rounded-full bg-sky-600 hover:bg-sky-500 text-white px-5 py-2.5 text-sm font-semibold transition font-vn"
                          >
                            Ghi danh
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {!loading && !error && pagination.total > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 mt-8 px-4 py-4 border-t border-slate-200">
              <div className="flex items-center gap-3 font-vn">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <span>Trang {pagination.page} / {pagination.totalPages}</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      const nextSize = parseInt(e.target.value);
                      setPageSize(nextSize);
                      setCurrentPage(1);
                    }}
                    className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-sm focus:border-sky-500 focus:outline-none"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={pagination.page <= 1}
                  className="px-3 py-1.5 rounded-full border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Trước
                </button>
                <button
                  onClick={() =>
                    setCurrentPage((prev) =>
                      Math.min(pagination.totalPages, prev + 1),
                    )
                  }
                  disabled={pagination.page >= pagination.totalPages}
                  className="px-3 py-1.5 rounded-full border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sau
                </button>
              </div>
            </div>
          )}

          {isEnrollModalOpen && selectedClass && (
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
              <div
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                onClick={closeEnrollModal}
              />
              <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-1 font-vn">
                  Ghi danh vào {selectedClass.className}
                </h3>
                <p className="text-sm text-slate-600 mb-4 font-vn">
                  Nhập mã ghi danh để tham gia lớp này.
                </p>
                <label className="block text-sm font-medium text-slate-700 mb-2 font-vn">
                  Mã ghi danh
                </label>
                <input
                  type="text"
                  value={enrollKey}
                  onChange={(event) => {
                    setEnrollKey(event.target.value);
                    if (enrollError) setEnrollError("");
                  }}
                  className={`w-full h-[42px] px-4 border rounded-full focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent font-vn ${
                    enrollError ? "border-red-500" : "border-slate-200"
                  }`}
                  placeholder="Nhập mã ghi danh"
                />
                {enrollError && (
                  <p className="text-sm text-red-600 mt-2 font-vn">{enrollError}</p>
                )}
                <div className="mt-6 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-full font-vn"
                    onClick={closeEnrollModal}
                    disabled={isEnrollSubmitting}
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={handleEnrollSubmit}
                    disabled={isEnrollSubmitting}
                    className="rounded-full bg-sky-600 hover:bg-sky-500 text-white px-5 py-2 text-sm font-semibold transition disabled:opacity-50 font-vn"
                  >
                    {isEnrollSubmitting ? "Đang ghi danh..." : "Ghi danh"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Toast Notification */}
          {toast && (
            <div className="fixed top-4 right-4 z-50 max-w-md">
              <Toast
                message={toast.message}
                type={toast.type}
                onClose={() => setToast(null)}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default StudentClassesPage;
