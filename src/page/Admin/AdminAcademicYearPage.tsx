import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  App,
  Button,
  Card,
  Checkbox,
  DatePicker,
  Divider,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  PartitionOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import SidebarAdmin from "@/components/Sidebar/SidebarAdmin/SidebarAdmin";
import SummaryMetrics, {
  SummaryMetricItem,
} from "@/components/Dashboard/SummaryMetrics";
import { api } from "@/services/constant/axiosInstance";
import {
  ACADEMIC_BLOCKS_BULK_ENDPOINT,
  ACADEMIC_BLOCKS_ENDPOINT,
  ACADEMIC_YEARS_ENDPOINT,
  CURRENT_ACADEMIC_BLOCK_ENDPOINT,
  DELETE_ACADEMIC_BLOCK_ENDPOINT,
  DELETE_ACADEMIC_YEAR_ENDPOINT,
  UPDATE_ACADEMIC_BLOCK_ENDPOINT,
  UPDATE_ACADEMIC_YEAR_ENDPOINT,
} from "@/services/constant/apiConfig";
import { extractLocalizedMessage } from "@/lib/utils";

interface AcademicYear {
  academicYearId: number;
  year: number;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface AcademicYearFormValues {
  year: number;
  name: string;
  isActive: boolean;
}

interface AcademicBlock {
  academicBlockId: number;
  academicYearId: number;
  blockCode: string;
  term: "SPRING" | "SUMMER" | "FALL";
  half: "H1" | "H2" | null;
  blockType: "NORMAL" | "BLOCK3";
  startDate: string;
  endDate: string;
  isActive: boolean;
}

interface AcademicBlockFormValues {
  term: "SPRING" | "SUMMER" | "FALL";
  blockType: "NORMAL" | "BLOCK3";
  half?: "H1" | "H2";
  startDate: dayjs.Dayjs;
  endDate: dayjs.Dayjs;
  isActive: boolean;
}

interface BulkBlockFormValues {
  term: "SPRING" | "SUMMER" | "FALL";
  includeH1: boolean;
  h1StartDate: dayjs.Dayjs;
  h1EndDate: dayjs.Dayjs;
  h1Active: boolean;
  includeH2: boolean;
  h2StartDate: dayjs.Dayjs;
  h2EndDate: dayjs.Dayjs;
  h2Active: boolean;
  includeB3: boolean;
  b3StartDate: dayjs.Dayjs;
  b3EndDate: dayjs.Dayjs;
  b3Active: boolean;
}

const AdminAcademicYearPage: React.FC = () => {
  const { notification } = App.useApp();
  const [yearForm] = Form.useForm<AcademicYearFormValues>();
  const [blockForm] = Form.useForm<AcademicBlockFormValues>();
  const [bulkForm] = Form.useForm<BulkBlockFormValues>();

  const [years, setYears] = useState<AcademicYear[]>([]);
  const [blocks, setBlocks] = useState<AcademicBlock[]>([]);
  const [currentBlock, setCurrentBlock] = useState<AcademicBlock | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [blocksLoading, setBlocksLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">(
    "all",
  );
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState<AcademicYear | null>(null);
  const [selectedYearForBlocks, setSelectedYearForBlocks] =
    useState<AcademicYear | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<AcademicBlock | null>(null);
  const [isBlocksModalOpen, setIsBlocksModalOpen] = useState(false);
  const [isBlockFormModalOpen, setIsBlockFormModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [includeH1, setIncludeH1] = useState(true);
  const [includeH2, setIncludeH2] = useState(false);
  const [includeB3, setIncludeB3] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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

  const buildYearDateRange = (year: number) => {
    const normalizedYear = Number(year);
    return {
      startDate: `${normalizedYear}-01-01`,
      endDate: `${normalizedYear}-12-31`,
    };
  };

  const fetchAcademicYears = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get(ACADEMIC_YEARS_ENDPOINT);
      const payload = response.data as { data?: AcademicYear[] };
      setYears(Array.isArray(payload?.data) ? payload.data : []);
    } catch (error: any) {
      notifyError(
        "Tải dữ liệu thất bại",
        extractLocalizedMessage(
          error?.response?.data || error,
          "Không thể tải danh sách niên khóa.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [notification]);

  const fetchCurrentAcademicBlock = useCallback(async () => {
    try {
      const response = await api.get(CURRENT_ACADEMIC_BLOCK_ENDPOINT);
      const payload = response.data as { data?: AcademicBlock | null };
      setCurrentBlock(payload?.data || null);
    } catch {
      setCurrentBlock(null);
    }
  }, []);

  const fetchAcademicBlocks = useCallback(
    async (academicYearId: number) => {
      setBlocksLoading(true);
      try {
        const response = await api.get(
          `${ACADEMIC_BLOCKS_ENDPOINT}?academicYearId=${academicYearId}`,
        );
        const payload = response.data as { data?: AcademicBlock[] };
        setBlocks(Array.isArray(payload?.data) ? payload.data : []);
      } catch (error: any) {
        notifyError(
          "Tải kỳ học thất bại",
          extractLocalizedMessage(
            error?.response?.data || error,
            "Không thể tải danh sách kỳ học.",
          ),
        );
      } finally {
        setBlocksLoading(false);
      }
    },
    [notification],
  );

  useEffect(() => {
    fetchAcademicYears();
    fetchCurrentAcademicBlock();
  }, [fetchAcademicYears, fetchCurrentAcademicBlock]);

  const handleOpenCreate = () => {
    setSelectedYear(null);
    yearForm.setFieldsValue({
      year: new Date().getFullYear(),
      name: "",
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (record: AcademicYear) => {
    setSelectedYear(record);
    yearForm.setFieldsValue({
      year: record.year,
      name: record.name,
      isActive: record.isActive,
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedYear(null);
    yearForm.resetFields();
  };

  const handleSubmit = async () => {
    try {
      const values = await yearForm.validateFields();
      const payload = {
        ...values,
        ...buildYearDateRange(values.year),
      };
      setActionLoading(true);

      if (selectedYear) {
        const response = await api.patch(
          UPDATE_ACADEMIC_YEAR_ENDPOINT(String(selectedYear.academicYearId)),
          payload,
        );
        notifySuccess(
          "Cập nhật thành công",
          extractLocalizedMessage(
            response.data,
            "Cập nhật niên khóa thành công.",
          ),
        );
      } else {
        const response = await api.post(ACADEMIC_YEARS_ENDPOINT, payload);
        notifySuccess(
          "Tạo thành công",
          extractLocalizedMessage(response.data, "Tạo niên khóa thành công."),
        );
      }

      handleCloseModal();
      await fetchAcademicYears();
    } catch (error: any) {
      if (error?.errorFields) return;
      notifyError(
        selectedYear ? "Cập nhật thất bại" : "Tạo thất bại",
        extractLocalizedMessage(
          error?.response?.data || error,
          selectedYear
            ? "Không thể cập nhật niên khóa."
            : "Không thể tạo niên khóa.",
        ),
      );
    } finally {
      setActionLoading(false);
    }
  };

  const openBlocksModal = async (academicYear: AcademicYear) => {
    setSelectedYearForBlocks(academicYear);
    setIsBlocksModalOpen(true);
    await fetchAcademicBlocks(academicYear.academicYearId);
  };

  const closeBlocksModal = () => {
    setIsBlocksModalOpen(false);
    setSelectedYearForBlocks(null);
    setBlocks([]);
  };

  const openCreateBulkModal = () => {
    if (!selectedYearForBlocks) return;
    setIsBulkModalOpen(true);
    setIncludeH1(true);
    setIncludeH2(false);
    setIncludeB3(false);
    bulkForm.setFieldsValue({
      term: "SPRING",
      includeH1: true,
      includeH2: false,
      includeB3: false,
      h1Active: true,
      h2Active: true,
      b3Active: true,
    });
  };

  const handleSubmitBulk = async () => {
    if (!selectedYearForBlocks) return;
    try {
      const values = await bulkForm.validateFields();
      const selectedBlockCount = [includeH1, includeH2, includeB3].filter(
        Boolean,
      ).length;
      if (selectedBlockCount === 0) {
        notifyError(
          "Thiếu dữ liệu",
          "Vui lòng chọn ít nhất một block để tạo.",
        );
        return;
      }
      setActionLoading(true);
      const blocksPayload: Array<{
        half?: "H1" | "H2";
        blockType: "NORMAL" | "BLOCK3";
        startDate: string;
        endDate: string;
        isActive: boolean;
      }> = [];

      if (includeH1) {
        blocksPayload.push({
          half: "H1",
          blockType: "NORMAL",
          startDate: values.h1StartDate.format("YYYY-MM-DD"),
          endDate: values.h1EndDate.format("YYYY-MM-DD"),
          isActive: values.h1Active,
        });
      }

      if (includeH2) {
        blocksPayload.push({
          half: "H2",
          blockType: "NORMAL",
          startDate: values.h2StartDate.format("YYYY-MM-DD"),
          endDate: values.h2EndDate.format("YYYY-MM-DD"),
          isActive: values.h2Active,
        });
      }

      if (includeB3) {
        blocksPayload.push({
          blockType: "BLOCK3",
          startDate: values.b3StartDate.format("YYYY-MM-DD"),
          endDate: values.b3EndDate.format("YYYY-MM-DD"),
          isActive: values.b3Active,
        });
      }

      const payload = {
        academicYearId: selectedYearForBlocks.academicYearId,
        term: values.term,
        blocks: blocksPayload,
      };
      const response = await api.post(ACADEMIC_BLOCKS_BULK_ENDPOINT, payload);
      notifySuccess(
        "Tạo kỳ học thành công",
        extractLocalizedMessage(response.data, "Đã tạo kỳ học theo term."),
      );
      setIsBulkModalOpen(false);
      bulkForm.resetFields();
      await fetchAcademicBlocks(selectedYearForBlocks.academicYearId);
      await fetchAcademicYears();
      await fetchCurrentAcademicBlock();
    } catch (error: any) {
      if (error?.errorFields) return;
      notifyError(
        "Tạo kỳ học thất bại",
        extractLocalizedMessage(
          error?.response?.data || error,
          "Không thể tạo kỳ học.",
        ),
      );
    } finally {
      setActionLoading(false);
    }
  };

  const openEditBlockModal = (block: AcademicBlock) => {
    setSelectedBlock(block);
    blockForm.setFieldsValue({
      term: block.term,
      blockType: block.blockType,
      half: block.half || undefined,
      startDate: dayjs(block.startDate),
      endDate: dayjs(block.endDate),
      isActive: block.isActive,
    });
    setIsBlockFormModalOpen(true);
  };

  const closeEditBlockModal = () => {
    setIsBlockFormModalOpen(false);
    setSelectedBlock(null);
    blockForm.resetFields();
  };

  const handleUpdateBlock = async () => {
    if (!selectedBlock) return;
    try {
      const values = await blockForm.validateFields();
      setActionLoading(true);
      const payload = {
        term: values.term,
        blockType: values.blockType,
        half: values.blockType === "BLOCK3" ? null : values.half,
        startDate: values.startDate.format("YYYY-MM-DD"),
        endDate: values.endDate.format("YYYY-MM-DD"),
        isActive: values.isActive,
      };
      const response = await api.patch(
        UPDATE_ACADEMIC_BLOCK_ENDPOINT(String(selectedBlock.academicBlockId)),
        payload,
      );
      notifySuccess(
        "Cập nhật thành công",
        extractLocalizedMessage(response.data, "Cập nhật kỳ học thành công."),
      );
      closeEditBlockModal();
      if (selectedYearForBlocks) {
        await fetchAcademicBlocks(selectedYearForBlocks.academicYearId);
      }
      await fetchAcademicYears();
      await fetchCurrentAcademicBlock();
    } catch (error: any) {
      if (error?.errorFields) return;
      notifyError(
        "Cập nhật thất bại",
        extractLocalizedMessage(
          error?.response?.data || error,
          "Không thể cập nhật kỳ học.",
        ),
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteBlock = async (block: AcademicBlock) => {
    setActionLoading(true);
    try {
      const response = await api.delete(
        DELETE_ACADEMIC_BLOCK_ENDPOINT(String(block.academicBlockId)),
      );
      notifySuccess(
        "Xóa thành công",
        extractLocalizedMessage(response.data, "Đã xóa kỳ học."),
      );
      if (selectedYearForBlocks) {
        await fetchAcademicBlocks(selectedYearForBlocks.academicYearId);
      }
      await fetchAcademicYears();
      await fetchCurrentAcademicBlock();
    } catch (error: any) {
      notifyError(
        "Xóa thất bại",
        extractLocalizedMessage(
          error?.response?.data || error,
          "Không thể xóa kỳ học.",
        ),
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (record: AcademicYear) => {
    setActionLoading(true);
    try {
      const response = await api.delete(
        DELETE_ACADEMIC_YEAR_ENDPOINT(String(record.academicYearId)),
      );
      notifySuccess(
        "Xóa thành công",
        extractLocalizedMessage(response.data, "Niên khóa đã được xóa."),
      );
      await fetchAcademicYears();
    } catch (error: any) {
      notifyError(
        "Xóa thất bại",
        extractLocalizedMessage(
          error?.response?.data || error,
          "Không thể xóa niên khóa.",
        ),
      );
    } finally {
      setActionLoading(false);
    }
  };

  const filteredYears = useMemo(() => {
    return [...years]
      .sort((left, right) => {
        const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0;
        const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0;
        return sortOrder === "newest" ? rightTime - leftTime : leftTime - rightTime;
      })
      .filter((yearItem) => {
        const searchText = searchTerm.toLowerCase();
        const matchesSearch =
          String(yearItem.year).includes(searchText) ||
          yearItem.name.toLowerCase().includes(searchText) ||
          yearItem.startDate.toLowerCase().includes(searchText) ||
          yearItem.endDate.toLowerCase().includes(searchText);
        const matchesStatus =
          filterStatus === "all" ||
          (filterStatus === "active" && yearItem.isActive) ||
          (filterStatus === "inactive" && !yearItem.isActive);
        return matchesSearch && matchesStatus;
      });
  }, [years, searchTerm, filterStatus, sortOrder]);

  const stats = useMemo(() => {
    const total = years.length;
    const active = years.filter((item) => item.isActive).length;
    return {
      total,
      active,
      inactive: total - active,
    };
  }, [years]);

  const summaryItems: SummaryMetricItem[] = [
    {
      key: "total-years",
      title: "Tổng niên khóa",
      value: stats.total,
      icon: <CalendarOutlined style={{ fontSize: 20 }} />,
      tone: "blue",
      description: "Toàn hệ thống",
    },
    {
      key: "active-years",
      title: "Đang hoạt động",
      value: stats.active,
      icon: <CheckCircleOutlined style={{ fontSize: 20 }} />,
      tone: "green",
      description: "Đang được sử dụng",
    },
    {
      key: "inactive-years",
      title: "Không hoạt động",
      value: stats.inactive,
      icon: <ExclamationCircleOutlined style={{ fontSize: 20 }} />,
      tone: "red",
      description: "Đã ngưng sử dụng",
    },
  ];

  const columns: ColumnsType<AcademicYear> = [
    {
      title: "Năm",
      dataIndex: "year",
      key: "year",
      width: 100,
      render: (value: number) => <span className="font-semibold">{value}</span>,
    },
    {
      title: "Tên niên khóa",
      dataIndex: "name",
      key: "name",
      render: (value: string) => value || "-",
    },
    {
      title: "Thời gian",
      key: "duration",
      render: (_, record) => (
        <div className="text-sm">
          {record.startDate} - {record.endDate}
        </div>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "isActive",
      key: "isActive",
      width: 150,
      render: (isActive: boolean) => (
        <Tag color={isActive ? "green" : "red"}>
          {isActive ? "Đang hoạt động" : "Không hoạt động"}
        </Tag>
      ),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 130,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="text"
            icon={<PartitionOutlined style={{ fontSize: 14 }} />}
            className="text-violet-600 hover:text-violet-700"
            onClick={() => openBlocksModal(record)}
            title="Quản lý kỳ học"
          />
          <Button
            type="text"
            icon={<EditOutlined style={{ fontSize: 14 }} />}
            className="text-blue-500 hover:text-blue-600"
            onClick={() => handleOpenEdit(record)}
            title="Sửa niên khóa"
          />
          <Popconfirm
            title="Xác nhận xóa niên khóa"
            description="Bạn có chắc muốn xóa niên khóa này? Hành động này không thể hoàn tác."
            onConfirm={() => handleDelete(record)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ loading: actionLoading, danger: true }}
          >
            <Button
              type="text"
              icon={<DeleteOutlined style={{ fontSize: 14 }} />}
              danger
              title="Xóa niên khóa"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const blockColumns: ColumnsType<AcademicBlock> = [
    {
      title: "Mã block",
      dataIndex: "blockCode",
      key: "blockCode",
      render: (value: string) => <span className="font-semibold">{value}</span>,
    },
    {
      title: "Term",
      dataIndex: "term",
      key: "term",
      width: 110,
      render: (value: string) => <Tag color="blue">{value}</Tag>,
    },
    {
      title: "Loại",
      key: "type",
      width: 130,
      render: (_, record) => (
        <Tag color={record.blockType === "BLOCK3" ? "purple" : "geekblue"}>
          {record.blockType === "BLOCK3"
            ? "BLOCK3"
            : `NORMAL ${record.half || ""}`.trim()}
        </Tag>
      ),
    },
    {
      title: "Thời gian",
      key: "duration",
      render: (_, record) => `${record.startDate} - ${record.endDate}`,
    },
    {
      title: "Trạng thái",
      dataIndex: "isActive",
      key: "isActive",
      width: 140,
      render: (isActive: boolean) => (
        <Tag color={isActive ? "green" : "red"}>
          {isActive ? "Đang hoạt động" : "Không hoạt động"}
        </Tag>
      ),
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
            onClick={() => openEditBlockModal(record)}
            title="Sửa kỳ học"
          />
          <Popconfirm
            title="Xác nhận xóa kỳ học"
            description="Bạn có chắc muốn xóa kỳ học này?"
            onConfirm={() => handleDeleteBlock(record)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true, loading: actionLoading }}
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined style={{ fontSize: 14 }} />}
              title="Xóa kỳ học"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarAdmin activeItem="manage-academic-years" />
      <main className="flex-1 overflow-y-auto p-6 sm:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">
                Quản trị
              </p>
              <h1 className="text-2xl font-bold text-gray-900">
                Quản lý niên khóa
              </h1>
              <p className="text-sm text-gray-600">
                Tạo và cập nhật niên khóa cho toàn hệ thống.
              </p>
            </div>
            <Space>
              {currentBlock && (
                <Tag
                  color="processing"
                  icon={<ClockCircleOutlined />}
                  className="!px-3 !py-1 !rounded-full"
                >
                  Current: {currentBlock.blockCode}
                </Tag>
              )}
              <Button
                icon={<ReloadOutlined style={{ fontSize: 14 }} />}
                onClick={async () => {
                  await fetchAcademicYears();
                  await fetchCurrentAcademicBlock();
                }}
                loading={loading}
              >
                Làm mới
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined style={{ fontSize: 14 }} />}
                onClick={handleOpenCreate}
              >
                Niên khóa mới
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
                <h2 className="text-lg font-bold text-gray-900">Niên khóa</h2>
              </div>
              <Space wrap>
                <Input
                  placeholder="Tìm theo năm, tên hoặc ngày..."
                  prefix={<SearchOutlined className="text-gray-400" />}
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                  className="w-full sm:w-72"
                  allowClear
                />
                <Select
                  value={filterStatus}
                  onChange={(val) => {
                    setFilterStatus(val);
                    setPage(1);
                  }}
                  style={{ width: 160 }}
                  options={[
                    { value: "all", label: "Tất cả trạng thái" },
                    { value: "active", label: "Đang hoạt động" },
                    { value: "inactive", label: "Không hoạt động" },
                  ]}
                />
                <Select
                  value={sortOrder}
                  onChange={(val) => {
                    setSortOrder(val);
                    setPage(1);
                  }}
                  style={{ width: 130 }}
                  options={[
                    { value: "newest", label: "Mới nhất" },
                    { value: "oldest", label: "Cũ nhất" },
                  ]}
                />
              </Space>
            </div>

            <Table
              columns={columns}
              dataSource={filteredYears}
              rowKey="academicYearId"
              loading={loading}
              pagination={{
                current: page,
                pageSize,
                total: filteredYears.length,
                showSizeChanger: true,
                showQuickJumper: false,
                pageSizeOptions: ["10", "20", "50"],
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} trên tổng ${total} niên khóa`,
                onChange: (nextPage, nextPageSize) => {
                  setPage(nextPage);
                  setPageSize(nextPageSize);
                },
              }}
            />
          </Card>
        </div>
      </main>

      <Modal
        title={selectedYear ? "Cập nhật niên khóa" : "Tạo niên khóa mới"}
        open={isModalOpen}
        onCancel={handleCloseModal}
        onOk={handleSubmit}
        confirmLoading={actionLoading}
        okText={selectedYear ? "Cập nhật" : "Tạo mới"}
        cancelText="Hủy"
        destroyOnClose
      >
        <Form form={yearForm} layout="vertical">
          <Form.Item
            name="year"
            label="Năm"
            rules={[
              { required: true, message: "Vui lòng nhập năm." },
              { type: "number", min: 2000, message: "Năm không hợp lệ." },
            ]}
          >
            <InputNumber
              className="w-full"
              min={2000}
              max={9999}
              placeholder="Ví dụ: 2026"
              controls={false}
            />
          </Form.Item>

          <Form.Item
            name="name"
            label="Tên niên khóa"
            rules={[{ required: true, message: "Vui lòng nhập tên niên khóa." }]}
          >
            <Input placeholder="Ví dụ: Năm học 2026-2027" />
          </Form.Item>

          <Form.Item
            name="isActive"
            label="Kích hoạt"
            valuePropName="checked"
            initialValue
          >
            <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`Quản lý kỳ học - ${selectedYearForBlocks?.name || ""}`}
        open={isBlocksModalOpen}
        onCancel={closeBlocksModal}
        footer={null}
        width={1000}
        destroyOnClose
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Typography.Text type="secondary">
              Quản lý block cho niên khóa đã chọn.
            </Typography.Text>
            <Space>
              <Button onClick={openCreateBulkModal} type="primary" icon={<PlusOutlined />}>
                Tạo kỳ học theo niên khóa
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={() =>
                  selectedYearForBlocks &&
                  fetchAcademicBlocks(selectedYearForBlocks.academicYearId)
                }
                loading={blocksLoading}
              >
                Làm mới
              </Button>
            </Space>
          </div>
          <Divider className="!my-2" />
          <Table
            rowKey="academicBlockId"
            columns={blockColumns}
            dataSource={blocks}
            loading={blocksLoading}
            pagination={{ pageSize: 8 }}
          />
        </div>
      </Modal>

      <Modal
        title="Tạo kỳ học theo niên khóa"
        open={isBulkModalOpen}
        onCancel={() => {
          setIsBulkModalOpen(false);
          setIncludeH1(true);
          setIncludeH2(false);
          setIncludeB3(false);
          bulkForm.resetFields();
        }}
        onOk={handleSubmitBulk}
        confirmLoading={actionLoading}
        okText="Tạo"
        cancelText="Hủy"
        destroyOnClose
      >
        <Form form={bulkForm} layout="vertical">
          <Form.Item
            name="term"
            label="Term"
            rules={[{ required: true, message: "Vui lòng chọn term." }]}
          >
            <Select
              options={[
                { value: "SPRING", label: "SPRING" },
                { value: "SUMMER", label: "SUMMER" },
                { value: "FALL", label: "FALL" },
              ]}
            />
          </Form.Item>

          <div className="flex items-center justify-between mb-1">
            <Typography.Text strong>NORMAL - H1</Typography.Text>
            <Checkbox
              checked={includeH1}
              onChange={(e) => {
                const checked = e.target.checked;
                setIncludeH1(checked);
                bulkForm.setFieldValue("includeH1", checked);
              }}
            >
              Tạo block này
            </Checkbox>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
            <Form.Item
              name="h1StartDate"
              label="Ngày bắt đầu"
              rules={[
                {
                  validator: (_, value: dayjs.Dayjs) => {
                    if (!includeH1 || value) return Promise.resolve();
                    return Promise.reject(
                      new Error("Vui lòng chọn ngày bắt đầu H1."),
                    );
                  },
                },
              ]}
            >
              <DatePicker
                className="w-full"
                format="YYYY-MM-DD"
                disabled={!includeH1}
              />
            </Form.Item>
            <Form.Item
              name="h1EndDate"
              label="Ngày kết thúc"
              rules={[
                {
                  validator: (_, value: dayjs.Dayjs) => {
                    if (!includeH1 || value) return Promise.resolve();
                    return Promise.reject(
                      new Error("Vui lòng chọn ngày kết thúc H1."),
                    );
                  },
                },
              ]}
            >
              <DatePicker
                className="w-full"
                format="YYYY-MM-DD"
                disabled={!includeH1}
              />
            </Form.Item>
          </div>
          <Form.Item name="h1Active" valuePropName="checked" initialValue>
            <Switch
              checkedChildren="Bật"
              unCheckedChildren="Tắt"
              disabled={!includeH1}
            />
          </Form.Item>

          <div className="flex items-center justify-between mb-1">
            <Typography.Text strong>NORMAL - H2</Typography.Text>
            <Checkbox
              checked={includeH2}
              onChange={(e) => {
                const checked = e.target.checked;
                setIncludeH2(checked);
                bulkForm.setFieldValue("includeH2", checked);
              }}
            >
              Tạo block này
            </Checkbox>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
            <Form.Item
              name="h2StartDate"
              label="Ngày bắt đầu"
              rules={[
                {
                  validator: (_, value: dayjs.Dayjs) => {
                    if (!includeH2 || value) return Promise.resolve();
                    return Promise.reject(
                      new Error("Vui lòng chọn ngày bắt đầu H2."),
                    );
                  },
                },
              ]}
            >
              <DatePicker
                className="w-full"
                format="YYYY-MM-DD"
                disabled={!includeH2}
              />
            </Form.Item>
            <Form.Item
              name="h2EndDate"
              label="Ngày kết thúc"
              rules={[
                {
                  validator: (_, value: dayjs.Dayjs) => {
                    if (!includeH2 || value) return Promise.resolve();
                    return Promise.reject(
                      new Error("Vui lòng chọn ngày kết thúc H2."),
                    );
                  },
                },
              ]}
            >
              <DatePicker
                className="w-full"
                format="YYYY-MM-DD"
                disabled={!includeH2}
              />
            </Form.Item>
          </div>
          <Form.Item name="h2Active" valuePropName="checked" initialValue>
            <Switch
              checkedChildren="Bật"
              unCheckedChildren="Tắt"
              disabled={!includeH2}
            />
          </Form.Item>

          <div className="flex items-center justify-between mb-1">
            <Typography.Text strong>BLOCK3</Typography.Text>
            <Checkbox
              checked={includeB3}
              onChange={(e) => {
                const checked = e.target.checked;
                setIncludeB3(checked);
                bulkForm.setFieldValue("includeB3", checked);
              }}
            >
              Tạo block này
            </Checkbox>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
            <Form.Item
              name="b3StartDate"
              label="Ngày bắt đầu"
              rules={[
                {
                  validator: (_, value: dayjs.Dayjs) => {
                    if (!includeB3 || value) return Promise.resolve();
                    return Promise.reject(
                      new Error("Vui lòng chọn ngày bắt đầu BLOCK3."),
                    );
                  },
                },
              ]}
            >
              <DatePicker
                className="w-full"
                format="YYYY-MM-DD"
                disabled={!includeB3}
              />
            </Form.Item>
            <Form.Item
              name="b3EndDate"
              label="Ngày kết thúc"
              rules={[
                {
                  validator: (_, value: dayjs.Dayjs) => {
                    if (!includeB3 || value) return Promise.resolve();
                    return Promise.reject(
                      new Error("Vui lòng chọn ngày kết thúc BLOCK3."),
                    );
                  },
                },
              ]}
            >
              <DatePicker
                className="w-full"
                format="YYYY-MM-DD"
                disabled={!includeB3}
              />
            </Form.Item>
          </div>
          <Form.Item name="b3Active" valuePropName="checked" initialValue>
            <Switch
              checkedChildren="Bật"
              unCheckedChildren="Tắt"
              disabled={!includeB3}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Cập nhật kỳ học"
        open={isBlockFormModalOpen}
        onCancel={closeEditBlockModal}
        onOk={handleUpdateBlock}
        confirmLoading={actionLoading}
        okText="Cập nhật"
        cancelText="Hủy"
        destroyOnClose
      >
        <Form form={blockForm} layout="vertical">
          <Form.Item
            name="term"
            label="Term"
            rules={[{ required: true, message: "Vui lòng chọn term." }]}
          >
            <Select
              options={[
                { value: "SPRING", label: "SPRING" },
                { value: "SUMMER", label: "SUMMER" },
                { value: "FALL", label: "FALL" },
              ]}
            />
          </Form.Item>
          <Form.Item
            name="blockType"
            label="Loại block"
            rules={[{ required: true, message: "Vui lòng chọn loại block." }]}
          >
            <Select
              options={[
                { value: "NORMAL", label: "NORMAL" },
                { value: "BLOCK3", label: "BLOCK3" },
              ]}
            />
          </Form.Item>
          <Form.Item
            shouldUpdate={(prev, curr) => prev.blockType !== curr.blockType}
            noStyle
          >
            {({ getFieldValue }) =>
              getFieldValue("blockType") === "NORMAL" ? (
                <Form.Item
                  name="half"
                  label="Half"
                  rules={[{ required: true, message: "Vui lòng chọn half." }]}
                >
                  <Select
                    options={[
                      { value: "H1", label: "H1" },
                      { value: "H2", label: "H2" },
                    ]}
                  />
                </Form.Item>
              ) : null
            }
          </Form.Item>
          <Form.Item
            name="startDate"
            label="Ngày bắt đầu"
            rules={[{ required: true, message: "Vui lòng chọn ngày bắt đầu." }]}
          >
            <DatePicker className="w-full" format="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item
            name="endDate"
            label="Ngày kết thúc"
            dependencies={["startDate"]}
            rules={[
              { required: true, message: "Vui lòng chọn ngày kết thúc." },
              ({ getFieldValue }) => ({
                validator(_, value: dayjs.Dayjs) {
                  const start = getFieldValue("startDate");
                  if (!value || !start) return Promise.resolve();
                  return value.isAfter(start, "day")
                    ? Promise.resolve()
                    : Promise.reject(
                        new Error("Ngày kết thúc phải lớn hơn ngày bắt đầu."),
                      );
                },
              }),
            ]}
          >
            <DatePicker className="w-full" format="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item name="isActive" label="Kích hoạt" valuePropName="checked" initialValue>
            <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminAcademicYearPage;
