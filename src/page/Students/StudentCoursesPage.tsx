import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Button from "@/components/yoodli/Button";
import Toast from "@/components/Toast/Toast";
import { Search, ChevronDown, BookOpen, User, Calendar, CheckCircle2, Bell, Menu, X, LogOut, GraduationCap } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/services/store/store";
import { fetchCourses } from "@/services/features/course/courseSlice";
import { enrollCourse, fetchEnrolledCourses } from "@/services/features/enrollment/enrollmentSlice";
import { logout } from "@/services/features/auth/authSlice";
import type { CourseData } from "@/services/features/course/courseSlice";

interface Course {
  id: string;
  title: string;
  courseCode: string;
  semester: string;
  status: "active" | "archived";
  schedule: string;
  instructorName: string;
  topicsCount: number;
  description: string;
  enrollmentCount?: number;
}

const StudentCoursesPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { courses: apiCourses, loading, error } = useAppSelector(
    (state) => state.course
  );
  const { enrolledCourseIds, loading: enrollmentLoading } = useAppSelector(
    (state) => state.enrollment
  );
  const { user } = useAppSelector((state) => state.auth);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All Courses");
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const [enrollingCourseId, setEnrollingCourseId] = useState<number | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Fetch all courses and enrolled courses on component mount
  useEffect(() => {
    dispatch(fetchCourses({}));
    dispatch(fetchEnrolledCourses());
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

  // Transform API data to UI format
  const transformCourseData = (apiCourse: CourseData): Course => {
    const isActive = apiCourse.isActive;
    const instructorName = apiCourse.instructor
      ? `${apiCourse.instructor.firstName || ""} ${apiCourse.instructor.lastName || ""}`.trim() || apiCourse.instructor.username || "Unknown Instructor"
      : "Unknown Instructor";
    return {
      id: apiCourse.courseId.toString(),
      title: apiCourse.courseName,
      courseCode: apiCourse.courseCode,
      semester: `${apiCourse.semester} • ${apiCourse.academicYear}`,
      status: isActive ? "active" : "archived",
      schedule: `${new Date(apiCourse.startDate).toLocaleDateString()} to ${new Date(apiCourse.endDate).toLocaleDateString()}`,
      instructorName,
      topicsCount: apiCourse.topics?.length ?? 0,
      description: apiCourse.description || "",
      enrollmentCount: apiCourse.enrollmentCount,
    };
  };

  const courses: Course[] = apiCourses.map(transformCourseData);

  // Filter courses based on selected filter and search query
  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.courseCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.instructorName.toLowerCase().includes(searchQuery.toLowerCase());

    if (selectedFilter === "All Courses") {
      return matchesSearch;
    } else if (selectedFilter === "Active Courses") {
      return matchesSearch && course.status === "active";
    } else if (selectedFilter === "Archived Courses") {
      return matchesSearch && course.status === "archived";
    }

    return matchesSearch;
  });

  const handleViewCourse = (courseId: string) => {
    navigate(`/student/course/${courseId}`);
  };

  const handleEnrollCourse = async (courseId: number) => {
    try {
      setEnrollingCourseId(courseId);
      await dispatch(enrollCourse(courseId)).unwrap();
      // Refresh enrolled courses list
      await dispatch(fetchEnrolledCourses());
      setToast({
        message: "Successfully enrolled in course!",
        type: "success",
      });
    } catch (error: unknown) {
      const errorMessage = typeof error === 'string' 
        ? error 
        : (error as Error)?.message || "Failed to enroll in course";
      setToast({
        message: errorMessage,
        type: "error",
      });
    } finally {
      setEnrollingCourseId(null);
    }
  };

  const isEnrolled = (courseId: number): boolean => {
    return enrolledCourseIds.includes(courseId);
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const userInitial =
    user?.firstName?.[0]?.toUpperCase() ||
    user?.username?.[0]?.toUpperCase() ||
    "S";

  const userDisplayName =
    user
      ? `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
        user.username ||
        "Student"
      : "Student";

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
              <div className="relative">
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
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                All Courses
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                Browse and explore available courses to improve your presentation skills.
              </p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
            {/* Search */}
            <div className="relative flex-1 w-full sm:max-w-[448px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search for courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-[43px] pl-10 pr-4 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto">
              <button
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 h-[34px] rounded-full border whitespace-nowrap ${
                  selectedFilter === "All Courses"
                    ? "bg-gray-100 border-gray-300"
                    : "bg-white border-gray-300"
                }`}
                onClick={() => setSelectedFilter("All Courses")}
              >
                <span className="text-sm font-medium text-gray-700">
                  All Courses
                </span>
                <ChevronDown className="w-4 h-4 text-gray-600" />
              </button>
              <button
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 h-[34px] rounded-full border whitespace-nowrap ${
                  selectedFilter === "Active Courses"
                    ? "bg-gray-100 border-gray-300"
                    : "bg-white border-gray-300"
                }`}
                onClick={() => setSelectedFilter("Active Courses")}
              >
                <span className="text-sm font-medium text-gray-700">
                  Active Courses
                </span>
              </button>
              <button
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 h-[34px] rounded-full border whitespace-nowrap ${
                  selectedFilter === "Archived Courses"
                    ? "bg-gray-100 border-gray-300"
                    : "bg-white border-gray-300"
                }`}
                onClick={() => setSelectedFilter("Archived Courses")}
              >
                <span className="text-sm font-medium text-gray-700">
                  Archived
                </span>
              </button>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-sky-200 border-t-sky-500 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Loading courses...</p>
              </div>
            </div>
          )}

          {/* Course Cards */}
          {!loading && (
            <div className="space-y-6">
              {filteredCourses.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                  <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    {searchQuery
                      ? "No courses found matching your search"
                      : "No courses available"}
                  </p>
                  <p className="text-sm text-gray-600">
                    {searchQuery
                      ? "Try adjusting your search terms or filters"
                      : "Check back later for new courses"}
                  </p>
                </div>
              ) : (
                filteredCourses.map((course) => (
                  <div
                    key={course.id}
                    className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                  >
                    {/* Course Info */}
                    <div className="p-5">
                        {/* Header */}
                        <div className="mb-4">
                          <div className="flex items-center gap-3 mb-2">
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                course.status === "active"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {course.status === "active" ? "Active" : "Archived"}
                            </span>
                            <span className="text-sm text-gray-600">
                              {course.semester}
                            </span>
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 mb-1">
                            {course.title}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">
                            {course.courseCode}
                          </p>
                          {course.description && (
                            <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                              {course.description}
                            </p>
                          )}
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
                            <User className="w-4 h-4 text-gray-600" />
                            <div>
                              <p className="text-xs text-gray-600">Instructor</p>
                              <p className="text-sm font-medium text-gray-900">
                                {course.instructorName}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
                            <BookOpen className="w-4 h-4 text-gray-600" />
                            <div>
                              <p className="text-xs text-gray-600">Topics</p>
                              <p className="text-sm font-medium text-gray-900">
                                {course.topicsCount}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
                            <Calendar className="w-4 h-4 text-gray-600" />
                            <div>
                              <p className="text-xs text-gray-600">Schedule</p>
                              <p className="text-sm font-medium text-gray-900">
                                {course.schedule}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Action Button */}
                        <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-200">
                          {isEnrolled(parseInt(course.id)) ? (
                            <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-full border border-green-200">
                              <CheckCircle2 className="w-4 h-4" />
                              <span className="text-sm font-medium">Enrolled</span>
                            </div>
                          ) : (
                            <Button
                              text={enrollingCourseId === parseInt(course.id) ? "Enrolling..." : "Enroll Now"}
                              variant="primary"
                              fontSize="14px"
                              borderRadius="6px"
                              paddingWidth="16px"
                              paddingHeight="8px"
                              onClick={() => handleEnrollCourse(parseInt(course.id))}
                              disabled={enrollingCourseId === parseInt(course.id) || enrollmentLoading}
                            />
                          )}
                          <Button
                            text="View Course"
                            variant="secondary"
                            fontSize="14px"
                            borderRadius="6px"
                            paddingWidth="16px"
                            paddingHeight="8px"
                            onClick={() => handleViewCourse(course.id)}
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

export default StudentCoursesPage;
