import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
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
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { EditOutlined } from "@ant-design/icons";
import {
  BookOpen,
  Users,
  Clock,
  RefreshCw,
  Eye,
} from "lucide-react";
import ClassModal from "@/components/Course/ClassModal";
import { useAppDispatch, useAppSelector } from "@/services/store/store";
import {
  fetchClassesByInstructor,
  updateClass,
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
  const { classes: apiClasses, loading, pagination } =
    useAppSelector((state) => state.class);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<
    "all" | "active" | "archived"
  >("all");
  const [classModalOpen, setClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassData | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { message: antdMessage } = App.useApp();

  useEffect(() => {
    dispatch(fetchClassesByInstructor({ page: currentPage, limit: pageSize }));
  }, [dispatch, currentPage, pageSize]);

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
      title: "Semester",
      key: "semester",
      render: (_, record) => (
        <span>
          {record.course?.semester || "—"} {record.course?.academicYear || ""}
        </span>
      ),
    },
    {
      title: "Students",
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
      title: "Dates",
      key: "dates",
      render: (_, record) => (
        <Text type="secondary" className="text-xs">
          {record.startDate} → {record.endDate}
        </Text>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={status === "active" ? "green" : "default"}>
          {status === "active" ? "Active" : "Archived"}
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
      title: "Actions",
      key: "actions",
      width: 160,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="text"
            icon={<Eye size={14} />}
            onClick={() => navigate(`/instructor/class/${record.classId}`)}
            title="View Class"
          />
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingClass(record);
              setClassModalOpen(true);
            }}
            title="Edit"
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
      antdMessage.success("Class updated successfully!");
      setClassModalOpen(false);
      setEditingClass(null);
      dispatch(fetchClassesByInstructor({ page: currentPage, limit: pageSize }));
    } catch {
      antdMessage.error("Failed to update class. Please try again.");
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarInstructor activeItem="courses" />
      <main className="flex-1 overflow-y-auto p-6 sm:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <Text className="text-xs uppercase tracking-wide text-gray-500 font-semibold">
                Instructor
              </Text>
              <h1 className="text-2xl font-bold text-gray-900">My Classes</h1>
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
              Refresh
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card size="small">
              <Space>
                <div className="rounded-lg bg-blue-100 text-blue-600 p-2">
                  <Users size={20} />
                </div>
                <div>
                  <p className="text-xs uppercase text-gray-500 font-semibold">
                    Students
                  </p>
                  <p className="text-xl font-bold">{totalStudents}</p>
                </div>
              </Space>
            </Card>
            <Card size="small">
              <Space>
                <div className="rounded-lg bg-green-100 text-green-600 p-2">
                  <BookOpen size={20} />
                </div>
                <div>
                  <p className="text-xs uppercase text-gray-500 font-semibold">
                    Active Classes
                  </p>
                  <p className="text-xl font-bold">{activeCourses}</p>
                </div>
              </Space>
            </Card>
            <Card size="small">
              <Space>
                <div className="rounded-lg bg-amber-100 text-amber-600 p-2">
                  <Clock size={20} />
                </div>
                <div>
                  <p className="text-xs uppercase text-gray-500 font-semibold">
                    Pending
                  </p>
                  <p className="text-xl font-bold">{pendingReviews}</p>
                </div>
              </Space>
            </Card>
          </div>

          {/* Filters & Search */}
          <Card>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
              <div>
                <Text className="text-xs uppercase tracking-wide text-gray-500 font-semibold">
                  Directory
                </Text>
                <h2 className="text-lg font-bold text-gray-900">Classes</h2>
              </div>
              <Space wrap>
                <Input.Search
                  placeholder="Search by class code, course..."
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
                    { value: "all", label: "All Classes" },
                    { value: "active", label: "Active" },
                    { value: "archived", label: "Archived" },
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
                        `${range[0]}-${range[1]} of ${total} classes`,
                      onChange: (p, ps) => {
                        setCurrentPage(p);
                        setPageSize(ps);
                      },
                    }
                  : false
              }
              locale={{
                emptyText: searchQuery
                  ? "No classes found matching your search"
                  : "No classes available",
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
      />
    </div>
  );
};

export default ManageClassesPage;