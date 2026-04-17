import React, { useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Card,
  Button,
  Tag,
  Typography,
  Spin,
  Table,
  Empty,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  ArrowLeftOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  BookOutlined,
  UserOutlined,
  TeamOutlined,
  RightOutlined,
} from "@ant-design/icons";
import { useAppDispatch, useAppSelector } from "@/services/store/store";
import { fetchTopicDetail } from "@/services/features/topic/topicSlice";
import { fetchPresentationsByClassAndTopic } from "@/services/features/presentation/presentationSlice";
import SidebarInstructor from "@/components/Sidebar/SidebarInstructor/SidebarInstructor";

const { Text, Title } = Typography;

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  draft: { color: "default", label: "Bản nháp" },
  submitted: { color: "blue", label: "Đã nộp" },
  processing: { color: "orange", label: "Đang xử lý" },
  analyzed: { color: "cyan", label: "Đã phân tích" },
  done: { color: "green", label: "Hoàn tất" },
  failed: { color: "red", label: "Thất bại" },
};

const formatDate = (dateStr?: string | null) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDuration = (seconds?: number | null) => {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyPresentation = any;

const IntructorTopicDetailPage: React.FC = () => {
  const { topicId, classId } = useParams<{ topicId: string; classId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const {
    selectedTopic: topic,
    loading: topicLoading,
    error: topicError,
  } = useAppSelector((state) => state.topic);
  const { presentations, loading: presentationLoading } = useAppSelector(
    (state) => state.presentation,
  );

  const topicIdNumber = topicId ? parseInt(topicId, 10) : null;
  const classIdNumber = classId ? parseInt(classId, 10) : null;

  useEffect(() => {
    if (!topicIdNumber) return;
    dispatch(fetchTopicDetail(topicIdNumber));
    if (classIdNumber) {
      dispatch(
        fetchPresentationsByClassAndTopic({
          classId: classIdNumber,
          topicId: topicIdNumber,
        }),
      );
    }
  }, [topicIdNumber, classIdNumber, dispatch]);

  const isPageLoading = topicLoading || presentationLoading;

  const mergedPresentations = useMemo(() => {
    if (presentations.length > 0) return presentations;
    return topic?.presentations || [];
  }, [presentations, topic?.presentations]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      submitted: 0,
      processing: 0,
      done: 0,
      failed: 0,
      draft: 0,
    };
    mergedPresentations.forEach((p: AnyPresentation) => {
      const key = p.status?.toLowerCase() || "draft";
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [mergedPresentations]);

  const columns: ColumnsType<AnyPresentation> = [
    {
      title: "#",
      width: 52,
      render: (_: unknown, __: unknown, index: number) => (
        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-xs font-bold text-indigo-500">
          {String(index + 1).padStart(2, "0")}
        </div>
      ),
    },
    {
      title: "Sinh viên",
      render: (_: unknown, record: AnyPresentation) => (
        <div>
          <Text strong className="text-slate-800 block text-sm">
            {record.student
              ? `${record.student.firstName} ${record.student.lastName}`
              : `Sinh viên #${record.studentId}`}
          </Text>
          {record.student?.email && (
            <Text type="secondary" style={{ fontSize: 11 }}>
              {record.student.email}
            </Text>
          )}
        </div>
      ),
    },
    {
      title: "Nhóm",
      dataIndex: "groupCode",
      width: 120,
      render: (groupCode: string | null) =>
        groupCode ? (
          <Tag
            icon={<TeamOutlined />}
            color="purple"
            style={{ borderRadius: 20 }}
          >
            {groupCode}
          </Tag>
        ) : (
          <Text type="secondary" style={{ fontSize: 12 }}>
            —
          </Text>
        ),
    },
    {
      title: "Tiêu đề",
      dataIndex: "title",
      render: (title: string) => (
        <Text className="text-slate-700 text-sm">{title || "—"}</Text>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      width: 120,
      render: (status: string) => {
        const sc = STATUS_CONFIG[status?.toLowerCase()] || STATUS_CONFIG.draft;
        return (
          <Tag
            color={sc.color}
            style={{ borderRadius: 20, margin: 0, fontWeight: 500 }}
          >
            {sc.label}
          </Tag>
        );
      },
    },
    {
      title: "Ngày nộp",
      dataIndex: "submissionDate",
      width: 155,
      render: (date: string | null) => (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {formatDate(date)}
        </Text>
      ),
    },
    {
      title: "Thời lượng",
      dataIndex: "durationSeconds",
      width: 90,
      align: "center" as const,
      render: (d: number | null) => (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {formatDuration(d)}
        </Text>
      ),
    },
    {
      title: "",
      width: 48,
      render: (_: unknown, record: AnyPresentation) => (
        <Link
          to={`/intructor/presentation/${record.presentationId}`}
          state={{ presentation: record }}
        >
          <Button
            type="text"
            icon={<RightOutlined style={{ color: "#94a3b8" }} />}
            size="small"
          />
        </Link>
      ),
    },
  ];

  if (isPageLoading && !topic) {
    return (
      <div className="flex h-screen bg-slate-50">
        <SidebarInstructor activeItem="manage-classes" />
        <main className="flex-1 flex items-center justify-center">
          <Spin size="large" />
        </main>
      </div>
    );
  }

  if (topicError || !topic) {
    return (
      <div className="flex h-screen bg-slate-50">
        <SidebarInstructor activeItem="manage-classes" />
        <main className="flex-1 overflow-y-auto p-8">
          <Button
            type="link"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(-1)}
            style={{ paddingLeft: 0, marginBottom: 24, fontWeight: 600 }}
          >
            Quay lại
          </Button>
          <Card>
            <Text type="danger">{topicError || "Không tìm thấy chủ đề"}</Text>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <SidebarInstructor activeItem="manage-classes" />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-[1280px] mx-auto px-6 py-6 space-y-6">

          {/* Back button */}
          <Button
            type="link"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(-1)}
            style={{ paddingLeft: 0, fontWeight: 600, color: "#0369a1" }}
          >
            Quay lại lớp học
          </Button>

          {/* ── Hero banner ─────────────────────────────── */}
          <section
            className="relative overflow-hidden rounded-3xl shadow-lg text-white"
            style={{
              background:
                "linear-gradient(135deg, #6366f1 0%, #8b5cf6 55%, #7c3aed 100%)",
            }}
          >
            <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/5" />
            <div className="absolute -bottom-12 -left-12 w-44 h-44 rounded-full bg-white/5" />

            <div className="relative px-8 py-7 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              {/* Left: identity */}
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-xl font-black shadow shrink-0">
                  #{topic.sequenceNumber}
                </div>
                <div>
                  <Text
                    style={{ fontSize: 11, letterSpacing: "0.1em" }}
                    className="font-semibold uppercase text-white/50 block"
                  >
                    Chủ đề thuyết trình
                  </Text>
                  <Title
                    level={3}
                    style={{ color: "white", margin: 0, lineHeight: 1.25 }}
                  >
                    {topic.topicName}
                  </Title>
                  {topic.description && (
                    <Text className="text-sm text-white/70 mt-1 block">
                      {topic.description}
                    </Text>
                  )}
                </div>
              </div>

              {/* Right: stat pills */}
              <div className="flex flex-wrap gap-3 shrink-0">
                {[
                  {
                    icon: <CalendarOutlined />,
                    label: "Hạn nộp",
                    value: topic.dueDate ? formatDate(topic.dueDate) : "Không có hạn",
                  },
                  {
                    icon: <ClockCircleOutlined />,
                    label: "Thời lượng",
                    value: topic.maxDurationMinutes
                      ? `${topic.maxDurationMinutes} phút`
                      : "—",
                  },
                  {
                    icon: <FileTextOutlined />,
                    label: "Bài nộp",
                    value: `${mergedPresentations.length} tổng`,
                  },
                ].map(({ icon, label, value }) => (
                  <div
                    key={label}
                    className="rounded-2xl px-4 py-3 backdrop-blur-md"
                    style={{ background: "rgba(255,255,255,0.13)" }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-white/60 text-sm">{icon}</span>
                      <div>
                        <Text
                          style={{ fontSize: 10, letterSpacing: "0.08em" }}
                          className="font-medium text-white/40 uppercase block"
                        >
                          {label}
                        </Text>
                        <Text className="text-xs font-semibold text-white leading-none">
                          {value}
                        </Text>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── Body: 2-column ──────────────────────────── */}
          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_300px] gap-6 items-start">

            {/* LEFT: Stats + Table */}
            <div className="space-y-4">

              {/* Status summary */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[
                  {
                    label: "Tổng",
                    count: mergedPresentations.length,
                    color: "#6366f1",
                    bg: "#eef2ff",
                  },
                  {
                    label: "Đã nộp",
                    count: statusCounts.submitted,
                    color: "#3b82f6",
                    bg: "#eff6ff",
                  },
                  {
                    label: "Đang xử lý",
                    count: statusCounts.processing,
                    color: "#f59e0b",
                    bg: "#fffbeb",
                  },
                  {
                    label: "Hoàn tất",
                    count: statusCounts.done,
                    color: "#10b981",
                    bg: "#ecfdf5",
                  },
                  {
                    label: "Thất bại",
                    count: statusCounts.failed,
                    color: "#ef4444",
                    bg: "#fef2f2",
                  },
                ].map(({ label, count, color }) => (
                  <div
                    key={label}
                    className="rounded-2xl border border-slate-100 bg-white px-4 py-3 text-center shadow-sm"
                    style={{ borderTopColor: color, borderTopWidth: 3 }}
                  >
                    <div
                      className="text-2xl font-black"
                      style={{ color }}
                    >
                      {count}
                    </div>
                    <div className="text-xs text-slate-400 font-medium mt-0.5">
                      {label}
                    </div>
                  </div>
                ))}
              </div>

              {/* Presentations table */}
              <Card
                variant="borderless"
                style={{
                  borderRadius: 16,
                  boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                }}
                styles={{
                  header: {
                    padding: "16px 20px",
                    borderBottom: "1px solid #f1f5f9",
                  },
                  body: { padding: 0 },
                }}
                title={
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center">
                      <FileTextOutlined style={{ color: "#6366f1" }} />
                    </div>
                    <Text strong style={{ fontSize: 15 }}>
                      Bài trình bày
                    </Text>
                    <Tag
                      color="purple"
                      style={{ borderRadius: 20, marginLeft: 4 }}
                    >
                      {mergedPresentations.length}
                    </Tag>
                  </div>
                }
              >
                {presentationLoading ? (
                  <div className="flex justify-center py-14">
                    <Spin size="large" />
                  </div>
                ) : mergedPresentations.length > 0 ? (
                  <Table
                    dataSource={mergedPresentations}
                    columns={columns}
                    rowKey="presentationId"
                    pagination={
                      mergedPresentations.length > 10
                        ? { pageSize: 10, size: "small" }
                        : false
                    }
                    size="middle"
                    rowClassName="hover:bg-slate-50/60"
                    style={{ borderRadius: "0 0 16px 16px" }}
                  />
                ) : (
                  <div className="py-16">
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description={
                        <div className="text-center space-y-1">
                          <Text
                            type="secondary"
                            className="block text-base"
                          >
                            Chưa có bài trình bày
                          </Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            Sinh viên sẽ nộp bài khi gần đến hạn
                          </Text>
                        </div>
                      }
                    />
                  </div>
                )}
              </Card>
            </div>

            {/* RIGHT: Sidebar */}
            <div className="space-y-4 xl:sticky xl:top-6">

              {/* Topic Details */}
              <Card
                variant="borderless"
                style={{
                  borderRadius: 16,
                  boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                }}
                styles={{
                  header: {
                    padding: "14px 20px",
                    borderBottom: "1px solid #f1f5f9",
                  },
                  body: { padding: "16px 20px" },
                }}
                title={
                  <div className="flex items-center gap-2">
                    <ClockCircleOutlined style={{ color: "#8b5cf6" }} />
                    <Text strong>Chi tiết chủ đề</Text>
                  </div>
                }
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Text type="secondary" className="text-sm">
                      Thứ tự
                    </Text>
                    <Tag color="purple" style={{ borderRadius: 20 }}>
                      #{topic.sequenceNumber}
                    </Tag>
                  </div>
                  <div className="flex items-center justify-between">
                    <Text type="secondary" className="text-sm">
                      Hạn nộp
                    </Text>
                    <Text strong className="text-sm text-right max-w-[160px]">
                      {topic.dueDate ? formatDate(topic.dueDate) : "—"}
                    </Text>
                  </div>
                  <div className="flex items-center justify-between">
                    <Text type="secondary" className="text-sm">
                      Thời lượng tối đa
                    </Text>
                    <Text strong className="text-sm">
                      {topic.maxDurationMinutes
                        ? `${topic.maxDurationMinutes} phút`
                        : "—"}
                    </Text>
                  </div>
                </div>
              </Card>

              {/* Requirements */}
              {topic.requirements && (
                <Card
                  variant="borderless"
                  style={{
                    borderRadius: 16,
                    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                  }}
                  styles={{
                    header: {
                      padding: "14px 20px",
                      borderBottom: "1px solid #f1f5f9",
                    },
                    body: { padding: "16px 20px" },
                  }}
                  title={
                    <div className="flex items-center gap-2">
                      <FileTextOutlined style={{ color: "#f59e0b" }} />
                      <Text strong>Yêu cầu</Text>
                    </div>
                  }
                >
                  <pre
                    className="whitespace-pre-wrap text-sm text-slate-600 bg-slate-50 p-3 rounded-xl leading-relaxed border border-slate-100 m-0"
                    style={{
                      fontFamily: "inherit",
                      maxHeight: 220,
                      overflowY: "auto",
                    }}
                  >
                    {topic.requirements}
                  </pre>
                </Card>
              )}

              {/* Course Info */}
              {topic.course && (
                <Card
                  variant="borderless"
                  style={{
                    borderRadius: 16,
                    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                  }}
                  styles={{
                    header: {
                      padding: "14px 20px",
                      borderBottom: "1px solid #f1f5f9",
                    },
                    body: { padding: "16px 20px" },
                  }}
                  title={
                    <div className="flex items-center gap-2">
                      <BookOutlined style={{ color: "#0284c7" }} />
                      <Text strong>Khóa học</Text>
                    </div>
                  }
                >
                  <div className="space-y-3">
                    <div>
                      <Text
                        type="secondary"
                        style={{ fontSize: 11 }}
                        className="uppercase tracking-wider block mb-0.5"
                      >
                        Tên khóa học
                      </Text>
                      <Text strong className="text-slate-800">
                        {topic.course.courseName || "—"}
                      </Text>
                    </div>
                    {topic.course.courseCode && (
                      <div>
                        <Text
                          type="secondary"
                          style={{ fontSize: 11 }}
                          className="uppercase tracking-wider block mb-1"
                        >
                          Mã
                        </Text>
                        <Tag
                          color="blue"
                          style={{ borderRadius: 20 }}
                        >
                          {topic.course.courseCode}
                        </Tag>
                      </div>
                    )}
                    {topic.course.instructor && (
                      <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                        <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center shrink-0">
                          <UserOutlined
                            style={{ fontSize: 13, color: "#0284c7" }}
                          />
                        </div>
                        <div>
                          <Text
                            type="secondary"
                            style={{ fontSize: 11 }}
                            className="block"
                          >
                            Giảng viên
                          </Text>
                          <Text strong className="text-sm text-slate-800">
                            {topic.course.instructor.firstName}{" "}
                            {topic.course.instructor.lastName}
                          </Text>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default IntructorTopicDetailPage;
