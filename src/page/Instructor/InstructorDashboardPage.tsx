import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SidebarInstructor from "@/components/Sidebar/SidebarInstructor/SidebarInstructor";
import {
  Presentation,
  BarChart3,
  Users,
  FileBarChart,
  BookOpen,
  RefreshCw,
} from "lucide-react";
import {
  Card,
  Typography,
  Empty,
  Spin,
  Tag,
  Tooltip,
} from "antd";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useAppDispatch, useAppSelector } from "@/services/store/store";
import {
  fetchInstructorDashboard,
} from "@/services/features/instructor/instructorDashboardSlice";

const { Text, Title } = Typography;
const CLASS_MAX_STUDENTS = 35;

const COLORS = {
  primary: "#4f46e5",
  success: "#16a34a",
  warning: "#d97706",
  sky: "#0284c7",
  purple: "#7c3aed",
  danger: "#dc2626",
  gray: "#9ca3af",
  bgPrimary: "#eef2ff",
  bgSuccess: "#f0fdf4",
  bgWarning: "#fffbeb",
  bgSky: "#f0f9ff",
};

const InstructorDashboardPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { metrics, loading } = useAppSelector((state) => state.instructorDashboard);

  useEffect(() => {
    dispatch(fetchInstructorDashboard());
  }, [dispatch]);

  const s = metrics?.stats;
  const charts = metrics?.charts;

  const pieColors: Record<string, string> = {
    confirmed: COLORS.success,
    pending: COLORS.warning,
    waiting: COLORS.gray,
    pending_review: COLORS.purple,
    generating: COLORS.sky,
    completed: COLORS.primary,
    failed: COLORS.danger,
    rejected: COLORS.danger,
    draft: COLORS.gray,
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <SidebarInstructor activeItem="dashboard" />
      <main className="flex-1 overflow-y-auto">
        <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <Title level={3} className="m-0">Dashboard giảng viên</Title>
            <button
              onClick={() => dispatch(fetchInstructorDashboard())}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border hover:bg-gray-50"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Làm mới
            </button>
          </div>
        </header>

        <div className="max-w-7xl mx-auto p-6 space-y-5">
          {loading && !metrics ? (
            <div className="h-[60vh] flex items-center justify-center">
              <Spin size="large" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <Card><Text>Tổng lớp</Text><Title level={3}>{s?.classes?.total ?? 0}</Title></Card>
                <Card><Text>Lớp hoạt động</Text><Title level={3}>{s?.classes?.active ?? 0}</Title></Card>
                <Card><Text>Sinh viên</Text><Title level={3}>{s?.students?.total ?? 0}</Title></Card>
                <Card><Text>Bài thuyết trình</Text><Title level={3}>{s?.presentations?.total ?? 0}</Title></Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card>
                  <div className="flex items-center gap-2 mb-3">
                    <BarChart3 size={16} color={COLORS.primary} />
                    <Text strong>Bài thuyết trình 30 ngày</Text>
                  </div>
                  {charts?.presentationsPerDay?.length ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={charts.presentationsPerDay}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={4} />
                        <YAxis allowDecimals={false} />
                        <RechartsTooltip />
                        <Bar dataKey="presentations" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <Empty description="Chưa có dữ liệu" image={Empty.PRESENTED_IMAGE_SIMPLE} />}
                </Card>

                <Card>
                  <div className="flex items-center gap-2 mb-3">
                    <FileBarChart size={16} color={COLORS.success} />
                    <Text strong>Báo cáo AI 14 ngày</Text>
                  </div>
                  {charts?.reportsPerDay?.length ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={charts.reportsPerDay}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={3} />
                        <YAxis allowDecimals={false} />
                        <RechartsTooltip />
                        <Bar dataKey="reports" fill={COLORS.success} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <Empty description="Chưa có dữ liệu" image={Empty.PRESENTED_IMAGE_SIMPLE} />}
                </Card>

                <Card>
                  <div className="flex items-center gap-2 mb-3">
                    <Users size={16} color={COLORS.sky} />
                    <Text strong>Sinh viên theo lớp (tối đa 35)</Text>
                  </div>
                  {charts?.studentsByClass?.length ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart
                        data={charts.studentsByClass.map((item: any) => {
                          const enrolled = Number(item.count) || 0;
                          return {
                            ...item,
                            enrolled,
                            remaining: Math.max(CLASS_MAX_STUDENTS - enrolled, 0),
                          };
                        })}
                        layout="vertical"
                        margin={{ left: 10, right: 10 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis
                          type="number"
                          allowDecimals={false}
                          domain={[0, CLASS_MAX_STUDENTS]}
                        />
                        <YAxis type="category" dataKey="label" width={70} tick={{ fontSize: 10 }} />
                        <RechartsTooltip formatter={(value: any) => [`${value} sinh viên`, ""]} />
                        <Bar
                          dataKey="enrolled"
                          stackId="capacity"
                          name="Đã đăng ký"
                          fill={COLORS.sky}
                          radius={[0, 4, 4, 0]}
                        />
                        <Bar
                          dataKey="remaining"
                          stackId="capacity"
                          name="Còn trống"
                          fill="#E5E7EB"
                          radius={[0, 4, 4, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <Empty description="Chưa có dữ liệu" image={Empty.PRESENTED_IMAGE_SIMPLE} />}
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card>
                  <div className="flex items-center gap-2 mb-3">
                    <FileBarChart size={16} color={COLORS.warning} />
                    <Text strong>Trạng thái báo cáo</Text>
                  </div>
                  {charts?.reportStatus?.length ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie data={charts.reportStatus} dataKey="count" nameKey="label" outerRadius={80}>
                          {charts.reportStatus.map((item: any) => (
                            <Cell key={item.key} fill={pieColors[item.key] ?? COLORS.gray} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : <Empty description="Chưa có dữ liệu" image={Empty.PRESENTED_IMAGE_SIMPLE} />}
                </Card>

                <Card>
                  <div className="flex items-center gap-2 mb-3">
                    <Presentation size={16} color={COLORS.purple} />
                    <Text strong>Trạng thái bài thuyết trình</Text>
                  </div>
                  {charts?.presentationsByStatus?.length ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie data={charts.presentationsByStatus} dataKey="count" nameKey="label" outerRadius={80}>
                          {charts.presentationsByStatus.map((item: any) => (
                            <Cell key={item.key} fill={pieColors[item.key] ?? COLORS.primary} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : <Empty description="Chưa có dữ liệu" image={Empty.PRESENTED_IMAGE_SIMPLE} />}
                </Card>

                <Card>
                  <div className="flex items-center gap-2 mb-3">
                    <BookOpen size={16} color={COLORS.warning} />
                    <Text strong>Phân bố điểm AI</Text>
                  </div>
                  {charts?.scoreDistribution?.length ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={charts.scoreDistribution}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="range" />
                        <YAxis allowDecimals={false} />
                        <RechartsTooltip />
                        <Bar dataKey="count" fill={COLORS.warning} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <Empty description="Chưa có dữ liệu" image={Empty.PRESENTED_IMAGE_SIMPLE} />}
                  <div className="mt-2 text-right">
                    <Tag color="green">Điểm TB: {s?.avgScore ?? "—"}</Tag>
                  </div>
                </Card>
              </div>

              <Card title="Top 5 bài thuyết trình điểm cao">
                {metrics?.topPresentations?.length ? (
                  <div className="space-y-3">
                    {metrics.topPresentations.map((p: any, idx: number) => (
                      <button
                        key={p.presentationId}
                        type="button"
                        onClick={() => navigate(`/instructor/presentation/${p.presentationId}`)}
                        className="w-full border rounded-2xl px-4 py-3 flex items-center justify-between gap-3 bg-white hover:shadow-md hover:-translate-y-0.5 transition-all text-left"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm"
                            style={{
                              background:
                                idx === 0
                                  ? "linear-gradient(135deg,#f59e0b,#f97316)"
                                  : idx === 1
                                    ? "linear-gradient(135deg,#94a3b8,#64748b)"
                                    : idx === 2
                                      ? "linear-gradient(135deg,#fb923c,#ea580c)"
                                      : "linear-gradient(135deg,#38bdf8,#0284c7)",
                            }}
                          >
                            #{idx + 1}
                          </div>

                          <div className="min-w-0">
                            <Tooltip title={p.title}>
                              <Text className="block truncate text-[15px] font-semibold text-gray-900">
                                {p.title}
                              </Text>
                            </Tooltip>
                            <Text type="secondary" className="text-xs">
                              {p.studentName} · {p.classCode}
                            </Text>
                          </div>
                        </div>

                        <div className="text-right min-w-[130px]">
                          <Text
                            className="block text-base font-bold"
                            style={{ color: COLORS.success }}
                          >
                            {p.score ?? "—"} điểm
                          </Text>
                          <Text className="text-xs text-blue-600 font-medium">
                            Xem chi tiết
                          </Text>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <Empty description="Chưa có bài thuyết trình có điểm" />
                )}
              </Card>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default InstructorDashboardPage;