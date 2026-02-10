import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import Button from "@/components/yoodli/Button";
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
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getInstructorNames = (cls: (typeof enrolledClasses)[0]) => {
    if (!cls.class.instructors || cls.class.instructors.length === 0) {
      return "No instructor assigned";
    }
    return cls.class.instructors
      .map((i) => `${i.firstName} ${i.lastName}`.trim())
      .join(", ");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700">
            Active
          </span>
        );
      case "inactive":
        return (
          <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
            Inactive
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
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
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Courses
              </Link>
              <Link
                to="/student/my-class"
                className="text-sm font-medium text-gray-900 border-b-2 border-sky-500 pb-1"
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
                className="block px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg"
              >
                Courses
              </Link>
              <Link
                to="/student/my-class"
                className="block px-3 py-2 text-sm font-medium text-gray-900 bg-gray-50 rounded-lg"
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
                My Classes
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                View all classes you have enrolled in.
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="flex mb-8">
            <div className="relative flex-1 w-full sm:max-w-[448px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search for classes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-[43px] pl-10 pr-4 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-sky-200 border-t-sky-500 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Loading your classes...</p>
              </div>
            </div>
          )}

          {/* Class Cards */}
          {!loading && (
            <div className="space-y-6">
              {filteredClasses.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                  <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    {searchQuery
                      ? "No classes found matching your search"
                      : "You haven't enrolled in any classes yet"}
                  </p>
                  <p className="text-sm text-gray-600 mb-4">
                    {searchQuery
                      ? "Try adjusting your search terms"
                      : "Go to the Courses tab to find classes and enroll to get started."}
                  </p>
                </div>
              ) : (
                filteredClasses.map((cls) => (
                  <div
                    key={cls.enrollmentId}
                    className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                  >
                    {/* Class Info */}
                    <div className="p-5">
                      {/* Header */}
                      <div className="mb-4">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="flex items-center gap-2 px-2 py-1 bg-green-50 text-green-700 rounded-full border border-green-200">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span className="text-xs font-medium">
                              Enrolled
                            </span>
                          </div>
                          {getStatusBadge(cls.class.status)}
                          <span className="text-sm text-gray-600">
                            {cls.class.course?.semester} •{" "}
                            {cls.class.course?.academicYear}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-1">
                          {cls.class.className}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {cls.class.course?.courseCode} -{" "}
                          {cls.class.course?.courseName}
                        </p>
                        {cls.class.description && (
                          <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                            {cls.class.description}
                          </p>
                        )}
                        <p className="text-xs text-gray-500">
                          Enrolled on {formatDate(cls.enrolledAt)}
                        </p>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
                          <Users className="w-4 h-4 text-gray-600" />
                          <div>
                            <p className="text-xs text-gray-600">Instructor</p>
                            <p className="text-sm font-medium text-gray-900">
                              {getInstructorNames(cls)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
                          <Calendar className="w-4 h-4 text-gray-600" />
                          <div>
                            <p className="text-xs text-gray-600">Start Date</p>
                            <p className="text-sm font-medium text-gray-900">
                              {formatDate(cls.class.startDate)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
                          <Calendar className="w-4 h-4 text-gray-600" />
                          <div>
                            <p className="text-xs text-gray-600">End Date</p>
                            <p className="text-sm font-medium text-gray-900">
                              {formatDate(cls.class.endDate)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-200">
                        <Button
                          text="View Class"
                          variant="primary"
                          fontSize="14px"
                          borderRadius="6px"
                          paddingWidth="16px"
                          paddingHeight="8px"
                          onClick={() => handleViewClass(cls.classId)}
                        />
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
