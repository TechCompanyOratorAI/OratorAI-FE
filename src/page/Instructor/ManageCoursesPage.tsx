import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Button from "@/components/yoodli/Button";
import CourseModal from "@/components/Course/CourseModal";
import Toast from "@/components/Toast/Toast";
import { Search, Bell, ChevronDown, MoreVertical, Sparkles, Plus } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/services/store/store";
import {
  fetchMyCourses,
  deleteCourse,
  createCourse,
  updateCourse,
} from "@/services/features/course/courseSlice";
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
}

const ManageCoursesPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { courses: apiCourses, loading } = useAppSelector(
    (state) => state.course
  );
  const { user } = useAppSelector((state) => state.auth);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("Active Semesters");
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CourseData | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Fetch courses on component mount
  useEffect(() => {
    dispatch(fetchMyCourses({}));
  }, [dispatch]);

  // Close user dropdown when clicking outside
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
      schedule: `${apiCourse.startDate} to ${apiCourse.endDate}`,
      instructorName,
      topicsCount: apiCourse.topics?.length ?? 0,
    };
  };

  const courses: Course[] = apiCourses.map(transformCourseData);
  const userInitial =
    user?.firstName?.[0]?.toUpperCase() ||
    user?.username?.[0]?.toUpperCase() ||
    "U";

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  // Filter courses based on selected filter and search query
  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.id.toLowerCase().includes(searchQuery.toLowerCase());

    if (selectedFilter === "Active Semesters") {
      return matchesSearch && course.status === "active";
    } else if (selectedFilter === "Archived") {
      return matchesSearch && course.status === "archived";
    } else if (selectedFilter === "By Department") {
      return matchesSearch;
    }

    return matchesSearch;
  });

  const handleDeleteCourse = async (courseId: number) => {
    try {
      await dispatch(deleteCourse(courseId)).unwrap();
      setDeleteConfirm(null);
      setToast({
        message: "Course deleted successfully!",
        type: "success",
      });
      // Reload courses list
      dispatch(fetchMyCourses({}));
    } catch {
      setToast({
        message: "Failed to delete course. Please try again.",
        type: "error",
      });
    }
  };

  const handleCourseModalOpen = (course?: CourseData) => {
    if (course) {
      setEditingCourse(course);
    } else {
      setEditingCourse(null);
    }
    setCourseModalOpen(true);
  };

  const handleCourseModalClose = () => {
    setCourseModalOpen(false);
    setEditingCourse(null);
  };

  const handleCourseSubmit = async (courseData: CourseData) => {
    try {
      if (editingCourse) {
        await dispatch(updateCourse({
          courseId: editingCourse.courseId,
          data: courseData,
        })).unwrap();
        setToast({
          message: "Course updated successfully!",
          type: "success",
        });
      } else {
        await dispatch(createCourse(courseData)).unwrap();
        setToast({
          message: "Course created successfully!",
          type: "success",
        });
      }
      handleCourseModalClose();
      dispatch(fetchMyCourses({}));
    } catch {
      setToast({
        message: `Failed to ${editingCourse ? "update" : "create"} course. Please try again.`,
        type: "error",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 h-auto sm:h-[71px]">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-[320px]">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0 h-auto sm:h-[46px] py-3 sm:py-0 sm:mt-[12px]">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-sky-500 to-indigo-500 rounded flex items-center justify-center">
                <span className="text-white font-bold text-sm">P</span>
              </div>
              <span className="text-lg font-semibold text-gray-900">
                PresentationAI
              </span>
            </div>

            {/* Navigation */}
            <nav className="flex items-center gap-4 sm:gap-8 overflow-x-auto">
              <a
                href="#"
                className="text-sm font-medium text-gray-900 border-b-2 border-sky-500 pb-1 whitespace-nowrap"
              >
                Courses
              </a>
              <a href="#" className="text-sm font-medium text-gray-600 whitespace-nowrap">
                Analytics
              </a>
              <a href="#" className="text-sm font-medium text-gray-600 whitespace-nowrap">
                Settings
              </a>
            </nav>

            {/* User Actions */}
            <div className="relative flex items-center gap-3" ref={userMenuRef}>
              <button className="relative p-2 hover:bg-gray-100 rounded-lg">
                <Bell className="w-6 h-6 text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <button
                onClick={() => setIsUserMenuOpen((prev) => !prev)}
                className="w-9 h-9 rounded-full bg-gray-300 flex items-center justify-center text-sm font-semibold text-gray-700 hover:ring-2 hover:ring-sky-200 transition"
              >
                {userInitial}
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-4 top-14 w-56 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-20">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-900">
                      {user
                        ? `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
                        user.username ||
                        "Instructor"
                        : "Instructor"}
                    </p>
                    {user?.email && (
                      <p className="text-xs text-gray-500 truncate">
                        {user.email}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-[320px] py-4 sm:py-6 lg:py-8">
        <div className="max-w-[1280px] mx-auto">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6 sm:mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-[32px] font-bold text-gray-900 mb-2">
                My Courses
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                Manage classes and presentation assignments for Fall 2023.
              </p>
            </div>
            <div className="w-full sm:w-auto">
              <Button
                text="Create New Course"
                variant="primary"
                fontSize="14px"
                borderRadius="8px"
                paddingWidth="20px"
                paddingHeight="10px"
                icon={<Plus className="w-5 h-5 text-white" />}
                iconPosition="left"
                onClick={() => handleCourseModalOpen()}
              />
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 gap-4 ">
            {/* Search */}
            <div className="relative flex-1 w-full sm:max-w-[448px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400" />
              <input
                type="text"
                placeholder="Search for courses (e.g. CS101)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-[43px] pl-10 pr-4 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-2 sm:pb-0 ">
              <button
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 h-[34px] rounded-full border whitespace-nowrap ${selectedFilter === "Active Semesters"
                  ? "bg-gray-100 border-gray-300"
                  : "bg-white border-gray-300"
                  }`}
                onClick={() => setSelectedFilter("Active Semesters")}
              >
                <span className="text-sm font-medium text-gray-700">
                  Active Semesters
                </span>
                <ChevronDown className="w-4 h-4 text-gray-600" />
              </button>
              <button
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 h-[34px] rounded-full border whitespace-nowrap ${selectedFilter === "Archived"
                  ? "bg-gray-100 border-gray-300"
                  : "bg-white border-gray-300"
                  }`}
                onClick={() => setSelectedFilter("Archived")}
              >
                <span className="text-sm font-medium text-gray-700">
                  Archived
                </span>
                <ChevronDown className="w-4 h-4 text-gray-600" />
              </button>
              <button
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 h-[34px] rounded-full border whitespace-nowrap ${selectedFilter === "By Department"
                  ? "bg-gray-100 border-gray-300"
                  : "bg-white border-gray-300"
                  }`}
                onClick={() => setSelectedFilter("By Department")}
              >
                <span className="text-sm font-medium text-gray-700">
                  By Department
                </span>
                <ChevronDown className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Loading and Error States */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-sky-200 border-t-sky-500 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Loading courses...</p>
              </div>
            </div>
          )}



          {/* Content Grid */}
          {!loading && (
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Course Cards */}
              <div className="flex-1 space-y-6">
                {filteredCourses.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
                    <p className="text-gray-600">
                      {searchQuery
                        ? "No courses found matching your search"
                        : "No courses available"}
                    </p>
                  </div>
                ) : (
                  filteredCourses.map((course) => (
                    <div
                      key={course.id}
                      className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => navigate(`/instructor/course/${course.id}`)}
                    >
                      {/* Course Info */}
                      <div className="p-5">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <span
                                className={`px-2 py-1 rounded text-xs font-medium ${course.status === "active"
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
                            <p className="text-sm text-gray-600">
                              {course.courseCode} • {course.schedule}
                            </p>
                          </div>
                          <div
                            className="p-1 hover:bg-gray-100 rounded relative group cursor-pointer"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="w-5 h-5 text-gray-600" />
                            {/* Dropdown menu */}
                            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const courseData = apiCourses.find(c => c.courseId === parseInt(course.id));
                                  if (courseData) {
                                    handleCourseModalOpen(courseData);
                                  }
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 first:rounded-t-xl"
                              >
                                Edit Course
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteConfirm(parseInt(course.id));
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 last:rounded-b-xl"
                              >
                                Delete Course
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="flex-1 p-3 bg-gray-50 rounded-xl border border-gray-200">
                            <p className="text-xs text-gray-600 mb-1">
                              Instructor
                            </p>
                            <p className="text-sm font-medium text-gray-900">
                              {course.instructorName}
                            </p>
                          </div>
                          <div className="flex-1 p-3 bg-gray-50 rounded-xl border border-gray-200">
                            <p className="text-xs text-gray-600 mb-1">
                              Topics
                            </p>
                            <p className="text-2xl font-bold text-gray-900">
                              {course.topicsCount}
                            </p>
                          </div>
                        </div>

                        {/* Status and Actions */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 pt-4 border-t border-gray-200">
                          {/* Có thể thêm info khác nếu cần */}
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                            {course.status === "active" ? (
                              <>
                                <div onClick={(e) => e.stopPropagation()}>
                                  <Button
                                    text="Grade"
                                    variant="secondary"
                                    fontSize="14px"
                                    borderRadius="6px"
                                    paddingWidth="12px"
                                    paddingHeight="6px"
                                    onClick={() => { }}
                                  />
                                </div>
                                <div onClick={(e) => e.stopPropagation()}>
                                  <Button
                                    text="View Class"
                                    variant="secondary"
                                    fontSize="14px"
                                    borderRadius="6px"
                                    paddingWidth="12px"
                                    paddingHeight="6px"
                                    onClick={() => { }}
                                  />
                                </div>
                              </>
                            ) : (
                              <div onClick={(e) => e.stopPropagation()}>
                                <Button
                                  text="View Archive"
                                  variant="secondary"
                                  fontSize="14px"
                                  borderRadius="6px"
                                  paddingWidth="12px"
                                  paddingHeight="6px"
                                  onClick={() => { }}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Sidebar */}
              <div className="w-full lg:w-[389px] space-y-6 flex-shrink-0">
                {/* AI Analysis */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-gradient-to-r from-sky-500 to-indigo-500 rounded flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <h4 className="text-base font-bold text-gray-900">
                      AI Analysis
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    System is currently processing 3 student presentations.
                    Estimated wait time: 5 mins.
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className="bg-gradient-to-r from-sky-500 to-indigo-500 h-1.5 rounded-full"
                      style={{ width: "33%" }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Course Modal */}
          <CourseModal
            isOpen={courseModalOpen}
            onClose={handleCourseModalClose}
            onSubmit={handleCourseSubmit}
            initialData={editingCourse || undefined}
            isLoading={loading}
          />

          {/* Delete Confirmation Dialog */}
          {deleteConfirm !== null && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 rounded-lg">
              <div className="bg-white rounded-2xl p-6 max-w-sm mx-4">
                <h2 className="text-lg font-bold text-gray-900 mb-2">
                  Delete Course
                </h2>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete this course? This action
                  cannot be undone.
                </p>
                <div className="flex gap-3 justify-end">
                  <Button
                    text="Cancel"
                    variant="secondary"
                    fontSize="14px"
                    borderRadius="6px"
                    paddingWidth="16px"
                    paddingHeight="8px"
                    onClick={() => setDeleteConfirm(null)}
                  />
                  <Button
                    text="Delete"
                    variant="primary"
                    fontSize="14px"
                    borderRadius="6px"
                    paddingWidth="16px"
                    paddingHeight="8px"
                    onClick={() => handleDeleteCourse(deleteConfirm)}
                  />
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

export default ManageCoursesPage;

