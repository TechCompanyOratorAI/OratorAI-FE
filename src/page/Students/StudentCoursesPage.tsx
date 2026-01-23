import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SidebarStudent from "@/components/Sidebar/SidebarStudent/SidebarStudent";
import Button from "@/components/yoodli/Button";
import Toast from "@/components/Toast/Toast";
import { Search, ChevronDown, BookOpen, User, Calendar, CheckCircle2 } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/services/store/store";
import { fetchCourses } from "@/services/features/course/courseSlice";
import { enrollCourse, fetchEnrolledCourses } from "@/services/features/enrollment/enrollmentSlice";
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

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All Courses");
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const [enrollingCourseId, setEnrollingCourseId] = useState<number | null>(null);

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
    // Navigate to course detail page (you may need to create this route)
    // For now, we'll just show a message
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
    } catch (error: any) {
      setToast({
        message: error || "Failed to enroll in course",
        type: "error",
      });
    } finally {
      setEnrollingCourseId(null);
    }
  };

  const isEnrolled = (courseId: number): boolean => {
    return enrolledCourseIds.includes(courseId);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <SidebarStudent activeItem="courses" />

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6 sm:mb-8">
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-[32px] font-bold text-gray-900 mb-2">
                  All Courses
                </h1>
                <p className="text-sm sm:text-base text-gray-600">
                  Browse and explore available courses.
                </p>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 gap-4">
              {/* Search */}
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

              {/* Filters */}
              <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-2 sm:pb-0">
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
                  <ChevronDown className="w-4 h-4 text-gray-600" />
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
                    Archived Courses
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-600" />
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
        </div>
      </main>
    </div>
  );
};

export default StudentCoursesPage;
