import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  Button,
  Tag,
  Space,
  Typography,
  Spin,
  Table,
  Empty,
  Avatar,
  Progress,
  Badge,
  Row,
  Col,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  ArrowLeft,
  Users,
  BarChart3,
  CheckCircle,
  Clock,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Trophy,
  Crown,
  Lock,
} from "lucide-react";
import {
  TrophyOutlined,
  TeamOutlined,
  CrownOutlined,
} from "@ant-design/icons";
import { toast } from "react-toastify";
import SidebarInstructor from "@/components/Sidebar/SidebarInstructor/SidebarInstructor";
import { useAppDispatch, useAppSelector } from "@/services/store/store";
import { fetchClassScores } from "@/services/features/classScore/classScoreSlice";
import {
  fetchGradeDistributionsByClass,
  DistributionStatus,
  GradeDistribution,
  setClassDistribution,
} from "@/services/features/groupGrade/groupGradeSlice";
import { fetchGroupsByClass } from "@/services/features/group/groupSlice";
import type { GroupStudent } from "@/services/features/group/groupSlice";
import { useSocket } from "@/hooks/useSocket";

const { Text, Title } = Typography;

// ─────────────────────────────────────────────────────────────────────────────
// Design Tokens
// ─────────────────────────────────────────────────────────────────────────────
const colors = {
  primary: "#4F46E5",      // Indigo
  primaryLight: "#EEF2FF",
  success: "#059669",      // Emerald
  successLight: "#D1FAE5",
  warning: "#D97706",      // Amber
  warningLight: "#FEF3C7",
  danger: "#DC2626",       // Red
  dangerLight: "#FEE2E2",
  info: "#0284C7",         // Sky
  infoLight: "#E0F2FE",
  purple: "#7C3AED",
  purpleLight: "#EDE9FE",
  gray: {
    50: "#F9FAFB",
    100: "#F3F4F6",
    200: "#E5E7EB",
    300: "#D1D5DB",
    400: "#9CA3AF",
    500: "#6B7280",
    600: "#4B5563",
    700: "#374151",
    800: "#1F2937",
    900: "#111827",
  },
};

const scoreColor = (score: number | null): string => {
  if (score === null) return colors.gray[400];
  if (score >= 80) return colors.success;
  if (score >= 60) return colors.warning;
  return colors.danger;
};

const scoreBg = (score: number | null): string => {
  if (score === null) return colors.gray[100];
  if (score >= 80) return colors.successLight;
  if (score >= 60) return colors.warningLight;
  return colors.dangerLight;
};

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
const groupStatusConfig: Record<DistributionStatus, { label: string; color: string; bg: string }> = {
  submitted: { label: "Đã nộp", color: colors.warning, bg: colors.warningLight },
  reopened:  { label: "Đang sửa", color: colors.info, bg: colors.infoLight },
  finalized:  { label: "Đã chốt", color: colors.success, bg: colors.successLight },
};

interface GroupRow {
  groupId: number;
  groupName: string;
  leaderName: string;
  memberCount: number;
  distribution: GradeDistribution | null;
  members: Array<{
    studentId: number;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string | null;
    percentage: number;
    receivedGrade: number;
    isLeader: boolean;
    instructorGrade: number;
    hasDistribution: boolean;
  }>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Components
// ─────────────────────────────────────────────────────────────────────────────

const MemberAvatar: React.FC<{
  firstName: string;
  isLeader: boolean;
  avatar?: string | null;
  size?: number;
}> = ({ firstName, isLeader, avatar, size = 36 }) => (
  <div className="relative">
    <Avatar
      src={avatar || undefined}
      size={size}
      style={{
        background: isLeader
          ? "linear-gradient(135deg, #f59e0b, #d97706)"
          : "linear-gradient(135deg, #6366f1, #4f46e5)",
        fontSize: size * 0.38,
        fontWeight: 700,
        border: isLeader ? `2px solid #f59e0b` : "none",
        boxShadow: isLeader ? "0 0 0 2px rgba(245,158,11,0.2)" : "none",
      }}
    >
      {firstName?.charAt(0).toUpperCase() ?? "?"}
    </Avatar>
    {isLeader && (
      <div
        className="absolute -bottom-1 -right-1 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center border-2 border-white"
        style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }}
      >
        <Crown size={9} color="white" />
      </div>
    )}
  </div>
);

const ProgressRing: React.FC<{
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}> = ({ value, max, size = 56, strokeWidth = 5, color }) => {
  const pct = max > 0 ? (value / max) * 100 : 0;
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  const displayColor = color ?? (pct >= 80 ? colors.success : pct >= 60 ? colors.warning : colors.danger);

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke={colors.gray[100]}
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke={displayColor}
        strokeWidth={strokeWidth}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
    </svg>
  );
};

const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subValue?: string;
  bg: string;
  accentColor?: string;
}> = ({ icon, label, value, subValue, bg }) => (
  <Card
    size="small"
    styles={{
      body: { padding: "16px 20px" },
    }}
    className="border-0 shadow-sm hover:shadow-md transition-shadow duration-200"
  >
    <div className="flex items-center gap-4">
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
        style={{ background: bg }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <Text type="secondary" className="text-xs font-medium uppercase tracking-wide block" style={{ color: colors.gray[500] }}>
          {label}
        </Text>
        <div className="flex items-end gap-2 mt-0.5">
          <Text className="text-2xl font-bold leading-none" style={{ color: colors.gray[800] }}>
            {value}
          </Text>
          {subValue && (
            <Text className="text-xs pb-0.5" style={{ color: colors.gray[400] }}>
              {subValue}
            </Text>
          )}
        </div>
      </div>
    </div>
  </Card>
);

const GroupStatusBadge: React.FC<{ status: DistributionStatus | undefined }> = ({ status }) => {
  if (!status) {
    return (
      <Tag className="rounded-full text-xs px-2.5 py-0.5 font-medium" style={{ background: colors.gray[100], color: colors.gray[400], border: "none" }}>
        Chưa có
      </Tag>
    );
  }
  const cfg = groupStatusConfig[status];
  return (
    <Tag
      className="rounded-full text-xs px-2.5 py-0.5 font-medium border-0"
      style={{ background: cfg.bg, color: cfg.color }}
    >
      {status === "finalized" && <Lock size={9} className="inline mr-1" />}
      {cfg.label}
    </Tag>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Member Table Columns
// ─────────────────────────────────────────────────────────────────────────────
const memberColumns: ColumnsType<GroupRow["members"][0]> = [
  {
    title: "Thành viên",
    key: "member",
    render: (_, record) => (
      <div className="flex items-center gap-3">
        <MemberAvatar
          firstName={record.firstName}
          isLeader={record.isLeader}
          avatar={record.avatar}
          size={36}
        />
        <div>
          <div className="flex items-center gap-2">
            <Text strong className="text-sm" style={{ color: colors.gray[800] }}>
              {record.firstName} {record.lastName}
            </Text>
            {record.isLeader && (
              <Tag color="gold" className="text-xs rounded-full px-2 py-0 m-0 border-0" style={{ background: colors.warningLight, color: colors.warning }}>
                <CrownOutlined /> Leader
              </Tag>
            )}
          </div>
          <Text type="secondary" className="text-xs">{record.email}</Text>
        </div>
      </div>
    ),
  },
  {
    title: "Đóng góp",
    key: "percentage",
    align: "center" as const,
    width: 130,
    render: (_, record) => (
      <div className="flex flex-col items-center gap-1">
        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${record.percentage}%`,
              background: `linear-gradient(90deg, ${colors.primary}, ${colors.purple})`,
            }}
          />
        </div>
        <Text strong className="text-sm" style={{ color: colors.primary }}>
          {record.percentage.toFixed(0)}%
        </Text>
      </div>
    ),
  },
  {
    title: "Điểm nhận",
    key: "receivedGrade",
    align: "center" as const,
    width: 160,
    render: (_, record) => (
      <div className="flex flex-col items-center">
        <div className="relative inline-flex items-center justify-center">
          <ProgressRing
            value={record.receivedGrade}
            max={record.instructorGrade || 10}
            size={52}
            strokeWidth={4}
          />
          <Text strong className="absolute text-sm" style={{ color: scoreColor(record.receivedGrade) }}>
            {record.receivedGrade.toFixed(1)}
          </Text>
        </div>
        <Text type="secondary" className="text-xs mt-1">
          / {record.instructorGrade.toFixed(1)}
        </Text>
      </div>
    ),
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────
const InstructorClassStudentsPage: React.FC = () => {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const parsed = classId ? parseInt(classId, 10) : NaN;
  const numericClassId = Number.isInteger(parsed) && parsed > 0 ? parsed : null;

  const { classScores, loading: loadingByClassId, error: errorByClassId } =
    useAppSelector((state) => state.classScore);
  const { classDistributions } = useAppSelector((state) => state.groupGrade);
  const { groups, loading: groupLoading } = useAppSelector((state) => state.group);
  const { joinGroup, leaveGroup, on } = useSocket();

  const data = numericClassId != null ? classScores[numericClassId] : undefined;
  const scoresLoading = numericClassId != null ? Boolean(loadingByClassId[numericClassId]) : false;
  const scoresError = numericClassId != null ? errorByClassId[numericClassId] ?? null : null;

  useEffect(() => {
    if (numericClassId) {
      dispatch(fetchClassScores(numericClassId));
      void dispatch(fetchGradeDistributionsByClass(numericClassId));
      void dispatch(fetchGroupsByClass(numericClassId));
    }
  }, [dispatch, numericClassId]);

  useEffect(() => {
    if (scoresError) toast.error(scoresError);
  }, [scoresError]);

  useEffect(() => {
    const classGroups = groups.filter(
      (g) => Number(g.classId ?? g.class?.classId) === numericClassId,
    );
    const groupIds = classGroups
      .map((g) => Number(g.groupId ?? g.id))
      .filter((groupId) => Number.isFinite(groupId) && groupId > 0);

    if (groupIds.length === 0) return;

    groupIds.forEach((groupId) => joinGroup(groupId));

    const syncDistribution = (payload: { distribution: GradeDistribution }) => {
      dispatch(setClassDistribution(payload.distribution));
    };

    const unwatchDistributed = on<{ groupId: number; reportId: number; distribution: GradeDistribution }>(
      "grade:distributed",
      syncDistribution,
    );
    const unwatchFinalized = on<{ groupId: number; reportId: number; distribution: GradeDistribution }>(
      "grade:finalized",
      syncDistribution,
    );
    const unwatchReopened = on<{ groupId: number; reportId: number; distribution: GradeDistribution }>(
      "grade:reopened",
      syncDistribution,
    );
    const unwatchFeedbackUpdated = on<{ groupId: number; reportId: number; distribution: GradeDistribution }>(
      "grade:feedback-updated",
      syncDistribution,
    );

    return () => {
      groupIds.forEach((groupId) => leaveGroup(groupId));
      unwatchDistributed?.();
      unwatchFinalized?.();
      unwatchReopened?.();
      unwatchFeedbackUpdated?.();
    };
  }, [groups, numericClassId, joinGroup, leaveGroup, on, dispatch]);

  const overallClassAverage = useMemo(() => {
    if (!data?.students) return null;
    const scores = data.students.map((s) => s.instructorAverageScore).filter((v): v is number => v !== null);
    return scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
  }, [data]);

  const groupRows: GroupRow[] = useMemo(() => {
    const distMap = new Map<number, GradeDistribution[]>();
    for (const d of classDistributions) {
      const arr = distMap.get(d.groupId) ?? [];
      arr.push(d);
      distMap.set(d.groupId, arr);
    }

    const classGroups = groups.filter(
      (g) => Number(g.classId ?? g.class?.classId) === numericClassId,
    );

    const rows: GroupRow[] = [];

    for (const group of classGroups) {
      const groupId = Number(group.groupId ?? group.id);
      const distributions = distMap.get(groupId) ?? [];
      const dist =
        distributions.find((d) => d.status === "finalized") ??
        distributions[0] ??
        null;

      const leader = (group.students ?? []).find(
        (s: GroupStudent) => s.GroupStudent?.role === "leader",
      );
      const leaderName = leader
        ? `${leader.firstName ?? ""} ${leader.lastName ?? ""}`.trim()
        : "—";

      const distributionMembers = new Map(
        (dist?.members ?? []).map((member) => [String(member.studentId), member]),
      );

      const members = (group.students ?? []).map((student: GroupStudent) => {
        const studentId = Number(student.userId ?? student.id ?? 0);
        const distributionMember = distributionMembers.get(String(studentId));

        return {
          studentId,
          firstName: student.firstName ?? "",
          lastName: student.lastName ?? "",
          email: student.email ?? student.username ?? "",
          avatar: student.avatar ?? null,
          percentage: distributionMember?.percentage ?? 0,
          receivedGrade: distributionMember?.receivedGrade ?? 0,
          isLeader:
            student.GroupStudent?.role === "leader" ||
            studentId === dist?.leaderStudentId,
          instructorGrade: dist?.instructorGrade ?? 0,
          hasDistribution: Boolean(distributionMember),
        };
      });

      rows.push({
        groupId,
        groupName: (group.groupName ?? group.name ?? `Nhóm #${groupId}`) as string,
        leaderName,
        memberCount: group.students?.length ?? members.length,
        distribution: dist,
        members,
      });
    }

    return rows;
  }, [classDistributions, groups, numericClassId]);

  const [expandedGroup, setExpandedGroup] = useState<number | null>(null);

  if (numericClassId == null) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: colors.gray[50] }}>
        <Card className="text-center max-w-sm mx-auto">
          <Empty description="Mã lớp không hợp lệ" />
          <Button type="primary" className="mt-4" onClick={() => navigate("/instructor/students")}>
            Quay lại danh sách lớp
          </Button>
        </Card>
      </div>
    );
  }

  if (scoresLoading && !data) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: colors.gray[50] }}>
        <div className="text-center">
          <Spin size="large" />
          <Text type="secondary" className="block mt-4">Đang tải dữ liệu lớp học...</Text>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: colors.gray[50] }}>
        <Card className="text-center max-w-md mx-auto">
          <Empty description={scoresError || "Không tìm thấy dữ liệu lớp học"} />
          <Space className="mt-4">
            <Button onClick={() => dispatch(fetchClassScores(numericClassId!))}>Thử lại</Button>
            <Button type="primary" onClick={() => navigate("/instructor/students")}>Quay lại danh sách lớp</Button>
          </Space>
        </Card>
      </div>
    );
  }

  const gradedCount = groupRows
    .flatMap((r) => r.members)
    .filter((m) => m.hasDistribution)
    .length;
  const totalMembers = data.totalStudents;
  const finalizedCount = groupRows.filter((r) => r.distribution?.status === "finalized").length;
  const pendingCount = groupRows.filter((r) => r.distribution && r.distribution.status !== "finalized").length;

  const groupColumns: ColumnsType<GroupRow> = [
    {
      title: "",
      key: "index",
      width: 40,
      render: (_, __, idx) => (
        <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center">
          <Text type="secondary" className="text-xs font-bold">{idx + 1}</Text>
        </div>
      ),
    },
    {
      title: "Nhóm",
      key: "group",
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: colors.primaryLight }}
          >
            <Trophy size={18} color={colors.primary} />
          </div>
          <div>
            <Text strong className="text-sm block" style={{ color: colors.gray[800] }}>
              {record.groupName}
            </Text>
            <Space size={3} className="mt-0.5">
              <CrownOutlined style={{ color: colors.warning, fontSize: 10 }} />
              <Text type="secondary" className="text-xs">{record.leaderName}</Text>
            </Space>
          </div>
        </div>
      ),
    },
    {
      title: "Thành viên",
      key: "memberCount",
      align: "center" as const,
      width: 100,
      render: (_, record) => (
        <Badge
          count={record.memberCount}
          showZero
          color={colors.primary}
          className="font-semibold"
        >
          <div className="w-8" />
        </Badge>
      ),
    },
    {
      title: "Điểm gốc",
      key: "instructorGrade",
      align: "center" as const,
      width: 110,
      render: (_, record) =>
        record.distribution ? (
          <div className="flex flex-col items-center">
            <Text strong className="text-base" style={{ color: colors.info }}>
              {record.distribution.instructorGrade.toFixed(1)}
            </Text>
            <Text type="secondary" className="text-xs">/ 10</Text>
          </div>
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
    {
      title: "Trạng thái",
      key: "status",
      align: "center" as const,
      width: 130,
      render: (_, record) => <GroupStatusBadge status={record.distribution?.status} />,
    },
    {
      title: "Tiến độ chốt",
      key: "progress",
      align: "center" as const,
      width: 140,
      render: (_, record) => {
        const pct = record.distribution?.status === "finalized" ? 100 : 0;
        return (
          <Progress
            percent={pct}
            size="small"
            showInfo={false}
            strokeColor={colors.success}
            trailColor={colors.gray[100]}
            style={{ width: 100, height: 6 }}
          />
        );
      },
    },
    {
      title: "",
      key: "expand",
      width: 44,
      render: (_, record) => (
        <Button
          type="text"
          size="small"
          shape="circle"
          className="flex items-center justify-center"
          icon={
            expandedGroup === record.groupId ? (
              <ChevronUp size={16} style={{ color: colors.primary }} />
            ) : (
              <ChevronDown size={16} style={{ color: colors.gray[400] }} />
            )
          }
          onClick={() =>
            setExpandedGroup(expandedGroup === record.groupId ? null : record.groupId)
          }
        />
      ),
    },
  ];

  return (
    <div className="flex min-h-screen" style={{ background: colors.gray[50] }}>
      <SidebarInstructor activeItem="students" />
      <main className="flex-1 overflow-y-auto">
        {/* ── Page Header ─────────────────────────────────────────────── */}
        <div
          className="border-b"
          style={{ background: "white", borderColor: colors.gray[100] }}
        >
          <div className="max-w-7xl mx-auto px-6 sm:px-8 py-6">
            {/* Breadcrumb row */}
            <div className="flex items-center justify-between mb-5">
              <Space>
                <Button
                  type="link"
                  icon={<ArrowLeft size={16} />}
                  onClick={() => navigate("/instructor/students")}
                  className="!px-0 !text-sky-700 hover:!text-sky-800"
                >
                  Quay lại danh sách lớp
                </Button>
              </Space>
              <Button
                icon={<RefreshCw size={14} />}
                onClick={() => {
                  dispatch(fetchClassScores(numericClassId!));
                  void dispatch(fetchGradeDistributionsByClass(numericClassId!));
                  void dispatch(fetchGroupsByClass(numericClassId!));
                }}
                loading={scoresLoading || groupLoading}
                className="rounded-xl"
              >
                Làm mới
              </Button>
            </div>

            {/* Class info */}
            <div className="flex items-start justify-between gap-6">
              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: colors.primaryLight }}
                >
                  <Users size={24} style={{ color: colors.primary }} />
                </div>
                <div>
                  <Title level={3} className="m-0 mb-1" style={{ color: colors.gray[800] }}>
                    {data.class.classCode}
                  </Title>
                  <Space size={4} className="flex-wrap">
                    <Tag color="blue" className="rounded-full text-xs m-0 border-0" style={{ background: colors.infoLight, color: colors.info }}>
                      <Users size={10} className="inline mr-1" />
                      {data.totalStudents} sinh viên
                    </Tag>
                    <Tag color="purple" className="rounded-full text-xs m-0 border-0" style={{ background: colors.purpleLight, color: colors.purple }}>
                      <TeamOutlined className="inline mr-1" />
                      {groupRows.length} nhóm
                    </Tag>
                  </Space>
                </div>
              </div>

              {/* Overall score ring */}
              {overallClassAverage !== null && (
                <div className="hidden lg:flex flex-col items-center">
                  <div className="relative inline-flex items-center justify-center">
                    <ProgressRing
                      value={overallClassAverage}
                      max={10}
                      size={80}
                      strokeWidth={6}
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <Text strong className="text-lg leading-none" style={{ color: scoreColor(overallClassAverage) }}>
                        {overallClassAverage.toFixed(1)}
                      </Text>
                    </div>
                  </div>
                  <Text type="secondary" className="text-xs mt-1">Điểm TB lớp</Text>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Content ───────────────────────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-6 sm:px-8 py-6 space-y-6">

          {/* Stats Grid */}
          <Row gutter={[16, 16]}>
            <Col xs={12} sm={12} md={6}>
              <StatCard
                icon={<Users size={20} style={{ color: colors.primary }} />}
                label="Tổng thành viên"
                value={totalMembers}
                subValue={`/ ${groupRows.length} nhóm`}
                bg={colors.primaryLight}
              />
            </Col>
            <Col xs={12} sm={12} md={6}>
              <StatCard
                icon={<CheckCircle size={20} style={{ color: colors.success }} />}
                label="Đã chấm điểm"
                value={gradedCount}
                subValue={`/ ${totalMembers} thành viên`}
                bg={colors.successLight}
              />
            </Col>
            <Col xs={12} sm={12} md={6}>
              <StatCard
                icon={<Clock size={20} style={{ color: colors.warning }} />}
                label="Nhóm đã chốt"
                value={finalizedCount}
                subValue={`/ ${groupRows.length} nhóm`}
                bg={colors.warningLight}
              />
            </Col>
            <Col xs={12} sm={12} md={6}>
              <StatCard
                icon={<BarChart3 size={20} style={{ color: colors.purple }} />}
                label="Điểm TB lớp"
                value={overallClassAverage !== null ? overallClassAverage.toFixed(1) : "—"}
                subValue={overallClassAverage !== null ? "/ 10" : undefined}
                bg={scoreBg(overallClassAverage)}
              />
            </Col>
          </Row>

          {/* Group Progress Summary */}
          <Card
            size="small"
            styles={{ body: { padding: "16px 20px" } }}
            className="border-0 shadow-sm"
          >
            <div className="flex flex-wrap items-center gap-4">
              <Space size={12}>
                <Trophy size={18} style={{ color: colors.warning }} />
                <Text strong className="text-sm" style={{ color: colors.gray[700] }}>
                  Tiến độ chốt điểm nhóm
                </Text>
              </Space>
              <div className="flex items-center gap-3 ml-auto">
                <Badge status="success" text={<Text type="secondary" className="text-xs">{finalizedCount} đã chốt</Text>} />
                <Badge status="warning" text={<Text type="secondary" className="text-xs">{pendingCount} chờ chốt</Text>} />
                <Badge status="default" text={<Text type="secondary" className="text-xs">{groupRows.length - finalizedCount - pendingCount} chưa có</Text>} />
              </div>
            </div>
          </Card>

          {/* ── Group Table ──────────────────────────────────────────── */}
          <Card
            className="border-0 shadow-sm"
            styles={{ body: { padding: 0 } }}
          >
            {/* Table header */}
            <div
              className="px-6 py-4 border-b flex items-center justify-between"
              style={{ borderColor: colors.gray[100] }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: colors.warningLight }}
                >
                  <TrophyOutlined style={{ color: colors.warning, fontSize: 16 }} />
                </div>
                <div>
                  <Text strong className="text-base" style={{ color: colors.gray[800] }}>
                    Điểm nhóm
                  </Text>
                  <Text type="secondary" className="text-xs block">
                    Click dòng để xem thành viên và điểm chốt
                  </Text>
                </div>
              </div>
              <Tag
                className="rounded-full text-xs font-medium border-0"
                style={{ background: colors.gray[100], color: colors.gray[600] }}
              >
                {groupRows.length} nhóm
              </Tag>
            </div>

            <Table
              columns={groupColumns}
              dataSource={groupRows}
              rowKey="groupId"
              loading={groupLoading || scoresLoading}
              pagination={false}
              size="middle"
              rowClassName={() => "cursor-pointer hover:bg-indigo-50/30 transition-colors duration-150"}
              locale={{
                emptyText: (
                  <div className="py-16 text-center">
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                      style={{ background: colors.gray[100] }}
                    >
                      <TeamOutlined style={{ fontSize: 28, color: colors.gray[300] }} />
                    </div>
                    <Text type="secondary">Chưa có nhóm nào trong lớp này</Text>
                  </div>
                ),
              }}
              expandable={{
                expandedRowKeys: expandedGroup !== null ? [expandedGroup] : [],
                onExpand: (expanded, record) => {
                  setExpandedGroup(expanded ? record.groupId : null);
                },
                expandedRowRender: (record) => (
                  <div
                    className="mx-4 my-2 rounded-2xl overflow-hidden"
                    style={{ background: colors.gray[50], border: `1px solid ${colors.gray[100]}` }}
                  >
                    {/* Group member header */}
                    <div
                      className="px-5 py-3 flex items-center justify-between"
                      style={{ background: colors.primaryLight }}
                    >
                      <Space>
                        <MemberAvatar
                          firstName={record.members[0]?.firstName ?? "?"}
                          avatar={record.members[0]?.avatar ?? null}
                          isLeader={false}
                          size={28}
                        />
                        <div>
                          <Text strong className="text-sm" style={{ color: colors.primary }}>
                            Thành viên nhóm — {record.groupName}
                          </Text>
                          <Text type="secondary" className="text-xs block ml-1">
                            {record.memberCount} thành viên
                          </Text>
                        </div>
                      </Space>
                      {record.distribution && (
                        <Tag
                          color="gold"
                          className="rounded-full text-xs font-medium border-0"
                          style={{ background: colors.warningLight, color: colors.warning }}
                        >
                          <Trophy size={10} className="inline mr-1" />
                          Điểm gốc: {record.distribution.instructorGrade.toFixed(2)} / 10
                        </Tag>
                      )}
                    </div>

                    {/* Members table */}
                    <Table
                      columns={memberColumns}
                      dataSource={record.members}
                      rowKey="studentId"
                      pagination={false}
                      size="small"
                      className="border-0"
                      rowClassName={() => "hover:bg-white transition-colors duration-100"}
                    />
                  </div>
                ),
              }}
            />
          </Card>
        </div>
      </main>
    </div>
  );
};

export default InstructorClassStudentsPage;
