import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Button from "@/components/yoodli/Button";
import ClassModal from "@/components/Course/ClassModal";
import Toast from "@/components/Toast/Toast";
import {
  Search,
  MoreVertical,
  Sparkles,
  Plus,
  Users,
  Clock,
  Calendar,
  BookOpen,
} from "lucide-react";
import { Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useAppDispatch, useAppSelector } from "@/services/store/store";
import {
  fetchClassesByInstructor,
  createClass,
  updateClass,
  deleteClass,
  ClassData,
} from "@/services/features/admin/classSlice";
import { fetchCourses } from "@/services/features/course/courseSlice";
import SidebarInstructor from "@/components/Sidebar/SidebarInstructor/SidebarInstructor";

interface ClassCard {
  id: string;
  title: string;
  courseCode: string;
  courseName: string;
  semester: string;
  academicYear: number;
  status: "active" | "archived";
  schedule: string;
  instructorName: string;
  topicsCount: number;
  studentsCount: number;
  isActive: boolean;
  startDate: string;
  endDate: string;
  maxStudents: number;
  enrollKey: string;
}

interface PendingSubmission {
  key: string;
  id: number;
  studentName: string;
  topic: string;
  submittedAt: string;
  status: "pending" | "reviewed";
}

const ManageClassesPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const {
    classes: apiClasses,
    loading,
    pagination,
  } = useAppSelector((state) => state.class);
  const { courses } = useAppSelector((state) => state.course);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<
    "all" | "active" | "archived"
  >("all");
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [classModalOpen, setClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassData | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  // Fetch classes and courses
  useEffect(() => {
    dispatch(fetchClassesByInstructor({ page: currentPage, limit: pageSize }));
  }, [dispatch, currentPage, pageSize]);

  useEffect(() => {
    dispatch(fetchCourses({ page: 1, limit: 100 }));
  }, [dispatch]);

  // Transform API data to UI format
  const transformClassData = (apiClass: ClassData): ClassCard => {
    const isActive = apiClass.status === "active";
    const instructorName = apiClass.instructors?.length
      ? apiClass.instructors
          .map((inst) =>
            `${inst.firstName || ""} ${inst.lastName || ""}`.trim(),
          )
          .filter(Boolean)
          .join(", ") ||
        apiClass.instructors[0]?.username ||
        "Unknown Instructor"
      : "Unknown Instructor";
    const enrollKeyValue =
      (apiClass as { activeKeys?: Array<{ keyValue?: string }> })
        .activeKeys?.[0]?.keyValue ||
      (apiClass.enrollKeys as Array<{ keyValue?: string }> | undefined)?.[0]
        ?.keyValue ||
      "";
    return {
      id: apiClass.classId.toString(),
      title: apiClass.classCode,
      courseCode: apiClass.course?.courseCode || "",
      courseName: apiClass.course?.courseName || "",
      semester: apiClass.course?.semester || "",
      academicYear: apiClass.course?.academicYear || 0,
      status: isActive ? "active" : "archived",
      schedule: `${apiClass.startDate} to ${apiClass.endDate}`,
      instructorName,
      topicsCount: 0,
      studentsCount: apiClass.enrollmentCount ?? 0,
      isActive,
      startDate: apiClass.startDate,
      endDate: apiClass.endDate,
      maxStudents: apiClass.maxStudents,
      enrollKey: enrollKeyValue,
    };
  };

  const classes: ClassCard[] = apiClasses.map(transformClassData);

  const totalRecords = pagination.total || apiClasses.length;
  const totalPages =
    pagination.totalPages || Math.max(1, Math.ceil(totalRecords / pageSize));
  const currentPageLabel = pagination.page || currentPage;

  // Filter courses based on selected filter and search query
  const filteredCourses = classes.filter((course) => {
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

  const handleDeleteCourse = async (classId: number) => {
    try {
      await dispatch(deleteClass(classId)).unwrap();
      setDeleteConfirm(null);
      setToast({
        message: "Class deleted successfully!",
        type: "success",
      });
      dispatch(
        fetchClassesByInstructor({ page: currentPage, limit: pageSize }),
      );
    } catch {
      setToast({
        message: "Failed to delete class. Please try again.",
        type: "error",
      });
    }
  };

  const handleCourseModalOpen = (classItem?: ClassData) => {
    if (classItem) {
      setEditingClass(classItem);
    } else {
      setEditingClass(null);
    }
    setClassModalOpen(true);
  };

  const handleCourseModalClose = () => {
    setClassModalOpen(false);
    setEditingClass(null);
  };

  const handleCourseSubmit = async (classData: any) => {
    try {
      if (editingClass) {
        await dispatch(
          updateClass({
            classId: editingClass.classId,
            classData: classData,
          }),
        ).unwrap();
        setToast({
          message: "Class updated successfully!",
          type: "success",
        });
      } else {
        await dispatch(createClass(classData)).unwrap();
        setToast({
          message: "Class created successfully!",
          type: "success",
        });
        setTimeout(() => window.location.reload(), 500);
      }
      handleCourseModalClose();
      dispatch(
        fetchClassesByInstructor({ page: currentPage, limit: pageSize }),
      );
    } catch {
      setToast({
        message: `Failed to ${editingClass ? "update" : "create"} class. Please try again.`,
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
              {text
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)}
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
      render: (text: string) => (
        <span className="text-sm text-gray-900">{text}</span>
      ),
    },
    {
      title: "Submitted",
      dataIndex: "submittedAt",
      key: "submittedAt",
      render: (text: string) => (
        <span className="text-sm text-gray-500">{text}</span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            status === "pending"
              ? "bg-amber-50 text-amber-700 border border-amber-200"
              : "bg-green-50 text-green-700 border border-green-200"
          }`}
        >
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
  const totalStudents = filteredCourses.reduce(
    (acc, course) => acc + course.studentsCount,
    0,
  );
  const activeCourses = filteredCourses.filter((c) => c.isActive).length;
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
                <span className="text-3xl font-bold text-gray-900">
                  {totalStudents}
                </span>
                <p className="text-xs text-gray-500 mt-1">
                  Across {filteredCourses.length} classes
                </p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-600">Active Classes</span>
                  <BookOpen className="w-5 h-5 text-green-500" />
                </div>
                <span className="text-3xl font-bold text-gray-900">
                  {activeCourses}
                </span>
                <p className="text-xs text-gray-500 mt-1">
                  {filteredCourses.length} total classes
                </p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-600">Pending Reviews</span>
                  <Clock className="w-5 h-5 text-amber-500" />
                </div>
                <span className="text-3xl font-bold text-gray-900">
                  {pendingReviews}
                </span>
                <p className="text-xs text-gray-500 mt-1">
                  Presentations awaiting feedback
                </p>
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
              <div className="flex items-center gap-2 ">
                <button
                  onClick={() => setSelectedFilter("all")}
                  className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                    selectedFilter === "all"
                      ? "bg-indigo-50 text-indigo-600 border border-indigo-200"
                      : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  All Classes
                </button>
                <button
                  onClick={() => setSelectedFilter("active")}
                  className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                    selectedFilter === "active"
                      ? "bg-green-50 text-green-600 border border-green-200"
                      : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  Active
                </button>
                <button
                  onClick={() => setSelectedFilter("archived")}
                  className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                    selectedFilter === "archived"
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
                        onClick={() =>
                          navigate(`/instructor/class/${course.id}`)
                        }
                      >
                        <div className="p-6">
                          {/* Header */}
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <span
                                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                                    course.isActive
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                      : "bg-slate-50 text-slate-700 border-slate-200"
                                  }`}
                                >
                                  {course.isActive ? "Active" : "Archived"}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {course.courseCode}
                                </span>
                              </div>
                              <h3 className="text-xl font-bold text-gray-900">
                                {course.title}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {course.courseName || "Course"}
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
                                    const classData = apiClasses.find(
                                      (c) => c.classId === parseInt(course.id),
                                    );
                                    if (classData) {
                                      handleCourseModalOpen(classData);
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

                          {/* Info Grid */}
                          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                              <Calendar className="w-4 h-4 text-indigo-500" />
                              <div>
                                <p className="text-xs text-gray-500">
                                  Duration
                                </p>
                                <p className="text-sm font-semibold text-gray-900">
                                  {new Date(
                                    course.startDate,
                                  ).toLocaleDateString()}{" "}
                                  - {""}
                                  {new Date(
                                    course.endDate,
                                  ).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                              <Users className="w-4 h-4 text-sky-500" />
                              <div>
                                <p className="text-xs text-gray-500">
                                  Enrollment
                                </p>
                                <p className="text-sm font-semibold text-gray-900">
                                  {course.studentsCount} / {course.maxStudents}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                              <BookOpen className="w-4 h-4 text-emerald-500" />
                              <div>
                                <p className="text-xs text-gray-500">
                                  Semester
                                </p>
                                <p className="text-sm font-semibold text-gray-900">
                                  {course.semester || "N/A"}
                                  {course.academicYear
                                    ? ` • ${course.academicYear}`
                                    : ""}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                              <BookOpen className="w-4 h-4 text-emerald-500" />
                              <div>
                                <p className="text-xs text-gray-500">
                                  Enroll Key
                                </p>
                                <p className="text-sm font-semibold text-gray-900">
                                  {course.enrollKey || "N/A"}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="mt-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-gray-200 pt-4">
                            <div className="text-sm text-gray-600">
                              Instructor:{" "}
                              <span className="font-semibold text-gray-900">
                                {course.instructorName}
                              </span>
                            </div>
                            <Button
                              text="View Class"
                              variant="primary"
                              fontSize="14px"
                              borderRadius="999px"
                              paddingWidth="18px"
                              paddingHeight="8px"
                              onClick={() => {
                                navigate(`/instructor/class/${course.id}`);
                              }}
                            />
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
                        <p className="text-xs text-gray-500">
                          Auto-grading presentations
                        </p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Processing</span>
                        <span className="font-medium text-gray-900">
                          3 presentations
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Estimated time</span>
                        <span className="font-medium text-gray-900">
                          ~5 minutes
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full"
                          style={{ width: "33%" }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 text-center">
                        33% complete
                      </p>
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
                          <span className="text-sm text-gray-600">
                            Average Score
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            85/100
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: "85%" }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-600">
                            Review Completion
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            78%
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: "78%" }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-600">
                            Student Engagement
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            92%
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div
                            className="bg-purple-500 h-2 rounded-full"
                            style={{ width: "92%" }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!loading && apiClasses.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 px-5 py-4 flex flex-col sm:flex-row items-center justify-end gap-3 mt-6">
                <div className="text-sm text-gray-600">
                  Page {currentPageLabel} of {totalPages} 
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        const nextSize = parseInt(e.target.value);
                        setPageSize(nextSize);
                        setCurrentPage(1);
                      }}
                      className="rounded-full border border-gray-200 bg-white px-2.5 py-1 text-sm focus:border-indigo-500 focus:outline-none"
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
                    disabled={currentPageLabel <= 1}
                    className="px-3 py-1.5 rounded-full border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                    }
                    disabled={currentPageLabel >= totalPages}
                    className="px-3 py-1.5 rounded-full border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {/* Class Modal */}
            <ClassModal
              isOpen={classModalOpen}
              onClose={handleCourseModalClose}
              onSubmit={handleCourseSubmit}
              initialData={editingClass || undefined}
              isLoading={loading}
              courses={courses}
            />

            {/* Delete Confirmation Dialog */}
            {deleteConfirm !== null && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-2xl p-6 max-w-sm mx-4">
                  <h2 className="text-lg font-bold text-gray-900 mb-2">
                    Delete Class
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Are you sure you want to delete this class? This action
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
        </div>
      </main>
    </div>
  );
};

export default ManageClassesPage;
