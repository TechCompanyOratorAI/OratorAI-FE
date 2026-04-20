import React, { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import SummaryMetrics, {
  SummaryMetricItem,
} from "@/components/Dashboard/SummaryMetrics";
import SidebarInstructor from "@/components/Sidebar/SidebarInstructor/SidebarInstructor";
import Toast from "@/components/Toast/Toast";
import {
  BookOpen,
  Clock,
  ArrowRight,
  CheckCircle2,
  BarChart3,
  Upload,
  Users,
} from "lucide-react";
import {
  Table,
  Card,
  Button,
  Tag,
  Space,
  Typography,
  Segmented,
  Empty,
  Spin,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useAppDispatch, useAppSelector } from "@/services/store/store";
import {
  fetchTeachingClasses,
  fetchClassAIRReports,
  fetchClassAverageScore,
  AIRReportSummary,
  TeachingClassStats,
} from "@/services/features/instructor/instructorDashboardSlice";

const { Text } = Typography;

const isClassExpired = (endDate: string): boolean => {
  const now = new Date();
  const beijingOffset = 8 * 60;
  const localOffset = now.getTimezoneOffset();
  const beijingNow = new Date(
    now.getTime() + (localOffset + beijingOffset) * 60 * 1000,
  );
  return new Date(endDate) < beijingNow;
};

const timeAgo = (dateStr: string): string => {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return "Vừa xong";
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  if (diff < 172800) return "Hôm qua";
  return `${Math.floor(diff / 86400)} ngày trước`;
};

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
  const [activeTab, setActiveTab] = React.useState<
    "all" | "pending" | "reviewed"
  >("all");

  useEffect(() => {
    dispatch(fetchTeachingClasses());
  }, [dispatch]);

  useEffect(() => {
    if (teachingClasses.length === 0) return;
    teachingClasses.forEach((cls) => {
      if (!isClassExpired(cls.endDate)) {
        dispatch(fetchClassAIRReports(cls.classId));
        dispatch(fetchClassAverageScore(cls.classId));
      }
    });
  }, [teachingClasses, dispatch]);

  const activeClasses = useMemo(
    () => teachingClasses.filter((c) => !isClassExpired(c.endDate)),
    [teachingClasses],
  );

  const stats = useMemo(() => {
    const classIds = activeClasses.map((c) => c.classId);
    const allStats = classIds
      .map((id) => classStats[id])
      .filter(Boolean) as TeachingClassStats[];
    const totalStudents = allStats.reduce((acc, s) => acc + s.totalStudents, 0);
    const pendingReports = allStats.reduce(
      (acc, s) => acc + s.pendingReports,
      0,
    );
    const reviewedReports = allStats.reduce(
      (acc, s) => acc + s.reviewedReports,
      0,
    );
    const scores = allStats
      .map((s) => s.averageScore)
      .filter((s): s is number => s !== null && s !== undefined);
    const avgScore =
      scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : null;
    return { totalStudents, totalClasses: activeClasses.length, pendingReports, reviewedReports, avgScore };
  }, [activeClasses, classStats]);

  const summaryItems: SummaryMetricItem[] = [
    {
      key: "students",
      title: "Tổng sinh viên",
      value: loading ? "—" : stats.totalStudents,
      icon: <Users className="w-5 h-5" />,
      tone: "blue",
      description: `${loading ? "Đang tải" : stats.totalClasses} lớp hoạt động`,
    },
    {
      key: "classes",
      title: "Lớp học đang dạy",
      value: loading ? "—" : stats.totalClasses,
      icon: <BookOpen className="w-5 h-5" />,
      tone: "purple",
      description: "Theo học kỳ hiện tại",
    },
    {
      key: "pending",
      title: "Bài chờ duyệt",
      value: reportsLoading ? "—" : stats.pendingReports,
      icon: <Clock className="w-5 h-5" />,
      tone: "amber",
      deltaLabel: stats.pendingReports > 0 ? "Cần xử lý" : "Ổn định",
      deltaType: stats.pendingReports > 0 ? "warning" : "success",
      description: `${stats.reviewedReports} bài đã duyệt`,
    },
    {
      key: "score",
      title: "Điểm trung bình",
      value: stats.avgScore ?? "—",
      suffix: stats.avgScore !== null ? "/100" : undefined,
      icon: <BarChart3 className="w-5 h-5" />,
      tone: "green",
      progress: stats.avgScore ?? undefined,
      description: "Chất lượng trình bày tổng quan",
    },
  ];

  const presentationRows: ColumnsType<AIRReportSummary> = [
    {
      title: "Sinh viên",
      key: "student",
      render: (_, record) => {
        const name = record.student
          ? `${record.student.firstName} ${record.student.lastName}`
          : "Không rõ";
        return (
          <Space>
            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
              <span className="text-indigo-700 font-semibold text-xs">
                {name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
              </span>
            </div>
            <Text>{name}</Text>
          </Space>
        );
      },
    },
    {
      title: "Bài thuyết trình",
      key: "title",
      render: (_, record) => (
        <Button
          type="link"
          onClick={() => navigate(`/instructor/presentation/${record.submissionId}`)}
        >
          {record.submission?.title || "—"}
        </Button>
      ),
    },
    {
      title: "Thời gian nộp",
      key: "date",
      render: (_, record) => (
        <Text type="secondary" className="text-sm">{timeAgo(record.generatedAt)}</Text>
      ),
    },
    {
      title: "Trạng thái",
      key: "status",
      render: (_, record) => {
        const isConfirmed = record.reportStatus === "confirmed";
        const isProcessing = record.reportStatus === "processing";
        return (
          <Tag color={isConfirmed ? "green" : isProcessing ? "blue" : "orange"}>
            {isConfirmed
              ? "Đã duyệt"
              : isProcessing
                ? "Đang xử lý"
                : "Chờ duyệt"}
          </Tag>
        );
      },
    },
    {
      title: "Điểm",
      key: "score",
      render: (_, record) => {
        const displayScore = record.gradeForInstructor ?? (record.overallScore ? Math.round(Number(record.overallScore)) : null);
        return (
          <Text type={displayScore ? "secondary" : "secondary"} className={displayScore ? "text-green-600 font-semibold" : ""}>
            {displayScore ? `${displayScore}/100` : "—"}
          </Text>
        );
      },
    },
    {
      title: "",
      key: "action",
      width: 80,
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          onClick={() => navigate(`/instructor/presentation/${record.submissionId}`)}
        >
          {record.reportStatus === "confirmed" ? "Xem" : "Duyệt"}
        </Button>
      ),
    },
  ];

  const filteredReports = useMemo(() => {
    if (activeTab === "pending")
      return recentReports.filter(
        (r) => r.reportStatus === "pending" || r.reportStatus === "processing",
      );
    if (activeTab === "reviewed")
      return recentReports.filter((r) => r.reportStatus === "confirmed");
    return recentReports;
  }, [recentReports, activeTab]);

  const recentActivityItems = useMemo(() => {
    return recentReports.slice(0, 8).map((r) => {
      const name = r.student
        ? `${r.student.firstName} ${r.student.lastName}`
        : "Một sinh viên";
      const isConfirmed = r.reportStatus === "confirmed";
      return {
        id: r.reportId,
        type: isConfirmed ? ("review" as const) : ("submission" as const),
        message: isConfirmed
          ? `Bạn đã duyệt "${r.submission.title}"`
          : `${name} đã nộp "${r.submission.title}"`,
        time: timeAgo(r.generatedAt),
      };
    });
  }, [recentReports]);

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
    <div className="flex min-h-screen bg-gray-50">
      <SidebarInstructor activeItem="dashboard" />
      <main className="flex-1 overflow-y-auto p-6 sm:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Page Header */}
          <div>
            <Text className="text-xs uppercase tracking-wide text-gray-500 font-semibold">
              Giảng viên
            </Text>
            <h1 className="text-2xl font-bold text-gray-900">
              Chào mừng, {user?.firstName || "Giảng viên"}
            </h1>
          </div>

          {/* Quick Stats Cards */}
          <SummaryMetrics items={summaryItems} />

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Pending Reviews Table */}
            <Card
              title="Danh sách chờ duyệt"
              className="xl:col-span-2"
              extra={
                <Segmented
                  size="small"
                  options={[
                    { label: "Tất cả", value: "all" },
                    { label: "Chờ duyệt", value: "pending" },
                    { label: "Đã duyệt", value: "reviewed" },
                  ]}
                  value={activeTab}
                  onChange={(val) => setActiveTab(val as typeof activeTab)}
                />
              }
            >
              {reportsLoading && filteredReports.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <Spin />
                </div>
              ) : filteredReports.length === 0 ? (
                <Empty description="Không có bài thuyết trình cần duyệt" />
              ) : (
                <Table
                  columns={presentationRows}
                  dataSource={filteredReports}
                  rowKey="reportId"
                  pagination={false}
                  scroll={{ x: "max-content" }}
                />
              )}
            </Card>

            {/* Recent Activity Sidebar */}
            <Card title="Hoạt động gần đây">
              {recentActivityItems.length === 0 ? (
                <Empty description="Không có hoạt động gần đây" />
              ) : (
                <Space direction="vertical" className="w-full">
                  {recentActivityItems.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${activity.type === "submission" ? "bg-amber-50" : "bg-green-50"
                        }`}>
                        {activity.type === "submission" ? (
                          <Upload className="w-3.5 h-3.5 text-amber-600" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <Text className="text-sm line-clamp-2">{activity.message}</Text>
                        <Text type="secondary" className="text-xs">{activity.time}</Text>
                      </div>
                    </div>
                  ))}
                </Space>
              )}
            </Card>
          </div>

          {/* Course Overview Section */}
          <Card
            title="Khóa học của bạn"
            extra={
              <Button type="link" icon={<ArrowRight size={14} />} onClick={() => navigate("/instructor/manage-courses")}>
                Xem tất cả
              </Button>
            }
          >
            {courseCards.length === 0 ? (
              <Empty description="Chưa có khóa học được phân công" />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {courseCards.slice(0, 3).map((course) => (
                  <Card
                    key={course.courseId}
                    hoverable
                    className="cursor-pointer"
                    onClick={() => navigate(`/instructor/course/${course.courseId}`)}
                  >
                    <Space direction="vertical" className="w-full" size={4}>
                      <div className="flex items-center justify-between">
                        <div className="w-9 h-9 bg-indigo-50 rounded-lg flex items-center justify-center">
                          <BookOpen className="w-4 h-4 text-indigo-600" />
                        </div>
                        <Tag color={course.isActive ? "green" : "default"}>
                          {course.isActive ? "Đang mở" : "Không hoạt động"}
                        </Tag>
                      </div>
                      <Text strong>{course.courseName}</Text>
                      <Text type="secondary">{course.courseCode}</Text>
                      <div className="flex items-center justify-between text-xs text-gray-400 pt-2">
                        <span>{course.semester}</span>
                        <span>
                          {activeClasses.filter((c) => c.course.courseId === course.courseId).length} lớp
                        </span>
                      </div>
                    </Space>
                  </Card>
                ))}
              </div>
            )}
          </Card>
        </div>
      </main>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default InstructorDashboardPage;