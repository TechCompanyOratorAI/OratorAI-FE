import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/services/store/store";
import {
  fetchCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  CourseData,
} from "@/services/features/course/courseSlice";
import {
  fetchInstructorByCourse,
  fetchDepartments,
  Department,
} from "@/services/features/admin/adminSlice";
import CourseModal from "@/components/Course/CourseModal";
import InstructorModal from "@/components/Course/InstructorModal";
import SidebarAdmin from "@/components/Sidebar/SidebarAdmin/SidebarAdmin";
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ReadOutlined,
  ReloadOutlined,
  SearchOutlined,
  TeamOutlined,
  UsergroupAddOutlined,
  CheckCircleOutlined,
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
} from "antd";
import type { ColumnsType } from "antd/es/table";
import SummaryMetrics, {
  SummaryMetricItem,
} from "@/components/Dashboard/SummaryMetrics";
import axiosInstance from "@/services/constant/axiosInstance";
import {
  ADD_INSTRUCTOR_TO_COURSE_ENDPOINT,
  REMOVE_INSTRUCTOR_FROM_COURSE_ENDPOINT,
} from "@/services/constant/apiConfig";

const AdminCoursePage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { courses, loading, pagination } = useSelector(
    (state: RootState) => state.course,
  );
  const { users, departments } = useSelector((state: RootState) => state.admin);

  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [isInstructorModalOpen, setIsInstructorModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<
    CourseData | undefined
  >();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSemester, setFilterSemester] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { notification } = App.useApp();

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

  const extractMessage = (payload: any, fallback: string) => {
    if (typeof payload === "string" && payload.trim()) return payload;
    if (payload && typeof payload === "object") {
      if (typeof payload.message === "string" && payload.message.trim()) {
        return payload.message;
      }
      if (
        payload.data &&
        typeof payload.data.message === "string" &&
        payload.data.message.trim()
      ) {
        return payload.data.message;
      }
    }
    return fallback;
  };

  useEffect(() => {
    dispatch(fetchCourses({ page: currentPage, limit: pageSize }));
  }, [dispatch, currentPage, pageSize]);

  useEffect(() => {
    dispatch(fetchDepartments());
  }, [dispatch]);

  const handleCreateCourse = () => {
    setSelectedCourse(undefined);
    setIsCourseModalOpen(true);
  };

  const handleEditCourse = (course: CourseData) => {
    setSelectedCourse(course);
    setIsCourseModalOpen(true);
  };

  const handleDeleteCourse = async (courseId: number) => {
    setActionLoading(true);
    try {
      const response = await dispatch(deleteCourse(courseId)).unwrap();
      notifySuccess(
        "Xóa thành công",
        extractMessage(response, "Đã xóa khóa học thành công."),
      );
    } catch (error) {
      notifyError("Xóa thất bại", extractMessage(error, "Không thể xóa khóa học."));
    }
    setActionLoading(false);
  };

  const handleSubmitCourse = async (courseData: any) => {
    setActionLoading(true);
    try {
      if (selectedCourse) {
        const response = await dispatch(
          updateCourse({
            courseId: selectedCourse.courseId,
            data: courseData,
          }),
        ).unwrap();
        notifySuccess(
          "Cập nhật thành công",
          extractMessage(response, "Đã cập nhật khóa học thành công."),
        );
      } else {
        const response = await dispatch(createCourse(courseData)).unwrap();
        notifySuccess(
          "Tạo thành công",
          extractMessage(response, "Đã tạo khóa học thành công."),
        );
      }
      setIsCourseModalOpen(false);
      setSelectedCourse(undefined);
    } catch (error) {
      notifyError(
        selectedCourse ? "Cập nhật thất bại" : "Tạo thất bại",
        extractMessage(
          error,
          selectedCourse
          ? "Không thể cập nhật khóa học."
          : "Không thể tạo khóa học.",
        ),
      );
    }
    setActionLoading(false);
  };

  const handleManageInstructors = async (course: CourseData) => {
    setSelectedCourse(course);
    setIsInstructorModalOpen(true);
    await dispatch(fetchInstructorByCourse(course.courseId.toString()));
  };

  const refreshSelectedCourse = async (courseId: number) => {
    const refreshResult = await dispatch(
      fetchCourses({ page: currentPage, limit: pageSize }),
    );

    if (fetchCourses.fulfilled.match(refreshResult)) {
      const updatedCourse = refreshResult.payload.data.find(
        (course) => course.courseId === courseId,
      );

      if (updatedCourse) {
        setSelectedCourse(updatedCourse);
      }
    }
  };

  const handleAddInstructor = async (userId: number) => {
    if (!selectedCourse) return;
    const courseId = selectedCourse.courseId;

    try {
      const response = await axiosInstance.post(
        ADD_INSTRUCTOR_TO_COURSE_ENDPOINT(courseId.toString()),
        { instructorIds: [userId] },
      );
      notifySuccess(
        "Thêm giảng viên thành công",
        extractMessage(response.data, "Đã thêm giảng viên thành công."),
      );
      await refreshSelectedCourse(courseId);
    } catch (error: any) {
      notifyError(
        "Thêm giảng viên thất bại",
        extractMessage(error?.response?.data || error, "Không thể thêm giảng viên."),
      );
    }
  };

  const handleRemoveInstructor = async (userId: number) => {
    if (!selectedCourse) return;
    const courseId = selectedCourse.courseId;

    try {
      const response = await axiosInstance.delete(
        REMOVE_INSTRUCTOR_FROM_COURSE_ENDPOINT(
          courseId.toString(),
          userId.toString(),
        ),
      );
      notifySuccess(
        "Gỡ giảng viên thành công",
        extractMessage(response.data, "Đã gỡ giảng viên thành công."),
      );
      await refreshSelectedCourse(courseId);
    } catch (error: any) {
      notifyError(
        "Gỡ giảng viên thất bại",
        extractMessage(error?.response?.data || error, "Không thể gỡ giảng viên."),
      );
    }
  };

  const currentInstructors = selectedCourse?.instructors?.length
    ? selectedCourse.instructors.map((instructor) => ({
      userId: instructor.userId,
      username: instructor.username,
      email: instructor.email,
      firstName: instructor.firstName,
      lastName: instructor.lastName,
    }))
    : selectedCourse?.instructor
      ? [
        {
          userId: selectedCourse.instructor.userId,
          username: selectedCourse.instructor.username,
          email: selectedCourse.instructor.email,
          firstName: selectedCourse.instructor.firstName,
          lastName: selectedCourse.instructor.lastName,
        },
      ]
      : [];

  const availableInstructors = users.map((user) => ({
    userId: user.userId,
    username: user.username,
    email: user.email,
    firstName: user.firstName || "",
    lastName: user.lastName || "",
  }));

  const departmentLookup = useMemo(() => {
    return departments.reduce(
      (acc, department) => {
        acc[department.departmentId] = department;
        return acc;
      },
      {} as Record<number, Department>,
    );
  }, [departments]);

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const department = departmentLookup[course.departmentId];
      const departmentText = department
        ? `${department.departmentCode} ${department.departmentName}`
        : "";
      const matchesSearch =
        course.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.courseCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        departmentText.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.departmentId.toString().includes(searchTerm.toLowerCase());
      const matchesSemester = filterSemester
        ? course.semester === filterSemester
        : true;
      return matchesSearch && matchesSemester;
    });
  }, [courses, searchTerm, filterSemester, departmentLookup]);

  const stats = useMemo(() => {
    const total = courses.length;
    const active = courses.filter((c) => c.isActive).length;
    const totalEnrollments = courses.reduce(
      (sum, c) => sum + (c.enrollmentCount || 0),
      0,
    );
    return { total, active, totalEnrollments };
  }, [courses]);

  const summaryItems: SummaryMetricItem[] = [
    {
      key: "total-courses",
      title: "Tổng khóa học",
      value: stats.total,
      icon: <ReadOutlined style={{ fontSize: 20 }} />,
      tone: "blue",
      description: "Toàn hệ thống",
    },
    {
      key: "active-courses",
      title: "Khóa học hoạt động",
      value: stats.active,
      icon: <CheckCircleOutlined style={{ fontSize: 20 }} />,
      tone: "green",
      description: "Đang mở",
    },
    {
      key: "enrollments",
      title: "Tổng lượt đăng ký",
      value: stats.totalEnrollments,
      icon: <TeamOutlined style={{ fontSize: 20 }} />,
      tone: "purple",
      description: "Theo dữ liệu ghi danh",
    },
  ];

  const semesters = Array.from(new Set(courses.map((c) => c.semester)));

  const columns: ColumnsType<CourseData> = [
    {
      title: "Thông tin khóa học",
      key: "courseInfo",
      render: (_, record) => (
        <div>
          <div className="font-semibold">{record.courseCode}</div>
          <div className="text-xs text-gray-400">
            Bộ môn:{" "}
            {departmentLookup[record.departmentId]
              ? `${departmentLookup[record.departmentId].departmentCode} – ${departmentLookup[record.departmentId].departmentName}`
              : record.departmentId}
          </div>
          <div className="text-gray-700 font-medium">{record.courseName}</div>
          <div className="text-xs text-gray-500 mt-1 line-clamp-1">
            {record.description}
          </div>
        </div>
      ),
    },
    {
      title: "Giảng viên",
      key: "instructor",
      render: (_, record) => {
        const instructors =
          record.instructors && record.instructors.length > 0
            ? record.instructors
            : record.instructor
              ? [record.instructor]
              : [];
        if (instructors.length === 0) {
          return (
            <span className="text-gray-400 italic text-xs">
              Chưa phân công giảng viên
            </span>
          );
        }
        return (
          <div className="space-y-1">
            {instructors.map((instructor) => (
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
      title: "Học kỳ",
      dataIndex: "semester",
      key: "semester",
      render: (val) => <Tag>{val}</Tag>,
    },
    {
      title: "Năm học",
      dataIndex: "academicYear",
      key: "academicYear",
    },
    {
      title: "Trạng thái",
      dataIndex: "isActive",
      key: "isActive",
      render: (isActive: boolean) => (
        <Tag color={isActive ? "green" : "red"}>
          {isActive ? "Đang hoạt động" : "Không hoạt động"}
        </Tag>
      ),
    },
    {
      title: "Số đăng ký",
      dataIndex: "enrollmentCount",
      key: "enrollmentCount",
      render: (val) => val || 0,
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 140,
      render: (_, record) => (
        <Space size="small">
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
            onClick={() => handleEditCourse(record)}
            className="text-blue-500 hover:text-blue-600"
            title="Sửa"
          />
          <Popconfirm
            title="Xác nhận xóa khóa học"
            description="Bạn có chắc muốn xóa khóa học này? Hành động này không thể hoàn tác."
            onConfirm={() => handleDeleteCourse(record.courseId)}
            okText="Xóa"
            okButtonProps={{ danger: true, loading: actionLoading }}
            cancelText="Hủy"
          >
            <Button
              type="text"
              icon={<DeleteOutlined />}
              danger
              title="Xóa"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarAdmin activeItem="manage-courses" />
      <main className="flex-1 overflow-y-auto p-6 sm:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">
                Quản trị
              </p>
              <h1 className="text-2xl font-bold text-gray-900">
                Quản lý khóa học
              </h1>
              <p className="text-sm text-gray-600">
                Quản lý toàn bộ khóa học, giảng viên và thông tin khóa học
              </p>
            </div>
            <Space>
              <Button
                icon={<ReloadOutlined style={{ fontSize: 14 }} />}
                onClick={() =>
                  dispatch(fetchCourses({ page: currentPage, limit: pageSize }))
                }
                loading={loading}
              >
                Làm mới
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined style={{ fontSize: 14 }} />}
                onClick={handleCreateCourse}
              >
                Khóa học mới
              </Button>
            </Space>
          </div>

          <SummaryMetrics items={summaryItems} columnsClassName="grid grid-cols-1 sm:grid-cols-3 gap-4" />

          <Card>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">
                  Danh mục
                </p>
                <h2 className="text-lg font-bold text-gray-900">Tất cả khóa học</h2>
              </div>
              <Space wrap>
                <Input
                  placeholder="Tìm theo tên hoặc mã..."
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
                  value={filterSemester}
                  onChange={(val) => {
                    setFilterSemester(val);
                    setCurrentPage(1);
                  }}
                  style={{ width: 160 }}
                  allowClear
                  placeholder="Tất cả học kỳ"
                  options={semesters.map((s) => ({ value: s, label: s }))}
                />
              </Space>
            </div>

            <Table
              columns={columns}
              dataSource={filteredCourses}
              rowKey="courseId"
              loading={loading}
              pagination={
                pagination.total > 0
                  ? {
                    current: currentPage,
                    pageSize,
                    total: pagination.total,
                    showSizeChanger: true,
                    showQuickJumper: false,
                    pageSizeOptions: ["10", "20", "50"],
                    showTotal: (total, range) =>
                      `${range[0]}-${range[1]} trên tổng ${total} khóa học`,
                    onChange: (p, ps) => {
                      setCurrentPage(p);
                      setPageSize(ps);
                    },
                  }
                  : false
              }
              locale={{
                emptyText:
                  searchTerm || filterSemester
                    ? "Không tìm thấy khóa học phù hợp bộ lọc"
                    : "Chưa có khóa học nào. Hãy tạo khóa học đầu tiên để bắt đầu.",
              }}
            />
          </Card>
        </div>
      </main>

      <CourseModal
        isOpen={isCourseModalOpen}
        onClose={() => {
          setIsCourseModalOpen(false);
          setSelectedCourse(undefined);
        }}
        onSubmit={handleSubmitCourse}
        initialData={selectedCourse}
        isLoading={actionLoading}
        departments={departments}
      />

      <InstructorModal
        isOpen={isInstructorModalOpen}
        onClose={() => {
          setIsInstructorModalOpen(false);
          setSelectedCourse(undefined);
        }}
        currentInstructors={currentInstructors}
        availableInstructors={availableInstructors}
        onAddInstructor={handleAddInstructor}
        onRemoveInstructor={handleRemoveInstructor}
        isLoading={loading}
      />
    </div>
  );
};

export default AdminCoursePage;
