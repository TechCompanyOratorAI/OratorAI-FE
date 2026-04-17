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
  BookOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import SummaryMetrics, {
  SummaryMetricItem,
} from "@/components/Dashboard/SummaryMetrics";
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
  const { departments, loading } = useSelector(
    (state: RootState) => state.admin,
  );

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
      notifySuccess("Xóa thành công", "Đã xóa bộ môn thành công.");
    } catch {
      notifyError("Xóa thất bại", "Không thể xóa bộ môn.");
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
        notifySuccess("Cập nhật thành công", "Đã cập nhật bộ môn thành công.");
      } else {
        await dispatch(
          createDepartment({
            departmentCode: formData.departmentCode,
            departmentName: formData.departmentName,
            description: formData.description,
          }),
        ).unwrap();
        await dispatch(fetchDepartments());
        notifySuccess("Tạo thành công", "Đã tạo bộ môn thành công.");
      }
      setIsModalOpen(false);
      setSelectedDepartment(undefined);
    } catch {
      notifyError(
        selectedDepartment ? "Cập nhật thất bại" : "Tạo thất bại",
        selectedDepartment
          ? "Không thể cập nhật bộ môn."
          : "Không thể tạo bộ môn.",
      );
    }
    setActionLoading(false);
  };

  const filteredDepartments = useMemo(() => {
    return [...departments]
      .sort((left, right) => {
        const leftTime = left.createdAt
          ? new Date(left.createdAt).getTime()
          : 0;
        const rightTime = right.createdAt
          ? new Date(right.createdAt).getTime()
          : 0;
        return rightTime - leftTime;
      })
      .filter((department) => {
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

  const summaryItems: SummaryMetricItem[] = [
    {
      key: "total",
      title: "Tổng bộ môn",
      value: stats.total,
      icon: <BookOutlined style={{ fontSize: 20 }} />,
      tone: "blue",
      description: "Toàn hệ thống",
    },
    {
      key: "active",
      title: "Đang hoạt động",
      value: stats.active,
      icon: <CheckCircleOutlined style={{ fontSize: 20 }} />,
      tone: "green",
      description: "Sẵn sàng sử dụng",
    },
    {
      key: "inactive",
      title: "Không hoạt động",
      value: stats.inactive,
      icon: <ExclamationCircleOutlined style={{ fontSize: 20 }} />,
      tone: "red",
      description: "Cần rà soát",
    },
  ];

  const columns: ColumnsType<Department> = [
    {
      title: "Bộ môn",
      key: "department",
      render: (_, record) => (
        <div>
          <div className="font-semibold">{record.departmentName}</div>
          <div className="text-xs text-gray-400">{record.departmentCode}</div>
        </div>
      ),
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
      render: (val) => val || "-",
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
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (val?: string) => {
        if (!val) return "-";
        const date = new Date(val);
        if (Number.isNaN(date.getTime())) return "-";
        return date.toLocaleDateString("vi-VN", {
          year: "numeric",
          month: "short",
          day: "2-digit",
        });
      },
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EditOutlined style={{ fontSize: 14 }} />}
            onClick={() => handleEditDepartment(record)}
            className="text-blue-500 hover:text-blue-600"
          />
          <Popconfirm
            title="Xác nhận xóa bộ môn"
            description="Bạn có chắc muốn xóa bộ môn này? Hành động này không thể hoàn tác."
            onConfirm={() => handleDeleteDepartment(record.departmentId)}
            okText="Xóa"
            okButtonProps={{ danger: true, loading: actionLoading }}
            cancelText="Hủy"
          >
            <Button
              type="text"
              icon={<DeleteOutlined style={{ fontSize: 14 }} />}
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
                Quản trị
              </p>
              <h1 className="text-2xl font-bold text-gray-900">
                Quản lý bộ môn
              </h1>
              <p className="text-sm text-gray-600">
                Quản lý bộ môn, trạng thái và thông tin chi tiết.
              </p>
            </div>
            <Space>
              <Button
                icon={<ReloadOutlined style={{ fontSize: 14 }} />}
                onClick={() => dispatch(fetchDepartments())}
                loading={loading}
              >
                Làm mới
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined style={{ fontSize: 14 }} />}
                onClick={handleCreateDepartment}
              >
                Bộ môn mới
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
                <h2 className="text-lg font-bold text-gray-900">Bộ môn</h2>
              </div>
              <Space wrap>
                <Input
                  placeholder="Tìm theo mã, tên hoặc mô tả..."
                  prefix={<SearchOutlined className="text-gray-400" />}
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
                    { value: "all", label: "Tất cả trạng thái" },
                    { value: "active", label: "Đang hoạt động" },
                    { value: "inactive", label: "Không hoạt động" },
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
                  `${range[0]}-${range[1]} trên tổng ${total} bộ môn`,
                onChange: (p, ps) => {
                  setPage(p);
                  setPageSize(ps);
                },
              }}
              locale={{
                emptyText:
                  searchTerm || filterStatus !== "all"
                    ? "Không tìm thấy bộ môn phù hợp bộ lọc"
                    : "Chưa có bộ môn nào. Hãy tạo bộ môn đầu tiên để bắt đầu.",
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
