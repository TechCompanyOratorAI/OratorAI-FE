import React, { useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/services/store/store";
import {
  createRubricTemplateCriterion,
  deleteRubricTemplateCriterion,
  RubricTemplate,
  RubricTemplateCriterion,
  RubricTemplateCriteriaBatchUpdatePayload,
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
  ConfigProvider,
} from "antd";
import viVN from "antd/locale/vi_VN";
import type { ColumnsType } from "antd/es/table";
import SummaryMetrics, {
  SummaryMetricItem,
} from "@/components/Dashboard/SummaryMetrics";
import SidebarAdmin from "@/components/Sidebar/SidebarAdmin/SidebarAdmin";
import RubricTemplateModal from "@/components/RubricTemplate/RubricTemplateModal";
import CriteriaModal from "@/components/RubricTemplate/CriteriaModal";
import { extractLocalizedMessage } from "@/lib/utils";

const AdminRubricTemplePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { templates, loading, actionLoading, error } =
    useAppSelector((state) => state.rubricTemplate);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [filterAssignmentType, setFilterAssignmentType] = useState("all");
  const [sortByCreatedAt, setSortByCreatedAt] = useState<"newest" | "oldest">(
    "newest",
  );
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
  const FETCH_ALL_LIMIT = 1000;

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
    dispatch(fetchRubricTemplates({ page: 1, limit: FETCH_ALL_LIMIT }));
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      notifyError("Lỗi mẫu rubric", extractLocalizedMessage(error, error));
      dispatch(clearRubricTemplateError());
    }
  }, [error, dispatch]);

  const getCreatedTimestamp = (template: RubricTemplate) => {
    const time = template.createdAt ? new Date(template.createdAt).getTime() : 0;
    return Number.isNaN(time) ? 0 : time;
  };

  const filteredTemplates = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    return [...templates]
      .sort((left, right) => {
        const createdDelta =
          sortByCreatedAt === "newest"
            ? getCreatedTimestamp(right) - getCreatedTimestamp(left)
            : getCreatedTimestamp(left) - getCreatedTimestamp(right);
        if (createdDelta !== 0) return createdDelta;
        return sortByCreatedAt === "newest"
          ? right.rubricTemplateId - left.rubricTemplateId
          : left.rubricTemplateId - right.rubricTemplateId;
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
  }, [templates, searchTerm, filterStatus, filterAssignmentType, sortByCreatedAt]);

  const stats = useMemo(() => {
    const total = templates.length;
    const active = templates.filter((template) => template.isActive).length;
    const defaults = templates.filter((template) => template.isDefault).length;
    return { total, active, defaults };
  }, [templates]);

  const summaryItems: SummaryMetricItem[] = [
    {
      key: "total-templates",
      title: "Tổng mẫu",
      value: stats.total,
      icon: <ProfileOutlined style={{ fontSize: 20 }} />,
      tone: "blue",
      description: "Trong hệ thống",
    },
    {
      key: "active-templates",
      title: "Đang hoạt động",
      value: stats.active,
      icon: <ProfileOutlined style={{ fontSize: 20 }} />,
      tone: "green",
      description: "Đang hoạt động",
    },
    {
      key: "default-templates",
      title: "Mặc định",
      value: stats.defaults,
      icon: <CheckSquareOutlined style={{ fontSize: 20 }} />,
      tone: "purple",
      description: "Mẫu ưu tiên",
    },
  ];

  const assignmentTypes = useMemo(
    () =>
      Array.from(new Set(templates.map((template) => template.assignmentType))),
    [templates],
  );

  const formatDate = (value?: string | null) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("vi-VN", {
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
      const response = await dispatch(createRubricTemplate(payload)).unwrap();
      notifySuccess(
        "Tạo thành công",
        extractLocalizedMessage(response, "Tạo mẫu tiêu chí thành công."),
      );
      setIsCreateModalOpen(false);
      dispatch(fetchRubricTemplates({ page: 1, limit: FETCH_ALL_LIMIT }));
    } catch (createError: any) {
      notifyError(
        "Tạo thất bại",
        typeof createError === "string"
          ? extractLocalizedMessage(createError, createError)
          : createError?.message || "Không thể tạo mẫu tiêu chí",
      );
    }
  };

  const handleUpdateTemplate = async (payload: RubricTemplatePayload) => {
    if (!editingTemplate) return;
    try {
      const response = await dispatch(
        updateRubricTemplate({
          rubricTemplateId: editingTemplate.rubricTemplateId,
          data: payload,
        }),
      ).unwrap();
      notifySuccess(
        "Cập nhật thành công",
        extractLocalizedMessage(response, "Cập nhật mẫu tiêu chí thành công."),
      );
      setIsEditModalOpen(false);
      setEditingTemplate(null);
      dispatch(fetchRubricTemplates({ page: 1, limit: FETCH_ALL_LIMIT }));
    } catch (updateError: any) {
      notifyError(
        "Cập nhật thất bại",
        typeof updateError === "string"
          ? extractLocalizedMessage(updateError, updateError)
          : updateError?.message || "Không thể cập nhật mẫu tiêu chí",
      );
    }
  };

  const handleDeleteTemplate = async (rubricTemplateId: number) => {
    try {
      const response = await dispatch(
        deleteRubricTemplate(rubricTemplateId),
      ).unwrap();
      notifySuccess(
        "Xóa thành công",
        extractLocalizedMessage(response, "Xóa mẫu tiêu chí thành công."),
      );
      dispatch(fetchRubricTemplates({ page: 1, limit: FETCH_ALL_LIMIT }));
    } catch (deleteError: any) {
      notifyError(
        "Xóa thất bại",
        typeof deleteError === "string"
          ? extractLocalizedMessage(deleteError, deleteError)
          : deleteError?.message || "Không thể xóa mẫu tiêu chí",
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
        fetchRubricTemplates({ page: 1, limit: FETCH_ALL_LIMIT }),
      ).unwrap();
    } catch (createCriteriaError: any) {
      notifyError(
        "Tạo thất bại",
        typeof createCriteriaError === "string"
          ? extractLocalizedMessage(createCriteriaError, createCriteriaError)
          : createCriteriaError?.message || "Không thể tạo tiêu chí",
      );
      throw createCriteriaError;
    }
  };

  const handleUpdateCriteria = async (
    criteriaId: number,
    payload: RubricTemplateCriteriaBatchUpdatePayload,
  ) => {
    try {
      await dispatch(
        updateRubricTemplateCriterion({ criteriaId, data: payload }),
      ).unwrap();
      notifySuccess("Cập nhật thành công", "Cập nhật tiêu chí thành công.");
      await dispatch(
        fetchRubricTemplates({ page: 1, limit: FETCH_ALL_LIMIT }),
      ).unwrap();
    } catch (updateCriteriaError: any) {
      notifyError(
        "Cập nhật thất bại",
        typeof updateCriteriaError === "string"
          ? extractLocalizedMessage(updateCriteriaError, updateCriteriaError)
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
        fetchRubricTemplates({ page: 1, limit: FETCH_ALL_LIMIT }),
      ).unwrap();
    } catch (deleteCriteriaError: any) {
      notifyError(
        "Xóa thất bại",
        typeof deleteCriteriaError === "string"
          ? extractLocalizedMessage(deleteCriteriaError, deleteCriteriaError)
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
            criteriaName: criterion.criteriaName.trim(),
            criteriaDescription: criterion.criteriaDescription.trim(),
            weight: Number(criterion.weight),
            maxScore: Number(criterion.maxScore),
            displayOrder: criterion.displayOrder,
              },
            }),
          ).unwrap(),
        ),
      );
      notifySuccess(
        "Cập nhật thành công",
        "Cập nhật thứ tự tiêu chí thành công.",
      );
      await dispatch(
        fetchRubricTemplates({ page: 1, limit: FETCH_ALL_LIMIT }),
      ).unwrap();
    } catch (reorderCriteriaError: any) {
      notifyError(
        "Cập nhật thất bại",
        typeof reorderCriteriaError === "string"
          ? extractLocalizedMessage(reorderCriteriaError, reorderCriteriaError)
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
          return (
            <span className="text-xs text-gray-400">Không có tiêu chí</span>
          );
        }
        return (
          <div className="space-y-1 max-w-xs">
            {sortedCriteria.slice(0, 3).map((criterion) => (
              <div
                key={criterion.criteriaId}
                className="flex items-center justify-between gap-2 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs cursor-pointer hover:border-blue-300 hover:bg-blue-50"
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
                <span className="font-medium text-gray-800 truncate rounded-md">
                  {criterion.displayOrder}. {criterion.criteriaName}
                </span>
                <Tag className="text-[10px]" color="blue">
                  {Number(criterion.weight)}%
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
      title: "Ngày tạo",
      key: "createdAt",
      render: (_, record) => formatDate(record.createdAt),
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
            <Button type="text" icon={<DeleteOutlined />} danger title="Xóa" />
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
                Quản lý mẫu tiêu chí
              </h1>
              <p className="text-sm text-gray-600">
                Quản lý bộ tiêu chí mẫu cho các loại bài nộp
              </p>
            </div>
            <Space>
              <Button
                icon={<ReloadOutlined style={{ fontSize: 14 }} />}
                onClick={() =>
                  dispatch(
                    fetchRubricTemplates({
                      page: 1,
                      limit: FETCH_ALL_LIMIT,
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

          <SummaryMetrics
            items={summaryItems}
            columnsClassName="grid grid-cols-1 sm:grid-cols-3 gap-4"
          />

          <Card className="rounded-2xl overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">
                  Danh mục
                </p>
                <h2 className="text-lg font-bold text-gray-900">
                  Mẫu tiêu chí
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
                <Select
                  value={sortByCreatedAt}
                  onChange={(val) => {
                    setSortByCreatedAt(val);
                    setCurrentPage(1);
                  }}
                  style={{ width: 140 }}
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
                dataSource={filteredTemplates}
                rowKey="rubricTemplateId"
                loading={loading}
                pagination={
                  filteredTemplates.length > 0
                    ? {
                        current: currentPage,
                        pageSize,
                        total: filteredTemplates.length,
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
                      ? "Không tìm thấy mẫu tiêu chí phù hợp bộ lọc"
                      : "Chưa có mẫu tiêu chí nào. Hãy tạo mẫu đầu tiên để bắt đầu.",
                }}
              />
            </ConfigProvider>
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
