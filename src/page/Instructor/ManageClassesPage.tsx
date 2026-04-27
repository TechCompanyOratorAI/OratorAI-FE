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
  ConfigProvider,
} from "antd";
import viVN from "antd/locale/vi_VN";
import type { ColumnsType } from "antd/es/table";
import { EditOutlined, KeyOutlined } from "@ant-design/icons";
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
  const { classes: apiClasses, loading } =
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

  const { message: antdMessage } = App.useApp();

  useEffect(() => {
    dispatch(fetchClassesByInstructor({ page: 1, limit: 1000 }));
  }, [dispatch]);

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
        return matchesSearch && (course.status !== "active" || expired);
      }

      return matchesSearch;
    });
  }, [apiClasses, searchQuery, selectedFilter]);

  const paginatedCourses = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCourses.slice(start, start + pageSize);
  }, [filteredCourses, currentPage, pageSize]);

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
          <Button
            type="text"
            icon={<KeyOutlined />}
            onClick={(event) => {
              event.stopPropagation();
              setKeyTargetClass(record);
              setKeyModalOpen(true);
            }}
            title="Tạo mã đăng ký"
          />
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
      await dispatch(
        createEnrollKey({
          classId: keyTargetClass.classId,
          customKey: data.customKey,
          expiresAt: data.expiresAt ? data.expiresAt.toISOString() : undefined,
          maxUses: data.maxUses,
        }),
      ).unwrap();
      antdMessage.success("Tạo mã đăng ký thành công!");
      setKeyModalOpen(false);
      setKeyTargetClass(null);
    } catch (err: any) {
      antdMessage.error(err || "Không thể tạo mã đăng ký. Vui lòng thử lại.");
    }
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
                dispatch(fetchClassesByInstructor({ page: 1, limit: 1000 }))
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

            <ConfigProvider locale={viVN}>
              <Tooltip title="Click to view class details" placement="top">
                <Table
                  columns={columns}
                  dataSource={paginatedCourses}
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
                    filteredCourses.length > 0
                      ? {
                          current: currentPage,
                          pageSize,
                          total: filteredCourses.length,
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
            </ConfigProvider>
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
        onClose={() => {
          setKeyModalOpen(false);
          setKeyTargetClass(null);
        }}
        onSubmit={handleCreateKey}
        isLoading={loading}
      />
    </div>
  );
};

export default ManageClassesPage;
