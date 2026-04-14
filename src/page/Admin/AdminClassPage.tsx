import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ReadOutlined,
  ReloadOutlined,
  SearchOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  UsergroupAddOutlined,
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
import SidebarAdmin from "@/components/Sidebar/SidebarAdmin/SidebarAdmin";
import ClassModal from "@/components/Course/ClassModal";
import InstructorModal from "@/components/Course/InstructorModal";
import {
  fetchClasses,
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

const AdminClassPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { classes, loading, pagination } = useSelector(
    (state: RootState) => state.class,
  );
  const { users } = useSelector((state: RootState) => state.admin);
  const { courses = [] } = useSelector((state: RootState) => state.course);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInstructorModalOpen, setIsInstructorModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassData | undefined>();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "active" | "inactive" | "archived"
  >("all");
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

  useEffect(() => {
    dispatch(fetchClasses({ page: currentPage, limit: pageSize }));
  }, [dispatch, currentPage, pageSize]);

  useEffect(() => {
    dispatch(fetchCourses({ page: 1, limit: 100 }));
  }, [dispatch]);

  const handleCreateClass = () => {
    setSelectedClass(undefined);
    setIsModalOpen(true);
  };

  const handleEditClass = (classData: ClassData) => {
    setSelectedClass(classData);
    setIsModalOpen(true);
  };

  const handleDeleteClass = async (classId: number) => {
    setActionLoading(true);
    try {
      await dispatch(deleteClass(classId)).unwrap();
      await dispatch(fetchClasses({ page: currentPage, limit: pageSize }));
      notifySuccess("Delete Success", "Class deleted successfully.");
    } catch {
      notifyError("Delete Failed", "Failed to delete class.");
    }
    setActionLoading(false);
  };

  const handleSubmitClass = async (formData: any) => {
    setActionLoading(true);
    try {
      if (selectedClass) {
        await dispatch(
          updateClass({
            classId: selectedClass.classId,
            classData: formData,
          }),
        ).unwrap();
        await dispatch(fetchClasses({ page: currentPage, limit: pageSize }));
        notifySuccess("Update Success", "Class updated successfully.");
      } else {
        await dispatch(createClass(formData)).unwrap();
        await dispatch(fetchClasses({ page: currentPage, limit: pageSize }));
        notifySuccess("Create Success", "Class created successfully.");
      }
      setIsModalOpen(false);
      setSelectedClass(undefined);
    } catch {
      notifyError(
        selectedClass ? "Update Failed" : "Create Failed",
        selectedClass ? "Failed to update class." : "Failed to create class.",
      );
    }
    setActionLoading(false);
  };

  const handleManageInstructors = async (classData: ClassData) => {
    setSelectedClass(classData);
    setIsInstructorModalOpen(true);
    await dispatch(fetchInstructorByClass(classData.courseId.toString()));
  };

  const handleAddInstructor = async (userId: number) => {
    if (!selectedClass) return;
    try {
      await dispatch(
        addInstructorToClass({
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
      notifySuccess("Add Instructor Success", "Instructor added successfully.");
    } catch {
      notifyError("Add Instructor Failed", "Failed to add instructor.");
    }
  };

  const handleRemoveInstructor = async (userId: number) => {
    if (!selectedClass) return;
    try {
      await dispatch(
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
        "Remove Instructor Success",
        "Instructor removed successfully.",
      );
    } catch {
      notifyError("Remove Instructor Failed", "Failed to remove instructor.");
    }
  };

  const filteredClasses = useMemo(
    () =>
      classes.filter((classItem: ClassData) => {
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

        return matchesSearch && matchesStatus;
      }),
    [classes, searchTerm, filterStatus],
  );

  const stats = useMemo(() => {
    const total = classes.length;
    const active = classes.filter(
      (c: ClassData) => c.status === "active",
    ).length;
    const totalStudents = classes.reduce(
      (sum: number, c: ClassData) => sum + (c.enrollmentCount || 0),
      0,
    );
    return { total, active, totalStudents };
  }, [classes]);

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
    searchTerm || filterStatus !== "all"
      ? filteredClasses.length
      : filteredClasses.length > pageSize &&
          filteredClasses.length < pagination.total
        ? filteredClasses.length
        : pagination.total;

  const columns: ColumnsType<ClassData> = [
    {
      title: "Class",
      key: "class",
      render: (_, record) => (
        <div className="font-semibold">{record.classCode}</div>
      ),
    },
    {
      title: "Course",
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
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (val: string) => (
        <Tag color={statusColor(val || "unknown")}>
          {val ? val.charAt(0).toUpperCase() + val.slice(1) : "Unknown"}
        </Tag>
      ),
    },
    {
      title: "Enrollment",
      key: "enrollment",
      render: (_, record) => (
        <span>
          {record.enrollmentCount} / {record.maxStudents}
        </span>
      ),
    },
    {
      title: "Instructors",
      key: "instructors",
      render: (_, record) => {
        if (!record.instructors || record.instructors.length === 0) {
          return (
            <span className="text-gray-400 italic text-xs">
              No instructor assigned
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
      title: "Start Date",
      dataIndex: "startDate",
      key: "startDate",
      render: (val) => new Date(val).toLocaleDateString(),
    },
    {
      title: "Actions",
      key: "actions",
      width: 140,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="text"
            icon={<UsergroupAddOutlined style={{ fontSize: 14 }} />}
            onClick={() => handleManageInstructors(record)}
            className="text-green-500 hover:text-green-600"
            title="Manage Instructors"
          />
          <Button
            type="text"
            icon={<EditOutlined style={{ fontSize: 14 }} />}
            onClick={() => handleEditClass(record)}
            className="text-blue-500 hover:text-blue-600"
            title="Edit"
          />
          <Popconfirm
            title="Delete Class"
            description="Are you sure you want to delete this class? This action cannot be undone."
            onConfirm={() => handleDeleteClass(record.classId)}
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
      <SidebarAdmin activeItem="manage-classes" />
      <main className="flex-1 overflow-y-auto p-6 sm:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">
                Administration
              </p>
              <h1 className="text-2xl font-bold text-gray-900">
                Class Management
              </h1>
              <p className="text-sm text-gray-600">
                Manage classes, instructors, and student enrollments.
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
                Refresh
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined style={{ fontSize: 14 }} />}
                onClick={handleCreateClass}
              >
                New Class
              </Button>
            </Space>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card size="small">
              <Space>
                <div className="rounded-lg bg-blue-100 text-blue-600 p-2">
                  <ReadOutlined style={{ fontSize: 20 }} />
                </div>
                <div>
                  <p className="text-xs uppercase text-gray-500 font-semibold">
                    Total Classes
                  </p>
                  <p className="text-xl font-bold">{stats.total}</p>
                </div>
              </Space>
            </Card>
            <Card size="small">
              <Space>
                <div className="rounded-lg bg-green-100 text-green-600 p-2">
                  <CheckCircleOutlined style={{ fontSize: 20 }} />
                </div>
                <div>
                  <p className="text-xs uppercase text-gray-500 font-semibold">
                    Active
                  </p>
                  <p className="text-xl font-bold">{stats.active}</p>
                </div>
              </Space>
            </Card>
            <Card size="small">
              <Space>
                <div className="rounded-lg bg-indigo-100 text-indigo-600 p-2">
                  <TeamOutlined style={{ fontSize: 20 }} />
                </div>
                <div>
                  <p className="text-xs uppercase text-gray-500 font-semibold">
                    Total Students
                  </p>
                  <p className="text-xl font-bold">{stats.totalStudents}</p>
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
                <h2 className="text-lg font-bold text-gray-900">Classes</h2>
              </div>
              <Space wrap>
                <Input
                  placeholder="Search by code, name, or course..."
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
                    { value: "all", label: "All status" },
                    { value: "active", label: "Active" },
                    { value: "inactive", label: "Inactive" },
                    { value: "archived", label: "Archived" },
                  ]}
                />
              </Space>
            </div>

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
                        `${range[0]}-${range[1]} of ${total} classes`,
                      onChange: (p, ps) => {
                        setCurrentPage(p);
                        setPageSize(ps);
                      },
                    }
                  : false
              }
              locale={{
                emptyText:
                  searchTerm || filterStatus !== "all"
                    ? "No classes found matching your filters"
                    : "No classes available. Create your first class to get started.",
              }}
            />
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
    </div>
  );
};

export default AdminClassPage;
