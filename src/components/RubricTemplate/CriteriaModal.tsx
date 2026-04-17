import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Edit,
  GripVertical,
  Search,
  Trash2,
  X,
} from "lucide-react";
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

interface CriteriaFormState {
  criteriaName: string;
  criteriaDescription: string;
  weight: string;
  maxScore: string;
  displayOrder: string;
  evaluationGuide: string;
  isActive: boolean;
}

const defaultFormState: CriteriaFormState = {
  criteriaName: "",
  criteriaDescription: "",
  weight: "1",
  maxScore: "100",
  displayOrder: "1",
  evaluationGuide: "",
  isActive: true,
};

type SortableCriteriaItemProps = {
  criterion: RubricTemplateCriterion;
  isEditing: boolean;
  onSelect: (criterion: RubricTemplateCriterion) => void;
  onDelete: (criterion: RubricTemplateCriterion) => void;
};

const SortableCriteriaItem = ({
  criterion,
  isEditing,
  onSelect,
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
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      role="button"
      tabIndex={0}
      onClick={() => onSelect(criterion)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect(criterion);
        }
      }}
      className={`w-full rounded-3xl border p-3 text-left transition-all cursor-grab active:cursor-grabbing ${isDragging
          ? "border-sky-300 bg-sky-50/80 shadow-md opacity-80"
          : isEditing
            ? "border-sky-300 bg-sky-50/70 shadow-sm"
            : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
        }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <span className="mt-0.5 rounded-lg p-1.5 text-slate-400">
            <GripVertical className="h-4 w-4" />
          </span>

          <div>
            <p className="text-sm font-semibold text-slate-900">
              {criterion.displayOrder}. {criterion.criteriaName}
            </p>
            <p className="mt-1 text-xs text-slate-600 line-clamp-2">
              {criterion.criteriaDescription}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
              <span className="rounded-full bg-slate-100 px-2 py-0.5">
                Persen{" "}
                {Number(criterion.weight) % 1 === 0
                  ? Math.floor(Number(criterion.weight))
                  : Number(criterion.weight).toFixed(1)}
                %
              </span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5">
                Max: {criterion.maxScore}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 ${criterion.isActive
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-rose-100 text-rose-700"
                  }`}
              >
                {criterion.isActive ? "Đang hoạt động" : "Không hoạt động"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 gap-1">
          <span className="rounded-xl p-2 text-sky-600" title="Sửa tiêu chí">
            <Edit className="h-4 w-4" />
          </span>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onDelete(criterion);
            }}
            className="rounded-xl p-2 text-rose-600 hover:bg-rose-50"
            title="Xóa tiêu chí"
          >
            <Trash2 className="h-4 w-4" />
          </button>
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
  const [formState, setFormState] =
    useState<CriteriaFormState>(defaultFormState);
  const [errors, setErrors] = useState<
    Partial<Record<keyof CriteriaFormState, string>>
  >({});
  const [editingCriterion, setEditingCriterion] =
    useState<RubricTemplateCriterion | null>(null);
  const [deletingCriterion, setDeletingCriterion] =
    useState<RubricTemplateCriterion | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [localCriteria, setLocalCriteria] = useState<RubricTemplateCriterion[]>(
    [],
  );
  const [originalCriteria, setOriginalCriteria] = useState<
    RubricTemplateCriterion[]
  >([]);

  const sortedCriteria = useMemo(() => {
    return [...(template?.criteria || [])].sort(
      (a, b) => a.displayOrder - b.displayOrder,
    );
  }, [template]);

  useEffect(() => {
    setLocalCriteria(sortedCriteria);
    setOriginalCriteria(sortedCriteria);
  }, [sortedCriteria]);

  const totalActivePercentage = useMemo(() => {
    return localCriteria.reduce(
      (sum, criterion) => sum + Number(criterion.weight),
      0,
    );
  }, [localCriteria]);

  const nextDisplayOrder = useMemo(() => {
    if (sortedCriteria.length === 0) return 1;
    return (
      Math.max(...sortedCriteria.map((criterion) => criterion.displayOrder)) + 1
    );
  }, [sortedCriteria]);

  const potentialTotalPercentage = useMemo(() => {
    if (editingCriterion) {
      const oldCriterion = localCriteria.find(
        (item) => item.criteriaId === editingCriterion.criteriaId,
      );
      if (!oldCriterion) return totalActivePercentage;

      const oldWeight = Number(oldCriterion.weight);
      const newWeight = Number(formState.weight);
      return totalActivePercentage - oldWeight + newWeight;
    }

    const newWeight = Number(formState.weight);
    return totalActivePercentage + newWeight;
  }, [
    editingCriterion,
    formState.weight,
    localCriteria,
    totalActivePercentage,
  ]);

  const isPercentageComplete = useMemo(() => {
    return totalActivePercentage >= 100;
  }, [totalActivePercentage]);

  const isPercentageExceeded = useMemo(() => {
    return potentialTotalPercentage > 100;
  }, [potentialTotalPercentage]);
  useEffect(() => {
    if (!isOpen) return;
    setEditingCriterion(null);
    setDeletingCriterion(null);
    setSearchTerm("");
    setCreateMode();
  }, [isOpen, template?.rubricTemplateId]);

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

  const handleCancelReorder = useCallback(() => {
    setLocalCriteria(originalCriteria);
  }, [originalCriteria]);

  const handleSaveReorder = useCallback(async () => {
    if (!template || !isOrderChanged) return;

    const reorderedCriteria = localCriteria.map((criterion, index) => ({
      ...criterion,
      displayOrder: index + 1,
    }));

    await onReorder(reorderedCriteria);
    setLocalCriteria(reorderedCriteria);
    setOriginalCriteria(reorderedCriteria);
  }, [isOrderChanged, localCriteria, onReorder, template]);

  if (!isOpen || !template) return null;

  const setEditMode = (criterion: RubricTemplateCriterion) => {
    setEditingCriterion(criterion);
    setErrors({});
    const weightNum = Number(criterion.weight);
    setFormState({
      criteriaName: criterion.criteriaName || "",
      criteriaDescription: criterion.criteriaDescription || "",
      weight: String(weightNum % 1 === 0 ? Math.floor(weightNum) : weightNum),
      maxScore: String(criterion.maxScore ?? ""),
      displayOrder: String(criterion.displayOrder ?? ""),
      evaluationGuide: criterion.evaluationGuide || "",
      isActive: criterion.isActive,
    });
  };

  const setCreateMode = (displayOrder = nextDisplayOrder) => {
    setEditingCriterion(null);
    setErrors({});
    setFormState({
      criteriaName: "",
      criteriaDescription: "",
      weight: "1",
      maxScore: "100",
      displayOrder: String(displayOrder),
      evaluationGuide: "",
      isActive: true,
    });
  };

  const validateForm = () => {
    const nextErrors: Partial<Record<keyof CriteriaFormState, string>> = {};

    if (!formState.criteriaName.trim()) {
      nextErrors.criteriaName = "Tên tiêu chí không được để trống";
    }

    if (!formState.criteriaDescription.trim()) {
      nextErrors.criteriaDescription = "Mô tả tiêu chí không được để trống";
    }

    const weightValue = Number(formState.weight);
    if (Number.isNaN(weightValue) || weightValue <= 0) {
      nextErrors.weight = "Phần trăm phải là số lớn hơn 0";
    }

    const maxScoreValue = Number(formState.maxScore);
    if (Number.isNaN(maxScoreValue) || maxScoreValue <= 0) {
      nextErrors.maxScore = "Điểm tối đa phải là số lớn hơn 0";
    }

    const displayOrderValue = Number(formState.displayOrder);
    if (
      Number.isNaN(displayOrderValue) ||
      !Number.isInteger(displayOrderValue) ||
      displayOrderValue <= 0
    ) {
      nextErrors.displayOrder = "Thứ tự hiển thị phải là số nguyên dương";
    }

    if (!formState.evaluationGuide.trim()) {
      nextErrors.evaluationGuide = "Hướng dẫn đánh giá không được để trống";
    }

    if (formState.isActive && potentialTotalPercentage > 100) {
      nextErrors.weight = `Tổng phần trăm sẽ vượt quá 100% (sẽ là ${potentialTotalPercentage.toFixed(1)}%)`;
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const buildPayload = (): RubricTemplateCriterionPayload => ({
    criteriaName: formState.criteriaName.trim(),
    criteriaDescription: formState.criteriaDescription.trim(),
    weight: Number(formState.weight),
    maxScore: Number(formState.maxScore),
    displayOrder: Number(formState.displayOrder),
    evaluationGuide: formState.evaluationGuide.trim(),
    isActive: formState.isActive,
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateForm()) return;

    const payload = buildPayload();

    if (editingCriterion) {
      await onUpdate(editingCriterion.criteriaId, payload);
      setCreateMode();
    } else {
      await onCreate(template.rubricTemplateId, payload);
      setCreateMode(Number(payload.displayOrder) + 1);
    }
  };

  const handleDeleteCriterion = async () => {
    if (!deletingCriterion) return;

    await onDelete(deletingCriterion.criteriaId, template.rubricTemplateId);
    setDeletingCriterion(null);

    if (editingCriterion?.criteriaId === deletingCriterion.criteriaId) {
      setCreateMode();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
      <div className="w-full max-w-6xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="bg-gradient-to-r from-sky-50 via-white to-emerald-50 border-b border-slate-100 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">
                Mẫu rubric
              </p>
              <h3 className="mt-1 text-xl font-semibold text-slate-900">
                Quản lý tiêu chí
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                {template.templateName}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-slate-200 bg-white p-2 text-slate-500 transition-colors hover:text-slate-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-3xl border border-slate-200 bg-white px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">
                Tổng
              </p>
              <p className="text-lg font-bold text-slate-900">
                {sortedCriteria.length}
              </p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">
                Hoạt động
              </p>
              <p className="text-lg font-bold text-emerald-700">
                {
                  sortedCriteria.filter((criterion) => criterion.isActive)
                    .length
                }
              </p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">
                Thứ tự tiếp theo
              </p>
              <p className="text-lg font-bold text-slate-900">
                {nextDisplayOrder}
              </p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">
                Tỷ lệ
              </p>
              <p
                className={`text-lg font-bold ${isPercentageComplete ? "text-emerald-700" : "text-rose-700"
                  }`}
              >
                {totalActivePercentage % 1 === 0
                  ? Math.floor(totalActivePercentage)
                  : totalActivePercentage.toFixed(1)}
                %
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 p-5 lg:grid-cols-[1.1fr_1fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-4">
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Danh sách tiêu chí
              </h4>
              <button
                type="button"
                onClick={() => setCreateMode()}
                className="text-xs font-semibold px-2 py-1 rounded-full bg-sky-100 text-sky-700 hover:bg-sky-200 transition whitespace-nowrap"
              >
                + Thêm mới
              </button>
            </div>

            <div className="relative mb-3">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm theo tên, mô tả, hướng dẫn..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none transition-colors focus:border-sky-300 focus:bg-white"
              />
            </div>

            <div className="max-h-[460px] space-y-2 overflow-y-auto pr-1">
              {filteredCriteria.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center text-sm text-slate-500">
                  {searchTerm
                    ? "Không tìm thấy tiêu chí phù hợp"
                    : "Mẫu này chưa có tiêu chí nào"}
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
                        onSelect={setEditMode}
                        onDelete={setDeletingCriterion}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              )}
            </div>

            {isOrderChanged && (
              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleSaveReorder}
                  disabled={isLoading}
                  className="rounded-2xl bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoading ? "Đang lưu..." : "Lưu thứ tự"}
                </button>
                <button
                  type="button"
                  onClick={handleCancelReorder}
                  disabled={isLoading}
                  className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Hủy
                </button>
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <h4 className="text-base font-semibold text-slate-800">
                  {editingCriterion ? "Sửa tiêu chí" : "Tiêu chí mới"}
                </h4>
                <p className="text-xs text-slate-500">
                  {editingCriterion
                    ? "Cập nhật thông tin và hướng dẫn đánh giá"
                    : "Tạo tiêu chí mới cho mẫu rubric"}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Tên tiêu chí
                </label>
                <input
                  type="text"
                  value={formState.criteriaName}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      criteriaName: e.target.value,
                    }))
                  }
                  className={`w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-200 ${errors.criteriaName ? "border-rose-300" : "border-slate-300"
                    }`}
                  placeholder="Chất lượng nội dung"
                />
                {errors.criteriaName && (
                  <p className="mt-1 text-xs text-rose-600">
                    {errors.criteriaName}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Mô tả
                </label>
                <textarea
                  rows={2}
                  value={formState.criteriaDescription}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      criteriaDescription: e.target.value,
                    }))
                  }
                  className={`w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-200 ${errors.criteriaDescription
                      ? "border-rose-300"
                      : "border-slate-300"
                    }`}
                  placeholder="Đánh giá độ rõ ràng và chiều sâu nội dung"
                />
                {errors.criteriaDescription && (
                  <p className="mt-1 text-xs text-rose-600">
                    {errors.criteriaDescription}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Persen %
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formState.weight}
                    onChange={(e) =>
                      setFormState((prev) => ({
                        ...prev,
                        weight: e.target.value,
                      }))
                    }
                    className={`w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-200 ${errors.weight ? "border-rose-300" : "border-slate-300"
                      }`}
                  />
                  {errors.weight && (
                    <p className="mt-1 text-xs text-rose-600">
                      {errors.weight}
                    </p>
                  )}
                  {isPercentageExceeded && !errors.weight && (
                    <p className="mt-1 text-xs font-semibold text-amber-600">
                      Total sẽ vượt 100%
                    </p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Điểm tối đa
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formState.maxScore}
                    onChange={(e) =>
                      setFormState((prev) => ({
                        ...prev,
                        maxScore: e.target.value,
                      }))
                    }
                    className={`w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-200 ${errors.maxScore ? "border-rose-300" : "border-slate-300"
                      }`}
                  />
                  {errors.maxScore && (
                    <p className="mt-1 text-xs text-rose-600">
                      {errors.maxScore}
                    </p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Thứ tự hiển thị
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formState.displayOrder}
                    onChange={(e) =>
                      setFormState((prev) => ({
                        ...prev,
                        displayOrder: e.target.value,
                      }))
                    }
                    className={`w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-200 ${errors.displayOrder
                        ? "border-rose-300"
                        : "border-slate-300"
                      }`}
                  />
                  {errors.displayOrder && (
                    <p className="mt-1 text-xs text-rose-600">
                      {errors.displayOrder}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Hướng dẫn đánh giá
                </label>
                <textarea
                  rows={3}
                  value={formState.evaluationGuide}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      evaluationGuide: e.target.value,
                    }))
                  }
                  className={`w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-200 ${errors.evaluationGuide
                      ? "border-rose-300"
                      : "border-slate-300"
                    }`}
                  placeholder="Hướng dẫn đánh giá..."
                />
                {errors.evaluationGuide && (
                  <p className="mt-1 text-xs text-rose-600">
                    {errors.evaluationGuide}
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="rounded-2xl bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoading
                    ? "Đang lưu..."
                    : editingCriterion
                      ? "Cập nhật tiêu chí"
                      : "Tạo tiêu chí"}
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>

      {deletingCriterion && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-5 shadow-xl">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-xl bg-rose-100 p-2 text-rose-600">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Xác nhận xóa tiêu chí
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  Bạn có chắc muốn xóa tiêu chí "
                  {deletingCriterion.criteriaName}"?
                </p>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingCriterion(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleDeleteCriterion}
                disabled={isLoading}
                className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? "Đang xóa..." : "Xóa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CriteriaModal;
