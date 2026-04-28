import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getErrorMessage, toast } from "@/lib/toast";
import {
  Card,
  Row,
  Col,
  Input,
  Button,
  Tag,
  Typography,
  Space,
  Skeleton,
  ConfigProvider,
  Segmented,
  Flex,
} from "antd";
import type { SegmentedProps } from "antd";
import {
  SearchOutlined,
  CalendarOutlined,
  FieldTimeOutlined,
  RightOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  ExclamationCircleOutlined,
  FileDoneOutlined,
} from "@ant-design/icons";
import {
  fetchPresentations,
  clearError,
} from "@/services/features/presentation/presentationSlice";
import StudentLayout from "@/components/StudentLayout/StudentLayout";
import { useAppDispatch, useAppSelector } from "@/services/store/store";

const { Title, Text } = Typography;

const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; color: string; icon: React.ReactNode }
> = {
  draft: {
    label: "Nháp",
    bg: "bg-slate-100",
    color: "text-slate-500",
    icon: <FileTextOutlined />,
  },
  submitted: {
    label: "Đã nộp",
    bg: "bg-blue-100",
    color: "text-blue-500",
    icon: <FileDoneOutlined />,
  },
  processing: {
    label: "Đang xử lý",
    bg: "bg-amber-100",
    color: "text-amber-500",
    icon: <SyncOutlined />,
  },
  done: {
    label: "Hoàn thành",
    bg: "bg-emerald-100",
    color: "text-emerald-500",
    icon: <CheckCircleOutlined />,
  },
  failed: {
    label: "Thất bại",
    bg: "bg-red-100",
    color: "text-red-500",
    icon: <ExclamationCircleOutlined />,
  },
};

const MyPresentationsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { presentations, loading, error } = useAppSelector(
    (state) => state.presentation,
  );
  const { user } = useAppSelector((state) => state.auth);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const fullName = user
    ? `${user.firstName} ${user.lastName}`.trim()
    : "Student";

  useEffect(() => {
    dispatch(fetchPresentations());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(getErrorMessage(error));
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const formatDate = (iso?: string | null) => {
    if (!iso) return "Chưa nộp";
    return new Date(iso).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatDuration = (seconds: number | null | undefined) => {
    if (!seconds || seconds <= 0) return "—";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins === 0
      ? `${secs} giây`
      : secs === 0
        ? `${mins} phút`
        : `${mins} phút ${secs} giây`;
  };

  const filtered = presentations.filter((p) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !search ||
      p.title.toLowerCase().includes(q) ||
      (p.topic?.topicName || "").toLowerCase().includes(q) ||
      (p.class?.classCode || "").toLowerCase().includes(q);
    const matchesStatus = filterStatus === "all" || p.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const allStatuses = [...new Set(presentations.map((p) => p.status))];
  const countByStatus = (s: string) =>
    presentations.filter((p) => p.status === s).length;

  const segmentedOptions: SegmentedProps["options"] = [
    { label: `Tất cả (${presentations.length})`, value: "all" },
    ...allStatuses.map((s) => ({
      label: `${STATUS_CONFIG[s]?.label ?? s} (${countByStatus(s)})`,
      value: s,
    })),
  ];

  const doneCount = presentations.filter((p) => p.status === "done").length;
  const processingCount = presentations.filter(
    (p) => p.status === "processing",
  ).length;
  const submittedCount = presentations.filter(
    (p) => p.status === "submitted",
  ).length;

  return (
    <StudentLayout>
      <ConfigProvider
        theme={{
          token: {
            borderRadiusLG: 20,
            borderRadius: 14,
            borderRadiusSM: 10,
            colorBgContainer: "#ffffff",
          },
          components: {
            Card: { borderRadiusLG: 26, paddingLG: 20 },
            Segmented: {
              borderRadius: 999,
              trackPadding: 4,
              itemSelectedBg: "#1677ff",
              itemSelectedColor: "#ffffff",
            },
            Input: { borderRadius: 14 },
          },
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          {/* Header */}
          <div
            className="rounded-2xl px-6 py-5 sm:px-8 sm:py-6"
            style={{
              background:
                "linear-gradient(135deg, #eff6ff 0%, #eef2ff 50%, #f5f3ff 100%)",
              border: "1px solid #e0e7ff",
            }}
          >
            <Title
              level={2}
              className="!mb-1 !text-slate-800 !text-2xl sm:!text-3xl !font-bold"
            >
              Bài thuyết trình của tôi
            </Title>
            <Text className="text-sm sm:text-base text-indigo-500/80">
              Tất cả bài thuyết trình của{" "}
              <span className="font-semibold text-indigo-600">{fullName}</span>
            </Text>
          </div>

          {/* Stats + Filter + List */}
          <div
            className="rounded-2xl bg-white p-5 sm:p-6 shadow-sm space-y-5"
            style={{ border: "1px solid #f1f5f9" }}
          >
            {/* Stats */}
            {!loading && presentations.length > 0 && (
              <Row gutter={[10, 10]}>
                {[
                  {
                    label: "Tổng cộng",
                    value: presentations.length,
                    icon: (
                      <FileTextOutlined className="text-base text-blue-500" />
                    ),
                    bg: "bg-blue-50",
                    text: "text-slate-800",
                  },
                  {
                    label: "Hoàn thành",
                    value: doneCount,
                    icon: (
                      <CheckCircleOutlined className="text-base text-emerald-500" />
                    ),
                    bg: "bg-emerald-50",
                    text: "text-emerald-600",
                  },
                  {
                    label: "Đang xử lý",
                    value: processingCount,
                    icon: <SyncOutlined className="text-base text-amber-500" />,
                    bg: "bg-amber-50",
                    text: "text-amber-500",
                  },
                  {
                    label: "Đã nộp",
                    value: submittedCount,
                    icon: (
                      <FileDoneOutlined className="text-base text-blue-500" />
                    ),
                    bg: "bg-blue-50",
                    text: "text-blue-500",
                  },
                ].map((s) => (
                  <Col xs={12} sm={6} key={s.label}>
                    <div
                      className="flex items-center gap-3 rounded-xl px-4 py-3"
                      style={{
                        border: "1px solid #e8efff",
                        background: "#f8faff",
                      }}
                    >
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${s.bg}`}
                      >
                        {s.icon}
                      </div>
                      <div>
                        <Text type="secondary" className="!text-[11px] !block">
                          {s.label}
                        </Text>
                        <span className={`text-xl font-bold ${s.text}`}>
                          {s.value}
                        </span>
                      </div>
                    </div>
                  </Col>
                ))}
              </Row>
            )}

            {/* Search + Filter */}
            <div
              className="rounded-xl px-4 py-3"
              style={{ border: "1px solid #e8efff", background: "#f8faff" }}
            >
              <Flex gap={12} wrap align="center">
                <Input
                  size="large"
                  variant="filled"
                  prefix={<SearchOutlined className="text-slate-400" />}
                  placeholder="Tìm theo tên, chủ đề, lớp..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  allowClear
                  className="!rounded-xl sm:!w-72"
                />
                <Segmented
                  shape="round"
                  size="large"
                  value={filterStatus}
                  onChange={(val) => setFilterStatus(val as string)}
                  options={segmentedOptions}
                  className="max-w-full overflow-x-auto [&_.ant-segmented-item-label]:!px-2.5 sm:!px-3.5"
                />
              </Flex>
            </div>

            {/* Loading */}
            {loading && (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <Card
                    key={i}
                    bordered={false}
                    className="!rounded-2xl !shadow-sm"
                    styles={{ body: { padding: "16px 20px" } }}
                  >
                    <Skeleton
                      active
                      avatar={{ shape: "square", size: 44 }}
                      paragraph={{ rows: 1 }}
                    />
                  </Card>
                ))}
              </div>
            )}

            {/* Empty */}
            {!loading && filtered.length === 0 && (
              <Card
                bordered={false}
                className="!rounded-2xl !shadow-sm"
                styles={{ body: { padding: "48px 24px", textAlign: "center" } }}
              >
                <Space direction="vertical" size="middle" align="center">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-blue-50">
                    <FileTextOutlined className="text-2xl text-blue-300" />
                  </div>
                  <Title level={4} className="!mb-0 !text-slate-700">
                    {search || filterStatus !== "all"
                      ? "Không tìm thấy bài nào"
                      : "Chưa có bài thuyết trình"}
                  </Title>
                  <Text type="secondary" className="text-sm max-w-xs">
                    {search || filterStatus !== "all"
                      ? "Thử thay đổi từ khóa hoặc bộ lọc trạng thái."
                      : "Vào lớp học và nộp bài để bắt đầu thuyết trình."}
                  </Text>
                  {search || filterStatus !== "all" ? (
                    <Button
                      onClick={() => {
                        setSearch("");
                        setFilterStatus("all");
                      }}
                      className="!rounded-xl !px-5 !h-10"
                    >
                      Xóa bộ lọc
                    </Button>
                  ) : (
                    <Button
                      type="primary"
                      onClick={() => navigate("/student/dashboard")}
                      className="!rounded-xl !px-5 !h-10 !font-semibold"
                    >
                      Quay lại trang chủ
                    </Button>
                  )}
                </Space>
              </Card>
            )}

            {/* List */}
            {!loading && filtered.length > 0 && (
              <div className="space-y-2.5">
                {filtered.map((p) => {
                  const sc = STATUS_CONFIG[p.status] || STATUS_CONFIG["draft"];
                  const isGroupPresentation = p.studentId !== user?.userId;
                  const ownerName = p.student
                    ? `${p.student.firstName} ${p.student.lastName}`.trim()
                    : "Trưởng nhóm";
                  return (
                    <div
                      key={p.presentationId}
                      onClick={() =>
                        navigate(`/student/presentation/${p.presentationId}`)
                      }
                      className="flex items-center gap-4 rounded-xl px-4 py-3.5 cursor-pointer transition-all hover:shadow-sm hover:bg-slate-50/80"
                      style={{
                        border: isGroupPresentation
                          ? "1px solid #dbeafe"
                          : "1px solid #e8efff",
                        background: isGroupPresentation ? "#f0f7ff" : "#f8faff",
                      }}
                    >
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${sc.bg}`}
                      >
                        <span className={`text-lg ${sc.color}`}>
                          {p.status === "processing" ? (
                            <SyncOutlined spin />
                          ) : (
                            sc.icon
                          )}
                        </span>
                      </div>

                      <Flex vertical className="min-w-0 flex-1" gap={6}>
                        <Flex
                          align="center"
                          justify="space-between"
                          gap={12}
                          className="w-full min-w-0"
                        >
                          <Text
                            strong
                            className="!text-slate-900 !text-sm sm:!text-base !min-w-0 !flex-1 !truncate"
                          >
                            {p.title}
                          </Text>
                          <Flex gap={6} align="center" className="shrink-0">
                            {isGroupPresentation && (
                              <Tag
                                color="blue"
                                className="!m-0 !rounded-full !text-xs !border-0 !px-2 !py-0.5 !leading-5"
                              >
                                Nhóm
                              </Tag>
                            )}
                            <Tag
                              className={`!m-0 !rounded-full !text-xs !font-medium !border-0 !px-2.5 !py-0.5 !leading-5 !whitespace-nowrap ${sc.bg} ${sc.color}`}
                              icon={
                                p.status === "processing" ? (
                                  <SyncOutlined className="!text-[10px]" spin />
                                ) : null
                              }
                            >
                              {sc.label}
                            </Tag>
                          </Flex>
                        </Flex>
                        <Flex gap={12} wrap align="center">
                          {isGroupPresentation && (
                            <>
                              <Text className="!text-xs !text-blue-500 !font-medium">
                                👑 {ownerName}
                              </Text>
                              <span className="text-slate-300 text-xs">·</span>
                            </>
                          )}
                          <Text
                            type="secondary"
                            className="!text-xs sm:!text-sm"
                          >
                            {p.topic?.topicName || "Không có chủ đề"}
                          </Text>
                          {p.class?.classCode && (
                            <>
                              <span className="text-slate-300 text-xs">·</span>
                              <Text
                                type="secondary"
                                className="!text-xs sm:!text-sm"
                              >
                                {p.class.classCode}
                              </Text>
                            </>
                          )}
                          <span className="text-slate-300 text-xs">·</span>
                          <Flex align="center" gap={4}>
                            <CalendarOutlined className="!text-[10px] text-slate-400" />
                            <Text
                              type="secondary"
                              className="!text-xs sm:!text-sm"
                            >
                              {formatDate(p.submissionDate ?? p.createdAt)}
                            </Text>
                          </Flex>
                          {p.durationSeconds && (
                            <>
                              <span className="text-slate-300 text-xs">·</span>
                              <Flex align="center" gap={4}>
                                <FieldTimeOutlined className="!text-[10px] text-slate-400" />
                                <Text
                                  type="secondary"
                                  className="!text-xs sm:!text-sm"
                                >
                                  {formatDuration(p.durationSeconds)}
                                </Text>
                              </Flex>
                            </>
                          )}
                        </Flex>
                      </Flex>

                      <RightOutlined className="text-slate-300 text-sm shrink-0 hover:text-blue-500 transition-colors" />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          {/* end white card */}
        </div>
      </ConfigProvider>
    </StudentLayout>
  );
};

export default MyPresentationsPage;
