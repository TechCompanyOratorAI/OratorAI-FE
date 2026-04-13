import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
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
import {
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  Search,
  Building2,
} from "lucide-react";
import SidebarAdmin from "@/components/Sidebar/SidebarAdmin/SidebarAdmin";
import DepartmentModal, {
  DepartmentFormData,
} from "@/components/Department/DepartmentModal";
import {
  fetchDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  Department,
} from "@/services/features/admin/adminSlice";
import { AppDispatch, RootState } from "@/services/store/store";

const AdminDepartmentPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { departments, loading } = useSelector((state: RootState) => state.admin);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<
    Department | undefined
  >();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [actionLoading, setActionLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { message: antdMessage } = App.useApp();

  useEffect(() => {
    dispatch(fetchDepartments());
  }, [dispatch]);

  const handleCreateDepartment = () => {
    setSelectedDepartment(undefined);
    setIsModalOpen(true);
  };

  const handleEditDepartment = (department: Department) => {
    setSelectedDepartment(department);
    setIsModalOpen(true);
  };

  const handleDeleteDepartment = async (departmentId: number) => {
    setActionLoading(true);
    try {
      await dispatch(deleteDepartment(departmentId.toString())).unwrap();
      await dispatch(fetchDepartments());
      antdMessage.success("Department deleted successfully");
    } catch {
      antdMessage.error("Failed to delete department");
    }
    setActionLoading(false);
  };

  const handleSubmitDepartment = async (formData: DepartmentFormData) => {
    setActionLoading(true);
    try {
      if (selectedDepartment) {
        await dispatch(
          updateDepartment({
            departmentId: selectedDepartment.departmentId.toString(),
            departmentName: formData.departmentName,
            description: formData.description,
            isActive: formData.isActive,
          }),
        ).unwrap();
        await dispatch(fetchDepartments());
        antdMessage.success("Department updated successfully");
      } else {
        await dispatch(
          createDepartment({
            departmentCode: formData.departmentCode,
            departmentName: formData.departmentName,
            description: formData.description,
          }),
        ).unwrap();
        await dispatch(fetchDepartments());
        antdMessage.success("Department created successfully");
      }
      setIsModalOpen(false);
      setSelectedDepartment(undefined);
    } catch {
      antdMessage.error(
        selectedDepartment
          ? "Failed to update department"
          : "Failed to create department",
      );
    }
    setActionLoading(false);
  };

  const filteredDepartments = useMemo(() => {
    return departments.filter((department) => {
      const matchesSearch =
        department.departmentCode
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        department.departmentName
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (department.description || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "active" && department.isActive) ||
        (filterStatus === "inactive" && !department.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [departments, searchTerm, filterStatus]);

  const stats = useMemo(() => {
    const total = departments.length;
    const active = departments.filter((d) => d.isActive).length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [departments]);

  const columns: ColumnsType<Department> = [
    {
      title: "Department",
      key: "department",
      render: (_, record) => (
        <div>
          <div className="font-semibold">{record.departmentName}</div>
          <div className="text-xs text-gray-400">{record.departmentCode}</div>
        </div>
      ),
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      render: (val) => val || "-",
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
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (val?: string) => {
        if (!val) return "-";
        const date = new Date(val);
        if (Number.isNaN(date.getTime())) return "-";
        return date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "2-digit",
        });
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="text"
            icon={<Edit2 size={14} />}
            onClick={() => handleEditDepartment(record)}
            className="text-blue-500 hover:text-blue-600"
          />
          <Popconfirm
            title="Delete Department"
            description="Are you sure you want to delete this department? This action cannot be undone."
            onConfirm={() => handleDeleteDepartment(record.departmentId)}
            okText="Delete"
            okButtonProps={{ danger: true, loading: actionLoading }}
            cancelText="Cancel"
          >
            <Button
              type="text"
              icon={<Trash2 size={14} />}
              danger
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarAdmin activeItem="manage-departments" />
      <main className="flex-1 overflow-y-auto p-6 sm:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">
                Administration
              </p>
              <h1 className="text-2xl font-bold text-gray-900">
                Department Management
              </h1>
              <p className="text-sm text-gray-600">
                Manage departments, status, and details.
              </p>
            </div>
            <Space>
              <Button
                icon={<RefreshCw size={14} />}
                onClick={() => dispatch(fetchDepartments())}
                loading={loading}
              >
                Refresh
              </Button>
              <Button
                type="primary"
                icon={<Plus size={14} />}
                onClick={handleCreateDepartment}
              >
                New Department
              </Button>
            </Space>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card size="small">
              <Space>
                <div className="rounded-lg bg-blue-100 text-blue-600 p-2">
                  <Building2 size={20} />
                </div>
                <div>
                  <p className="text-xs uppercase text-gray-500 font-semibold">
                    Total Departments
                  </p>
                  <p className="text-xl font-bold">{stats.total}</p>
                </div>
              </Space>
            </Card>
            <Card size="small">
              <Space>
                <div className="rounded-lg bg-green-100 text-green-600 p-2">
                  <Building2 size={20} />
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
                <div className="rounded-lg bg-red-100 text-red-600 p-2">
                  <Building2 size={20} />
                </div>
                <div>
                  <p className="text-xs uppercase text-gray-500 font-semibold">
                    Inactive
                  </p>
                  <p className="text-xl font-bold">{stats.inactive}</p>
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
                <h2 className="text-lg font-bold text-gray-900">Departments</h2>
              </div>
              <Space wrap>
                <Input
                  placeholder="Search by code, name, or description..."
                  prefix={<Search size={14} className="text-gray-400" />}
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                  className="w-full sm:w-64"
                  allowClear
                />
                <Select
                  value={filterStatus}
                  onChange={(val) => {
                    setFilterStatus(val);
                    setPage(1);
                  }}
                  style={{ width: 140 }}
                  options={[
                    { value: "all", label: "All status" },
                    { value: "active", label: "Active" },
                    { value: "inactive", label: "Inactive" },
                  ]}
                />
              </Space>
            </div>

            <Table
              columns={columns}
              dataSource={filteredDepartments}
              rowKey="departmentId"
              loading={loading}
              pagination={{
                current: page,
                pageSize,
                total: filteredDepartments.length,
                showSizeChanger: true,
                showQuickJumper: false,
                pageSizeOptions: ["10", "20", "50"],
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} of ${total} departments`,
                onChange: (p, ps) => {
                  setPage(p);
                  setPageSize(ps);
                },
              }}
              locale={{
                emptyText: searchTerm || filterStatus !== "all"
                  ? "No departments found matching your filters"
                  : "No departments available. Create your first department to get started.",
              }}
            />
          </Card>
        </div>
      </main>

      <DepartmentModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedDepartment(undefined);
        }}
        onSubmit={handleSubmitDepartment}
        initialData={selectedDepartment}
        isLoading={actionLoading}
      />
    </div>
  );
};

export default AdminDepartmentPage;
