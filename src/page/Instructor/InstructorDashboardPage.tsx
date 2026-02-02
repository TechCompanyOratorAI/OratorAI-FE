import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SidebarInstructor from "@/components/Sidebar/SidebarInstructor/SidebarInstructor";
import Button from "@/components/yoodli/Button";
import Toast from "@/components/Toast/Toast";
import {
  Upload,
  TrendingUp,
  Users,
  BookOpen,
  FileText,
  Clock,
  ArrowRight,
  Plus,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Activity,
  ChevronRight,
} from "lucide-react";
import { Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useAppDispatch, useAppSelector } from "@/services/store/store";
import { fetchMyCourses } from "@/services/features/course/courseSlice";
import { fetchEnrolledClasses } from "@/services/features/enrollment/enrollmentSlice";

interface Presentation {
  key: string;
  id: number;
  studentName: string;
  studentAvatar?: string;
  course: string;
  courseId: number;
  topic: string;
  topicId: number;
  date: string;
  status: "pending" | "reviewed" | "analyzed";
  score?: number;
}

interface RecentActivity {
  id: number;
  type: "submission" | "review" | "enrollment" | "comment";
  message: string;
  time: string;
  icon: string;
}

const InstructorDashboardPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const { courses } = useAppSelector((state) => state.course);
  const { enrolledClasses } = useAppSelector((state) => state.enrollment);

  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "reviewed">("all");

  useEffect(() => {
    dispatch(fetchMyCourses({}));
    dispatch(fetchEnrolledClasses());
  }, [dispatch]);

  // Calculate metrics
  const totalStudents = enrolledClasses.reduce((acc, cls) => {
    return acc + (cls.class.maxStudents || 0);
  }, 0);

  const pendingReviews = enrolledClasses.length > 0 ? 12 : 0;
  const averageScore = 85;

  const pendingPresentations: Presentation[] = [
    {
      key: "1",
      id: 1,
      studentName: "Sarah Jenkins",
      course: "BUS101 - Business Communication",
      courseId: 1,
      topic: "Marketing Final Pitch",
      topicId: 1,
      date: "2 hours ago",
      status: "pending",
    },
    {
      key: "2",
      id: 2,
      studentName: "Michael Chen",
      course: "ENG400 - Technical Writing",
      courseId: 2,
      topic: "Thesis Draft 1",
      topicId: 2,
      date: "4 hours ago",
      status: "pending",
    },
    {
      key: "3",
      id: 3,
      studentName: "Emily Davis",
      course: "COM202 - Public Speaking",
      courseId: 3,
      topic: "Persuasive Speech",
      topicId: 3,
      date: "Yesterday",
      status: "pending",
    },
    {
      key: "4",
      id: 4,
      studentName: "James Wilson",
      course: "BUS101 - Business Communication",
      courseId: 1,
      topic: "Q4 Sales Report",
      topicId: 4,
      date: "Yesterday",
      status: "reviewed",
      score: 92,
    },
  ];

  const recentActivities: RecentActivity[] = [
    { id: 1, type: "submission", message: "Sarah Jenkins submitted Marketing Final Pitch", time: "2 hours ago", icon: "upload" },
    { id: 2, type: "review", message: "You reviewed James Wilson's Q4 Sales Report", time: "4 hours ago", icon: "check" },
    { id: 3, type: "enrollment", message: "Emily Davis enrolled in COM202", time: "Yesterday", icon: "user" },
    { id: 4, type: "submission", message: "Michael Chen submitted Thesis Draft 1", time: "Yesterday", icon: "upload" },
    { id: 5, type: "review", message: "You reviewed Marketing Strategy 101", time: "2 days ago", icon: "check" },
  ];

  const columns: ColumnsType<Presentation> = [
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
      title: "Course",
      dataIndex: "course",
      key: "course",
      render: (text: string, record: Presentation) => (
        <button
          onClick={() => navigate(`/instructor/course/${record.courseId}`)}
          className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline text-left"
        >
          {text}
        </button>
      ),
    },
    {
      title: "Topic",
      dataIndex: "topic",
      key: "topic",
      render: (text: string, record: Presentation) => (
        <button
          onClick={() => navigate(`/instructor/topic/${record.topicId}`)}
          className="text-sm text-gray-900 hover:text-indigo-600 hover:underline text-left"
        >
          {text}
        </button>
      ),
    },
    {
      title: "Submitted",
      dataIndex: "date",
      key: "date",
      render: (text: string) => <span className="text-sm text-gray-500">{text}</span>,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <div
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${status === "reviewed"
              ? "bg-green-50 text-green-700 border border-green-200"
              : status === "analyzed"
                ? "bg-blue-50 text-blue-700 border border-blue-200"
                : "bg-amber-50 text-amber-700 border border-amber-200"
            }`}
        >
          {status === "reviewed" ? (
            <CheckCircle2 className="w-3.5 h-3.5" />
          ) : status === "analyzed" ? (
            <Activity className="w-3.5 h-3.5" />
          ) : (
            <Clock className="w-3.5 h-3.5" />
          )}
          <span className="capitalize">{status}</span>
        </div>
      ),
    },
    {
      title: "Score",
      dataIndex: "score",
      key: "score",
      render: (score: number | undefined) => (
        <span className={`text-sm font-semibold ${score ? "text-green-600" : "text-gray-400"}`}>
          {score ? `${score}/100` : "—"}
        </span>
      ),
    },
    {
      title: "",
      key: "action",
      width: 60,
      render: (_, record) => (
        <Button
          text={record.status === "pending" ? "Review" : "View"}
          variant={record.status === "pending" ? "primary" : "secondary"}
          fontSize="13px"
          borderRadius="6px"
          paddingWidth="12px"
          paddingHeight="6px"
          onClick={() => navigate(`/instructor/presentation/${record.id}`)}
        />
      ),
    },
  ];

  const filteredPresentations = activeTab === "all"
    ? pendingPresentations
    : pendingPresentations.filter(p => p.status === activeTab);

  return (
    <div className="flex h-screen bg-gray-50">
      <SidebarInstructor activeItem="dashboard" />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          {/* Page Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6 lg:mb-8">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-1 lg:mb-2">
                Welcome back, {user?.firstName || "Instructor"}!
              </h1>
              <p className="text-sm lg:text-base text-gray-600">
                Here's what's happening with your courses and students today.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                text="Create Course"
                variant="primary"
                fontSize="14px"
                borderRadius="8px"
                paddingWidth="16px"
                paddingHeight="10px"
                icon={<Plus className="w-4 h-4" />}
                iconPosition="left"
                onClick={() => navigate("/instructor/create-course")}
              />
            </div>
          </div>

          {/* Quick Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 lg:mb-8">
            {/* Total Students */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-600">Total Students</span>
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-gray-900">{totalStudents}</span>
                <span className="text-sm text-gray-500">students</span>
              </div>
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                <span className="text-xs text-green-600 font-medium">+12% this month</span>
              </div>
            </div>

            {/* Active Courses */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-600">Active Courses</span>
                <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-indigo-600" />
                </div>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-gray-900">{courses.length}</span>
                <span className="text-sm text-gray-500">courses</span>
              </div>
              <div className="flex items-center gap-1 mt-2">
                <span className="text-xs text-gray-500">{courses.filter(c => c.isActive).length} active</span>
              </div>
            </div>

            {/* Pending Reviews */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-600">Pending Reviews</span>
                <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-gray-900">{pendingReviews}</span>
                <span className="text-sm text-gray-500">presentations</span>
              </div>
              <div className="flex items-center gap-1 mt-2">
                <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-xs text-amber-600 font-medium">Needs attention</span>
              </div>
            </div>

            {/* Average Score */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-600">Average Score</span>
                <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-green-600" />
                </div>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-gray-900">{averageScore}</span>
                <span className="text-lg text-gray-500">/100</span>
              </div>
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                <span className="text-xs text-green-600 font-medium">+5% from last month</span>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
            {/* Pending Reviews Table */}
            <div className="xl:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between p-5 border-b border-gray-200">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Pending Reviews</h2>
                  <p className="text-sm text-gray-600">Student presentations awaiting your feedback</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab("all")}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${activeTab === "all"
                        ? "bg-indigo-50 text-indigo-600"
                        : "text-gray-600 hover:bg-gray-100"
                      }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setActiveTab("pending")}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${activeTab === "pending"
                        ? "bg-amber-50 text-amber-600"
                        : "text-gray-600 hover:bg-gray-100"
                      }`}
                  >
                    Pending
                  </button>
                  <button
                    onClick={() => setActiveTab("reviewed")}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${activeTab === "reviewed"
                        ? "bg-green-50 text-green-600"
                        : "text-gray-600 hover:bg-gray-100"
                      }`}
                  >
                    Reviewed
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <Table
                  columns={columns}
                  dataSource={filteredPresentations}
                  pagination={false}
                  scroll={{ x: 'max-content' }}
                  className="[&_.ant-table-thead>tr>th]:bg-gray-50 [&_.ant-table-thead>tr>th]:text-gray-700 [&_.ant-table-thead>tr>th]:font-semibold [&_.ant-table-thead>tr>th]:text-sm [&_.ant-table-thead>tr>th]:border-b [&_.ant-table-thead>tr>th]:px-4 [&_.ant-table-thead>tr>th]:py-3 [&_.ant-table-tbody>tr>td]:px-4 [&_.ant-table-tbody>tr>td]:py-3 [&_.ant-table-tbody>tr]:border-b [&_.ant-table-tbody>tr]:border-gray-100 [&_.ant-table-tbody>tr:hover]:bg-gray-50"
                />
              </div>
              {pendingPresentations.length > 4 && (
                <div className="p-4 border-t border-gray-200 bg-gray-50">
                  <button
                    onClick={() => navigate("/instructor/presentations")}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
                  >
                    View All Pending Reviews
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Recent Activity Sidebar */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-gray-200">
                <h2 className="text-lg font-bold text-gray-900">Recent Activity</h2>
                <p className="text-sm text-gray-600">Latest updates from your courses</p>
              </div>
              <div className="divide-y divide-gray-100">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${activity.type === "submission" ? "bg-amber-100" :
                          activity.type === "review" ? "bg-green-100" :
                            activity.type === "enrollment" ? "bg-blue-100" : "bg-purple-100"
                        }`}>
                        {activity.type === "submission" ? (
                          <Upload className="w-4 h-4 text-amber-600" />
                        ) : activity.type === "review" ? (
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        ) : activity.type === "enrollment" ? (
                          <Users className="w-4 h-4 text-blue-600" />
                        ) : (
                          <FileText className="w-4 h-4 text-purple-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 line-clamp-2">{activity.message}</p>
                        <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={() => navigate("/instructor/activity")}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  View All Activity
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Course Overview Section */}
          <div className="mt-6 lg:mt-8">
            <div className="flex items-center justify-between mb-4 lg:mb-6">
              <h2 className="text-xl font-bold text-gray-900">Your Courses Overview</h2>
              <button
                onClick={() => navigate("/instructor/manage-courses")}
                className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"
              >
                Manage All Courses
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
              {courses.slice(0, 3).map((course) => (
                <div
                  key={course.courseId}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/instructor/course/${course.courseId}`)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-indigo-600" />
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${course.isActive
                        ? "bg-green-50 text-green-700"
                        : "bg-gray-100 text-gray-700"
                      }`}>
                      {course.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{course.courseName}</h3>
                  <p className="text-sm text-gray-600 mb-3">{course.courseCode}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">{course.semester}</span>
                    <span className="text-gray-500">{course.topics?.length || 0} topics</span>
                  </div>
                </div>
              ))}
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

export default InstructorDashboardPage;
