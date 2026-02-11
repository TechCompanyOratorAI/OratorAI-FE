import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import Button from "@/components/yoodli/Button";
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
    <div className="min-h-screen bg-gray-50">
      {/* Simple Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-sky-500 to-indigo-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">E</span>
              </div>
              <span className="text-lg font-semibold text-gray-900">
                OratorAI
              </span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <Link
                to="/student/dashboard"
                className="text-sm font-medium text-gray-900 border-b-2 border-sky-500 pb-1"
              >
                Courses
              </Link>
              <Link
                to="/student/my-class"
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                My Classes
              </Link>
              <Link
                to="/student/feedback"
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                My Presentations
              </Link>
            </nav>

            {/* User Actions */}
            <div className="flex items-center gap-4">
              <button className="relative p-2 hover:bg-gray-100 rounded-lg">
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 p-1 hover:bg-gray-100 rounded-lg"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 flex items-center justify-center">
                    <span className="text-white font-semibold text-xs">
                      {fullName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-600" />
                </button>
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900">
                        {fullName}
                      </p>
                      <p className="text-xs text-gray-500">Student</p>
                    </div>
                    <Link
                      to="/student/settings"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Settings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Đăng Xuất
                    </button>
                  </div>
                )}
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5 text-gray-600" />
                ) : (
                  <Menu className="w-5 h-5 text-gray-600" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <nav className="px-4 py-3 space-y-1">
              <Link
                to="/student/dashboard"
                className="block px-3 py-2 text-sm font-medium text-gray-900 bg-gray-50 rounded-lg"
              >
                Courses
              </Link>
              <Link
                to="/student/my-class"
                className="block px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg"
              >
                My Classes
              </Link>
              <Link
                to="/student/feedback"
                className="block px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg"
              >
                My Presentations
              </Link>
              <Link
                to="/student/settings"
                className="block px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg"
              >
                Settings
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Find your course
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                Browse available courses and enroll in the ones that fit you.
              </p>
            </div>
          </div>

          {/* Search and Stats */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
            {/* Search */}
            <div className="relative flex-1 w-full lg:max-w-[448px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by course name, code, major, or instructor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-[43px] pl-10 pr-4 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full lg:w-auto">
              <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center">
                  <GraduationCap className="w-4 h-4 text-sky-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total Courses</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {stats.total}
                  </p>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Active Courses</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {stats.active}
                  </p>
                </div>
              </div>
              {/* Enrolled courses card removed because course enrollment is no longer used */}
            </div>
          </div>

          {/* Course List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-sky-200 border-t-sky-500 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Loading courses...</p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-white rounded-2xl border border-red-200 p-6 text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <Button
                text="Retry"
                variant="primary"
                fontSize="14px"
                borderRadius="8px"
                paddingWidth="16px"
                paddingHeight="8px"
                onClick={() =>
                  dispatch(fetchCourses({ page: currentPage, limit: pageSize }))
                }
              />
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                No courses found
              </p>
              <p className="text-sm text-gray-600">
                Try adjusting your search keywords.
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
                    : "No instructor assigned";

                return (
                  <div
                    key={course.courseId}
                    className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="p-5">
                      {/* Header */}
                      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${course.isActive
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-700"
                                }`}
                            >
                              {course.isActive ? "Active" : "Inactive"}
                            </span>
                            <span className="text-sm text-gray-600">
                              {course.semester} • {course.academicYear}
                            </span>
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 mb-1">
                            {course.courseName}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">
                            {course.courseCode} • Major: {course.majorCode}
                          </p>
                          {course.description && (
                            <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                              {course.description}
                            </p>
                          )}
                        </div>
                        {/* Enrolled chip removed: students enroll at class level only */}
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
                          <Users className="w-4 h-4 text-gray-600" />
                          <div>
                            <p className="text-xs text-gray-600">Instructor</p>
                            <p className="text-sm font-medium text-gray-900">
                              {instructorNames}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
                          <Calendar className="w-4 h-4 text-gray-600" />
                          <div>
                            <p className="text-xs text-gray-600">Schedule</p>
                            <p className="text-sm font-medium text-gray-900">
                              {new Date(course.startDate).toLocaleDateString()}{" "}
                              -{" "}
                              {new Date(course.endDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-3 pt-4 border-t border-gray-200">
                        <Button
                          text="Classes"
                          variant="primary"
                          fontSize="14px"
                          borderRadius="6px"
                          paddingWidth="16px"
                          paddingHeight="8px"
                          onClick={() =>
                            navigate(`/student/classes?courseId=${course.courseId}`)
                          }
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!loading && !error && pagination.total > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 mt-8 px-4 py-4 border-t border-gray-200">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="text-sm text-gray-600">
                    Page {pagination.page} of {pagination.totalPages}
                  </div>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      const nextSize = parseInt(e.target.value);
                      setPageSize(nextSize);
                      setCurrentPage(1);
                    }}
                    className="rounded-full border border-gray-200 bg-white px-2.5 py-1 text-sm focus:border-sky-500 focus:outline-none"
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
                  className="px-3 py-1.5 rounded-full border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() =>
                    setCurrentPage((prev) =>
                      Math.min(pagination.totalPages, prev + 1),
                    )
                  }
                  disabled={pagination.page >= pagination.totalPages}
                  className="px-3 py-1.5 rounded-full border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
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
