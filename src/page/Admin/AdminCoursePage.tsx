import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/services/store/store";
import {
  fetchCourses,
  fetchCourseDetail,
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
  
  UsergroupAddOutlined,
  CheckCircleOutlined,
  
  ExclamationCircleOutlined,
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
import axiosInstance from "@/services/constant/axiosInstance";
import {
  ADD_INSTRUCTOR_TO_COURSE_ENDPOINT,
  ACADEMIC_BLOCKS_ENDPOINT,
  REMOVE_INSTRUCTOR_FROM_COURSE_ENDPOINT,
  SUBJECT_AREAS_ENDPOINT,
} from "@/services/constant/apiConfig";
import { extractLocalizedMessage } from "@/lib/utils";

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
  const [filterSemester, setFilterSemester] = useState<string | undefined>(
    undefined,
  );
  const [filterDepartmentId, setFilterDepartmentId] = useState<
    number | undefined
  >(undefined);
  const [filterInstructorStatus, setFilterInstructorStatus] = useState<
    "all" | "has" | "none"
  >("all");
  const [sortByCreatedAt, setSortByCreatedAt] = useState<
    "newest" | "oldest"
  >("newest");
  const [actionLoading, setActionLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [subjectAreas, setSubjectAreas] = useState<
    Array<{
      subjectAreaId: number;
      subjectCode: string;
      subjectName: string;
      departmentId: number | null;
      isActive: boolean;
    }>
  >([]);
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

  const normalizeCourseMessage = (message: string) => {
    const replacements: Array<[RegExp, string]> = [
      [/Instructor removed from course successfully/gi, "Đã gỡ giảng viên khỏi môn học thành công."],
      [/Instructor added to course successfully/gi, "Đã thêm giảng viên vào môn học thành công."],
      [/Course updated successfully/gi, "Cập nhật môn học thành công."],
      [/Course deleted successfully/gi, "Xóa môn học thành công."],
      [/Course created successfully/gi, "Tạo môn học thành công."],
    ];

    return replacements.reduce(
      (result, [pattern, replacement]) => result.replace(pattern, replacement),
      message,
    );
  };

  useEffect(() => {
    dispatch(fetchCourses({ page: currentPage, limit: pageSize }));
  }, [dispatch, currentPage, pageSize]);

  useEffect(() => {
    dispatch(fetchDepartments());
  }, [dispatch]);

  useEffect(() => {
    const fetchCourseDependencies = async () => {
      try {
        const [subjectRes, blockRes] = await Promise.all([
          axiosInstance.get(`${SUBJECT_AREAS_ENDPOINT}?limit=200`),
          axiosInstance.get(`${ACADEMIC_BLOCKS_ENDPOINT}?isActive=true`),
        ]);
        const subjectPayload = subjectRes.data as { data?: any[] };
        const blockPayload = blockRes.data as { data?: any[] };
        setSubjectAreas(
          Array.isArray(subjectPayload?.data) ? subjectPayload.data : [],
        );
        setAcademicBlocks(
          Array.isArray(blockPayload?.data) ? blockPayload.data : [],
        );
      } catch (error) {
        notifyError(
          "Tải dữ liệu phụ trợ thất bại",
          extractLocalizedMessage(
            error,
            "Không thể tải lĩnh vực môn học hoặc kỳ học.",
          ),
        );
      }
    };
    fetchCourseDependencies();
  }, []);

  const handleCreateCourse = () => {
    setSelectedCourse(undefined);
    setIsCourseModalOpen(true);
  };

  const handleEditCourse = async (course: CourseData) => {
    setSelectedCourse(course);
    setIsCourseModalOpen(true);
    try {
      const detailedCourse = await dispatch(
        fetchCourseDetail(course.courseId),
      ).unwrap();
      setSelectedCourse((prev) => ({
        ...(prev || course),
        ...detailedCourse,
        departmentId:
          detailedCourse?.departmentId ??
          prev?.departmentId ??
          course.departmentId,
        subjectAreaId:
          detailedCourse?.subjectAreaId ??
          prev?.subjectAreaId ??
          course.subjectAreaId,
      }));
    } catch {
      // Keep basic row data if detail fetch fails.
    }
  };

  const handleDeleteCourse = async (courseId: number) => {
    setActionLoading(true);
    try {
      const response = await dispatch(deleteCourse(courseId)).unwrap();
      notifySuccess(
        "Xóa thành công",
        normalizeCourseMessage(
          extractLocalizedMessage(response, "Đã xóa môn học thành công."),
        ),
      );
    } catch (error) {
      notifyError(
        "Xóa thất bại",
        normalizeCourseMessage(
          extractLocalizedMessage(error, "Không thể xóa môn học."),
        ),
      );
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
          normalizeCourseMessage(
            extractLocalizedMessage(response, "Đã cập nhật môn học thành công."),
          ),
        );
      } else {
        const response = await dispatch(createCourse(courseData)).unwrap();
        notifySuccess(
          "Tạo thành công",
          normalizeCourseMessage(
            extractLocalizedMessage(response, "Đã tạo môn học thành công."),
          ),
        );
      }
      setIsCourseModalOpen(false);
      setSelectedCourse(undefined);
    } catch (error) {
      notifyError(
        selectedCourse ? "Cập nhật thất bại" : "Tạo thất bại",
        normalizeCourseMessage(
          extractLocalizedMessage(
            error,
            selectedCourse
              ? "Không thể cập nhật môn học."
              : "Không thể tạo môn học.",
          ),
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

  const handleAddInstructor = async (userIds: number[]) => {
    if (!selectedCourse) return;
    if (!Array.isArray(userIds) || userIds.length === 0) return;
    const courseId = selectedCourse.courseId;

    try {
      const response = await axiosInstance.post(
        ADD_INSTRUCTOR_TO_COURSE_ENDPOINT(courseId.toString()),
        { instructorIds: userIds },
      );
      notifySuccess(
        "Thêm giảng viên thành công",
        normalizeCourseMessage(
          extractLocalizedMessage(
            response.data,
            `Đã thêm ${userIds.length} giảng viên thành công.`,
          ),
        ),
      );
      await refreshSelectedCourse(courseId);
    } catch (error: any) {
      notifyError(
        "Thêm giảng viên thất bại",
        normalizeCourseMessage(
          extractLocalizedMessage(
            error?.response?.data || error,
            "Không thể thêm giảng viên.",
          ),
        ),
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
        normalizeCourseMessage(
          extractLocalizedMessage(response.data, "Đã gỡ giảng viên thành công."),
        ),
      );
      await refreshSelectedCourse(courseId);
    } catch (error: any) {
      notifyError(
        "Gỡ giảng viên thất bại",
        normalizeCourseMessage(
          extractLocalizedMessage(
            error?.response?.data || error,
            "Không thể gỡ giảng viên.",
          ),
        ),
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

  const hasInstructorAssigned = (course: CourseData) =>
    Boolean(
      (course.instructors && course.instructors.length > 0) || course.instructor,
    );

  const filteredCourses = useMemo(() => {
    const filtered = courses.filter((course) => {
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
      const matchesDepartment =
        filterDepartmentId !== undefined
          ? course.departmentId === filterDepartmentId
          : true;
      const matchesInstructor =
        filterInstructorStatus === "all"
          ? true
          : filterInstructorStatus === "has"
            ? hasInstructorAssigned(course)
            : !hasInstructorAssigned(course);
      return (
        matchesSearch &&
        matchesSemester &&
        matchesDepartment &&
        matchesInstructor
      );
    });

    return filtered.sort((a, b) => {
      const aTime = new Date(a.createdAt || 0).getTime();
      const bTime = new Date(b.createdAt || 0).getTime();
      return sortByCreatedAt === "newest" ? bTime - aTime : aTime - bTime;
    });
  }, [
    courses,
    searchTerm,
    filterSemester,
    filterDepartmentId,
    filterInstructorStatus,
    sortByCreatedAt,
    departmentLookup,
  ]);

  const stats = useMemo(() => {
    const total = courses.length;
    const active = courses.filter((c) => c.isActive).length;
    const noInstructor = courses.filter((c) => !hasInstructorAssigned(c)).length;
    return { total, active, noInstructor };
  }, [courses]);

  const summaryItems: SummaryMetricItem[] = [
    {
      key: "total-courses",
      title: "Tổng môn học",
      value: stats.total,
      icon: <ReadOutlined style={{ fontSize: 20 }} />,
      tone: "blue",
      description: "Toàn hệ thống",
    },
    {
      key: "active-courses",
      title: "Môn học hoạt động",
      value: stats.active,
      icon: <CheckCircleOutlined style={{ fontSize: 20 }} />,
      tone: "green",
      description: "Đang mở",
    },
    {
      key: "enrollments",
      title: "Các Môn Chưa có Giảng Viên",
      value: stats.noInstructor,
      icon: <ExclamationCircleOutlined style={{ fontSize: 20 }} />,
      tone: "red",
      description: "Chưa phân công",
    },
  ];

  const semesters = Array.from(new Set(courses.map((c) => c.semester)));

  const getCourseTermItems = (course: CourseData) => {
    if (!course.academicBlocks || course.academicBlocks.length === 0) {
      return [{ term: course.semester || "-", details: [] as string[] }];
    }

    const termMap = new Map<string, string[]>();
    course.academicBlocks.forEach((block) => {
      const term = block?.term || "-";
      const suffix =
        block?.blockType === "BLOCK3" ? "BLOCK3" : (block?.half ?? "H1");
      const details = termMap.get(term) || [];
      details.push(Boolean(block?.CourseAcademicBlock?.isPrimary) ? `${suffix} (Primary)` : suffix);
      termMap.set(term, details);
    });

    return Array.from(termMap.entries()).map(([term, details]) => ({
      term,
      details,
    }));
  };

  const getCourseAcademicYearsDisplay = (course: CourseData) => {
    if (!course.academicBlocks || course.academicBlocks.length === 0) {
      return course.academicYear ? String(course.academicYear) : "-";
    }
    const years = Array.from(
      new Set(
        course.academicBlocks
          .map((block) => block.academicYear?.year)
          .filter((year): year is number => Number.isInteger(year)),
      ),
    );
    if (years.length === 0) {
      return course.academicYear ? String(course.academicYear) : "-";
    }
    return years.join(", ");
  };

  const columns: ColumnsType<CourseData> = [
    {
      title: "Thông tin môn học",
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
      key: "semester",
      render: (_, record) => (
        <div className="flex flex-col gap-1">
          {getCourseTermItems(record).map((item, index) => (
            <Tag key={`${record.courseId}-term-${index}`} className="w-fit !m-0">
              {item.term}
              {item.details.length > 0 ? `: ${item.details.join(", ")}` : ""}
            </Tag>
          ))}
        </div>
      ),
    },
    {
      title: "Năm học",
      key: "academicYear",
      render: (_, record) => getCourseAcademicYearsDisplay(record),
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
            title="Xác nhận xóa môn học"
            description="Bạn có chắc muốn xóa môn học này? Hành động này không thể hoàn tác."
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
                Quản lý môn học
              </h1>
              <p className="text-sm text-gray-600">
                Quản lý toàn bộ môn học, giảng viên và thông tin môn học
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
                Môn học mới
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
                <h2 className="text-lg font-bold text-gray-900">Tất cả môn học</h2>
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
                  placeholder="Tất cả kỳ"
                  options={semesters.map((s) => ({ value: s, label: s }))}
                />
                <Select
                  value={filterDepartmentId}
                  onChange={(val) => {
                    setFilterDepartmentId(val);
                    setCurrentPage(1);
                  }}
                  style={{ width: 240 }}
                  allowClear
                  placeholder="Tất cả chuyên ngành"
                  options={departments.map((department) => ({
                    value: department.departmentId,
                    label: `${department.departmentCode} – ${department.departmentName}`,
                  }))}
                  showSearch
                  optionFilterProp="label"
                  listHeight={192}
                />
                <Select
                  value={filterInstructorStatus}
                  onChange={(val) => {
                    setFilterInstructorStatus(val);
                    setCurrentPage(1);
                  }}
                  style={{ width: 190 }}
                  options={[
                    { value: "all", label: "Tất cả môn học" },
                    { value: "has", label: "Đã có giảng viên" },
                    { value: "none", label: "Chưa có giảng viên" },
                  ]}
                />
                <Select
                  value={sortByCreatedAt}
                  onChange={(val) => {
                    setSortByCreatedAt(val);
                    setCurrentPage(1);
                  }}
                  style={{ width: 170 }}
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
                        `${range[0]}-${range[1]} trên tổng ${total} môn học`,
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
                    filterSemester ||
                    filterDepartmentId !== undefined ||
                    filterInstructorStatus !== "all"
                      ? "Không tìm thấy môn học phù hợp bộ lọc"
                      : "Chưa có môn học nào. Hãy tạo môn học đầu tiên để bắt đầu.",
                }}
              />
            </ConfigProvider>
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
        subjectAreas={subjectAreas}
        academicBlocks={academicBlocks}
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
