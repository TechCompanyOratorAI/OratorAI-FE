import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  User,
  BookOpen,
  CheckCircle2,
  Info,
  Bell,
  Menu,
  X,
  LogOut,
  GraduationCap,
} from "lucide-react";
import Toast from "@/components/Toast/Toast";
import { useAppDispatch, useAppSelector } from "@/services/store/store";
import { fetchClassDetail } from "@/services/features/admin/classSlice";
import { fetchEnrolledClasses } from "@/services/features/enrollment/enrollmentSlice";
import { logout } from "@/services/features/auth/authSlice";

const StudentClassDetailPage: React.FC = () => {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const {
    selectedClass: classDetail,
    loading,
    error,
  } = useAppSelector((state) => state.class);
  const { enrolledClassIds } = useAppSelector((state) => state.enrollment);
  const { user } = useAppSelector((state) => state.auth);

  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (classId) {
      dispatch(fetchClassDetail(parseInt(classId)));
      dispatch(fetchEnrolledClasses());
    }
  }, [classId, dispatch]);

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
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isClassEnrolled = (targetClassId: number): boolean => {
    return enrolledClassIds.includes(targetClassId);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-sky-200 border-t-sky-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading class details...</p>
        </div>
      </div>
    );
  }

  if (error || !classDetail) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sky-600 hover:text-sky-700 font-medium mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-700 font-medium">
              {error || "Class not found"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const classDuration = Math.ceil(
    (new Date(classDetail.endDate).getTime() -
      new Date(classDetail.startDate).getTime()) /
      (1000 * 60 * 60 * 24),
  );

  const instructorName = classDetail.instructors?.length
    ? classDetail.instructors
        .map(
          (instructor) =>
            `${instructor.firstName || ""} ${instructor.lastName || ""}`.trim() ||
            instructor.username ||
            "Unknown Instructor",
        )
        .join(", ")
    : "Unknown Instructor";
  const courseInfo = classDetail.course;
  const classTitle = classDetail.className || classDetail.classCode;
  const enrollmentCount =
    classDetail.enrollments?.length ?? classDetail.enrollmentCount ?? 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-sky-500 to-indigo-500 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">OratorAI</span>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-4">
              {/* Notifications */}
              <button className="relative p-2 hover:bg-gray-100 rounded-lg">
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* User Menu */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 p-1 hover:bg-gray-100 rounded-lg"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {userInitial}
                    </span>
                  </div>
                </button>
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900">
                        {userDisplayName}
                      </p>
                      <p className="text-xs text-gray-500">Student</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
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
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sky-600 hover:text-sky-700 font-medium mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Classes
          </button>

          {/* Class Header */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      classDetail.status === "active"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {classDetail.status === "active" ? "Active" : "Inactive"}
                  </span>
                  {courseInfo?.semester && courseInfo?.academicYear && (
                    <span className="text-sm text-gray-600">
                      {courseInfo.semester} • {courseInfo.academicYear}
                    </span>
                  )}
                  {classId && isClassEnrolled(parseInt(classId)) && (
                    <div className="flex items-center gap-2 px-2 py-1 bg-green-50 text-green-700 rounded-full border border-green-200">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span className="text-xs font-medium">Enrolled</span>
                    </div>
                  )}
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {classTitle}
                </h1>
                <p className="text-lg text-gray-600 mb-1">
                  {classDetail.classCode}
                  {courseInfo?.courseCode && courseInfo?.courseName
                    ? ` • ${courseInfo.courseCode} - ${courseInfo.courseName}`
                    : ""}
                </p>
                {classDetail.description && (
                  <p className="text-gray-700 mt-3">
                    {classDetail.description}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                  Timeline
                </p>
                <div className="flex items-center gap-2 text-gray-800 font-semibold">
                  <Calendar className="w-4 h-4 text-sky-600" />
                  {classDuration} days
                </div>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                  Enrolled
                </p>
                <div className="flex items-center gap-2 text-gray-800 font-semibold">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  {enrollmentCount}
                  {classDetail.maxStudents ? `/${classDetail.maxStudents}` : ""}
                </div>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                  Instructor
                </p>
                <div className="flex items-center gap-2 text-gray-800 font-semibold">
                  <User className="w-4 h-4 text-amber-600" />
                  {instructorName}
                </div>
              </div>
            </div>
          </div>

          {/* Class Info */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <Info className="w-5 h-5 text-indigo-600" />
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">
                  Class information
                </p>
                <h3 className="text-lg font-bold text-gray-900">Details</h3>
              </div>
            </div>
            <div className="space-y-3 text-sm text-gray-700">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Start Date</span>
                <span className="font-semibold text-gray-900">
                  {formatDate(classDetail.startDate)}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">End Date</span>
                <span className="font-semibold text-gray-900">
                  {formatDate(classDetail.endDate)}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Duration</span>
                <span className="font-semibold text-gray-900">
                  {classDuration} days
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Status</span>
                <span
                  className={`font-semibold ${classDetail.status === "active" ? "text-green-700" : "text-gray-700"}`}
                >
                  {classDetail.status === "active" ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Class Code</span>
                <span className="font-semibold text-gray-900">
                  {classDetail.classCode}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-gray-600">Course</span>
                <span className="font-semibold text-gray-900">
                  {courseInfo?.courseCode && courseInfo?.courseName
                    ? `${courseInfo.courseCode} - ${courseInfo.courseName}`
                    : "N/A"}
                </span>
              </div>
            </div>
          </div>
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

export default StudentClassDetailPage;
