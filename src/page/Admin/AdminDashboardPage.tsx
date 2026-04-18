import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SidebarAdmin from "@/components/Sidebar/SidebarAdmin/SidebarAdmin";
import {
  Card,
  Table,
  Tag,
  Typography,
  Spin,
  Empty,
  Tooltip,
} from "antd";
import type { ColumnsType } from "antd/es/table";
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
import {
  Users,
  Presentation,
  BarChart3,
  BookOpen,
  FileBarChart,
  RefreshCw,
  Trophy,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/services/store/store";
import { fetchAdminDashboard } from "@/services/features/admin/adminDashboardSlice";

const { Text, Title } = Typography;

const C = {
  primary:   "#4f46e5",
  primaryLight: "#eef2ff",
  success:   "#16a34a",
  successLight: "#f0fdf4",
  warning:   "#d97706",
  warningLight: "#fffbeb",
  danger:    "#dc2626",
  dangerLight: "#fef2f2",
  purple:    "#7c3aed",
  purpleLight: "#f5f3ff",
  sky:       "#0284c7",
  skyLight:  "#f0f9ff",
  orange:    "#ea580c",
  orangeLight: "#fff7ed",
  gray: {
    50: "#f9fafb",
    100: "#f3f4f6",
    200: "#e5e7eb",
    300: "#d1d5db",
    400: "#9ca3af",
    500: "#6b7280",
    600: "#4b5563",
    700: "#374151",
    800: "#1f2937",
    900: "#111827",
  },
};

const ROLE_COLORS: Record<string, string> = {
  student:    C.primary,
  instructor: C.purple,
  admin:      C.danger,
};

const PRES_COLORS: Record<string, string> = {
  draft:      C.gray[400],
  submitted:  C.warning,
  processing: C.purple,
  done:       C.success,
  failed:     C.danger,
};

const SCORE_COLORS = ["#ef4444", "#f59e0b", "#3b82f6", "#22c55e"];

// ── Stat Card ─────────────────────────────────────────────────────────────────
const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: number;
  sub?: string;
  bg: string;
  iconColor: string;
  onClick?: () => void;
}> = ({ icon, label, value, sub, bg, iconColor, onClick }) => (
  <Card
    size="small"
    styles={{ body: { padding: "20px 22px" } }}
    className="border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer h-full group"
    onClick={onClick}
  >
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300" style={{ background: bg }}>
        <span style={{ color: iconColor }}>{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <Text className="text-xs font-semibold block uppercase tracking-wide" style={{ color: C.gray[500] }}>
          {label}
        </Text>
        <Text className="text-2xl font-bold block leading-none mt-1" style={{ color: C.gray[800] }}>
          {value.toLocaleString("vi-VN")}
        </Text>
        {sub && (
          <Text className="text-xs mt-1.5 block" style={{ color: C.gray[400] }}>
            {sub}
          </Text>
        )}
      </div>
    </div>
  </Card>
);

// ── Mini stat pill ────────────────────────────────────────────────────────────
const MiniPill: React.FC<{ label: string; value: string | number; color: string; bg: string }> = ({
  label, value, color, bg,
}) => (
  <div
    className="flex flex-col items-center justify-center px-3 py-2 rounded-xl flex-1"
    style={{ background: bg }}
  >
    <Text className="text-lg font-bold leading-none" style={{ color }}>{value}</Text>
    <Text className="text-[10px] mt-1 font-medium" style={{ color: C.gray[500] }}>{label}</Text>
  </div>
);

// ── Donut chart card ─────────────────────────────────────────────────────────
const DonutCard: React.FC<{
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  data: { label: string; count: number; key: string }[];
  colors: Record<string, string>;
  total?: number;
}> = ({ title, subtitle, icon, iconBg, iconColor, data, colors, total }) => (
  <Card
    size="small"
    styles={{ body: { padding: "18px" } }}
    className="border border-slate-100 shadow-sm h-full hover:shadow-xl transition-all duration-300 group"
  >
    <div className="flex items-center gap-2 mb-4">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300" style={{ background: iconBg }}>
        <span style={{ color: iconColor }}>{icon}</span>
      </div>
      <div>
        <Text strong className="text-sm block leading-none" style={{ color: C.gray[800] }}>{title}</Text>
        {subtitle && <Text className="text-xs mt-0.5 block" style={{ color: C.gray[400] }}>{subtitle}</Text>}
      </div>
    </div>

    {data.length > 0 ? (
      <div className="flex items-center gap-3">
        <ResponsiveContainer width={110} height={110}>
          <PieChart>
            <Pie
              data={data}
              cx="50%" cy="50%"
              innerRadius={34} outerRadius={50}
              paddingAngle={2}
              dataKey="count"
              nameKey="label"
            >
              {data.map((entry) => (
                <Cell
                  key={entry.key}
                  fill={colors[entry.key] ?? C.gray[400]}
                />
              ))}
            </Pie>
            {total != null && (
              <text x="55" y="52" textAnchor="middle" dominantBaseline="middle">
                <tspan style={{ fontSize: 14, fontWeight: 700, fill: C.gray[800] }}>
                  {total.toLocaleString("vi-VN")}
                </tspan>
              </text>
            )}
          </PieChart>
        </ResponsiveContainer>

        <div className="flex-1 space-y-1.5 min-w-0">
          {data.slice(0, 5).map((entry) => (
            <div key={entry.key} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: colors[entry.key] ?? C.gray[400] }} />
              <Text className="text-xs truncate flex-1" style={{ color: C.gray[600] }}>
                {entry.label}
              </Text>
              <Text className="text-xs font-bold flex-shrink-0" style={{ color: C.gray[700] }}>
                {entry.count.toLocaleString("vi-VN")}
              </Text>
            </div>
          ))}
        </div>
      </div>
    ) : (
      <div className="h-[110px] flex items-center justify-center">
        <Empty description="Chưa có dữ liệu" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </div>
    )}
  </Card>
);

// ── Score distribution bar ────────────────────────────────────────────────────
const ScoreBar: React.FC<{ data: { range: string; count: number; key: string }[]; avg: number | null }> = ({
  data, avg,
}) => {
  const max = Math.max(...data.map((d) => d.count), 1);
  const total = data.reduce((s, d) => s + d.count, 0);

  return (
    <div className="flex items-center gap-4">
      {/* Average score donut */}
      <div className="flex flex-col items-center justify-center" style={{ minWidth: 90 }}>
        {avg != null ? (
          <>
            <div className="relative w-16 h-16">
              <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="26" fill="none" stroke={C.gray[100]} strokeWidth="6" />
                <circle
                  cx="32" cy="32" r="26" fill="none"
                  stroke={avg >= 8 ? C.success : avg >= 6 ? C.warning : C.danger}
                  strokeWidth="6"
                  strokeDasharray={`${2 * Math.PI * 26}`}
                  strokeDashoffset={`${2 * Math.PI * 26 * (1 - Math.min(100, (avg / 10) * 100) / 100)}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Text className="text-sm font-bold leading-none" style={{
                  color: avg >= 8 ? C.success : avg >= 6 ? C.warning : C.danger,
                }}>
                  {avg.toFixed(1)}
                </Text>
                <Text className="text-[9px]" style={{ color: C.gray[400] }}>/10</Text>
              </div>
            </div>
            <Text className="text-xs mt-1" style={{ color: C.gray[500] }}>Điểm TB</Text>
          </>
        ) : (
          <Text type="secondary" className="text-sm">—</Text>
        )}
      </div>

      {/* Bar chart */}
      <div className="flex-1 space-y-1.5">
        {data.map((d, i) => (
          <div key={d.key} className="flex items-center gap-2">
            <Text className="text-xs w-8 text-right flex-shrink-0" style={{ color: C.gray[500] }}>
              {d.range}
            </Text>
            <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: C.gray[100] }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${max > 0 ? (d.count / max) * 100 : 0}%`,
                  background: SCORE_COLORS[i],
                }}
              />
            </div>
            <Text className="text-xs w-6 text-right flex-shrink-0 font-medium" style={{ color: C.gray[600] }}>
              {d.count}
            </Text>
            <Text className="text-xs w-8 flex-shrink-0" style={{ color: C.gray[400] }}>
              {total > 0 ? `${Math.round((d.count / total) * 100)}%` : "0%"}
            </Text>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Chart Tooltip ─────────────────────────────────────────────────────────────
const BarTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="shadow-lg rounded-lg border px-3 py-2 bg-white" style={{ borderColor: C.gray[200] }}>
      <Text className="text-xs font-medium" style={{ color: C.gray[600] }}>{label}</Text>
      <br />
      <Text className="text-sm font-bold" style={{ color: C.primary }}>
        {payload[0].value} bài
      </Text>
    </div>
  );
};

// ── Main ──────────────────────────────────────────────────────────────────────
const AdminDashboardPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { metrics: data, loading } = useAppSelector((s) => s.adminDashboard);

  useEffect(() => {
    dispatch(fetchAdminDashboard());
  }, [dispatch]);

  const s = data?.stats;
  const charts = data?.charts;

  if (loading && !data) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: C.gray[50] }}>
        <Spin size="large" tip="Đang tải dashboard..." />
      </div>
    );
  }

  const totalReports = charts?.reportStatus?.reduce((sum: number, r: any) => sum + r.count, 0) ?? 0;
  const totalPres = charts?.presentationsByStatus?.reduce((sum: number, r: any) => sum + r.count, 0) ?? 0;
  const totalUsers = (s?.users?.students ?? 0) + (s?.users?.instructors ?? 0) + (s?.users?.admins ?? 0);

  // Presentation columns
  const presColumns: ColumnsType<any> = [
    {
      title: "Bài thuyết trình",
      key: "title",
      render: (_, r) => (
        <Tooltip title={r.title}>
          <Text className="text-sm block truncate max-w-[200px]">{r.title}</Text>
        </Tooltip>
      ),
    },
    {
      title: "Sinh viên",
      key: "student",
      width: 140,
      render: (_, r) => (
        <Text className="text-xs" style={{ color: C.gray[600] }}>{r.studentName}</Text>
      ),
    },
    {
      title: "Điểm AI",
      key: "score",
      width: 70,
      align: "center" as const,
      render: (_, r) =>
        r.score != null ? (
          <Text className="text-sm font-bold" style={{ color: C.primary }}>{r.score}</Text>
        ) : <Text type="secondary">—</Text>,
    },
    {
      title: "Trạng thái",
      key: "status",
      width: 110,
      render: (_, r) => {
        const map: Record<string, { color: string; label: string }> = {
          confirmed: { color: "green", label: "Đã xác nhận" },
          pending: { color: "orange", label: "Chờ duyệt" },
          completed: { color: "blue", label: "Hoàn thành" },
          generating: { color: "purple", label: "Đang xử lý" },
          rejected: { color: "red", label: "Từ chối" },
          failed: { color: "red", label: "Thất bại" },
        };
        const cfg = map[r.reportStatus ?? ""] ?? { color: "default", label: "—" };
        return <Tag color={cfg.color} className="text-xs">{cfg.label}</Tag>;
      },
    },
  ];

  // User columns
  const userColumns: ColumnsType<any> = [
    {
      title: "Người dùng",
      key: "name",
      render: (_, r) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
            style={{ background: ROLE_COLORS[r.role?.toLowerCase()] ?? C.gray[400] }}>
            {r.initials}
          </div>
          <div>
            <Text className="text-sm font-medium block">{r.name}</Text>
            <Text className="text-xs" style={{ color: C.gray[500] }}>{r.email}</Text>
          </div>
        </div>
      ),
    },
    {
      title: "Vai trò",
      key: "role",
      width: 90,
      align: "center" as const,
      render: (_, r) => {
        const map: Record<string, string> = { Student: "blue", Instructor: "purple", Admin: "red" };
        const role = r.role as string;
        return <Tag color={map[role] ?? "default"} className="text-xs">{role}</Tag>;
      },
    },
    {
      title: "Ngày tạo",
      key: "createdAt",
      width: 100,
      render: (_, r) => (
        <Text className="text-xs" style={{ color: C.gray[500] }}>
          {r.createdAt ? new Date(r.createdAt).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }) : "—"}
        </Text>
      ),
    },
  ];

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#f8fafc" }}>
      <SidebarAdmin activeItem="dashboard" />
      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <header
          className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b px-6 py-4"
          style={{ borderColor: C.gray[100], boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
        >
          <div className="flex items-center justify-between">
            <Title level={3} className="m-0" style={{ color: C.gray[800] }}>Tổng quan hệ thống</Title>
            <button
              onClick={() => dispatch(fetchAdminDashboard())}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-200 hover:bg-gray-50 hover:shadow-sm active:scale-[0.98]"
              style={{ borderColor: C.gray[200], color: C.gray[600] }}
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Làm mới
            </button>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-6 py-6 space-y-5">

          {/* ── 3 MAIN STAT CARDS ─────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              icon={<Users size={22} />}
              label="Người dùng"
              value={s?.users?.total ?? 0}
              sub={`${s?.users?.newThisWeek ?? 0} tuần này`}
              bg={C.primaryLight}
              iconColor={C.primary}
              onClick={() => navigate("/admin/user-management")}
            />
            <StatCard
              icon={<Presentation size={22} />}
              label="Bài thuyết trình"
              value={s?.presentations?.total ?? 0}
              sub={`${s?.presentations?.thisWeek ?? 0} tuần · ${s?.presentations?.today ?? 0} hôm nay`}
              bg={C.warningLight}
              iconColor={C.warning}
            />
            <StatCard
              icon={<FileBarChart size={22} />}
              label="Báo cáo AI"
              value={s?.reports?.total ?? 0}
              sub={`${s?.reports?.confirmed ?? 0} đã xác nhận · ${s?.reports?.pending ?? 0} chờ duyệt`}
              bg={C.primaryLight}
              iconColor={C.primary}
            />
          </div>

          {/* ── MINI STATS ROW ─────────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MiniPill
              label="Khóa học"
              value={s?.courses?.total ?? 0}
              color={C.success}
              bg={C.successLight}
            />
            <MiniPill
              label="Lớp học"
              value={s?.courses?.classes ?? 0}
              color={C.sky}
              bg={C.skyLight}
            />
            <MiniPill
              label="Sinh viên"
              value={s?.users?.students ?? 0}
              color={C.primary}
              bg={C.primaryLight}
            />
            <MiniPill
              label="Giảng viên"
              value={s?.users?.instructors ?? 0}
              color={C.purple}
              bg={C.purpleLight}
            />
          </div>

          {/* ── BAR CHARTS ROW: Pres per day + Report per day ─────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card size="small" styles={{ body: { padding: "16px 20px 12px" } }}
              className="border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md transition-transform duration-300 hover:scale-110" style={{ background: C.primaryLight }}>
                  <BarChart3 size={16} style={{ color: C.primary }} />
                </div>
                <div>
                  <Text strong className="text-sm block" style={{ color: C.gray[800] }}>
                    Bài thuyết trình — 30 ngày
                  </Text>
                  <Text className="text-xs" style={{ color: C.gray[400] }}>
                    {s?.presentations?.thisWeek ?? 0} tuần này
                  </Text>
                </div>
              </div>
              {charts?.presentationsPerDay?.length ? (
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={charts.presentationsPerDay}
                    margin={{ top: 0, right: 0, left: -20, bottom: 0 }} barCategoryGap="28%">
                    <CartesianGrid strokeDasharray="3 3" stroke={C.gray[100]} vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 9, fill: C.gray[500] }}
                      tickLine={false} axisLine={false} interval={4} />
                    <YAxis tick={{ fontSize: 9, fill: C.gray[500] }}
                      tickLine={false} axisLine={false} allowDecimals={false} />
                    <RechartsTooltip content={<BarTooltip />} cursor={{ fill: C.primaryLight }} />
                    <Bar dataKey="presentations" fill={C.primary} radius={[3, 3, 0, 0]} maxBarSize={22} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[160px] flex items-center justify-center">
                  <Empty description="Chưa có dữ liệu" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                </div>
              )}
            </Card>

            <Card size="small" styles={{ body: { padding: "16px 20px 12px" } }}
              className="border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md transition-transform duration-300 hover:scale-110" style={{ background: C.successLight }}>
                  <FileBarChart size={16} style={{ color: C.success }} />
                </div>
                <div>
                  <Text strong className="text-sm block" style={{ color: C.gray[800] }}>
                    Báo cáo AI — 14 ngày
                  </Text>
                  <Text className="text-xs" style={{ color: C.gray[400] }}>
                    {s?.reports?.confirmed ?? 0} đã xác nhận
                  </Text>
                </div>
              </div>
              {charts?.reportsPerDay?.length ? (
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={charts.reportsPerDay}
                    margin={{ top: 0, right: 0, left: -20, bottom: 0 }} barCategoryGap="28%">
                    <CartesianGrid strokeDasharray="3 3" stroke={C.gray[100]} vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 9, fill: C.gray[500] }}
                      tickLine={false} axisLine={false} interval={3} />
                    <YAxis tick={{ fontSize: 9, fill: C.gray[500] }}
                      tickLine={false} axisLine={false} allowDecimals={false} />
                    <RechartsTooltip content={<BarTooltip />} cursor={{ fill: C.successLight }} />
                    <Bar dataKey="reports" fill={C.success} radius={[3, 3, 0, 0]} maxBarSize={22} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[160px] flex items-center justify-center">
                  <Empty description="Chưa có dữ liệu" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                </div>
              )}
            </Card>
          </div>

          {/* ── PIE CHARTS ROW: Report status + Users by role + Pres status ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <DonutCard
              title="Trạng thái báo cáo"
              subtitle={`${totalReports} tổng`}
              icon={<FileBarChart size={16} />}
              iconBg={C.warningLight}
              iconColor={C.warning}
              data={charts?.reportStatus ?? []}
              colors={{ confirmed: C.success, pending: C.warning, completed: C.sky, generating: C.purple, rejected: C.orange, failed: C.danger, draft: C.gray[400], waiting: C.gray[400], pending_review: C.gray[400] }}
              total={totalReports}
            />
            <DonutCard
              title="Phân bố người dùng"
              subtitle={`${totalUsers} tổng`}
              icon={<Users size={16} />}
              iconBg={C.primaryLight}
              iconColor={C.primary}
              data={charts?.usersByRole ?? []}
              colors={ROLE_COLORS}
              total={totalUsers}
            />
            <DonutCard
              title="Trạng thái bài thuyết trình"
              subtitle={`${totalPres} tổng`}
              icon={<Presentation size={16} />}
              iconBg={C.skyLight}
              iconColor={C.sky}
              data={charts?.presentationsByStatus ?? []}
              colors={PRES_COLORS}
              total={totalPres}
            />
          </div>

          {/* ── SCORE DISTRIBUTION ─────────────────────────────────────── */}
          <Card size="small" styles={{ body: { padding: "16px 20px" } }}
            className="border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: C.successLight }}>
                <Trophy size={16} style={{ color: C.success }} />
              </div>
              <Text strong className="text-sm" style={{ color: C.gray[800] }}>
                Phân bố điểm AI — Báo cáo đã xác nhận
              </Text>
            </div>
            <ScoreBar
              data={charts?.scoreDistribution ?? []}
              avg={s?.avgScore ?? null}
            />
          </Card>

          {/* ── TABLES ROW ──────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card size="small" styles={{ body: { padding: 0 } }}
              className="border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300">
              <div className="px-5 py-4 border-b flex items-center justify-between"
                style={{ borderColor: C.gray[100] }}>
                <Text strong className="text-sm" style={{ color: C.gray[800] }}>
                  Bài thuyết trình gần đây
                </Text>
                <Tag color="blue">{data?.recentPresentations?.length ?? 0} mới nhất</Tag>
              </div>
              {!!data?.recentPresentations?.length ? (
                <Table
                  columns={presColumns}
                  dataSource={data.recentPresentations.map((p: any) => ({ ...p, key: p.presentationId }))}
                  pagination={false} size="small"
                  className="[&_.ant-table-thead>tr>th]:!bg-gray-50 [&_.ant-table-thead>tr>th]:!text-xs [&_.ant-table-thead>tr>th]:!px-4 [&_.ant-table-thead>tr>th]:!py-3 [&_.ant-table-tbody>tr>td]:!px-4 [&_.ant-table-tbody>tr>td]:!py-2.5"
                />
              ) : (
                <div className="p-8 text-center">
                  <Empty description="Chưa có bài thuyết trình nào" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                </div>
              )}
            </Card>

            <Card size="small" styles={{ body: { padding: 0 } }}
              className="border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300">
              <div className="px-5 py-4 border-b flex items-center justify-between"
                style={{ borderColor: C.gray[100] }}>
                <Text strong className="text-sm" style={{ color: C.gray[800] }}>
                  Người dùng mới
                </Text>
                <Tag color="purple">{data?.recentUsers?.length ?? 0} mới nhất</Tag>
              </div>
              {!!data?.recentUsers?.length ? (
                <Table
                  columns={userColumns}
                  dataSource={data.recentUsers.map((u: any) => ({ ...u, key: u.userId }))}
                  pagination={false} size="small"
                  className="[&_.ant-table-thead>tr>th]:!bg-gray-50 [&_.ant-table-thead>tr>th]:!text-xs [&_.ant-table-thead>tr>th]:!px-4 [&_.ant-table-thead>tr>th]:!py-3 [&_.ant-table-tbody>tr>td]:!px-4 [&_.ant-table-tbody>tr>td]:!py-2.5"
                />
              ) : (
                <div className="p-8 text-center">
                  <Empty description="Chưa có người dùng nào" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                </div>
              )}
            </Card>
          </div>

          {/* ── CLASSES & INSTRUCTORS ROW ─────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card size="small" styles={{ body: { padding: 0 } }} className="border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300">
              <div className="px-5 py-4 border-b" style={{ borderColor: C.gray[100] }}>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: C.skyLight }}>
                    <BookOpen size={14} style={{ color: C.sky }} />
                  </div>
                  <Text strong className="text-sm" style={{ color: C.gray[800] }}>
                    Lớp học nhiều sinh viên
                  </Text>
                </div>
              </div>
              {!!data?.topClasses?.length ? (
                <div className="divide-y" style={{ borderColor: C.gray[50] }}>
                  {data.topClasses.map((cls: any) => (
                    <div
                      key={cls.classId}
                      className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => navigate("/admin/manage-classes")}
                    >
                      <div className="flex-1 min-w-0">
                        <Text className="text-sm font-medium text-gray-900 block truncate">
                          {cls.classCode}
                        </Text>
                        <Text type="secondary" className="text-xs block truncate">
                          {cls.courseName}
                        </Text>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center"
                          style={{ background: C.skyLight }}>
                          <Text className="text-xs font-bold" style={{ color: C.sky }}>
                            {cls.enrollmentCount}
                          </Text>
                        </div>
                        <Text className="text-xs" style={{ color: C.gray[400] }}>SV</Text>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <Empty description="Chưa có lớp học nào" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                </div>
              )}
            </Card>

            <Card size="small" styles={{ body: { padding: 0 } }} className="border-0 shadow-sm">
              <div className="px-5 py-4 border-b" style={{ borderColor: C.gray[100] }}>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: C.purpleLight }}>
                    <Users size={14} style={{ color: C.purple }} />
                  </div>
                  <Text strong className="text-sm" style={{ color: C.gray[800] }}>
                    Giảng viên đang hoạt động
                  </Text>
                </div>
              </div>
              {!!data?.topInstructors?.length ? (
                <div className="divide-y" style={{ borderColor: C.gray[50] }}>
                  {data.topInstructors.map((inst: any) => (
                    <div
                      key={inst.userId}
                      className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => navigate("/admin/user-management")}
                    >
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{ background: C.purpleLight, color: C.purple }}>
                        {inst.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <Text className="text-sm font-medium text-gray-900 block truncate">
                          {inst.name}
                        </Text>
                      </div>
                      <Text className="text-sm font-bold flex-shrink-0" style={{ color: C.purple }}>
                        {inst.classCount} <Text className="font-normal text-xs" style={{ color: C.gray[400] }}>lớp</Text>
                      </Text>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <Empty description="Chưa có giảng viên nào" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                </div>
              )}
            </Card>
          </div>

        </div>
      </main>
    </div>
  );
};

export default AdminDashboardPage;
