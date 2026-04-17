import React, { useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/services/store/store";
import {
  createRubricTemplateCriterion,
  deleteRubricTemplateCriterion,
  RubricTemplate,
  RubricTemplateCriterion,
  RubricTemplateCriterionPayload,
  RubricTemplatePayload,
  clearRubricTemplateError,
  createRubricTemplate,
  deleteRubricTemplate,
  fetchRubricTemplates,
  updateRubricTemplateCriterion,
  updateRubricTemplate,
} from "@/services/features/admin/rubricTempleSlice";
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
  ProfileOutlined,
  CheckSquareOutlined,
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
import RubricTemplateModal from "@/components/RubricTemplate/RubricTemplateModal";
import CriteriaModal from "@/components/RubricTemplate/CriteriaModal";

const AdminRubricTemplePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { templates, pagination, loading, actionLoading, error } =
    useAppSelector((state) => state.rubricTemplate);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [filterAssignmentType, setFilterAssignmentType] = useState("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<RubricTemplate | null>(
    null,
  );
  const [selectedTemplateForCriteriaId, setSelectedTemplateForCriteriaId] =
    useState<number | null>(null);

  const selectedTemplateForCriteria = useMemo(
    () =>
      templates.find(
        (template) =>
          template.rubricTemplateId === selectedTemplateForCriteriaId,
      ) || null,
    [templates, selectedTemplateForCriteriaId],
  );

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
    dispatch(fetchRubricTemplates({ page: currentPage, limit: pageSize }));
  }, [dispatch, currentPage, pageSize]);

  useEffect(() => {
    if (error) {
      notifyError("Lỗi mẫu rubric", error);
      dispatch(clearRubricTemplateError());
    }
  }, [error, dispatch]);

  const filteredTemplates = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    return [...templates]
      .sort((left, right) => {
        const leftTime = left.createdAt
          ? new Date(left.createdAt).getTime()
          : 0;
        const rightTime = right.createdAt
          ? new Date(right.createdAt).getTime()
          : 0;
        return rightTime - leftTime;
      })
      .filter((template) => {
        const matchesKeyword =
          !keyword ||
          template.templateName.toLowerCase().includes(keyword) ||
          template.description.toLowerCase().includes(keyword) ||
          template.assignmentType.toLowerCase().includes(keyword);

        const matchesStatus =
          filterStatus === "all" ||
          (filterStatus === "active" && template.isActive) ||
          (filterStatus === "inactive" && !template.isActive);

        const matchesAssignmentType =
          filterAssignmentType === "all" ||
          template.assignmentType === filterAssignmentType;

        return matchesKeyword && matchesStatus && matchesAssignmentType;
      });
  }, [templates, searchTerm, filterStatus, filterAssignmentType]);

  const stats = useMemo(() => {
    const total = templates.length;
    const active = templates.filter((template) => template.isActive).length;
    const defaults = templates.filter((template) => template.isDefault).length;
    return { total, active, defaults };
  }, [templates]);

  const assignmentTypes = useMemo(
    () =>
      Array.from(new Set(templates.map((template) => template.assignmentType))),
    [templates],
  );

  const formatDate = (value?: string | null) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  };

  const previewText = (value?: string | null, maxLength = 42) => {
    const text = (value || "-").trim();
    if (text.length <= maxLength) return text;
    return `${text.slice(0, maxLength).trimEnd()}...`;
  };

  const handleCreateTemplate = async (payload: RubricTemplatePayload) => {
    try {
      await dispatch(createRubricTemplate(payload)).unwrap();
      notifySuccess("Tạo thành công", "Tạo mẫu rubric thành công.");
      setIsCreateModalOpen(false);
      dispatch(fetchRubricTemplates({ page: currentPage, limit: pageSize }));
    } catch (createError: any) {
      notifyError(
        "Tạo thất bại",
        typeof createError === "string"
          ? createError
          : createError?.message || "Không thể tạo mẫu rubric",
      );
    }
  };

  const handleUpdateTemplate = async (payload: RubricTemplatePayload) => {
    if (!editingTemplate) return;
    try {
      await dispatch(
        updateRubricTemplate({
          rubricTemplateId: editingTemplate.rubricTemplateId,
          data: payload,
        }),
      ).unwrap();
      notifySuccess("Cập nhật thành công", "Cập nhật mẫu rubric thành công.");
      setIsEditModalOpen(false);
      setEditingTemplate(null);
      dispatch(fetchRubricTemplates({ page: currentPage, limit: pageSize }));
    } catch (updateError: any) {
      notifyError(
        "Cập nhật thất bại",
        typeof updateError === "string"
          ? updateError
          : updateError?.message || "Không thể cập nhật mẫu rubric",
      );
    }
  };

  const handleDeleteTemplate = async (rubricTemplateId: number) => {
    try {
      await dispatch(deleteRubricTemplate(rubricTemplateId)).unwrap();
      notifySuccess("Xóa thành công", "Xóa mẫu rubric thành công.");
      dispatch(fetchRubricTemplates({ page: currentPage, limit: pageSize }));
    } catch (deleteError: any) {
      notifyError(
        "Xóa thất bại",
        typeof deleteError === "string"
          ? deleteError
          : deleteError?.message || "Không thể xóa mẫu rubric",
      );
    }
  };

  const handleCreateCriteria = async (
    rubricTemplateId: number,
    payload: RubricTemplateCriterionPayload,
  ) => {
    try {
      await dispatch(
        createRubricTemplateCriterion({ rubricTemplateId, data: payload }),
      ).unwrap();
      notifySuccess("Tạo thành công", "Tạo tiêu chí thành công.");
      await dispatch(
        fetchRubricTemplates({ page: currentPage, limit: pageSize }),
      ).unwrap();
    } catch (createCriteriaError: any) {
      notifyError(
        "Tạo thất bại",
        typeof createCriteriaError === "string"
          ? createCriteriaError
          : createCriteriaError?.message || "Không thể tạo tiêu chí",
      );
      throw createCriteriaError;
    }
  };

  const handleUpdateCriteria = async (
    criteriaId: number,
    payload: RubricTemplateCriterionPayload,
  ) => {
    try {
      await dispatch(
        updateRubricTemplateCriterion({ criteriaId, data: payload }),
      ).unwrap();
      notifySuccess("Cập nhật thành công", "Cập nhật tiêu chí thành công.");
      await dispatch(
        fetchRubricTemplates({ page: currentPage, limit: pageSize }),
      ).unwrap();
    } catch (updateCriteriaError: any) {
      notifyError(
        "Cập nhật thất bại",
        typeof updateCriteriaError === "string"
          ? updateCriteriaError
          : updateCriteriaError?.message || "Không thể cập nhật tiêu chí",
      );
      throw updateCriteriaError;
    }
  };

  const handleDeleteCriteria = async (
    criteriaId: number,
    rubricTemplateId: number,
  ) => {
    try {
      await dispatch(
        deleteRubricTemplateCriterion({ criteriaId, rubricTemplateId }),
      ).unwrap();
      notifySuccess("Xóa thành công", "Xóa tiêu chí thành công.");
      await dispatch(
        fetchRubricTemplates({ page: currentPage, limit: pageSize }),
      ).unwrap();
    } catch (deleteCriteriaError: any) {
      notifyError(
        "Xóa thất bại",
        typeof deleteCriteriaError === "string"
          ? deleteCriteriaError
          : deleteCriteriaError?.message || "Không thể xóa tiêu chí",
      );
      throw deleteCriteriaError;
    }
  };

  const handleReorderCriteria = async (
    reorderedCriteria: RubricTemplateCriterion[],
  ) => {
    try {
      await Promise.all(
        reorderedCriteria.map((criterion) =>
          dispatch(
            updateRubricTemplateCriterion({
              criteriaId: criterion.criteriaId,
              data: {
                criteriaName: criterion.criteriaName,
                criteriaDescription: criterion.criteriaDescription,
                weight: Number(criterion.weight),
                maxScore: Number(criterion.maxScore),
                displayOrder: criterion.displayOrder,
                evaluationGuide: criterion.evaluationGuide,
                isActive: criterion.isActive,
              },
            }),
          ).unwrap(),
        ),
      );
      notifySuccess("Cập nhật thành công", "Cập nhật thứ tự tiêu chí thành công.");
      await dispatch(
        fetchRubricTemplates({ page: currentPage, limit: pageSize }),
      ).unwrap();
    } catch (reorderCriteriaError: any) {
      notifyError(
        "Cập nhật thất bại",
        typeof reorderCriteriaError === "string"
          ? reorderCriteriaError
          : reorderCriteriaError?.message ||
          "Không thể cập nhật thứ tự tiêu chí",
      );
      throw reorderCriteriaError;
    }
  };

  const columns: ColumnsType<RubricTemplate> = [
    {
      title: "Mẫu",
      key: "template",
      render: (_, record) => (
        <div>
          <div className="font-semibold">{record.templateName}</div>
          <div
            className="text-xs text-gray-400"
            title={record.description || "-"}
          >
            {previewText(record.description)}
          </div>
          {record.isDefault && (
            <Tag color="blue" className="mt-1">
              Mặc định
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: "Loại",
      dataIndex: "assignmentType",
      key: "assignmentType",
    },
    {
      title: "Tiêu chí",
      key: "criteria",
      render: (_, record) => {
        const sortedCriteria = [...(record.criteria || [])].sort(
          (a, b) => a.displayOrder - b.displayOrder,
        );
        if (sortedCriteria.length === 0) {
          return <span className="text-xs text-gray-400">Không có tiêu chí</span>;
        }
        return (
          <div className="space-y-1 max-w-xs">
            {sortedCriteria.slice(0, 3).map((criterion) => (
              <div
                key={criterion.criteriaId}
                className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs cursor-pointer hover:border-blue-300 hover:bg-blue-50"
                role="button"
                tabIndex={0}
                onClick={() =>
                  setSelectedTemplateForCriteriaId(record.rubricTemplateId)
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    setSelectedTemplateForCriteriaId(record.rubricTemplateId);
                  }
                }}
                title="Mở quản lý criteria"
              >
                <span className="font-medium text-gray-800 truncate">
                  {criterion.displayOrder}. {criterion.criteriaName}
                </span>
                <Tag className="text-[10px]" color="blue">
                  {Number(criterion.weight)}% · {criterion.maxScore}
                </Tag>
              </div>
            ))}
            {sortedCriteria.length > 3 && (
              <div
                className="text-xs text-gray-400 cursor-pointer hover:text-gray-600"
                onClick={() =>
                  setSelectedTemplateForCriteriaId(record.rubricTemplateId)
                }
              >
                +{sortedCriteria.length - 3} thêm
              </div>
            )}
          </div>
        );
      },
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
      title: "Cập nhật",
      key: "updated",
      render: (_, record) => formatDate(record.updatedAt || record.createdAt),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 140,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="text"
            icon={<CheckSquareOutlined style={{ fontSize: 14 }} />}
            onClick={() =>
              setSelectedTemplateForCriteriaId(record.rubricTemplateId)
            }
            className="text-green-500 hover:text-green-600"
            title="Quản lý tiêu chí"
          />
          <Button
            type="text"
            icon={<EditOutlined style={{ fontSize: 14 }} />}
            onClick={() => {
              setEditingTemplate(record);
              setIsEditModalOpen(true);
            }}
            className="text-blue-500 hover:text-blue-600"
            title="Chỉnh sửa"
          />
          <Popconfirm
            title="Xác nhận xóa template"
            description={`Bạn có chắc muốn xóa template "${record.templateName}"?`}
            onConfirm={() => handleDeleteTemplate(record.rubricTemplateId)}
            okText="Xóa"
            okButtonProps={{ danger: true }}
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
      <SidebarAdmin activeItem="rubric-templates" />
      <main className="flex-1 overflow-y-auto p-6 sm:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">
                Quản trị
              </p>
              <h1 className="text-2xl font-bold text-gray-900">
                Quản lý mẫu rubric
              </h1>
              <p className="text-sm text-gray-600">
                Quản lý bộ rubric mẫu cho các loại bài nộp
              </p>
            </div>
            <Space>
              <Button
                icon={<ReloadOutlined style={{ fontSize: 14 }} />}
                onClick={() =>
                  dispatch(
                    fetchRubricTemplates({
                      page: currentPage,
                      limit: pageSize,
                    }),
                  )
                }
                loading={loading}
              >
                Làm mới
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined style={{ fontSize: 14 }} />}
                onClick={() => setIsCreateModalOpen(true)}
              >
                Mẫu mới
              </Button>
            </Space>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card size="small" className="rounded-2xl overflow-hidden">
              <Space>
                <div className="rounded-lg bg-blue-100 text-blue-600 p-2">
                  <ProfileOutlined style={{ fontSize: 20 }} />
                </div>
                <div>
                  <p className="text-xs uppercase text-gray-500 font-semibold">
                    Tổng mẫu
                  </p>
                  <p className="text-xl font-bold">{stats.total}</p>
                </div>
              </Space>
            </Card>
            <Card size="small" className="rounded-2xl overflow-hidden">
              <Space>
                <div className="rounded-lg bg-green-100 text-green-600 p-2">
                  <ProfileOutlined style={{ fontSize: 20 }} />
                </div>
                <div>
                  <p className="text-xs uppercase text-gray-500 font-semibold">
                    Đang hoạt động
                  </p>
                  <p className="text-xl font-bold">{stats.active}</p>
                </div>
              </Space>
            </Card>
            <Card size="small" className="rounded-2xl overflow-hidden">
              <Space>
                <div className="rounded-lg bg-indigo-100 text-indigo-600 p-2">
                  <CheckSquareOutlined style={{ fontSize: 20 }} />
                </div>
                <div>
                  <p className="text-xs uppercase text-gray-500 font-semibold">
                    Mặc định
                  </p>
                  <p className="text-xl font-bold">{stats.defaults}</p>
                </div>
              </Space>
            </Card>
          </div>

          <Card className="rounded-2xl overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">
                  Danh mục
                </p>
                <h2 className="text-lg font-bold text-gray-900">
                  Mẫu rubric
                </h2>
              </div>
              <Space wrap>
                <Input.Search
                  placeholder="Tìm theo tên, mô tả, loại..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full sm:w-72"
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
                    { value: "all", label: "Tất cả trạng thái" },
                    { value: "active", label: "Đang hoạt động" },
                    { value: "inactive", label: "Không hoạt động" },
                  ]}
                />
                <Select
                  value={filterAssignmentType}
                  onChange={(val) => {
                    setFilterAssignmentType(val);
                    setCurrentPage(1);
                  }}
                  style={{ width: 160 }}
                  options={[
                    { value: "all", label: "Tất cả loại" },
                    ...assignmentTypes.map((t) => ({ value: t, label: t })),
                  ]}
                />
              </Space>
            </div>

            <Table
              columns={columns}
              dataSource={filteredTemplates}
              rowKey="rubricTemplateId"
              loading={loading}
              pagination={
                pagination && pagination.total > 0
                  ? {
                    current: currentPage,
                    pageSize,
                    total: pagination.total,
                    showSizeChanger: true,
                    showQuickJumper: false,
                    pageSizeOptions: ["10", "20", "50"],
                    showTotal: (total, range) =>
                      `${range[0]}-${range[1]} trên tổng ${total} mẫu`,
                    onChange: (p, ps) => {
                      setCurrentPage(p);
                      setPageSize(ps);
                    },
                  }
                  : false
              }
              locale={{
                emptyText: error
                  ? error
                  : searchTerm ||
                    filterStatus !== "all" ||
                    filterAssignmentType !== "all"
                    ? "Không tìm thấy mẫu rubric phù hợp bộ lọc"
                    : "Chưa có mẫu rubric nào. Hãy tạo mẫu đầu tiên để bắt đầu.",
              }}
            />
          </Card>
        </div>
      </main>

      <RubricTemplateModal
        isOpen={isCreateModalOpen}
        mode="create"
        isLoading={actionLoading}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateTemplate}
      />

      <RubricTemplateModal
        isOpen={isEditModalOpen}
        mode="edit"
        isLoading={actionLoading}
        initialData={
          editingTemplate
            ? {
              templateName: editingTemplate.templateName,
              description: editingTemplate.description,
              assignmentType: editingTemplate.assignmentType,
              isDefault: editingTemplate.isDefault,
            }
            : undefined
        }
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingTemplate(null);
        }}
        onSubmit={handleUpdateTemplate}
      />

      <CriteriaModal
        isOpen={Boolean(selectedTemplateForCriteria)}
        template={selectedTemplateForCriteria}
        isLoading={actionLoading}
        onClose={() => setSelectedTemplateForCriteriaId(null)}
        onCreate={handleCreateCriteria}
        onUpdate={handleUpdateCriteria}
        onReorder={handleReorderCriteria}
        onDelete={handleDeleteCriteria}
      />
    </div>
  );
};

export default AdminRubricTemplePage;
