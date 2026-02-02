import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Button from "@/components/yoodli/Button";
import CourseModal from "@/components/Course/CourseModal";
import Toast from "@/components/Toast/Toast";
import {
  Search,
  MoreVertical,
  Sparkles,
  Plus,
  Users,
  Clock,
  FileText,
  Calendar,
  BookOpen,
} from "lucide-react";
import { Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useAppDispatch, useAppSelector } from "@/services/store/store";
import {
  fetchMyCourses,
  deleteCourse,
  createCourse,
  updateCourse,
} from "@/services/features/course/courseSlice";
import type { CourseData } from "@/services/features/course/courseSlice";
import SidebarInstructor from "@/components/Sidebar/SidebarInstructor/SidebarInstructor";

interface Course {
  id: string;
  title: string;
  courseCode: string;
  semester: string;
  academicYear: number;
  status: "active" | "archived";
  schedule: string;
  instructorName: string;
  topicsCount: number;
  studentsCount: number;
  isActive: boolean;
}

interface PendingSubmission {
  key: string;
  id: number;
  studentName: string;
  topic: string;
  submittedAt: string;
  status: "pending" | "reviewed";
}

const ManageCoursesPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { courses: apiCourses, loading } = useAppSelector(
    (state) => state.course
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<"all" | "active" | "archived">("all");
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CourseData | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  // Fetch courses on component mount
  useEffect(() => {
    dispatch(fetchMyCourses({}));
  }, [dispatch]);

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
      semester: apiCourse.semester,
      academicYear: apiCourse.academicYear,
      status: isActive ? "active" : "archived",
      schedule: `${apiCourse.startDate} to ${apiCourse.endDate}`,
      instructorName,
      topicsCount: apiCourse.topics?.length ?? 0,
      studentsCount: Math.floor(Math.random() * 40) + 10, // Mock data
      isActive,
    };
  };

  const courses: Course[] = apiCourses.map(transformCourseData);

  // Filter courses based on selected filter and search query
  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.courseCode.toLowerCase().includes(searchQuery.toLowerCase());

    if (selectedFilter === "active") {
      return matchesSearch && course.isActive;
    } else if (selectedFilter === "archived") {
      return matchesSearch && !course.isActive;
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

  // Mock pending submissions
  const pendingSubmissions: PendingSubmission[] = [
    {
      key: "1",
      id: 1,
      studentName: "Sarah Jenkins",
      topic: "Marketing Final Pitch",
      submittedAt: "2 hours ago",
      status: "pending",
    },
    {
      key: "2",
      id: 2,
      studentName: "Michael Chen",
      topic: "Thesis Draft 1",
      submittedAt: "4 hours ago",
      status: "pending",
    },
    {
      key: "3",
      id: 3,
      studentName: "Emily Davis",
      topic: "Persuasive Speech",
      submittedAt: "Yesterday",
      status: "pending",
    },
  ];

  const submissionColumns: ColumnsType<PendingSubmission> = [
    {
      title: "Student",
      dataIndex: "studentName",
      key: "studentName",
      render: (text: string) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
            <span className="text-indigo-700 font-semibold text-xs">
              {text.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
            </span>
          </div>
          <span className="text-sm font-medium text-gray-900">{text}</span>
        </div>
      ),
    },
    {
      title: "Topic",
      dataIndex: "topic",
      key: "topic",
      render: (text: string) => <span className="text-sm text-gray-900">{text}</span>,
    },
    {
      title: "Submitted",
      dataIndex: "submittedAt",
      key: "submittedAt",
      render: (text: string) => <span className="text-sm text-gray-500">{text}</span>,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${status === "pending"
            ? "bg-amber-50 text-amber-700 border border-amber-200"
            : "bg-green-50 text-green-700 border border-green-200"
          }`}>
          {status === "pending" ? "Pending" : "Reviewed"}
        </span>
      ),
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Button
          text="Review"
          variant="primary"
          fontSize="13px"
          borderRadius="6px"
          paddingWidth="12px"
          paddingHeight="6px"
          onClick={() => navigate(`/instructor/presentation/${record.id}`)}
        />
      ),
    },
  ];

  // Calculate stats
  const totalStudents = filteredCourses.reduce((acc, course) => acc + course.studentsCount, 0);
  const activeCourses = filteredCourses.filter(c => c.isActive).length;
  const pendingReviews = 3;

  return (
    <div className="flex h-screen bg-gray-50">
      <SidebarInstructor activeItem="courses" />

      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6 sm:mb-8">
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-[32px] font-bold text-gray-900 mb-2">
                  My Classes
                </h1>
                <p className="text-sm sm:text-base text-gray-600">
                  Manage classes and presentation assignments for your students.
                </p>
              </div>
              <div className="w-full sm:w-auto flex items-center gap-3">
                <Button
                  text="Create New Class"
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

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-600">Total Students</span>
                  <Users className="w-5 h-5 text-blue-500" />
                </div>
                <span className="text-3xl font-bold text-gray-900">{totalStudents}</span>
                <p className="text-xs text-gray-500 mt-1">Across {filteredCourses.length} classes</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-600">Active Classes</span>
                  <BookOpen className="w-5 h-5 text-green-500" />
                </div>
                <span className="text-3xl font-bold text-gray-900">{activeCourses}</span>
                <p className="text-xs text-gray-500 mt-1">{filteredCourses.length} total classes</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-600">Pending Reviews</span>
                  <Clock className="w-5 h-5 text-amber-500" />
                </div>
                <span className="text-3xl font-bold text-gray-900">{pendingReviews}</span>
                <p className="text-xs text-gray-500 mt-1">Presentations awaiting feedback</p>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
              {/* Search */}
              <div className="relative flex-1 w-full sm:max-w-[448px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search for classes (e.g. CS101)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-[43px] pl-10 pr-4 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedFilter("all")}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${selectedFilter === "all"
                      ? "bg-indigo-50 text-indigo-600 border border-indigo-200"
                      : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
                    }`}
                >
                  All Classes
                </button>
                <button
                  onClick={() => setSelectedFilter("active")}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${selectedFilter === "active"
                      ? "bg-green-50 text-green-600 border border-green-200"
                      : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
                    }`}
                >
                  Active
                </button>
                <button
                  onClick={() => setSelectedFilter("archived")}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${selectedFilter === "archived"
                      ? "bg-gray-100 text-gray-700 border border-gray-300"
                      : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
                    }`}
                >
                  Archived
                </button>
              </div>
            </div>

            {/* Content Grid */}
            {!loading && (
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Course Cards */}
                <div className="flex-1 space-y-6">
                  {filteredCourses.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
                      <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-lg font-medium text-gray-900 mb-2">
                        {searchQuery
                          ? "No classes found matching your search"
                          : "No classes available"}
                      </p>
                      <p className="text-sm text-gray-600 mb-4">
                        {searchQuery
                          ? "Try adjusting your search terms"
                          : "Create your first class to get started"}
                      </p>
                      {!searchQuery && (
                        <Button
                          text="Create Class"
                          variant="primary"
                          fontSize="14px"
                          borderRadius="6px"
                          paddingWidth="16px"
                          paddingHeight="8px"
                          icon={<Plus className="w-4 h-4" />}
                          iconPosition="left"
                          onClick={() => handleCourseModalOpen()}
                        />
                      )}
                    </div>
                  ) : (
                    filteredCourses.map((course) => (
                      <div
                        key={course.id}
                        className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-all cursor-pointer"
                        onClick={() => navigate(`/instructor/course/${course.id}`)}
                      >
                        <div className="p-5">
                          {/* Header */}
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <div className="flex items-center gap-3 mb-2">
                                <span
                                  className={`px-2 py-1 rounded text-xs font-medium ${course.isActive
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
                                {course.title}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {course.courseCode}
                              </p>
                            </div>
                            <div
                              className="p-1 hover:bg-gray-100 rounded relative group cursor-pointer"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="w-5 h-5 text-gray-600" />
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
                                  Edit Class
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteConfirm(parseInt(course.id));
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 last:rounded-b-xl"
                                >
                                  Delete Class
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Stats */}
                          <div className="grid grid-cols-3 gap-4 mb-4">
                            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
                              <Users className="w-4 h-4 text-gray-600" />
                              <div>
                                <p className="text-xs text-gray-600">Students</p>
                                <p className="text-sm font-semibold text-gray-900">{course.studentsCount}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
                              <FileText className="w-4 h-4 text-gray-600" />
                              <div>
                                <p className="text-xs text-gray-600">Topics</p>
                                <p className="text-sm font-semibold text-gray-900">{course.topicsCount}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
                              <Calendar className="w-4 h-4 text-gray-600" />
                              <div>
                                <p className="text-xs text-gray-600">Duration</p>
                                <p className="text-sm font-semibold text-gray-900">{course.schedule.split(' to ')[0]}</p>
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                            <span className="text-sm text-gray-500">
                              {course.instructorName}
                            </span>
                            <div className="flex items-center gap-2">
                              <Button
                                text="View Class"
                                variant="primary"
                                fontSize="14px"
                                borderRadius="6px"
                                paddingWidth="16px"
                                paddingHeight="8px"
                                onClick={() => {
                                  navigate(`/instructor/course/${course.id}`);
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Right Sidebar */}
                <div className="w-full lg:w-[360px] space-y-6 flex-shrink-0">
                  {/* Pending Reviews */}
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <h4 className="text-base font-bold text-gray-900">
                          Pending Reviews
                        </h4>
                        <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                          {pendingReviews}
                        </span>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <Table
                        columns={submissionColumns}
                        dataSource={pendingSubmissions}
                        pagination={false}
                        size="small"
                        scroll={{ x: 400 }}
                        className="[&_.ant-table-thead>tr>th]:bg-gray-50 [&_.ant-table-thead>tr>th]:text-gray-700 [&_.ant-table-thead>tr>th]:font-semibold [&_.ant-table-thead>tr>th]:text-xs [&_.ant-table-thead>tr>th]:py-2 [&_.ant-table-tbody>tr>td]:py-2"
                      />
                    </div>
                  </div>

                  {/* AI Analysis Status */}
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-gray-900">
                          AI Processing
                        </h4>
                        <p className="text-xs text-gray-500">Auto-grading presentations</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Processing</span>
                        <span className="font-medium text-gray-900">3 presentations</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Estimated time</span>
                        <span className="font-medium text-gray-900">~5 minutes</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full"
                          style={{ width: "33%" }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 text-center">33% complete</p>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                    <h4 className="text-base font-bold text-gray-900 mb-4">
                      Performance Overview
                    </h4>
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-600">Average Score</span>
                          <span className="text-sm font-medium text-gray-900">85/100</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full" style={{ width: "85%" }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-600">Review Completion</span>
                          <span className="text-sm font-medium text-gray-900">78%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div className="bg-blue-500 h-2 rounded-full" style={{ width: "78%" }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-600">Student Engagement</span>
                          <span className="text-sm font-medium text-gray-900">92%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div className="bg-purple-500 h-2 rounded-full" style={{ width: "92%" }}></div>
                        </div>
                      </div>
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
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-2xl p-6 max-w-sm mx-4">
                  <h2 className="text-lg font-bold text-gray-900 mb-2">
                    Delete Course
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Are you sure you want to delete this course? This action cannot be undone.
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
        </div>
      </main>
    </div>
  );
};

export default ManageCoursesPage;
