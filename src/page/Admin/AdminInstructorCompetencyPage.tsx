import React, { useEffect, useMemo, useState } from "react";
import {
  App,
  Button,
  Card,
  Empty,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import SidebarAdmin from "@/components/Sidebar/SidebarAdmin/SidebarAdmin";
import { useAppDispatch, useAppSelector } from "@/services/store/store";
import { fetchAllUsers } from "@/services/features/admin/adminSlice";
import axiosInstance from "@/services/constant/axiosInstance";
import {
  COMPETENCIES_ENDPOINT,
  INSTRUCTOR_COMPETENCIES_ENDPOINT,
  BASE_URL,
} from "@/services/constant/apiConfig";

const { Text } = Typography;

type CompetencyCatalog = {
  competencyId: number;
  competencyCode: string;
  competencyName: string;
  isActive?: boolean;
};

type EvidenceItem = {
  evidenceType?: string;
  title: string;
  url?: string;
  notes?: string;
};

type InstructorCompetency = {
  instructorCompetencyId: number;
  instructorId: number;
  competencyId: number;
  level: number;
  status: "pending" | "approved" | "rejected";
  rejectionReason?: string | null;
  competency?: {
    competencyId: number;
    competencyCode: string;
    competencyName: string;
  };
  evidences?: Array<{
    evidenceId?: number;
    evidenceType?: string;
    title: string;
    url?: string | null;
    notes?: string | null;
  }>;
};

type ReviewFormValues = {
  approved: boolean;
  competencyId?: number;
  rejectionReason?: string;
  evidences?: EvidenceItem[];
};

const defaultEvidence = (): EvidenceItem => ({
  evidenceType: "certificate",
  title: "",
  url: "",
  notes: "",
});

const INSTRUCTOR_COMPETENCY_APPROVE_ENDPOINT = (id: number) =>
  `${BASE_URL}/api/v1/instructor-competencies/${id}/approve`;

const INSTRUCTOR_COMPETENCY_DELETE_ENDPOINT = (id: number) =>
  `${BASE_URL}/api/v1/instructor-competencies/${id}`;

const AdminInstructorCompetencyPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { message } = App.useApp();
  const { users } = useAppSelector((state) => state.admin);

  const [catalogs, setCatalogs] = useState<CompetencyCatalog[]>([]);
  const [selectedInstructorId, setSelectedInstructorId] = useState<number>();
  const [records, setRecords] = useState<InstructorCompetency[]>([]);
  const [pageLoading, setPageLoading] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<InstructorCompetency | null>(null);

  const [reviewForm] = Form.useForm<ReviewFormValues>();

  const instructorOptions = useMemo(() => {
    return users
      .filter((user) =>
        user.userRoles?.some((ur) => ur.role?.roleName?.toLowerCase() === "instructor"),
      )
      .map((instructor) => ({
        value: instructor.userId,
        label: `${instructor.firstName || ""} ${instructor.lastName || ""}`.trim()
          ? `${instructor.firstName || ""} ${instructor.lastName || ""} (${instructor.email})`
          : `${instructor.username} (${instructor.email})`,
      }));
  }, [users]);

  const fetchCatalogs = async () => {
    const response = await axiosInstance.get(COMPETENCIES_ENDPOINT, {
      params: { isActive: true },
    });
    const payload = response.data as { data?: CompetencyCatalog[] };
    setCatalogs(Array.isArray(payload.data) ? payload.data : []);
  };

  const fetchInstructorRecords = async (instructorId: number) => {
    setPageLoading(true);
    try {
      const response = await axiosInstance.get(
        INSTRUCTOR_COMPETENCIES_ENDPOINT(String(instructorId)),
      );
      const payload = response.data as { data?: InstructorCompetency[] };
      setRecords(Array.isArray(payload.data) ? payload.data : []);
    } catch (error: any) {
      message.error(
        error?.response?.data?.message || "Không thể tải chứng chỉ của instructor.",
      );
      setRecords([]);
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    dispatch(fetchAllUsers());
    fetchCatalogs().catch(() => {
      message.error("Không thể tải danh mục năng lực.");
    });
  }, [dispatch, message]);

  useEffect(() => {
    if (!selectedInstructorId) {
      setRecords([]);
      return;
    }
    fetchInstructorRecords(selectedInstructorId);
  }, [selectedInstructorId]);

  const openReviewModal = (record: InstructorCompetency, approved: boolean) => {
    setReviewTarget(record);
    reviewForm.resetFields();
    reviewForm.setFieldsValue({
      approved,
      competencyId: record.competencyId,
      rejectionReason: "",
      evidences:
        record.evidences && record.evidences.length > 0
          ? record.evidences.map((ev) => ({
              evidenceType: ev.evidenceType || "other",
              title: ev.title || "",
              url: ev.url || "",
              notes: ev.notes || "",
            }))
          : [defaultEvidence()],
    });
    setIsReviewModalOpen(true);
  };

  const submitReview = async (values: ReviewFormValues) => {
    if (!reviewTarget || !selectedInstructorId) return;
    setModalLoading(true);
    try {
      await axiosInstance.patch(
        INSTRUCTOR_COMPETENCY_APPROVE_ENDPOINT(reviewTarget.instructorCompetencyId),
        {
          approved: values.approved,
          competencyId: values.competencyId,
          evidences: (values.evidences || [])
            .filter((ev) => ev.title?.trim())
            .map((ev) => ({
              evidenceType: ev.evidenceType || "other",
              title: ev.title.trim(),
              url: ev.url?.trim() || undefined,
              notes: ev.notes?.trim() || undefined,
            })),
          rejectionReason:
            values.approved ? undefined : values.rejectionReason?.trim() || undefined,
        },
      );
      message.success(values.approved ? "Đã duyệt chứng chỉ." : "Đã từ chối chứng chỉ.");
      setIsReviewModalOpen(false);
      setReviewTarget(null);
      await fetchInstructorRecords(selectedInstructorId);
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Duyệt/Từ chối thất bại.");
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async (record: InstructorCompetency) => {
    if (!selectedInstructorId) return;
    try {
      await axiosInstance.delete(
        INSTRUCTOR_COMPETENCY_DELETE_ENDPOINT(record.instructorCompetencyId),
      );
      message.success("Đã xóa chứng chỉ.");
      await fetchInstructorRecords(selectedInstructorId);
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Xóa chứng chỉ thất bại.");
    }
  };

  const columns: ColumnsType<InstructorCompetency> = [
    {
      title: "Năng lực/Chứng chỉ",
      key: "competency",
      render: (_, row) => (
        <div>
          <div className="font-semibold">
            {row.competency?.competencyCode || `#${row.competencyId}`} -{" "}
            {row.competency?.competencyName || "N/A"}
          </div>
          <div className="text-xs text-gray-500">
            Tài liệu: {row.evidences?.length || 0}
          </div>
        </div>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status: InstructorCompetency["status"]) => {
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
      title: "Thao tác",
      key: "actions",
      width: 220,
      render: (_, row) => (
        <Space size="small">
          <Button
            type="text"
            icon={<CheckCircleOutlined />}
            className="text-green-600"
            onClick={() => openReviewModal(row, true)}
            title="Duyệt"
          />
          <Button
            type="text"
            icon={<CloseCircleOutlined />}
            className="text-orange-500"
            onClick={() => openReviewModal(row, false)}
            title="Từ chối"
          />
          <Popconfirm
            title="Xóa chứng chỉ"
            description="Bạn chắc chắn muốn xóa bản ghi này?"
            okText="Xóa"
            cancelText="Hủy"
            onConfirm={() => handleDelete(row)}
          >
            <Button type="text" danger icon={<DeleteOutlined />} title="Xóa" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarAdmin activeItem="instructor-competencies" />
      <main className="flex-1 overflow-y-auto p-6 sm:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">
                Quản trị
              </p>
              <h1 className="text-2xl font-bold text-gray-900">
                Quản lý chứng chỉ Instructor
              </h1>
              <p className="text-sm text-gray-600">
                Admin CRUD và duyệt/từ chối chứng chỉ năng lực của giảng viên
              </p>
            </div>
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => {
                  if (selectedInstructorId) fetchInstructorRecords(selectedInstructorId);
                }}
              >
                Làm mới
              </Button>
            </Space>
          </div>

          <Card>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <Text strong>Chọn Instructor</Text>
                <Select
                  className="w-full mt-2"
                  placeholder="Chọn giảng viên..."
                  options={instructorOptions}
                  value={selectedInstructorId}
                  onChange={(val) => setSelectedInstructorId(val)}
                  showSearch
                  optionFilterProp="label"
                  allowClear
                />
              </div>
            </div>
          </Card>

          <Card>
            {!selectedInstructorId ? (
              <Empty
                description="Chọn instructor để xem danh sách chứng chỉ."
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ) : pageLoading ? (
              <div className="h-48 flex items-center justify-center">
                <Spin size="large" />
              </div>
            ) : (
              <Table
                rowKey="instructorCompetencyId"
                columns={columns}
                dataSource={records}
                pagination={{ pageSize: 8, showSizeChanger: false }}
                locale={{ emptyText: "Instructor chưa có chứng chỉ nào." }}
              />
            )}
          </Card>
        </div>
      </main>

      <Modal
        open={isReviewModalOpen}
        onCancel={() => {
          setIsReviewModalOpen(false);
          setReviewTarget(null);
        }}
        title={reviewForm.getFieldValue("approved") ? "Duyệt chứng chỉ" : "Từ chối chứng chỉ"}
        onOk={() => reviewForm.submit()}
        okText="Xác nhận"
        cancelText="Hủy"
        confirmLoading={modalLoading}
        destroyOnHidden
        forceRender
      >
        <Form form={reviewForm} layout="vertical" onFinish={submitReview}>
          <Form.Item name="approved" hidden>
            <Input />
          </Form.Item>

          <Form.Item
            name="competencyId"
            label="Năng lực"
            rules={[{ required: true, message: "Vui lòng chọn năng lực" }]}
          >
            <Select
              placeholder="Chọn năng lực..."
              options={catalogs.map((item) => ({
                value: item.competencyId,
                label: `${item.competencyCode} - ${item.competencyName}`,
              }))}
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>

          <Form.List name="evidences">
            {(fields, { remove }) => (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Text strong>Tài liệu chứng minh</Text>
                  <Button
                    type="dashed"
                    htmlType="button"
                    onClick={(e) => {
                      e.preventDefault();
                      const current = reviewForm.getFieldValue("evidences") || [];
                      reviewForm.setFieldValue("evidences", [
                        ...current,
                        defaultEvidence(),
                      ]);
                    }}
                  >
                    Thêm tài liệu
                  </Button>
                </div>

                {fields.map((field, idx) => {
                  const { key: _fieldKey, ...restField } = field;
                  return (
                    <Card key={field.key} size="small">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Form.Item
                          {...restField}
                          name={[field.name, "evidenceType"]}
                          label="Loại"
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
                            { required: true, whitespace: true, message: "Không để trống" },
                          ]}
                        >
                          <Input />
                        </Form.Item>

                        <Form.Item {...restField} name={[field.name, "url"]} label="URL">
                          <Input />
                        </Form.Item>
                        <Form.Item {...restField} name={[field.name, "notes"]} label="Ghi chú">
                          <Input />
                        </Form.Item>
                      </div>
                      <div className="flex justify-end">
                        <Button type="link" danger onClick={() => remove(field.name)}>
                          Xóa tài liệu {idx + 1}
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </Form.List>

          <Form.Item shouldUpdate noStyle>
            {() =>
              reviewForm.getFieldValue("approved") ? null : (
                <Form.Item
                  name="rejectionReason"
                  label="Lý do từ chối"
                  rules={[{ required: true, message: "Vui lòng nhập lý do từ chối" }]}
                >
                  <Input.TextArea rows={3} />
                </Form.Item>
              )
            }
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminInstructorCompetencyPage;
