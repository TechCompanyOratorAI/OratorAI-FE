import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import dayjs from "dayjs";
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ReadOutlined,
  ReloadOutlined,
  SearchOutlined,
  CheckCircleOutlined,
  UsergroupAddOutlined,
  FileExcelOutlined,
  ExclamationCircleOutlined,
  CopyOutlined,
} from "@ant-design/icons";
import {
  Table,
  Button,
  Input,
  Select,
  Tag,
  Space,
  Card,
  Popconfirm,
  App,
  ConfigProvider,
} from "antd";
import viVN from "antd/locale/vi_VN";
import type { ColumnsType } from "antd/es/table";
import SummaryMetrics, {
  SummaryMetricItem,
} from "@/components/Dashboard/SummaryMetrics";
import SidebarAdmin from "@/components/Sidebar/SidebarAdmin/SidebarAdmin";
import ClassModal from "@/components/Course/ClassModal";
import InstructorModal from "@/components/Course/InstructorModal";
import EmailWhitelistModal from "@/components/Class/EmailWhitelistModal";
import {
  fetchClasses,
  fetchClassDetail,
  createClass,
  updateClass,
  deleteClass,
  addInstructorToClass,
  removeInstructorFromClass,
  ClassData,
  InstructorInfo,
} from "@/services/features/admin/classSlice";
import { fetchInstructorByClass } from "@/services/features/admin/adminSlice";
import { fetchCourses } from "@/services/features/course/courseSlice";
import { RootState, AppDispatch } from "@/services/store/store";
import { extractLocalizedMessage } from "@/lib/utils";
import axiosInstance from "@/services/constant/axiosInstance";
import { ACADEMIC_BLOCKS_ENDPOINT } from "@/services/constant/apiConfig";

const AdminClassPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { classes, loading, pagination } = useSelector(
    (state: RootState) => state.class,
  );
  const { users } = useSelector((state: RootState) => state.admin);
  const { courses = [] } = useSelector((state: RootState) => state.course);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInstructorModalOpen, setIsInstructorModalOpen] = useState(false);
  const [isWhitelistModalOpen, setIsWhitelistModalOpen] = useState(false);
  const [whitelistClass, setWhitelistClass] = useState<{ classId: number; classCode: string } | null>(null);
  const [selectedClass, setSelectedClass] = useState<ClassData | undefined>();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "active" | "inactive" | "archived"
  >("all");
  const [filterCourseId, setFilterCourseId] = useState<number | "all">("all");
  const [filterStudentStatus, setFilterStudentStatus] = useState<
    "all" | "has" | "none"
  >("all");
  const [sortByCreatedAt, setSortByCreatedAt] = useState<"newest" | "oldest">(
    "newest",
  );
  const [actionLoading, setActionLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [academicBlocks, setAcademicBlocks] = useState<
    Array<{
      academicBlockId: number;
      blockCode: string;
      term: string;
      half?: string | null;
      blockType: string;
      startDate: string;
      endDate: string;
      isActive: boolean;
      academicYear?: {
        academicYearId: number;
        year: number;
        name: string;
      };
    }>
  >([]);

  const { notification, message } = App.useApp();

  const notifySuccess = (title: string, description: string) => {
    notification.success({
      message: title,
      description,
      placement: "topRight",
    });
  };

  const notifyError = (title: string, description: string) => {
    notification.error({
      message: title,
      description,
      placement: "topRight",
    });
  };

  useEffect(() => {
    dispatch(fetchClasses({ page: currentPage, limit: pageSize }));
  }, [dispatch, currentPage, pageSize]);

  useEffect(() => {
    dispatch(fetchCourses({ page: 1, limit: 100 }));
  }, [dispatch]);

  useEffect(() => {
    const fetchAcademicBlocks = async () => {
      try {
        const response = await axiosInstance.get(`${ACADEMIC_BLOCKS_ENDPOINT}?isActive=true`);
        const payload = response.data as { data?: any[] };
        setAcademicBlocks(Array.isArray(payload?.data) ? payload.data : []);
      } catch (error) {
        notifyError(
          "Tải kỳ học thất bại",
          extractLocalizedMessage(error, "Không thể tải danh sách kỳ học."),
        );
      }
    };
    fetchAcademicBlocks();
  }, []);

  const handleCreateClass = () => {
    setSelectedClass(undefined);
    setIsModalOpen(true);
  };

  const handleEditClass = async (classData: ClassData) => {
    setSelectedClass(classData);
    setIsModalOpen(true);
    try {
      const detailedClass = await dispatch(
        fetchClassDetail(classData.classId),
      ).unwrap();
      if (detailedClass) {
        setSelectedClass(detailedClass);
      }
    } catch {
      // Keep list data if detail fetch fails.
    }
  };

  const handleDeleteClass = async (classId: number) => {
    setActionLoading(true);
    try {
      const response = await dispatch(deleteClass(classId)).unwrap();
      await dispatch(fetchClasses({ page: currentPage, limit: pageSize }));
      notifySuccess(
        "Xóa thành công",
        extractLocalizedMessage(response, "Đã xóa lớp học thành công."),
      );
    } catch (error) {
      notifyError(
        "Xóa thất bại",
        extractLocalizedMessage(error, "Không thể xóa lớp học."),
      );
    }
    setActionLoading(false);
  };

  const handleSubmitClass = async (formData: any) => {
    setActionLoading(true);
    try {
      if (selectedClass) {
        const response = await dispatch(
          updateClass({
            classId: selectedClass.classId,
            classData: formData,
          }),
        ).unwrap();
        await dispatch(fetchClasses({ page: currentPage, limit: pageSize }));
        notifySuccess(
          "Cập nhật thành công",
          extractLocalizedMessage(response, "Đã cập nhật lớp học thành công."),
        );
      } else {
        const response = await dispatch(createClass(formData)).unwrap();
        await dispatch(fetchClasses({ page: currentPage, limit: pageSize }));
        notifySuccess(
          "Tạo thành công",
          extractLocalizedMessage(response, "Đã tạo lớp học thành công."),
        );
      }
      setIsModalOpen(false);
      setSelectedClass(undefined);
    } catch (error) {
      notifyError(
        selectedClass ? "Cập nhật thất bại" : "Tạo thất bại",
        extractLocalizedMessage(
          error,
          selectedClass
          ? "Không thể cập nhật lớp học."
          : "Không thể tạo lớp học.",
        ),
      );
    }
    setActionLoading(false);
  };

  const handleManageInstructors = async (classData: ClassData) => {
    setSelectedClass(classData);
    setIsInstructorModalOpen(true);
    await dispatch(fetchInstructorByClass(classData.courseId.toString()));
  };

  const handleManageWhitelist = (classData: ClassData) => {
    setWhitelistClass({ classId: classData.classId, classCode: classData.classCode });
    setIsWhitelistModalOpen(true);
  };

  const handleAddInstructor = async (userIds: number[]) => {
    if (!selectedClass) return;
    if (!Array.isArray(userIds) || userIds.length === 0) return;
    try {
      const response = await dispatch(
        addInstructorToClass({
          classId: selectedClass.classId,
          userIds,
        }),
      ).unwrap();
      const refreshResult = await dispatch(
        fetchClasses({ page: currentPage, limit: pageSize }),
      );
      if (fetchClasses.fulfilled.match(refreshResult)) {
        const data = Array.isArray(refreshResult.payload.data)
          ? refreshResult.payload.data
          : [refreshResult.payload.data];
        const updated = data.find(
          (c: ClassData) => c.classId === selectedClass.classId,
        );
        if (updated) setSelectedClass(updated);
      }
      notifySuccess(
        "Thêm giảng viên thành công",
        extractLocalizedMessage(response, `Đã thêm ${userIds.length} giảng viên thành công.`),
      );
    } catch (error) {
      notifyError(
        "Thêm giảng viên thất bại",
        extractLocalizedMessage(error, "Không thể thêm giảng viên."),
      );
    }
  };

  const handleRemoveInstructor = async (userId: number) => {
    if (!selectedClass) return;
    try {
      const response = await dispatch(
        removeInstructorFromClass({
          classId: selectedClass.classId,
          userId: userId,
        }),
      ).unwrap();
      const refreshResult = await dispatch(
        fetchClasses({ page: currentPage, limit: pageSize }),
      );
      if (fetchClasses.fulfilled.match(refreshResult)) {
        const data = Array.isArray(refreshResult.payload.data)
          ? refreshResult.payload.data
          : [refreshResult.payload.data];
        const updated = data.find(
          (c: ClassData) => c.classId === selectedClass.classId,
        );
        if (updated) setSelectedClass(updated);
      }
      notifySuccess(
        "Gỡ giảng viên thành công",
        extractLocalizedMessage(response, "Đã gỡ giảng viên thành công."),
      );
    } catch (error) {
      notifyError(
        "Gỡ giảng viên thất bại",
        extractLocalizedMessage(error, "Không thể gỡ giảng viên."),
      );
    }
  };

  const filteredClasses = useMemo(
    () =>
      classes
        .filter((classItem: ClassData) => {
        const classCode = (classItem.classCode || "").toLowerCase();
        const className = (classItem.className || "").toLowerCase();
        const courseCode = (classItem.course?.courseCode || "").toLowerCase();
        const keyword = searchTerm.toLowerCase();

        const matchesSearch =
          classCode.includes(keyword) ||
          className.includes(keyword) ||
          courseCode.includes(keyword);

        const matchesStatus =
          filterStatus === "all" || classItem.status === filterStatus;
        const matchesCourse =
          filterCourseId === "all" || classItem.courseId === filterCourseId;
        const matchesStudentStatus =
          filterStudentStatus === "all"
            ? true
            : filterStudentStatus === "has"
              ? (classItem.enrollmentCount || 0) > 0
              : (classItem.enrollmentCount || 0) === 0;

          return (
            matchesSearch &&
            matchesStatus &&
            matchesCourse &&
            matchesStudentStatus
          );
        })
        .sort((a, b) => {
          const aTime = new Date(a.createdAt || 0).getTime();
          const bTime = new Date(b.createdAt || 0).getTime();
          return sortByCreatedAt === "newest" ? bTime - aTime : aTime - bTime;
        }),
    [
      classes,
      searchTerm,
      filterStatus,
      filterCourseId,
      filterStudentStatus,
      sortByCreatedAt,
    ],
  );

  const stats = useMemo(() => {
    const total = classes.length;
    const active = classes.filter(
      (c: ClassData) => c.status === "active",
    ).length;
    const classesWithoutStudents = classes.filter(
      (c: ClassData) => (c.enrollmentCount || 0) === 0,
    ).length;
    return { total, active, classesWithoutStudents };
  }, [classes]);

  const summaryItems: SummaryMetricItem[] = [
    {
      key: "total-classes",
      title: "Tổng lớp học",
      value: stats.total,
      icon: <ReadOutlined style={{ fontSize: 20 }} />,
      tone: "blue",
      description: "Toàn hệ thống",
    },
    {
      key: "active-classes",
      title: "Đang hoạt động",
      value: stats.active,
      icon: <CheckCircleOutlined style={{ fontSize: 20 }} />,
      tone: "green",
      description: "Có thể mở đăng ký",
    },
    {
      key: "students",
      title: "Lớp Chưa Có Sinh Viên",
      value: stats.classesWithoutStudents,
      icon: <ExclamationCircleOutlined style={{ fontSize: 20 }} />,
      tone: "red",
      description: "Chưa có đăng ký",
    },
  ];

  const getAvailableInstructors = (): InstructorInfo[] => {
    return users.map((user: any) => ({
      userId: user.userId,
      username: user.username,
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email,
    }));
  };

  const statusColor = (status: string) => {
    if (status === "active") return "green";
    if (status === "inactive") return "default";
    return "red";
  };

  const tableTotal =
    searchTerm ||
    filterStatus !== "all" ||
    filterCourseId !== "all" ||
    filterStudentStatus !== "all"
      ? filteredClasses.length
      : filteredClasses.length > pageSize &&
          filteredClasses.length < pagination.total
        ? filteredClasses.length
        : pagination.total;

  const getClassEnrollKey = (record: ClassData): string | null => {
    const fromActive = record.activeKeys?.find((k) => k.isActive && !((k as any).isRevoked))
      ?.keyValue;
    const fromEnrollKeys = record.enrollKeys?.find(
      (k) => k.isActive && !((k as any).isRevoked),
    )?.keyValue;
    const fromLegacy = (record as any).enrollkey as string | undefined;
    return fromActive || fromEnrollKeys || fromLegacy || null;
  };

  const columns: ColumnsType<ClassData> = [
    {
      title: "Lớp",
      key: "class",
      render: (_, record) => (
        <div className="font-semibold">{record.classCode}</div>
      ),
    },
    {
      title: "Môn học",
      key: "course",
      render: (_, record) => (
        <div>
          <div className="font-medium">{record.course?.courseCode}</div>
          <div className="text-xs text-gray-400">
            {record.course?.courseName}
          </div>
        </div>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (val: string) => (
        <Tag color={statusColor(val || "unknown")}>
          {val
            ? val === "active"
              ? "Đang hoạt động"
              : val === "inactive"
                ? "Không hoạt động"
                : val === "archived"
                  ? "Đã lưu trữ"
                  : val
            : "Không xác định"}
        </Tag>
      ),
    },
    {
      title: "Sĩ số",
      key: "enrollment",
      render: (_, record) => (
        <span>
          {record.enrollmentCount} / {record.maxStudents}
        </span>
      ),
    },
    {
      title: "Giảng viên",
      key: "instructors",
      render: (_, record) => {
        if (!record.instructors || record.instructors.length === 0) {
          return (
            <span className="text-gray-400 italic text-xs">
              Chưa có giảng viên phụ trách
            </span>
          );
        }
        return (
          <div className="space-y-1">
            {record.instructors.map((instructor) => (
              <div key={instructor.userId}>
                <div className="font-semibold text-sm">
                  {instructor.firstName} {instructor.lastName}
                </div>
                <div className="text-xs text-gray-400">{instructor.email}</div>
              </div>
            ))}
          </div>
        );
      },
    },
    {
      title: "Mã đăng ký",
      key: "enrollKey",
      width: 220,
      render: (_, record) => {
        const keyValue = getClassEnrollKey(record);
        if (!keyValue) {
          return <Tag>Chưa có mã</Tag>;
        }
        return (
          <div
            className="flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-2 py-1"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="font-mono text-xs font-semibold tracking-wide text-blue-700 flex-1">
              {keyValue}
            </span>
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined />}
              onClick={() => {
                navigator.clipboard.writeText(keyValue);
                message.success("Đã sao chép mã đăng ký");
              }}
            />
          </div>
        );
      },
    },
    {
      title: "Ngày bắt đầu",
      dataIndex: "startDate",
      key: "startDate",
      render: (val) => dayjs(val).format("D [thg] M, YYYY"),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 165,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="text"
            icon={<FileExcelOutlined style={{ fontSize: 14 }} />}
            onClick={() => handleManageWhitelist(record)}
            className="text-emerald-600 hover:text-emerald-700"
            title="Danh sách sinh viên"
          />
          <Button
            type="text"
            icon={<UsergroupAddOutlined style={{ fontSize: 14 }} />}
            onClick={() => handleManageInstructors(record)}
            className="text-green-500 hover:text-green-600"
            title="Quản lý giảng viên"
          />
          <Button
            type="text"
            icon={<EditOutlined style={{ fontSize: 14 }} />}
            onClick={() => handleEditClass(record)}
            className="text-blue-500 hover:text-blue-600"
            title="Chỉnh sửa"
          />
          <Popconfirm
            title="Xóa lớp học"
            description="Bạn có chắc muốn xóa lớp học này? Hành động này không thể hoàn tác."
            onConfirm={() => handleDeleteClass(record.classId)}
            okText="Xóa"
            okButtonProps={{ danger: true, loading: actionLoading }}
            cancelText="Hủy"
          >
            <Button type="text" icon={<DeleteOutlined />} danger title="Xóa" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarAdmin activeItem="manage-classes" />
      <main className="flex-1 overflow-y-auto p-6 sm:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">
                Quản trị hệ thống
              </p>
              <h1 className="text-2xl font-bold text-gray-900">
                Quản lý lớp học
              </h1>
              <p className="text-sm text-gray-600">
                Quản lý lớp học, giảng viên và danh sách sinh viên.
              </p>
            </div>
            <Space>
              <Button
                icon={<ReloadOutlined style={{ fontSize: 14 }} />}
                onClick={() =>
                  dispatch(fetchClasses({ page: currentPage, limit: pageSize }))
                }
                loading={loading}
              >
                Làm mới
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined style={{ fontSize: 14 }} />}
                onClick={handleCreateClass}
              >
                Tạo lớp mới
              </Button>
            </Space>
          </div>

          <SummaryMetrics
            items={summaryItems}
            columnsClassName="grid grid-cols-1 sm:grid-cols-3 gap-4"
          />

          <Card>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">
                  Danh mục
                </p>
                <h2 className="text-lg font-bold text-gray-900">Lớp học</h2>
              </div>
              <Space wrap>
                <Input
                  placeholder="Tìm theo mã lớp, tên lớp hoặc môn học..."
                  prefix={<SearchOutlined className="text-gray-400" />}
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full sm:w-64"
                  allowClear
                />
                <Select
                  value={filterStatus}
                  onChange={(val) => {
                    setFilterStatus(val);
                    setCurrentPage(1);
                  }}
                  style={{ width: 140 }}
                  options={[
                    { value: "all", label: "Trạng thái" },
                    { value: "active", label: "Đang hoạt động" },
                    { value: "inactive", label: "Không hoạt động" },
                    
                  ]}
                />
                <Select
                  value={filterCourseId}
                  onChange={(val) => {
                    setFilterCourseId(val);
                    setCurrentPage(1);
                  }}
                  style={{ width: 220 }}
                  showSearch
                  optionFilterProp="label"
                  filterOption={(input, option) =>
                    String(option?.label ?? "")
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  options={[
                    { value: "all", label: "Tất cả môn học" },
                    ...courses.map((course) => ({
                      value: course.courseId,
                      label: `${course.courseCode} - ${course.courseName}`,
                    })),
                  ]}
                />
                <Select
                  value={filterStudentStatus}
                  onChange={(val) => {
                    setFilterStudentStatus(val);
                    setCurrentPage(1);
                  }}
                  style={{ width: 190 }}
                  options={[
                    { value: "all", label: "Tất cả lớp" },
                    { value: "has", label: "Đã có sinh viên" },
                    { value: "none", label: "Chưa có sinh viên" },
                  ]}
                />
                <Select
                  value={sortByCreatedAt}
                  onChange={(val) => {
                    setSortByCreatedAt(val);
                    setCurrentPage(1);
                  }}
                  style={{ width: 130 }}
                  options={[
                    { value: "newest", label: "Mới nhất" },
                    { value: "oldest", label: "Cũ nhất" },
                  ]}
                />
              </Space>
            </div>

            <ConfigProvider locale={viVN}>
              <Table
                columns={columns}
                dataSource={filteredClasses}
                rowKey={(record) =>
                  String(
                    record.classId ??
                      `${record.courseId}-${record.classCode}-${record.startDate}`,
                  )
                }
                loading={loading}
                pagination={
                  tableTotal > 0
                    ? {
                        current: currentPage,
                        pageSize,
                        total: tableTotal,
                        showSizeChanger: true,
                        showQuickJumper: false,
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
                  emptyText:
                    searchTerm ||
                    filterStatus !== "all" ||
                    filterCourseId !== "all" ||
                    filterStudentStatus !== "all"
                      ? "Không tìm thấy lớp học phù hợp bộ lọc"
                      : "Chưa có lớp học nào. Hãy tạo lớp đầu tiên để bắt đầu.",
                }}
              />
            </ConfigProvider>
          </Card>
        </div>
      </main>

      <ClassModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedClass(undefined);
        }}
        onSubmit={handleSubmitClass}
        initialData={selectedClass}
        isLoading={actionLoading}
        courses={courses}
        academicBlocks={academicBlocks}
      />

      <InstructorModal
        isOpen={isInstructorModalOpen}
        onClose={() => {
          setIsInstructorModalOpen(false);
          setSelectedClass(undefined);
        }}
        currentInstructors={selectedClass?.instructors ?? []}
        availableInstructors={getAvailableInstructors()}
        onAddInstructor={handleAddInstructor}
        onRemoveInstructor={handleRemoveInstructor}
        isLoading={loading}
      />

      <EmailWhitelistModal
        isOpen={isWhitelistModalOpen}
        classData={whitelistClass}
        onClose={() => {
          setIsWhitelistModalOpen(false);
          setWhitelistClass(null);
        }}
      />
    </div>
  );
};

export default AdminClassPage;
