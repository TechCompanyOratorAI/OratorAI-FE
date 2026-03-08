import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import Toast from "@/components/Toast/Toast";
import {
  Search,
  Users,
  Calendar,
  BookOpen,
  CheckCircle2,
  Bell,
  Menu,
  X,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/services/store/store";
import { fetchEnrolledClasses } from "@/services/features/enrollment/enrollmentSlice";
import { logout } from "@/services/features/auth/authSlice";
import AppLogo from "@/components/AppLogo/AppLogo";

const StudentMyClassesPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { enrolledClasses, loading, error } = useAppSelector(
    (state) => state.enrollment,
  );
  const { user } = useAppSelector((state) => state.auth);

  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    };

    if (isUserMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isUserMenuOpen]);

  // Fetch enrolled classes on component mount
  useEffect(() => {
    dispatch(fetchEnrolledClasses());
  }, [dispatch]);

  // Show error toast if there's an error
  useEffect(() => {
    if (error) {
      setToast({
        message: error,
        type: "error",
      });
    }
  }, [error]);

  // Filter classes based on search query
  const filteredClasses = enrolledClasses.filter((cls) => {
    const className = cls.class.className?.toLowerCase() || "";
    const classCode = cls.class.classCode?.toLowerCase() || "";
    const courseName = cls.class.course?.courseName?.toLowerCase() || "";
    const courseCode = cls.class.course?.courseCode?.toLowerCase() || "";
    const instructorName =
      cls.class.instructors
        ?.map((i) => `${i.firstName} ${i.lastName}`.toLowerCase())
        .join(" ") || "";

    const searchLower = searchQuery.toLowerCase();

    return (
      className.includes(searchLower) ||
      classCode.includes(searchLower) ||
      courseName.includes(searchLower) ||
      courseCode.includes(searchLower) ||
      instructorName.includes(searchLower)
    );
  });

  const handleViewClass = (classId: number) => {
    navigate(`/student/class/${classId}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getInstructorNames = (cls: (typeof enrolledClasses)[0]) => {
    if (!cls.class.instructors || cls.class.instructors.length === 0) {
      return "Chưa gán giảng viên";
    }
    return cls.class.instructors
      .map((i) => `${i.firstName} ${i.lastName}`.trim())
      .join(", ");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
            Đang mở
          </span>
        );
      case "inactive":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
            Đã đóng
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
            {status}
          </span>
        );
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const fullName = user
    ? `${user.firstName} ${user.lastName}`.trim()
    : "Student";

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
                className="text-sm font-medium text-slate-700 hover:text-slate-900"
              >
                Khóa học
              </Link>
              <Link
                to="/student/my-class"
                className="text-sm font-medium text-slate-900 border-b-2 border-sky-500 pb-1"
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
                className="block px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg"
              >
                Khóa học
              </Link>
              <Link
                to="/student/my-class"
                className="block px-3 py-2 text-sm font-medium text-slate-900 bg-sky-50 rounded-lg"
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
                Lớp của tôi
              </h1>
              <p className="text-sm sm:text-base text-slate-600 font-vn">
                Xem tất cả lớp bạn đã ghi danh.
              </p>
            </div>
          </div>

          <div className="flex mb-8">
            <div className="relative flex-1 w-full sm:max-w-[448px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm lớp..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-[43px] pl-10 pr-4 border border-slate-200 bg-white rounded-full focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent font-vn placeholder:text-slate-500"
              />
            </div>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-sky-200 border-t-sky-500 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-slate-600 font-vn">Đang tải lớp của bạn...</p>
              </div>
            </div>
          )}

          {!loading && (
            <div className="space-y-6">
              {filteredClasses.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-12 text-center">
                  <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-lg font-medium text-slate-900 mb-2 font-vn">
                    {searchQuery
                      ? "Không tìm thấy lớp phù hợp"
                      : "Bạn chưa ghi danh lớp nào"}
                  </p>
                  <p className="text-sm text-slate-600 mb-4 font-vn">
                    {searchQuery
                      ? "Thử đổi từ khóa tìm kiếm"
                      : "Vào mục Khóa học để tìm và ghi danh lớp."}
                  </p>
                </div>
              ) : (
                filteredClasses.map((cls) => (
                  <div
                    key={cls.enrollmentId}
                    className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden hover:shadow-lg hover:border-sky-100 transition"
                  >
                    <div className="p-5">
                      <div className="mb-4">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="flex items-center gap-2 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200 font-vn">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span className="text-xs font-medium">Đã ghi danh</span>
                          </div>
                          {getStatusBadge(cls.class.status)}
                          <span className="text-sm text-slate-600">
                            {cls.class.course?.semester} • {cls.class.course?.academicYear}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-1 font-vn">
                          {cls.class.className}
                        </h3>
                        <p className="text-sm text-slate-600 mb-2">
                          {cls.class.course?.courseCode} - {cls.class.course?.courseName}
                        </p>
                        {cls.class.description && (
                          <p className="text-sm text-slate-700 mb-3 line-clamp-2">
                            {cls.class.description}
                          </p>
                        )}
                        <p className="text-xs text-slate-500 font-vn">
                          Ghi danh ngày {formatDate(cls.enrolledAt)}
                        </p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                        <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                          <Users className="w-4 h-4 text-sky-600" />
                          <div>
                            <p className="text-xs text-slate-500 font-vn">Giảng viên</p>
                            <p className="text-sm font-medium text-slate-900">
                              {getInstructorNames(cls)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                          <Calendar className="w-4 h-4 text-sky-600" />
                          <div>
                            <p className="text-xs text-slate-500 font-vn">Ngày bắt đầu</p>
                            <p className="text-sm font-medium text-slate-900">
                              {formatDate(cls.class.startDate)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                          <Calendar className="w-4 h-4 text-sky-600" />
                          <div>
                            <p className="text-xs text-slate-500 font-vn">Ngày kết thúc</p>
                            <p className="text-sm font-medium text-slate-900">
                              {formatDate(cls.class.endDate)}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
                        <button
                          onClick={() => handleViewClass(cls.classId)}
                          className="rounded-full bg-sky-600 hover:bg-sky-500 text-white px-5 py-2.5 text-sm font-semibold transition font-vn"
                        >
                          Xem lớp
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
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

export default StudentMyClassesPage;
