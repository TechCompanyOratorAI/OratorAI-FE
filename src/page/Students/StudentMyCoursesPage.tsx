import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SidebarStudent from "@/components/Sidebar/SidebarStudent/SidebarStudent";
import Button from "@/components/yoodli/Button";
import Toast from "@/components/Toast/Toast";
import { Search, BookOpen, User, Calendar, CheckCircle2 } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/services/store/store";
import { fetchEnrolledCourses } from "@/services/features/enrollment/enrollmentSlice";
import type { EnrolledCourse } from "@/services/features/enrollment/enrollmentSlice";

const StudentMyCoursesPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { enrolledCourses, loading, error } = useAppSelector(
    (state) => state.enrollment
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  // Fetch enrolled courses on component mount
  useEffect(() => {
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

  // Filter courses based on search query
  const filteredCourses = enrolledCourses.filter((course) => {
    const matchesSearch =
      course.courseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.courseCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${course.instructor.firstName} ${course.instructor.lastName}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  const handleViewCourse = (courseId: number) => {
    navigate(`/student/course/${courseId}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const instructorName = (course: EnrolledCourse) => {
    return `${course.instructor.firstName} ${course.instructor.lastName}`.trim() || course.instructor.username || "Unknown Instructor";
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <SidebarStudent activeItem="my-courses" />

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6 sm:mb-8">
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-[32px] font-bold text-gray-900 mb-2">
                  My Courses
                </h1>
                <p className="text-sm sm:text-base text-gray-600">
                  View all courses you have enrolled in.
                </p>
              </div>
            </div>

            {/* Search */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 gap-4">
              <div className="relative flex-1 w-full sm:max-w-[448px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search for courses (e.g. CS101)..."
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
                  <p className="text-gray-600">Loading your courses...</p>
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
                        : "You haven't enrolled in any courses yet"}
                    </p>
                    <p className="text-sm text-gray-600 mb-4">
                      {searchQuery
                        ? "Try adjusting your search terms"
                        : "Browse available courses and enroll to get started"}
                    </p>
                    {!searchQuery && (
                      <Button
                        text="Browse Courses"
                        variant="primary"
                        fontSize="14px"
                        borderRadius="6px"
                        paddingWidth="16px"
                        paddingHeight="8px"
                        onClick={() => navigate("/student/courses")}
                      />
                    )}
                  </div>
                ) : (
                  filteredCourses.map((course) => (
                    <div
                      key={course.enrollmentId}
                      className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                    >
                      {/* Course Info */}
                      <div className="p-5">
                          {/* Header */}
                          <div className="mb-4">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="flex items-center gap-2 px-2 py-1 bg-green-50 text-green-700 rounded-full border border-green-200">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span className="text-xs font-medium">Enrolled</span>
                              </div>
                              <span
                                className={`px-2 py-1 rounded text-xs font-medium ${
                                  course.isActive
                                    ? "bg-green-100 text-green-700"
                                    : "bg-gray-100 text-gray-700"
                                }`}
                              >
                                {course.isActive ? "Active" : "Archived"}
                              </span>
                              <span className="text-sm text-gray-600">
                                {course.semester} • {course.academicYear}
                              </span>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-1">
                              {course.courseName}
                            </h3>
                            <p className="text-sm text-gray-600 mb-2">
                              {course.courseCode}
                            </p>
                            {course.description && (
                              <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                                {course.description}
                              </p>
                            )}
                            <p className="text-xs text-gray-500">
                              Enrolled on {formatDate(course.enrolledAt)}
                            </p>
                          </div>

                          {/* Stats */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
                              <User className="w-4 h-4 text-gray-600" />
                              <div>
                                <p className="text-xs text-gray-600">Instructor</p>
                                <p className="text-sm font-medium text-gray-900">
                                  {instructorName(course)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
                              <Calendar className="w-4 h-4 text-gray-600" />
                              <div>
                                <p className="text-xs text-gray-600">Start Date</p>
                                <p className="text-sm font-medium text-gray-900">
                                  {formatDate(course.startDate)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
                              <Calendar className="w-4 h-4 text-gray-600" />
                              <div>
                                <p className="text-xs text-gray-600">End Date</p>
                                <p className="text-sm font-medium text-gray-900">
                                  {formatDate(course.endDate)}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Action Button */}
                          <div className="flex items-center justify-end pt-4 border-t border-gray-200">
                            <Button
                              text="View Course"
                              variant="primary"
                              fontSize="14px"
                              borderRadius="6px"
                              paddingWidth="16px"
                              paddingHeight="8px"
                              onClick={() => handleViewCourse(course.courseId)}
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
        </div>
      </main>
    </div>
  );
};

export default StudentMyCoursesPage;
