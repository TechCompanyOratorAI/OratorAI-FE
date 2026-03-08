import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import Toast from "@/components/Toast/Toast";
import {
  Search,
  GraduationCap,
  BookOpen,
  Calendar,
  Users,
  CheckCircle2,
  Menu,
  X,
  LogOut,
  Bell,
  ChevronDown,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/services/store/store";
import { logout } from "@/services/features/auth/authSlice";
import AppLogo from "@/components/AppLogo/AppLogo";
import { fetchCourses } from "@/services/features/course/courseSlice";
// Enrollment by course is no longer used for students

const StudentDashboardPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const { courses, loading, error, pagination } = useAppSelector(
    (state) => state.course,
  );

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    dispatch(fetchCourses({ page: currentPage, limit: pageSize }));
  }, [dispatch, currentPage, pageSize]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const fullName = user
    ? `${user.firstName} ${user.lastName}`.trim()
    : "Student";

  const filteredCourses = courses.filter((course) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const instructorNames = (course.instructors || course.instructor
      ? (course.instructors || [course.instructor])
        .filter(Boolean)
        .map(
          (inst) =>
            `${inst?.firstName || ""} ${inst?.lastName || ""}`.toLowerCase(),
        )
        .join(" ")
      : ""
    ).toLowerCase();

    return (
      course.courseName.toLowerCase().includes(query) ||
      course.courseCode.toLowerCase().includes(query) ||
      (course.majorCode || "").toLowerCase().includes(query) ||
      instructorNames.includes(query)
    );
  });

  const stats = {
    total: courses.length,
    active: courses.filter((c) => c.isActive).length,
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div>
                <AppLogo to="/" size="md" />
                <p className="text-xs text-slate-500 font-vn">Student workspace</p>
              </div>
            </div>
            <nav className="hidden md:flex items-center gap-8 font-vn">
              <Link
                to="/student/dashboard"
                className="text-sm font-medium text-slate-900 border-b-2 border-sky-500 pb-1"
              >
                Khóa học
              </Link>
              <Link
                to="/student/my-class"
                className="text-sm font-medium text-slate-700 hover:text-slate-900"
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
            <div className="flex items-center gap-4">
              <button className="relative p-2 hover:bg-sky-50 rounded-full transition">
                <Bell className="w-5 h-5 text-slate-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </button>
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 p-1 hover:bg-sky-50 rounded-full transition"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-sky-500 to-cyan-500 flex items-center justify-center">
                    <span className="text-white font-semibold text-xs">
                      {fullName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-600" />
                </button>
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="text-sm font-semibold text-slate-900">{fullName}</p>
                      <p className="text-xs text-slate-500">Student</p>
                    </div>
                    <Link
                      to="/student/settings"
                      className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 font-vn"
                    >
                      Cài đặt
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 font-vn"
                    >
                      <LogOut className="w-4 h-4" />
                      Đăng xuất
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
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white">
            <nav className="px-4 py-3 space-y-1 font-vn">
              <Link
                to="/student/dashboard"
                className="block px-3 py-2 text-sm font-medium text-slate-900 bg-sky-50 rounded-lg"
              >
                Khóa học
              </Link>
              <Link
                to="/student/my-class"
                className="block px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg"
              >
                Lớp của tôi
              </Link>
              <Link
                to="/student/my-presentations"
                className="block px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg"
              >
                Bài thuyết trình
              </Link>
              <Link
                to="/student/settings"
                className="block px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg"
              >
                Cài đặt
              </Link>
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2 font-vn">
                Tìm khóa học của bạn
              </h1>
              <p className="text-sm sm:text-base text-slate-600 font-vn">
                Xem các khóa học có sẵn và ghi danh vào khóa phù hợp với bạn.
              </p>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
            <div className="relative flex-1 w-full lg:max-w-[448px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm theo tên khóa, mã, chuyên ngành hoặc giảng viên..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-[43px] pl-10 pr-4 border border-slate-200 bg-white rounded-full focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent font-vn placeholder:text-slate-500"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full lg:w-auto">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-sky-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-vn">Tổng khóa học</p>
                  <p className="text-lg font-semibold text-slate-900">{stats.total}</p>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-vn">Khóa đang mở</p>
                  <p className="text-lg font-semibold text-slate-900">{stats.active}</p>
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-sky-200 border-t-sky-500 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-slate-600 font-vn">Đang tải khóa học...</p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-white rounded-2xl border border-red-200 shadow-md p-6 text-center">
              <p className="text-red-600 mb-4 font-vn">{error}</p>
              <button
                onClick={() =>
                  dispatch(fetchCourses({ page: currentPage, limit: pageSize }))
                }
                className="rounded-full bg-sky-600 hover:bg-sky-500 text-white px-5 py-2.5 text-sm font-semibold transition font-vn"
              >
                Thử lại
              </button>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-12 text-center">
              <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-lg font-medium text-slate-900 mb-2 font-vn">
                Không tìm thấy khóa học
              </p>
              <p className="text-sm text-slate-600 font-vn">
                Thử đổi từ khóa tìm kiếm.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredCourses.map((course) => {
                const instructorNames = course.instructors?.length
                  ? course.instructors
                    .map(
                      (inst) =>
                        `${inst.firstName || ""} ${inst.lastName || ""}`.trim() ||
                        inst.username,
                    )
                    .join(", ")
                  : course.instructor
                    ? `${course.instructor.firstName || ""} ${course.instructor.lastName || ""
                      }`.trim() || course.instructor.username
                    : "Chưa gán giảng viên";

                return (
                  <div
                    key={course.courseId}
                    className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden hover:shadow-lg hover:border-sky-100 transition"
                  >
                    <div className="p-5">
                      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                                course.isActive
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {course.isActive ? "Đang mở" : "Đã đóng"}
                            </span>
                            <span className="text-sm text-slate-600">
                              {course.semester} • {course.academicYear}
                            </span>
                          </div>
                          <h3 className="text-xl font-bold text-slate-900 mb-1 font-vn">
                            {course.courseName}
                          </h3>
                          <p className="text-sm text-slate-600 mb-2">
                            {course.courseCode} • Chuyên ngành: {course.majorCode}
                          </p>
                          {course.description && (
                            <p className="text-sm text-slate-700 mb-3 line-clamp-2">
                              {course.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                          <Users className="w-4 h-4 text-sky-600" />
                          <div>
                            <p className="text-xs text-slate-500 font-vn">Giảng viên</p>
                            <p className="text-sm font-medium text-slate-900">
                              {instructorNames}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                          <Calendar className="w-4 h-4 text-sky-600" />
                          <div>
                            <p className="text-xs text-slate-500 font-vn">Lịch học</p>
                            <p className="text-sm font-medium text-slate-900">
                              {new Date(course.startDate).toLocaleDateString("vi-VN")}{" "}
                              – {new Date(course.endDate).toLocaleDateString("vi-VN")}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-3 pt-4 border-t border-slate-200">
                        <button
                          onClick={() =>
                            navigate(`/student/classes?courseId=${course.courseId}`)
                          }
                          className="rounded-full bg-sky-600 hover:bg-sky-500 text-white px-5 py-2.5 text-sm font-semibold transition font-vn"
                        >
                          Xem lớp
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
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
        </div>
      </main>

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
  );
};

export default StudentDashboardPage;
