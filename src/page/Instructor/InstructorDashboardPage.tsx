import React, { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import SidebarInstructor from "@/components/Sidebar/SidebarInstructor/SidebarInstructor";
import Button from "@/components/yoodli/Button";
import Toast from "@/components/Toast/Toast";
import {
  BookOpen,
  Clock,
  ArrowRight,
  Plus,
  CheckCircle2,
  FileText,
  BarChart3,
  Upload,
  Users,
} from "lucide-react";
import { Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useAppDispatch, useAppSelector } from "@/services/store/store";
import {
  fetchTeachingClasses,
  fetchClassAIRReports,
  fetchClassAverageScore,
  AIRReportSummary,
  TeachingClassStats,
} from "@/services/features/instructor/instructorDashboardSlice";

// ── Helpers ───────────────────────────────────────────────────────────────────

const isClassExpired = (endDate: string): boolean => {
  const now = new Date();
  const beijingOffset = 8 * 60;
  const localOffset = now.getTimezoneOffset();
  const beijingNow = new Date(now.getTime() + (localOffset + beijingOffset) * 60 * 1000);
  return new Date(endDate) < beijingNow;
};

const timeAgo = (dateStr: string): string => {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 172800) return "Yesterday";
  return `${Math.floor(diff / 86400)}d ago`;
};

// ── Types ─────────────────────────────────────────────────────────────────────

type StatColor = "blue" | "indigo" | "amber" | "green";

interface StatCardProps {
  label: string;
  value: number | string;
  suffix?: string;
  icon: React.ReactNode;
  color: StatColor;
}

const colorMap: Record<StatColor, string> = {
  blue: "bg-blue-50 text-blue-600",
  indigo: "bg-indigo-50 text-indigo-600",
  amber: "bg-amber-50 text-amber-600",
  green: "bg-green-50 text-green-600",
};

const StatCard: React.FC<StatCardProps> = ({ label, value, suffix, icon, color }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-5">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">
          {value}{suffix && <span className="text-base font-normal text-gray-400">{suffix}</span>}
        </p>
      </div>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorMap[color]}`}>
        {icon}
      </div>
    </div>
  </div>
);

// ── Component ─────────────────────────────────────────────────────────────────

const InstructorDashboardPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const {
    teachingClasses,
    classStats,
    recentReports,
    loading,
    reportsLoading,
  } = useAppSelector((state) => state.instructorDashboard);

  const [toast, setToast] = React.useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const [activeTab, setActiveTab] = React.useState<"all" | "pending" | "reviewed">("all");

  // Fetch teaching classes on mount
  useEffect(() => {
    dispatch(fetchTeachingClasses());
  }, [dispatch]);

  // When classes load, fetch reports & avg score for each active class
  useEffect(() => {
    if (teachingClasses.length === 0) return;
    teachingClasses.forEach((cls) => {
      if (!isClassExpired(cls.endDate)) {
        dispatch(fetchClassAIRReports(cls.classId));
        dispatch(fetchClassAverageScore(cls.classId));
      }
    });
  }, [teachingClasses, dispatch]);

  // Filter out expired classes
  const activeClasses = useMemo(
    () => teachingClasses.filter((c) => !isClassExpired(c.endDate)),
    [teachingClasses],
  );

  // Compute aggregated stats
  const stats = useMemo(() => {
    const classIds = activeClasses.map((c) => c.classId);
    const allStats = classIds.map((id) => classStats[id]).filter(Boolean) as TeachingClassStats[];
    const totalStudents = allStats.reduce((acc, s) => acc + s.totalStudents, 0);
    const pendingReports = allStats.reduce((acc, s) => acc + s.pendingReports, 0);
    const reviewedReports = allStats.reduce((acc, s) => acc + s.reviewedReports, 0);
    const scores = allStats.map((s) => s.averageScore).filter((s): s is number => s !== null && s !== undefined);
    const avgScore = scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : null;
    return {
      totalStudents,
      totalClasses: activeClasses.length,
      pendingReports,
      reviewedReports,
      avgScore,
    };
  }, [activeClasses, classStats]);

  // Table data from recentReports
  const presentationRows: ColumnsType<AIRReportSummary> = [
    {
      title: "Student",
      dataIndex: ["student", "firstName"],
      key: "student",
      render: (_, record) => {
        const name = record.student
          ? `${record.student.firstName} ${record.student.lastName}`
          : "Unknown";
        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
              <span className="text-indigo-700 font-semibold text-xs">
                {name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
              </span>
            </div>
            <span className="text-sm font-medium text-gray-900">{name}</span>
          </div>
        );
      },
    },
    {
      title: "Presentation",
      dataIndex: ["submission", "title"],
      key: "title",
      render: (text: string, record) => (
        <button
          onClick={() => navigate(`/instructor/presentation/${record.submissionId}`)}
          className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline text-left"
        >
          {text}
        </button>
      ),
    },
    {
      title: "Submitted",
      dataIndex: "generatedAt",
      key: "date",
      render: (text: string) => <span className="text-sm text-gray-500">{timeAgo(text)}</span>,
    },
    {
      title: "Status",
      dataIndex: "reportStatus",
      key: "status",
      render: (status: string) => {
        const isConfirmed = status === "confirmed";
        const isProcessing = status === "processing";
        return (
          <div
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
              isConfirmed
                ? "bg-green-50 text-green-700 border border-green-200"
                : isProcessing
                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                  : "bg-amber-50 text-amber-700 border border-amber-200"
            }`}
          >
            {isConfirmed ? (
              <CheckCircle2 className="w-3.5 h-3.5" />
            ) : isProcessing ? (
              <Clock className="w-3.5 h-3.5" />
            ) : (
              <Clock className="w-3.5 h-3.5" />
            )}
            <span className="capitalize">{isConfirmed ? "Reviewed" : isProcessing ? "Processing" : "Pending"}</span>
          </div>
        );
      },
    },
    {
      title: "Score",
      dataIndex: "overallScore",
      key: "score",
      render: (score: string | null, record) => {
        const displayScore = record.gradeForInstructor ?? (score ? Math.round(Number(score)) : null);
        return (
          <span className={`text-sm font-semibold ${displayScore ? "text-green-600" : "text-gray-400"}`}>
            {displayScore ? `${displayScore}/100` : "—"}
          </span>
        );
      },
    },
    {
      title: "",
      key: "action",
      width: 60,
      render: (_, record) => (
        <Button
          text={record.reportStatus === "confirmed" ? "View" : "Review"}
          variant={record.reportStatus === "confirmed" ? "secondary" : "primary"}
          fontSize="13px"
          borderRadius="6px"
          paddingWidth="12px"
          paddingHeight="6px"
          onClick={() => navigate(`/instructor/presentation/${record.submissionId}`)}
        />
      ),
    },
  ];

  const filteredReports = useMemo(() => {
    if (activeTab === "pending") return recentReports.filter((r) => r.reportStatus === "pending" || r.reportStatus === "processing");
    if (activeTab === "reviewed") return recentReports.filter((r) => r.reportStatus === "confirmed");
    return recentReports;
  }, [recentReports, activeTab]);

  // Recent activity from reports
  const recentActivityItems = useMemo(() => {
    return recentReports.slice(0, 8).map((r) => {
      const name = r.student ? `${r.student.firstName} ${r.student.lastName}` : "A student";
      const isConfirmed = r.reportStatus === "confirmed";
      return {
        id: r.reportId,
        type: isConfirmed ? "review" as const : "submission" as const,
        message: isConfirmed
          ? `You reviewed "${r.submission.title}"`
          : `${name} submitted "${r.submission.title}"`,
        time: timeAgo(r.generatedAt),
      };
    });
  }, [recentReports]);

  // Course cards from teaching classes
  const courseCards = useMemo(() => {
    const seen = new Set<number>();
    return activeClasses
      .filter((c) => {
        if (seen.has(c.course.courseId)) return false;
        seen.add(c.course.courseId);
        return true;
      })
      .map((c) => ({
        courseId: c.course.courseId,
        courseName: c.course.courseName,
        courseCode: c.course.courseCode,
        semester: c.course.semester,
        isActive: c.status === "active",
      }));
  }, [activeClasses]);

  return (
    <div className="flex h-screen bg-gray-50">
      <SidebarInstructor activeItem="dashboard" />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          {/* Page Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6 lg:mb-8">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                Welcome, {user?.firstName || "Instructor"}
              </h1>
            </div>
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

          {/* Quick Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 lg:mb-8">
            <StatCard
              label="Total Students"
              value={loading ? "—" : stats.totalStudents}
              icon={<Users className="w-5 h-5 text-blue-600" />}
              color="blue"
            />
            <StatCard
              label="Classes"
              value={loading ? "—" : stats.totalClasses}
              icon={<BookOpen className="w-5 h-5 text-indigo-600" />}
              color="indigo"
            />
            <StatCard
              label="Pending Reviews"
              value={reportsLoading ? "—" : stats.pendingReports}
              icon={<Clock className="w-5 h-5 text-amber-600" />}
              color="amber"
            />
            <StatCard
              label="Avg Score"
              value={stats.avgScore ?? "—"}
              suffix={stats.avgScore !== null ? "/100" : undefined}
              icon={<BarChart3 className="w-5 h-5 text-green-600" />}
              color="green"
            />
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
            {/* Pending Reviews Table */}
            <div className="xl:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <h2 className="text-base font-semibold text-gray-900">Pending Reviews</h2>
                <div className="flex items-center gap-1">
                  {(["all", "pending", "reviewed"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                        activeTab === tab
                          ? tab === "pending"
                            ? "bg-amber-50 text-amber-600"
                            : tab === "reviewed"
                              ? "bg-green-50 text-green-600"
                              : "bg-indigo-50 text-indigo-600"
                          : "text-gray-500 hover:bg-gray-100"
                      }`}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="overflow-x-auto">
                {reportsLoading && filteredReports.length === 0 ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                  </div>
                ) : filteredReports.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Clock className="w-10 h-10 text-gray-300 mb-3" />
                    <p className="text-sm text-gray-500">No presentations to review</p>
                  </div>
                ) : (
                  <Table
                    columns={presentationRows}
                    dataSource={filteredReports}
                    pagination={false}
                    scroll={{ x: "max-content" }}
                    className="[&_.ant-table-thead>tr>th]:bg-gray-50 [&_.ant-table-thead>tr>th]:text-gray-700 [&_.ant-table-thead>tr>th]:font-semibold [&_.ant-table-thead>tr>th]:text-sm [&_.ant-table-thead>tr>th]:border-b [&_.ant-table-thead>tr>th]:px-4 [&_.ant-table-thead>tr>th]:py-3 [&_.ant-table-tbody>tr>td]:px-4 [&_.ant-table-tbody>tr>td]:py-3 [&_.ant-table-tbody>tr]:border-b [&_.ant-table-tbody>tr]:border-gray-100 [&_.ant-table-tbody>tr:hover]:bg-gray-50"
                  />
                )}
              </div>
            </div>

            {/* Recent Activity Sidebar */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <h2 className="text-base font-semibold text-gray-900">Recent Activity</h2>
              </div>
              {recentActivityItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <FileText className="w-8 h-8 text-gray-300 mb-2" />
                  <p className="text-sm text-gray-400">No recent activity</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {recentActivityItems.map((activity) => (
                    <div key={activity.id} className="p-3">
                      <div className="flex items-start gap-3">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                          activity.type === "submission" ? "bg-amber-50" : "bg-green-50"
                        }`}>
                          {activity.type === "submission" ? (
                            <Upload className="w-3.5 h-3.5 text-amber-600" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-700 line-clamp-2">{activity.message}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{activity.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Course Overview Section */}
          <div className="mt-6 lg:mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Your Courses</h2>
              <button
                onClick={() => navigate("/instructor/manage-courses")}
                className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700"
              >
                View all <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            {courseCards.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">No courses assigned yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {courseCards.slice(0, 3).map((course) => (
                  <div
                    key={course.courseId}
                    className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => navigate(`/instructor/course/${course.courseId}`)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-9 h-9 bg-indigo-50 rounded-lg flex items-center justify-center">
                        <BookOpen className="w-4 h-4 text-indigo-600" />
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        course.isActive ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"
                      }`}>
                        {course.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900">{course.courseName}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">{course.courseCode}</p>
                    <div className="flex items-center justify-between text-xs text-gray-400 mt-3 pt-3 border-t border-gray-100">
                      <span>{course.semester}</span>
                      <span>{activeClasses.filter((c) => c.course.courseId === course.courseId).length} classes</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
