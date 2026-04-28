import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Empty,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { EyeOutlined, PlusOutlined } from "@ant-design/icons";
import { toast } from "react-toastify";
import SidebarInstructor from "@/components/Sidebar/SidebarInstructor/SidebarInstructor";
import { useAppSelector } from "@/services/store/store";
import axiosInstance from "@/services/constant/axiosInstance";
import {
  COMPETENCIES_ENDPOINT,
  INSTRUCTOR_COMPETENCIES_ENDPOINT,
} from "@/services/constant/apiConfig";

const { Text } = Typography;

type CompetencyCatalogItem = {
  competencyId: number;
  competencyCode: string;
  competencyName: string;
  description?: string | null;
  isActive?: boolean;
};

type EvidenceItem = {
  evidenceId?: number;
  evidenceType?: string;
  title: string;
  url?: string | null;
  notes?: string | null;
};

type InstructorCompetencyItem = {
  instructorCompetencyId: number;
  instructorId: number;
  competencyId: number;
  level: number;
  status: "pending" | "approved" | "rejected";
  declaredAt?: string;
  rejectionReason?: string | null;
  competency?: CompetencyCatalogItem;
  evidences?: EvidenceItem[];
};

type CompetencyFormValues = {
  competencyId: number;
  evidences?: EvidenceItem[];
};

const createDefaultEvidence = () => ({
  evidenceType: "certificate",
  title: "",
  url: "",
  notes: "",
});

const InstructorSettingsPage: React.FC = () => {
  const [form] = Form.useForm<CompetencyFormValues>();
  const { user } = useAppSelector((state) => state.auth);

  const [catalogs, setCatalogs] = useState<CompetencyCatalogItem[]>([]);
  const [competencies, setCompetencies] = useState<InstructorCompetencyItem[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<InstructorCompetencyItem | null>(
    null,
  );

  const instructorId = user?.userId;

  const fetchCatalogs = async () => {
    const response = await axiosInstance.get(COMPETENCIES_ENDPOINT, {
      params: { isActive: true },
    });
    const payload = response.data as { data?: CompetencyCatalogItem[] };
    setCatalogs(Array.isArray(payload?.data) ? payload.data : []);
  };

  const fetchInstructorCompetencies = async () => {
    if (!instructorId) return;
    const response = await axiosInstance.get(
      INSTRUCTOR_COMPETENCIES_ENDPOINT(String(instructorId)),
    );
    const payload = response.data as { data?: InstructorCompetencyItem[] };
    setCompetencies(Array.isArray(payload?.data) ? payload.data : []);
  };

  const refreshData = async () => {
    if (!instructorId) return;
    setPageLoading(true);
    try {
      await Promise.all([fetchCatalogs(), fetchInstructorCompetencies()]);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(
        err?.response?.data?.message || "Không thể tải dữ liệu năng lực.",
      );
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, [instructorId]);

  const competencyOptions = useMemo(
    () =>
      catalogs.map((item) => ({
        value: item.competencyId,
        label: `${item.competencyCode} - ${item.competencyName}`,
      })),
    [catalogs],
  );

  const openCreateModal = () => {
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    form.resetFields();
  };

  useEffect(() => {
    if (!isModalOpen) return;
    form.resetFields();
    form.setFieldsValue({
      competencyId: undefined,
      evidences: [createDefaultEvidence()],
    });
  }, [isModalOpen, form]);

  const openDetailModal = (item: InstructorCompetencyItem) => {
    setDetailItem(item);
    setIsDetailModalOpen(true);
  };

  const closeDetailModal = () => {
    setDetailItem(null);
    setIsDetailModalOpen(false);
  };

  const handleSubmit = async (values: CompetencyFormValues) => {
    if (!instructorId) return;
    setSubmitLoading(true);

    const evidences = (values.evidences || [])
      .filter((ev) => ev?.title?.trim())
      .map((ev) => ({
        evidenceType: ev.evidenceType || "other",
        title: ev.title.trim(),
        url: ev.url?.trim() || undefined,
        notes: ev.notes?.trim() || undefined,
      }));

    try {
      await axiosInstance.post(
        INSTRUCTOR_COMPETENCIES_ENDPOINT(String(instructorId)),
        {
          competencies: [
            {
              competencyId: values.competencyId,
              evidences,
            },
          ],
        },
      );
      toast.success("Khai báo năng lực thành công.");

      handleModalClose();
      await fetchInstructorCompetencies();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || "Thao tác năng lực thất bại.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const columns: ColumnsType<InstructorCompetencyItem> = [
    {
      title: "Năng lực",
      key: "competency",
      render: (_, record) => (
        <div>
          <div className="font-semibold text-slate-900">
            {record.competency?.competencyCode || `#${record.competencyId}`} -{" "}
            {record.competency?.competencyName || "N/A"}
          </div>
          <div className="text-xs text-slate-500">
            {record.competency?.description || "Không có mô tả"}
          </div>
        </div>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 130,
      render: (status: InstructorCompetencyItem["status"]) => {
        const map = {
          approved: { color: "green", label: "Đã duyệt" },
          rejected: { color: "red", label: "Từ chối" },
          pending: { color: "gold", label: "Chờ duyệt" },
        };
        const current = map[status] || map.pending;
        return <Tag color={current.color}>{current.label}</Tag>;
      },
    },
    {
      title: "Tài liệu chứng minh",
      key: "evidenceCount",
      width: 110,
      render: (_, record) => record.evidences?.length || 0,
    },
    {
      title: "Chi tiết",
      key: "detail",
      width: 100,
      render: (_, record) => (
        <Button
          type="text"
          icon={<EyeOutlined />}
          onClick={() => openDetailModal(record)}
          title="Xem chi tiết tài liệu chứng minh"
        />
      ),
    },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      <SidebarInstructor activeItem="settings" />
      <main className="flex-1 overflow-y-auto p-6 sm:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">
                Cài đặt giảng viên
              </p>
              <h1 className="text-2xl font-bold text-gray-900">
                Khai báo năng lực
              </h1>
              <p className="text-sm text-gray-600">
                Quản lý danh sách năng lực và Tài liệu chứng minh chuyên môn của bạn
              </p>
            </div>
            <Space>
              <Button onClick={refreshData}>Làm mới</Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={openCreateModal}
              >
                Thêm năng lực
              </Button>
            </Space>
          </div>

          <Card>
            {pageLoading ? (
              <div className="h-56 flex items-center justify-center">
                <Spin size="large" />
              </div>
            ) : competencies.length === 0 ? (
              <Empty
                description="Bạn chưa khai báo năng lực nào."
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ) : (
              <Table
                rowKey="instructorCompetencyId"
                dataSource={competencies}
                columns={columns}
                pagination={{ pageSize: 8, showSizeChanger: false }}
              />
            )}
          </Card>
        </div>
      </main>

      <Modal
        open={isModalOpen}
        onCancel={handleModalClose}
        title="Khai báo năng lực mới"
        onOk={() => form.submit()}
        okText="Tạo mới"
        cancelText="Hủy"
        confirmLoading={submitLoading}
        width={760}
        destroyOnHidden
        forceRender
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            evidences: [createDefaultEvidence()],
          }}
        >
          <Form.Item
            name="competencyId"
            label={<Text strong>Năng lực</Text>}
            rules={[{ required: true, message: "Vui lòng chọn năng lực" }]}
          >
            <Select
              placeholder="Chọn năng lực..."
              options={competencyOptions}
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>

          <Form.List name="evidences">
            {(fields, { add, remove }) => (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Text strong>Tài liệu chứng minh</Text>
                  <Button
                    type="dashed"
                    onClick={() =>
                      add({
                        evidenceType: "certificate",
                        title: "",
                        url: "",
                        notes: "",
                      })
                    }
                  >
                    Thêm Tài liệu chứng minh
                  </Button>
                </div>

                {fields.map((field, index) => {
                  const { key: _fieldKey, ...restField } = field;
                  return (
                    <Card key={field.key} size="small">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Form.Item
                          {...restField}
                          name={[field.name, "evidenceType"]}
                          label="Loại Tài liệu chứng minh"
                        >
                          <Select
                            options={[
                              { value: "certificate", label: "Certificate" },
                              { value: "portfolio", label: "Portfolio" },
                              { value: "experience", label: "Experience" },
                              { value: "other", label: "Other" },
                            ]}
                          />
                        </Form.Item>

                        <Form.Item
                          {...restField}
                          name={[field.name, "title"]}
                          label="Tiêu đề"
                          rules={[
                            {
                              required: true,
                              whitespace: true,
                              message: "Tiêu đề không được để trống",
                            },
                          ]}
                        >
                          <Input placeholder="VD: Node.js Advanced Certificate" />
                        </Form.Item>

                        <Form.Item {...restField} name={[field.name, "url"]} label="URL">
                          <Input placeholder="https://example.com/..." />
                        </Form.Item>

                        <Form.Item {...restField} name={[field.name, "notes"]} label="Ghi chú">
                          <Input placeholder="Mô tả ngắn..." />
                        </Form.Item>
                      </div>

                      <div className="flex justify-end">
                        <Button danger type="link" onClick={() => remove(field.name)}>
                          Xóa Tài liệu chứng minh {index + 1}
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </Form.List>
        </Form>
      </Modal>

      <Modal
        open={isDetailModalOpen}
        onCancel={closeDetailModal}
        footer={null}
        title="Chi tiết tài liệu chứng minh"
        width={840}
        destroyOnHidden
      >
        {detailItem ? (
          <div className="space-y-4">
            <Card size="small" className="!rounded-xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-lg border border-slate-200 p-3">
                  <p className="text-xs font-semibold text-slate-500 mb-1">
                    Năng lực
                  </p>
                  <p className="text-sm font-medium text-slate-900 break-words">
                    {detailItem.competency?.competencyCode ||
                      `#${detailItem.competencyId}`}{" "}
                    - {detailItem.competency?.competencyName || "N/A"}
                  </p>
                </div>

                <div className="rounded-lg border border-slate-200 p-3">
                  <p className="text-xs font-semibold text-slate-500 mb-1">
                    Trạng thái
                  </p>
                  <div>
                    <Tag
                      color={
                        detailItem.status === "approved"
                          ? "green"
                          : detailItem.status === "rejected"
                            ? "red"
                            : "gold"
                      }
                    >
                      {detailItem.status === "approved"
                        ? "Đã duyệt"
                        : detailItem.status === "rejected"
                          ? "Từ chối"
                          : "Chờ duyệt"}
                    </Tag>
                  </div>
                </div>
              </div>

              {detailItem.rejectionReason ? (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 mt-3">
                  <p className="text-xs font-semibold text-red-600 mb-1">
                    Lý do từ chối
                  </p>
                  <p className="text-sm text-red-700 break-words">
                    {detailItem.rejectionReason}
                  </p>
                </div>
              ) : null}
            </Card>

            <div className="flex items-center justify-between">
              <Text strong>Tài liệu chứng minh</Text>
              <Text type="secondary">
                {detailItem.evidences?.length || 0} tài liệu
              </Text>
            </div>

            {!detailItem.evidences || detailItem.evidences.length === 0 ? (
              <Empty
                description="Chưa có tài liệu chứng minh."
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ) : (
              <div className="space-y-3 max-h-[52vh] overflow-y-auto pr-1">
                {detailItem.evidences.map((ev, index) => (
                  <Card
                    key={`${ev.evidenceId ?? "evidence"}-${index}`}
                    size="small"
                    className="!rounded-xl"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs font-semibold text-slate-500 mb-1">
                          Loại tài liệu chứng minh
                        </p>
                        <p className="text-sm text-slate-900 break-words">
                          {ev.evidenceType || "other"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-slate-500 mb-1">
                          Tiêu đề
                        </p>
                        <p className="text-sm text-slate-900 break-words">
                          {ev.title || "-"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-slate-500 mb-1">
                          URL
                        </p>
                        {ev.url ? (
                          <a
                            href={ev.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 hover:underline break-all text-sm"
                          >
                            {ev.url}
                          </a>
                        ) : (
                          <p className="text-sm text-slate-900">-</p>
                        )}
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-slate-500 mb-1">
                          Ghi chú
                        </p>
                        <p className="text-sm text-slate-900 break-words">
                          {ev.notes || "-"}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </Modal>
    </div>
  );
};

export default InstructorSettingsPage;
