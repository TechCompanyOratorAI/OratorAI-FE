import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Button,
  Space,
  Typography,
  Popconfirm,
  Card,
  Tag,
  App,
} from "antd";
import { GripVertical } from "lucide-react";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  RubricTemplate,
  RubricTemplateCriterion,
  RubricTemplateCriterionPayload,
} from "@/services/features/admin/rubricTempleSlice";

const { Text } = Typography;

interface CriteriaModalProps {
  isOpen: boolean;
  template: RubricTemplate | null;
  isLoading?: boolean;
  onClose: () => void;
  onCreate: (
    rubricTemplateId: number,
    payload: RubricTemplateCriterionPayload,
  ) => Promise<void>;
  onUpdate: (
    criteriaId: number,
    payload: RubricTemplateCriterionPayload,
  ) => Promise<void>;
  onReorder: (criteria: RubricTemplateCriterion[]) => Promise<void>;
  onDelete: (criteriaId: number, rubricTemplateId: number) => Promise<void>;
}

interface CriteriaFormValues {
  criteriaName: string;
  criteriaDescription: string;
  weight: number;
  maxScore: number;
  displayOrder: number;
  evaluationGuide: string;
  isActive: boolean;
}

type SortableCriteriaItemProps = {
  criterion: RubricTemplateCriterion;
  isEditing: boolean;
  onSelect: (criterion: RubricTemplateCriterion) => void;
  onDelete: (criterion: RubricTemplateCriterion) => void;
  onEditClick: (criterion: RubricTemplateCriterion) => void;
};

const SortableCriteriaItem = ({
  criterion,
  isEditing,
  onEditClick,
  onDelete,
}: SortableCriteriaItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: criterion.criteriaId,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`w-full rounded-2xl border p-3 text-left transition-all ${
        isDragging
          ? "border-blue-300 bg-blue-50/80 shadow-md"
          : isEditing
            ? "border-blue-300 bg-blue-50/70 shadow-sm"
            : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <Button
            type="text"
            icon={<GripVertical />}
            {...attributes}
            {...listeners}
            className="mt-0.5 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
            title="Drag to reorder"
          />

          <div>
            <p className="text-sm font-semibold text-gray-900">
              {criterion.displayOrder}. {criterion.criteriaName}
            </p>
            <p className="mt-1 text-xs text-gray-600 line-clamp-2">
              {criterion.criteriaDescription}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-gray-500">
              <Tag color="blue">
                Weight {Number(criterion.weight) % 1 === 0
                  ? Math.floor(Number(criterion.weight))
                  : Number(criterion.weight).toFixed(1)}%
              </Tag>
              <Tag>Max: {criterion.maxScore}</Tag>
              <Tag color={criterion.isActive ? "green" : "red"}>
                {criterion.isActive ? "Active" : "Inactive"}
              </Tag>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 gap-1">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => onEditClick(criterion)}
            className="text-blue-500 hover:text-blue-600"
            title="Edit criterion"
          />
          <Popconfirm
            title="Xác nhận xóa criteria"
            description={`Bạn có chắc muốn xóa criteria "${criterion.criteriaName}"?`}
            onConfirm={() => onDelete(criterion)}
            okText="Xóa"
            okButtonProps={{ danger: true }}
            cancelText="Hủy"
          >
            <Button
              type="text"
              icon={<DeleteOutlined />}
              danger
              title="Delete criterion"
            />
          </Popconfirm>
        </div>
      </div>
    </div>
  );
};

const CriteriaModal: React.FC<CriteriaModalProps> = ({
  isOpen,
  template,
  isLoading = false,
  onClose,
  onCreate,
  onUpdate,
  onReorder,
  onDelete,
}) => {
  const [form] = Form.useForm<CriteriaFormValues>();
  const [editingCriterion, setEditingCriterion] =
    useState<RubricTemplateCriterion | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [localCriteria, setLocalCriteria] = useState<RubricTemplateCriterion[]>(
    [],
  );
  const [originalCriteria, setOriginalCriteria] = useState<
    RubricTemplateCriterion[]
  >([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { message: antdMessage } = App.useApp();

  const sortedCriteria = useMemo(() => {
    return [...(template?.criteria || [])].sort(
      (a, b) => a.displayOrder - b.displayOrder,
    );
  }, [template]);

  useEffect(() => {
    setLocalCriteria(sortedCriteria);
    setOriginalCriteria(sortedCriteria);
  }, [sortedCriteria]);

  const nextDisplayOrder = useMemo(() => {
    if (sortedCriteria.length === 0) return 1;
    return (
      Math.max(...sortedCriteria.map((criterion) => criterion.displayOrder)) + 1
    );
  }, [sortedCriteria]);

  useEffect(() => {
    if (!isOpen) return;
    setEditingCriterion(null);
    setSearchTerm("");
    form.resetFields();
  }, [isOpen, template?.rubricTemplateId, form]);

  const filteredCriteria = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return localCriteria;

    return localCriteria.filter((criterion) => {
      return (
        criterion.criteriaName.toLowerCase().includes(keyword) ||
        criterion.criteriaDescription.toLowerCase().includes(keyword) ||
        criterion.evaluationGuide.toLowerCase().includes(keyword)
      );
    });
  }, [localCriteria, searchTerm]);

  const isOrderChanged = useMemo(() => {
    if (localCriteria.length !== originalCriteria.length) return true;
    return localCriteria.some(
      (criterion, index) =>
        criterion.criteriaId !== originalCriteria[index]?.criteriaId,
    );
  }, [localCriteria, originalCriteria]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setLocalCriteria((previous) => {
      const oldIndex = previous.findIndex(
        (item) => item.criteriaId === Number(active.id),
      );
      const newIndex = previous.findIndex(
        (item) => item.criteriaId === Number(over.id),
      );

      if (oldIndex < 0 || newIndex < 0) return previous;
      return arrayMove(previous, oldIndex, newIndex);
    });
  }, []);

  const handleSaveReorder = async () => {
    if (!template || !isOrderChanged) return;
    const reorderedCriteria = localCriteria.map((criterion, index) => ({
      ...criterion,
      displayOrder: index + 1,
    }));
    try {
      await onReorder(reorderedCriteria);
      setLocalCriteria(reorderedCriteria);
      setOriginalCriteria(reorderedCriteria);
      antdMessage.success("Cập nhật thứ tự criteria thành công");
    } catch {
      antdMessage.error("Không thể cập nhật thứ tự criteria");
    }
  };

  const handleCancelReorder = () => {
    setLocalCriteria(originalCriteria);
  };

  const handleEditClick = (criterion: RubricTemplateCriterion) => {
    setEditingCriterion(criterion);
    const weightNum = Number(criterion.weight);
    form.setFieldsValue({
      criteriaName: criterion.criteriaName,
      criteriaDescription: criterion.criteriaDescription,
      weight: weightNum % 1 === 0 ? Math.floor(weightNum) : weightNum,
      maxScore: criterion.maxScore,
      displayOrder: criterion.displayOrder,
      evaluationGuide: criterion.evaluationGuide,
      isActive: criterion.isActive,
    });
  };

  const handleCreateNew = () => {
    setEditingCriterion(null);
    form.resetFields();
    form.setFieldsValue({
      weight: 1,
      maxScore: 100,
      displayOrder: nextDisplayOrder,
      isActive: true,
    });
  };

  const handleSubmit = async (values: CriteriaFormValues) => {
    if (!template) return;
    setIsSubmitting(true);
    try {
      const payload: RubricTemplateCriterionPayload = {
        criteriaName: values.criteriaName,
        criteriaDescription: values.criteriaDescription,
        weight: Number(values.weight),
        maxScore: Number(values.maxScore),
        displayOrder: Number(values.displayOrder),
        evaluationGuide: values.evaluationGuide,
        isActive: values.isActive,
      };

      if (editingCriterion) {
        await onUpdate(editingCriterion.criteriaId, payload);
        antdMessage.success("Cập nhật criteria thành công");
        handleCreateNew();
      } else {
        await onCreate(template.rubricTemplateId, payload);
        antdMessage.success("Tạo criteria thành công");
        form.setFieldsValue({
          criteriaName: "",
          criteriaDescription: "",
          weight: 1,
          maxScore: 100,
          displayOrder: Number(values.displayOrder) + 1,
          evaluationGuide: "",
          isActive: true,
        });
      }
    } catch {
      // error handled in parent
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCriterion = async (criterion: RubricTemplateCriterion) => {
    if (!template) return;
    try {
      await onDelete(criterion.criteriaId, template.rubricTemplateId);
      if (editingCriterion?.criteriaId === criterion.criteriaId) {
        handleCreateNew();
      }
    } catch {
      // error handled in parent
    }
  };

  const statsActive = sortedCriteria.filter((c) => c.isActive).length;
  const statsInactive = sortedCriteria.filter((c) => !c.isActive).length;

  return (
    <Modal
      title={
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
            Rubric Template
          </p>
          <p className="text-lg font-semibold">Criteria Management</p>
          <p className="text-sm font-normal text-gray-500">
            {template?.templateName}
          </p>
        </div>
      }
      open={isOpen}
      onCancel={onClose}
      footer={null}
      centered
      width={1000}
      destroyOnClose
      loading={isLoading}
      maskClosable={!isLoading}
    >
      <div className="mt-4">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <Card size="small" className="text-center">
            <Text type="secondary" className="text-xs">Total</Text>
            <p className="text-lg font-bold">{sortedCriteria.length}</p>
          </Card>
          <Card size="small" className="text-center">
            <Text type="secondary" className="text-xs">Active</Text>
            <p className="text-lg font-bold text-green-600">{statsActive}</p>
          </Card>
          <Card size="small" className="text-center">
            <Text type="secondary" className="text-xs">Inactive</Text>
            <p className="text-lg font-bold text-red-600">{statsInactive}</p>
          </Card>
          <Card size="small" className="text-center">
            <Text type="secondary" className="text-xs">Next Order</Text>
            <p className="text-lg font-bold">{nextDisplayOrder}</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.1fr_1fr]">
          {/* Left - Criteria List */}
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex items-center justify-between mb-3">
              <Text strong className="text-sm uppercase tracking-wide text-gray-500">
                Criteria List
              </Text>
              <Button
                size="small"
                onClick={handleCreateNew}
                icon={<EditOutlined />}
              >
                New Criteria
              </Button>
            </div>

            <Input
              placeholder="Search by name, description, guide..."
              prefix={<span className="text-gray-400">🔍</span>}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mb-3"
              allowClear
            />

            <div className="max-h-[400px] space-y-2 overflow-y-auto pr-1">
              {filteredCriteria.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-5 text-center text-sm text-gray-500">
                  {searchTerm
                    ? "Không tìm thấy criteria phù hợp"
                    : "Template này chưa có criteria nào"}
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  modifiers={[restrictToVerticalAxis]}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={filteredCriteria.map(
                      (criterion) => criterion.criteriaId,
                    )}
                    strategy={verticalListSortingStrategy}
                  >
                    {filteredCriteria.map((criterion) => (
                      <SortableCriteriaItem
                        key={criterion.criteriaId}
                        criterion={criterion}
                        isEditing={
                          editingCriterion?.criteriaId === criterion.criteriaId
                        }
                        onSelect={() => handleEditClick(criterion)}
                        onDelete={handleDeleteCriterion}
                        onEditClick={handleEditClick}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              )}
            </div>

            {isOrderChanged && (
              <div className="mt-4 flex items-center justify-end gap-2">
                <Button onClick={handleCancelReorder} disabled={isLoading}>
                  Cancel
                </Button>
                <Button
                  type="primary"
                  onClick={handleSaveReorder}
                  loading={isLoading}
                >
                  Save Order
                </Button>
              </div>
            )}
          </div>

          {/* Right - Form */}
          <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <Text strong className="text-base text-gray-800">
                  {editingCriterion ? "Edit Criteria" : "Create Criteria"}
                </Text>
                <p className="text-xs text-gray-500">
                  {editingCriterion
                    ? "Cập nhật thông tin và hướng dẫn đánh giá"
                    : "Tạo criteria mới cho rubric template"}
                </p>
              </div>
              {editingCriterion && (
                <Button size="small" onClick={handleCreateNew}>
                  New Criteria
                </Button>
              )}
            </div>

            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              requiredMark="optional"
              disabled={isSubmitting || isLoading}
              initialValues={{
                weight: 1,
                maxScore: 100,
                displayOrder: nextDisplayOrder,
                isActive: true,
              }}
            >
              <Form.Item
                name="criteriaName"
                label={<Text strong>Criteria Name</Text>}
                rules={[
                  { required: true, message: "Criteria name is required" },
                ]}
              >
                <Input placeholder="VD: Content Quality" />
              </Form.Item>

              <Form.Item
                name="criteriaDescription"
                label={<Text strong>Description</Text>}
                rules={[
                  { required: true, message: "Description is required" },
                ]}
              >
                <Input.TextArea
                  placeholder="Evaluates content clarity and depth"
                  rows={2}
                />
              </Form.Item>

              <div className="grid grid-cols-3 gap-3">
                <Form.Item
                  name="weight"
                  label={<Text strong>Weight %</Text>}
                  rules={[
                    { required: true, message: "Required" },
                    { type: "number", min: 0.01, message: "Must be > 0" },
                  ]}
                >
                  <InputNumber className="w-full" min={0.01} step={0.01} />
                </Form.Item>

                <Form.Item
                  name="maxScore"
                  label={<Text strong>Max Score</Text>}
                  rules={[
                    { required: true, message: "Required" },
                    { type: "number", min: 1, message: "Must be >= 1" },
                  ]}
                >
                  <InputNumber className="w-full" min={1} />
                </Form.Item>

                <Form.Item
                  name="displayOrder"
                  label={<Text strong>Display Order</Text>}
                  rules={[
                    { required: true, message: "Required" },
                    { type: "number", min: 1, message: "Must be >= 1" },
                  ]}
                >
                  <InputNumber className="w-full" min={1} />
                </Form.Item>
              </div>

              <Form.Item
                name="evaluationGuide"
                label={<Text strong>Evaluation Guide</Text>}
                rules={[
                  { required: true, message: "Evaluation guide is required" },
                ]}
              >
                <Input.TextArea
                  placeholder="Guide for evaluation..."
                  rows={3}
                />
              </Form.Item>

              <Form.Item
                name="isActive"
                label={<Text strong>Active</Text>}
                valuePropName="checked"
              >
                <Space>
                  <Button
                    type={form.getFieldValue("isActive") ? "primary" : "default"}
                    size="small"
                    onClick={() => form.setFieldValue("isActive", true)}
                  >
                    Active
                  </Button>
                  <Button
                    type={!form.getFieldValue("isActive") ? "primary" : "default"}
                    size="small"
                    danger={!form.getFieldValue("isActive")}
                    onClick={() => form.setFieldValue("isActive", false)}
                  >
                    Inactive
                  </Button>
                </Space>
              </Form.Item>

              <Form.Item className="!mb-0">
                <Space className="w-full justify-end">
                  <Button onClick={onClose} disabled={isSubmitting || isLoading}>
                    Close
                  </Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={isSubmitting || isLoading}
                  >
                    {isSubmitting || isLoading
                      ? "Saving..."
                      : editingCriterion
                        ? "Update Criteria"
                        : "Create Criteria"}
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default CriteriaModal;
