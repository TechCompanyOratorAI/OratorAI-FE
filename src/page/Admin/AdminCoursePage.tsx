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
  Plus,
  Edit2,
  Users,
  RefreshCw,
  Book,
  Search,
} from "lucide-react";
import { DeleteOutlined, UsergroupAddOutlined } from "@ant-design/icons";
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

  const { message: antdMessage } = App.useApp();

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
      await dispatch(deleteCourse(courseId)).unwrap();
      antdMessage.success("Course deleted successfully");
    } catch {
      antdMessage.error("Failed to delete course");
    }
    setActionLoading(false);
  };

  const handleSubmitCourse = async (courseData: any) => {
    setActionLoading(true);
    try {
      if (selectedCourse) {
        await dispatch(
          updateCourse({
            courseId: selectedCourse.courseId,
            data: courseData,
          }),
        ).unwrap();
        antdMessage.success("Course updated successfully");
      } else {
        await dispatch(createCourse(courseData)).unwrap();
        antdMessage.success("Course created successfully");
      }
      setIsCourseModalOpen(false);
      setSelectedCourse(undefined);
    } catch {
      antdMessage.error(
        selectedCourse
          ? "Failed to update course"
          : "Failed to create course",
      );
    }
    setActionLoading(false);
  };

  const handleManageInstructors = async (course: CourseData) => {
    setSelectedCourse(course);
    setIsInstructorModalOpen(true);
    await dispatch(fetchInstructorByCourse(course.courseId.toString()));
  };

  const handleAddInstructor = async (userId: number) => {
    if (!selectedCourse) return;
    try {
      await axiosInstance.post(
        ADD_INSTRUCTOR_TO_COURSE_ENDPOINT(selectedCourse.courseId.toString()),
        { instructorIds: [userId] },
      );
      antdMessage.success("Instructor added successfully");
      await dispatch(fetchCourses({ page: currentPage, limit: pageSize }));
    } catch {
      antdMessage.error("Failed to add instructor");
    }
  };

  const handleRemoveInstructor = async (userId: number) => {
    if (!selectedCourse) return;
    try {
      await axiosInstance.delete(
        REMOVE_INSTRUCTOR_FROM_COURSE_ENDPOINT(
          selectedCourse.courseId.toString(),
          userId.toString(),
        ),
      );
      antdMessage.success("Instructor removed successfully");
      await dispatch(fetchCourses({ page: currentPage, limit: pageSize }));
    } catch {
      antdMessage.error("Failed to remove instructor");
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

  const semesters = Array.from(new Set(courses.map((c) => c.semester)));

  const columns: ColumnsType<CourseData> = [
    {
      title: "Course Info",
      key: "courseInfo",
      render: (_, record) => (
        <div>
          <div className="font-semibold">{record.courseCode}</div>
          <div className="text-xs text-gray-400">
            Department:{" "}
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
      title: "Instructor",
      key: "instructor",
      render: (_, record) => {
        const instructors = record.instructors && record.instructors.length > 0
          ? record.instructors
          : record.instructor ? [record.instructor] : [];
        if (instructors.length === 0) {
          return <span className="text-gray-400 italic text-xs">No instructor assigned</span>;
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
      title: "Semester",
      dataIndex: "semester",
      key: "semester",
      render: (val) => <Tag>{val}</Tag>,
    },
    {
      title: "Academic Year",
      dataIndex: "academicYear",
      key: "academicYear",
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      render: (isActive: boolean) => (
        <Tag color={isActive ? "green" : "red"}>
          {isActive ? "Active" : "Inactive"}
        </Tag>
      ),
    },
    {
      title: "Enrollments",
      dataIndex: "enrollmentCount",
      key: "enrollmentCount",
      render: (val) => val || 0,
    },
    {
      title: "Actions",
      key: "actions",
      width: 140,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="text"
            icon={<UsergroupAddOutlined size={14} />}
            onClick={() => handleManageInstructors(record)}
            className="text-purple-500 hover:text-purple-600"
            title="Manage Instructors"
          />
          <Button
            type="text"
            icon={<Edit2 size={14} />}
            onClick={() => handleEditCourse(record)}
            className="text-blue-500 hover:text-blue-600"
            title="Edit"
          />
          <Popconfirm
            title="Delete Course"
            description="Are you sure you want to delete this course? This action cannot be undone."
            onConfirm={() => handleDeleteCourse(record.courseId)}
            okText="Delete"
            okButtonProps={{ danger: true, loading: actionLoading }}
            cancelText="Cancel"
          >
            <Button
              type="text"
              icon={<DeleteOutlined />}
              danger
              title="Delete"
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
                Administration
              </p>
              <h1 className="text-2xl font-bold text-gray-900">
                Course Management
              </h1>
              <p className="text-sm text-gray-600">
                Manage all courses, instructors, and course details
              </p>
            </div>
            <Space>
              <Button
                icon={<RefreshCw size={14} />}
                onClick={() =>
                  dispatch(fetchCourses({ page: currentPage, limit: pageSize }))
                }
                loading={loading}
              >
                Refresh
              </Button>
              <Button
                type="primary"
                icon={<Plus size={14} />}
                onClick={handleCreateCourse}
              >
                New Course
              </Button>
            </Space>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card size="small">
              <Space>
                <div className="rounded-lg bg-blue-100 text-blue-600 p-2">
                  <Book size={20} />
                </div>
                <div>
                  <p className="text-xs uppercase text-gray-500 font-semibold">
                    Total Courses
                  </p>
                  <p className="text-xl font-bold">{stats.total}</p>
                </div>
              </Space>
            </Card>
            <Card size="small">
              <Space>
                <div className="rounded-lg bg-green-100 text-green-600 p-2">
                  <Book size={20} />
                </div>
                <div>
                  <p className="text-xs uppercase text-gray-500 font-semibold">
                    Active Courses
                  </p>
                  <p className="text-xl font-bold">{stats.active}</p>
                </div>
              </Space>
            </Card>
            <Card size="small">
              <Space>
                <div className="rounded-lg bg-indigo-100 text-indigo-600 p-2">
                  <Users size={20} />
                </div>
                <div>
                  <p className="text-xs uppercase text-gray-500 font-semibold">
                    Total Enrollments
                  </p>
                  <p className="text-xl font-bold">{stats.totalEnrollments}</p>
                </div>
              </Space>
            </Card>
          </div>

          <Card>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">
                  Directory
                </p>
                <h2 className="text-lg font-bold text-gray-900">All Courses</h2>
              </div>
              <Space wrap>
                <Input
                  placeholder="Search by name or code..."
                  prefix={<Search size={14} className="text-gray-400" />}
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
                  placeholder="All Semesters"
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
                        `${range[0]}-${range[1]} of ${total} courses`,
                      onChange: (p, ps) => {
                        setCurrentPage(p);
                        setPageSize(ps);
                      },
                    }
                  : false
              }
              locale={{
                emptyText: searchTerm || filterSemester
                  ? "No courses found matching your filters"
                  : "No courses available. Create your first course to get started.",
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
