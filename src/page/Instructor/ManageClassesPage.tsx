import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import SummaryMetrics, {
  SummaryMetricItem,
} from "@/components/Dashboard/SummaryMetrics";
import {
  Table,
  Card,
  Button,
  Input,
  Select,
  Tag,
  Space,
  Typography,
  App,
  Tooltip,
  Modal,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { EditOutlined, KeyOutlined, CopyOutlined, CheckCircleOutlined } from "@ant-design/icons";
import {
  BookOpen,
  Users,
  Clock,
  RefreshCw,
  Eye,
} from "lucide-react";
import dayjs from "dayjs";
import ClassModal from "@/components/Course/ClassModal";
import EnrollKeyModal from "@/components/Class/EnrollKeyModal";
import { useAppDispatch, useAppSelector } from "@/services/store/store";
import {
  fetchClassesByInstructor,
  updateClass,
  createEnrollKey,
  clearLastCreatedKey,
  fetchActiveKeysByClass,
  ClassData,
} from "@/services/features/admin/classSlice";
import SidebarInstructor from "@/components/Sidebar/SidebarInstructor/SidebarInstructor";

const { Text } = Typography;

const isClassExpired = (endDate: string): boolean => {
  const now = new Date();
  const beijingOffset = 8 * 60;
  const localOffset = now.getTimezoneOffset();
  const diffMinutes = localOffset + beijingOffset;
  const beijingNow = new Date(now.getTime() + diffMinutes * 60 * 1000);
  return new Date(endDate) < beijingNow;
};

const ManageClassesPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { classes: apiClasses, loading, pagination, lastCreatedKey, keysByClass } =
    useAppSelector((state) => state.class);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<
    "all" | "active" | "archived"
  >("all");
  const [classModalOpen, setClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassData | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [keyModalOpen, setKeyModalOpen] = useState(false);
  const [keyTargetClass, setKeyTargetClass] = useState<ClassData | null>(null);
  const [keyResultOpen, setKeyResultOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [keyAlreadyExisted, setKeyAlreadyExisted] = useState(false);
  /** Key được hiển thị trong modal — có thể là key vừa tạo (lastCreatedKey) hoặc key đã tồn tại (từ keysByClass) */
  const [displayKey, setDisplayKey] = useState<string | null>(null);

  /** Click 🔑 — luôn mở EnrollKeyModal.
   *  Modal tự quyết định hiện key hiện có (nếu đã có) hay form tạo mới.
   */
  const handleKeyButtonClick = (record: ClassData) => {
    setKeyTargetClass(record);
    setKeyModalOpen(true);
  };

  const { message: antdMessage } = App.useApp();

  useEffect(() => {
    dispatch(fetchClassesByInstructor({ page: currentPage, limit: pageSize }));
  }, [dispatch, currentPage, pageSize]);

  // After classes load, fetch active key for each class in parallel
  useEffect(() => {
    if (apiClasses.length === 0) return;
    apiClasses.forEach((c) => {
      if (keysByClass[c.classId] === undefined) {
        void dispatch(fetchActiveKeysByClass(c.classId));
      }
    });
  }, [apiClasses, dispatch]); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredCourses = useMemo(() => {
    return apiClasses.filter((course) => {
      const matchesSearch =
        course.classCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.course?.courseCode
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        course.course?.courseName
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase());

      const expired = isClassExpired(course.endDate || "");

      if (selectedFilter === "active") {
        return matchesSearch && course.status === "active" && !expired;
      } else if (selectedFilter === "archived") {
        return matchesSearch && course.status !== "active";
      }

      return matchesSearch && !expired;
    });
  }, [apiClasses, searchQuery, selectedFilter]);

  // Zebra stripe: đổi màu xen kẽ theo hàng + hover effect
  const getRowClassName = (_: any, index: number) => {
    const base = index % 2 === 0 ? "bg-white" : "bg-gray-50";
    return `${base} table-row-clickable hover:bg-blue-50/50 transition-colors duration-150`;
  };

  const totalStudents = filteredCourses.reduce(
    (acc, c) => acc + (c.enrollmentCount ?? 0),
    0,
  );
  const activeCourses = filteredCourses.filter((c) => c.status === "active").length;
  const pendingReviews = 3;

  const summaryItems: SummaryMetricItem[] = [
    {
      key: "students",
      title: "Sinh viên",
      value: totalStudents,
      icon: <Users size={20} />,
      tone: "blue",
      description: "Theo lớp hiển thị",
    },
    {
      key: "active-classes",
      title: "Lớp đang mở",
      value: activeCourses,
      icon: <BookOpen size={20} />,
      tone: "green",
      description: "Trạng thái active",
    },
    {
      key: "pending",
      title: "Chờ xử lý",
      value: pendingReviews,
      icon: <Clock size={20} />,
      tone: "amber",
      deltaLabel: pendingReviews > 0 ? "Cần duyệt" : "Ổn định",
      deltaType: pendingReviews > 0 ? "warning" : "success",
    },
  ];

  const columns: ColumnsType<ClassData> = [
    {
      title: "Class",
      key: "class",
      render: (_, record) => (
        <div>
          <Text strong>{record.classCode}</Text>
          <div className="text-xs text-gray-500">
            {record.course?.courseName || "—"}
            {record.course?.courseCode ? ` — ${record.course.courseCode}` : ""}
          </div>
        </div>
      ),
    },
    {
      title: "Học kỳ",
      key: "semester",
      render: (_, record) => (
        <span>
          {record.course?.semester || "—"} {record.course?.academicYear || ""}
        </span>
      ),
    },
    {
      title: "Sinh viên",
      key: "students",
      render: (_, record) => (
        <Space>
          <Users size={14} />
          <span>
            {record.enrollmentCount ?? 0}/{record.maxStudents}
          </span>
        </Space>
      ),
    },
    {
      title: "Thời gian",
      key: "dates",
      render: (_, record) => (
        <Text type="secondary" className="text-xs">
          {record.startDate} → {record.endDate}
        </Text>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={status === "active" ? "green" : "default"}>
          {status === "active" ? "Đang mở" : "Đã lưu trữ"}
        </Tag>
      ),
    },
    {
      title: "Mã đăng ký",
      key: "enrollKey",
      width: 220,
      render: (_, record) => {
        const keyValue = keysByClass[record.classId];
        // undefined = not fetched yet (loading), null = no key
        if (keyValue === undefined) {
          return <span className="text-gray-300 text-xs">...</span>;
        }
        if (!keyValue) {
          return (
            <Button
              size="small"
              icon={<KeyOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                handleKeyButtonClick(record);
              }}
              style={{ borderRadius: 6, fontSize: 11, color: "#6B7280", borderColor: "#D1D5DB" }}
            >
              Tạo mã
            </Button>
          );
        }
        return (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "linear-gradient(135deg, #EFF6FF 0%, #EEF2FF 100%)",
              border: "1.5px solid #BFDBFE",
              borderRadius: 8,
              padding: "4px 10px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <span
              style={{
                fontFamily: "'Courier New', monospace",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: 1,
                color: "#1D4ED8",
                flex: 1,
                userSelect: "text",
              }}
            >
              {keyValue}
            </span>
            <Tooltip title="Sao chép">
              <Button
                type="text"
                size="small"
                icon={<CopyOutlined style={{ fontSize: 11 }} />}
                style={{ padding: 2, minWidth: 20, height: 20 }}
                onClick={() => {
                  navigator.clipboard.writeText(keyValue);
                  antdMessage.success("Đã sao chép mã!");
                }}
              />
            </Tooltip>
          </div>
        );
      },
    },
    {
      title: "",
      key: "chevron",
      width: 32,
      render: () => (
        <span className="row-chevron text-gray-400 text-lg select-none transition-colors duration-150">›</span>
      ),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 160,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="text"
            icon={<Eye size={14} />}
            onClick={(event) => {
              event.stopPropagation();
              navigate(`/instructor/class/${record.classId}`);
            }}
            title="Xem lớp học"
          />
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={(event) => {
              event.stopPropagation();
              setEditingClass(record);
              setClassModalOpen(true);
            }}
            title="Chỉnh sửa"
          />
          <Tooltip title={keysByClass[record.classId] ? "Xem mã" : "Tạo mã đăng ký"}>
            <Button
              type="text"
              icon={<KeyOutlined />}
              onClick={(event) => {
                event.stopPropagation();
                handleKeyButtonClick(record);
              }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const handleCourseSubmit = async (classData: any) => {
    if (!editingClass) return;
    try {
      await dispatch(
        updateClass({
          classId: editingClass.classId,
          classData,
        }),
      ).unwrap();
      antdMessage.success("Cập nhật lớp học thành công!");
      setClassModalOpen(false);
      setEditingClass(null);
      dispatch(fetchClassesByInstructor({ page: currentPage, limit: pageSize }));
    } catch {
      antdMessage.error("Không thể cập nhật lớp học. Vui lòng thử lại.");
    }
  };

  const handleCreateKey = async (data: { customKey?: string; expiresAt?: dayjs.Dayjs; maxUses?: number }) => {
    if (!keyTargetClass) return;
    try {
      const result = await dispatch(
        createEnrollKey({
          classId: keyTargetClass.classId,
          customKey: data.customKey,
          expiresAt: data.expiresAt ? data.expiresAt.toISOString() : undefined,
          maxUses: data.maxUses,
        }),
      ).unwrap();
      setKeyModalOpen(false);
      setKeyTargetClass(null);
      setDisplayKey(result.keyValue);
      setKeyAlreadyExisted(result.alreadyExists);
      setKeyResultOpen(true);
    } catch (err: any) {
      antdMessage.error(err || "Không thể tạo mã đăng ký. Vui lòng thử lại.");
    }
  };

  const handleCopyKey = () => {
    const key = displayKey ?? lastCreatedKey;
    if (!key) return;
    navigator.clipboard.writeText(key).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarInstructor activeItem="manage-classes" />
      <main className="flex-1 overflow-y-auto p-6 sm:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <Text className="text-xs uppercase tracking-wide text-gray-500 font-semibold">
                Giảng viên
              </Text>
              <h1 className="text-2xl font-bold text-gray-900">Lớp học của tôi</h1>
              <p className="text-sm text-gray-600">
                Quản lý các lớp học đang giảng dạy
              </p>
            </div>
            <Button
              icon={<RefreshCw size={14} />}
              onClick={() =>
                dispatch(fetchClassesByInstructor({ page: currentPage, limit: pageSize }))
              }
              loading={loading}
            >
              Làm mới
            </Button>
          </div>

          {/* Stats Cards */}
          <SummaryMetrics items={summaryItems} columnsClassName="grid grid-cols-1 sm:grid-cols-3 gap-4" />

          {/* Filters & Search */}
          <Card>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
              <div>
                <Text className="text-xs uppercase tracking-wide text-gray-500 font-semibold">
                  Danh mục
                </Text>
                <h2 className="text-lg font-bold text-gray-900">Lớp học</h2>
              </div>
              <Space wrap>
                <Input.Search
                  placeholder="Tìm theo mã lớp, khóa học..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full sm:w-72"
                  allowClear
                />
                <Select
                  value={selectedFilter}
                  onChange={(val) => {
                    setSelectedFilter(val);
                    setCurrentPage(1);
                  }}
                  style={{ width: 140 }}
                  options={[
                    { value: "all", label: "Tất cả lớp" },
                    { value: "active", label: "Đang mở" },
                    { value: "archived", label: "Đã lưu trữ" },
                  ]}
                />
              </Space>
            </div>

            <Tooltip title="Click to view class details" placement="top">
              <Table
                columns={columns}
                dataSource={filteredCourses}
                rowKey="classId"
                loading={loading}
                onRow={(record, index) => ({
                  className: getRowClassName(record, index ?? 0),
                  onClick: () => navigate(`/instructor/class/${record.classId}`),
                  style: { cursor: "pointer" },
                  onMouseEnter: (e) => {
                    // Highlight chevron on hover
                    const chevron = e.currentTarget.querySelector(".row-chevron") as HTMLElement;
                    if (chevron) chevron.classList.add("text-blue-500");
                  },
                  onMouseLeave: (e) => {
                    const chevron = e.currentTarget.querySelector(".row-chevron") as HTMLElement;
                    if (chevron) chevron.classList.remove("text-blue-500");
                  },
                })}
                pagination={
                  pagination && pagination.total > 0
                    ? {
                      current: currentPage,
                      pageSize,
                      total: pagination.total,
                      showSizeChanger: true,
                      pageSizeOptions: ["10", "20", "50"],
                      showTotal: (total, range) =>
                        `${range[0]}-${range[1]} trên ${total} lớp`,
                      onChange: (p, ps) => {
                        setCurrentPage(p);
                        setPageSize(ps);
                      },
                    }
                    : false
                }
                locale={{
                  emptyText: searchQuery
                    ? "Không tìm thấy lớp học phù hợp từ khóa"
                    : "Chưa có lớp học",
                }}
              />
            </Tooltip>
          </Card>
        </div>
      </main>

      <ClassModal
        isOpen={classModalOpen}
        onClose={() => {
          setClassModalOpen(false);
          setEditingClass(null);
        }}
        onSubmit={handleCourseSubmit}
        initialData={editingClass || undefined}
        isLoading={loading}
        courses={[]}
        mode="instructor-edit"
      />

      <EnrollKeyModal
        isOpen={keyModalOpen}
        classData={
          keyTargetClass
            ? {
                classId: keyTargetClass.classId,
                classCode: keyTargetClass.classCode,
                className: keyTargetClass.className || keyTargetClass.classCode,
              }
            : null
        }
        existingKey={keyTargetClass ? (keysByClass[keyTargetClass.classId] ?? null) : null}
        onClose={() => {
          setKeyModalOpen(false);
          setKeyTargetClass(null);
        }}
        onSubmit={handleCreateKey}
        isLoading={loading}
      />

      {/* ── Key Result Modal ───────────────────────────────────────── */}
      <Modal
        open={keyResultOpen}
        onCancel={() => {
          setKeyResultOpen(false);
          dispatch(clearLastCreatedKey());
          setCopied(false);
          setKeyAlreadyExisted(false);
          setDisplayKey(null);
        }}
        footer={
          <Button
            type="primary"
            onClick={() => {
              setKeyResultOpen(false);
              dispatch(clearLastCreatedKey());
              setCopied(false);
              setKeyAlreadyExisted(false);
              setDisplayKey(null);
            }}
            style={{ borderRadius: 8 }}
          >
            Đóng
          </Button>
        }
        width={440}
        styles={{ content: { borderRadius: 16 } }}
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {keyAlreadyExisted ? (
              <KeyOutlined style={{ color: "#D97706", fontSize: 20 }} />
            ) : (
              <CheckCircleOutlined style={{ color: "#059669", fontSize: 20 }} />
            )}
            <span style={{ fontWeight: 700, fontSize: 16 }}>
              {keyAlreadyExisted ? "Mã đăng ký hiện tại" : "Mã tham gia lớp đã tạo"}
            </span>
          </div>
        }
      >
        <div style={{ textAlign: "center", padding: "16px 0" }}>
          <p style={{ color: "#6B7280", marginBottom: 16, fontSize: 14 }}>
            {keyAlreadyExisted
              ? "Lớp học này đã có mã đăng ký đang hoạt động. Chia sẻ mã này cho sinh viên:"
              : "Chia sẻ mã sau cho sinh viên để họ có thể tham gia lớp nhanh:"}
          </p>

          {/* Key display */}
          <div
            style={{
              background: "linear-gradient(135deg, #F0F9FF 0%, #EEF2FF 100%)",
              border: "2px solid #BAE6FD",
              borderRadius: 14,
              padding: "20px 24px",
              marginBottom: 16,
              position: "relative",
            }}
          >
            <Typography.Text
              style={{
                fontFamily: "'Courier New', monospace",
                fontSize: 26,
                fontWeight: 800,
                letterSpacing: 3,
                color: "#1E40AF",
                display: "block",
              }}
            >
              {displayKey ?? lastCreatedKey ?? "—"}
            </Typography.Text>
          </div>

          {/* Copy button */}
          <Button
            icon={copied ? <CheckCircleOutlined style={{ color: "#059669" }} /> : <CopyOutlined />}
            onClick={handleCopyKey}
            size="large"
            style={{
              borderRadius: 10,
              fontWeight: 600,
              background: copied
                ? "#D1FAE5"
                : "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)",
              color: copied ? "#059669" : "white",
              border: "none",
              padding: "0 32px",
              height: 44,
              transition: "all 0.2s",
            }}
          >
            {copied ? "Đã sao chép!" : "Sao chép mã"}
          </Button>

          <p style={{ color: "#9CA3AF", fontSize: 12, marginTop: 12 }}>
            Sinh viên dùng mã này để tham gia lớp từ Dashboard hoặc mục Lớp của tôi.
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default ManageClassesPage;
