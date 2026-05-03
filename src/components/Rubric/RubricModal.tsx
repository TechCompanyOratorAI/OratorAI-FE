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
import { RubricCriteriaPayload } from "@/services/features/rubric/rubricSilce";

const RequiredMark = () => (
  <span className="text-red-500" aria-hidden="true">
    *
  </span>
);

function validateCriterionFields(
  criterion: RubricCriterionItem,
): Partial<Record<keyof RubricCriteriaPayload, string>> {
  const next: Partial<Record<keyof RubricCriteriaPayload, string>> = {};
  if (!criterion.criteriaName.trim()) {
    next.criteriaName = "Vui lòng nhập tên tiêu chí.";
  }
  if (!criterion.criteriaDescription.trim()) {
    next.criteriaDescription = "Vui lòng nhập mô tả tiêu chí.";
  }
  const w = Number(criterion.weight);
  if (!Number.isFinite(w) || w <= 0) {
    next.weight = "Vui lòng nhập phần trăm lớn hơn 0.";
  }
  const d = Number(criterion.displayOrder);
  if (!Number.isFinite(d) || d <= 0) {
    next.displayOrder = "Vui lòng nhập thứ tự hiển thị lớn hơn 0.";
  }
  return next;
}

type RubricCriterionItem = {
  classRubricCriteriaId: number;
  criteriaName: string;
  criteriaDescription: string;
  weight: number | string;
  maxScore: number | string;
  displayOrder: number;
  isActive?: number | boolean;
};

interface RubricFormState {
  criteriaName: string;
  criteriaDescription: string;
  weight: string;
  maxScore: string;
  displayOrder: string;
  isActive?: boolean;
}

interface RubricModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    criteriaData: Array<RubricCriteriaPayload & { classRubricCriteriaId?: number }>,
  ) => Promise<void> | void;
  isLoading?: boolean;
  mode?: "create" | "edit";
  initialData?: Partial<RubricCriteriaPayload>;
  defaultDisplayOrder?: number;
  templateName?: string;
  criteriaList?: RubricCriterionItem[];
  activeCriteriaId?: number;
  onSelectCriteria?: (criterionId: number) => void;
  onDeleteCriteria?: (criterionId: number) => Promise<void>;
}

type SortableCriterionItemProps = {
  criterion: RubricCriterionItem;
  isEditing: boolean;
  onSelect: (criterion: RubricCriterionItem) => void;
  onDelete?: (criterion: RubricCriterionItem) => void;
};

const SortableCriterionItem = ({
  criterion,
  isEditing,
  onSelect,
  onDelete,
}: SortableCriterionItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: criterion.classRubricCriteriaId,
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
              {criterion.criteriaName
                ? `${criterion.displayOrder}. ${criterion.criteriaName}`
                : "Tiêu chí mới"}
            </p>
            <p className="mt-1 text-xs text-slate-600 line-clamp-2">
              {criterion.criteriaDescription || "Không có mô tả"}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
              <span className="rounded-full bg-slate-100 px-2 py-0.5">
                Phần trăm: {Number(criterion.weight).toFixed(0)}%
              </span>

            </div>
          </div>
        </div>

        <div className="flex shrink-0 gap-1">
          <span className="rounded-xl p-2 text-sky-600" title="Sửa tiêu chí">
            <Edit className="h-4 w-4" />
          </span>
          {onDelete && (
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
          )}
        </div>
      </div>
    </div>
  );
};

const RubricModal: React.FC<RubricModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  mode = "create",
  initialData,
  defaultDisplayOrder = 1,
  templateName,
  criteriaList = [],
  activeCriteriaId,
  onSelectCriteria,
  onDeleteCriteria,
}) => {
  const WEIGHT_SUGGESTIONS = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100] as const;
  const [formData, setFormData] = useState<RubricFormState>({
    criteriaName: "",
    criteriaDescription: "",
    weight: "1",
    maxScore: "100",
    displayOrder: String(defaultDisplayOrder),
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof RubricCriteriaPayload, string>>
  >({});
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCriterionId, setSelectedCriterionId] = useState<number | null>(
    activeCriteriaId ?? null,
  );
  const [localCriteria, setLocalCriteria] = useState<RubricCriterionItem[]>([]);
  const [originalCriteria, setOriginalCriteria] = useState<
    RubricCriterionItem[]
  >([]);
  const [tempCriterionIdSeed, setTempCriterionIdSeed] = useState(-1);
  const [deletingCriterion, setDeletingCriterion] =
    useState<RubricCriterionItem | null>(null);
  const [showWeightSuggestions, setShowWeightSuggestions] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  );

  useEffect(() => {
    if (!isOpen) return;
    const sorted = [...criteriaList].sort(
      (a, b) => a.displayOrder - b.displayOrder,
    );
    setLocalCriteria(sorted);
    setOriginalCriteria(sorted);
    setTempCriterionIdSeed(-1);
  }, [isOpen, criteriaList]);

  // Calculate total percentage of all criteria
  const totalActivePercentage = useMemo(() => {
    return localCriteria.reduce(
      (sum, criterion) => sum + Number(criterion.weight),
      0,
    );
  }, [localCriteria]);

  const potentialTotalPercentage = useMemo(() => {
    const baseTotal = totalActivePercentage;
    const currentWeight = Number(formData.weight) || 0;

    if (isAddingNew) {
      return baseTotal + currentWeight;
    }

    const selected = localCriteria.find(
      (c) => c.classRubricCriteriaId === selectedCriterionId,
    );
    if (selected) {
      return baseTotal - (Number(selected.weight) || 0) + currentWeight;
    }

    return baseTotal;
  }, [
    totalActivePercentage,
    formData.weight,
    isAddingNew,
    selectedCriterionId,
    localCriteria,
  ]);

  const isPercentageExceeded = useMemo(() => {
    return potentialTotalPercentage > 100.01;
  }, [potentialTotalPercentage]);


  const setFormFromCriterion = useCallback(
    (criterion: RubricCriterionItem) => {
      setFormData({
        criteriaName: criterion.criteriaName || "",
        criteriaDescription: criterion.criteriaDescription || "",
        weight: String(Number(criterion.weight)),
        maxScore: "100",
        displayOrder: String(criterion.displayOrder),
      });
    },
    [],
  );

  useEffect(() => {
    if (!isOpen) {
      setErrors({});
      setSearchTerm("");
      setDeletingCriterion(null);
      setShowWeightSuggestions(false);
      return;
    }

    if (mode === "create") {
      setSelectedCriterionId(null);
      setIsAddingNew(true);
      setFormData({
        criteriaName: "",
        criteriaDescription: "",
        weight: "1",
        maxScore: "100",
        displayOrder: String(defaultDisplayOrder),
        isActive: true,
      });
      setErrors({});
      return;
    }

    const initialSelectedId = activeCriteriaId ?? null;
    setSelectedCriterionId(initialSelectedId);

    const selectedCriterion = initialSelectedId
      ? criteriaList.find(
        (item) => item.classRubricCriteriaId === initialSelectedId,
      )
      : null;

    if (selectedCriterion) {
      setFormFromCriterion(selectedCriterion);
    } else {
      setFormData({
        criteriaName: initialData?.criteriaName ?? "",
        criteriaDescription: initialData?.criteriaDescription ?? "",
        weight: String(Number(initialData?.weight ?? 1)),
        maxScore: "100",
        displayOrder: String(
          Number(initialData?.displayOrder ?? defaultDisplayOrder),
        ),
      });
    }

    setErrors({});
  }, [
    isOpen,
    mode,
    initialData,
    defaultDisplayOrder,
    activeCriteriaId,
    criteriaList,
    setFormFromCriterion,
  ]);

  const filteredCriteria = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return localCriteria;

    return localCriteria.filter((item) => {
      return (
        item.criteriaName.toLowerCase().includes(keyword) ||
        item.criteriaDescription.toLowerCase().includes(keyword)
      );
    });
  }, [localCriteria, searchTerm]);




  const isExistingCriterionSelected =
    selectedCriterionId !== null && selectedCriterionId > 0;
  const nextOrder =
    localCriteria.length > 0
      ? Math.max(...localCriteria.map((item) => item.displayOrder)) + 1
      : 1;

  // Keep display order synced with next order when no criterion is selected.
  useEffect(() => {
    if (selectedCriterionId === null) {
      setFormData((prev) => ({
        ...prev,
        displayOrder: String(nextOrder),
      }));
    }
  }, [nextOrder, selectedCriterionId]);



  const normalizeCriteriaOrder = useCallback((criteria: RubricCriterionItem[]) => {
    return [...criteria]
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((criterion, index) => ({
        ...criterion,
        displayOrder: index + 1,
      }));
  }, []);

  const handleAddNewCriterion = useCallback(() => {
    setIsAddingNew(true);
    setSelectedCriterionId(null);
    setFormData({
      criteriaName: "",
      criteriaDescription: "",
      weight: "1",
      maxScore: "100",
      displayOrder: String(nextOrder),
    });
    setErrors({});
  }, [nextOrder]);


  const applyFormToSelectedCriterion = useCallback(
    (nextForm: RubricFormState) => {
      if (selectedCriterionId === null) return;
      setLocalCriteria((previous) => {
        const updated = previous.map((criterion) => {
          if (criterion.classRubricCriteriaId !== selectedCriterionId) {
            return criterion;
          }
          const parsedWeight = Number(nextForm.weight);
          const parsedDisplayOrder = Number(nextForm.displayOrder);
          return {
            ...criterion,
            criteriaName: nextForm.criteriaName,
            criteriaDescription: nextForm.criteriaDescription,
            weight: Number.isFinite(parsedWeight) && parsedWeight > 0
              ? parsedWeight
              : criterion.weight,
            displayOrder:
              Number.isFinite(parsedDisplayOrder) && parsedDisplayOrder > 0
                ? Math.trunc(parsedDisplayOrder)
                : criterion.displayOrder,
          };
        });
        return normalizeCriteriaOrder(updated);
      });
    },
    [normalizeCriteriaOrder, selectedCriterionId],
  );

  const normalizeNumberValue = (name: keyof RubricFormState, value: string) => {
    if (!value) return;
    let numericValue = parseFloat(value);
    if (isNaN(numericValue)) return;

    if (name === "weight") {
      // Round up to nearest integer if it has decimals to avoid .9999 issues
      numericValue = Math.ceil(numericValue);
    } else if (name === "maxScore" || name === "displayOrder") {
      numericValue = Math.round(numericValue);
    }

    setFormData((prev) => {
      const next = {
        ...prev,
        [name]: String(numericValue),
      };
      if (name !== "displayOrder" && !isAddingNew) {
        applyFormToSelectedCriterion(next);
      }
      return next;
    });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = {
        ...prev,
        [name]: value,
      };
      if (name !== "displayOrder" && !isAddingNew) {
        applyFormToSelectedCriterion(next);
      }
      return next;
    });

    if (errors[name as keyof RubricCriteriaPayload]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const saveCriteriaState = useCallback(async (updatedList: RubricCriterionItem[]) => {
    const changedCriteria = updatedList
      .map((criterion, index) => {
        const normalized = {
          ...(criterion.classRubricCriteriaId > 0
            ? { classRubricCriteriaId: criterion.classRubricCriteriaId }
            : {}),
          criteriaName: criterion.criteriaName,
          criteriaDescription: criterion.criteriaDescription,
          weight: Number(criterion.weight),
          maxScore: Number(criterion.maxScore),
          displayOrder: index + 1,
          evaluationGuide: "",
        };
        const original = originalCriteria.find(
          (item) =>
            item.classRubricCriteriaId === criterion.classRubricCriteriaId,
        );
        if (!original) return normalized;

        const isChanged =
          criterion.criteriaName !== original.criteriaName ||
          criterion.criteriaDescription !== original.criteriaDescription ||
          Number(criterion.weight) !== Number(original.weight) ||
          Number(criterion.maxScore) !== Number(original.maxScore) ||
          index + 1 !== original.displayOrder;
        return isChanged ? normalized : null;
      })
      .filter((criterion) => criterion !== null);

    if (changedCriteria.length === 0) return;

    setLocalCriteria(updatedList);
    await onSubmit(changedCriteria);
    setOriginalCriteria(
      updatedList.map((criterion, index) => ({
        ...criterion,
        displayOrder: index + 1,
      })),
    );
  }, [originalCriteria, onSubmit]);


  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    let nextList: RubricCriterionItem[] = [];
    setLocalCriteria((previous) => {
      const oldIndex = previous.findIndex(
        (item) => item.classRubricCriteriaId === Number(active.id),
      );
      const newIndex = previous.findIndex(
        (item) => item.classRubricCriteriaId === Number(over.id),
      );

      if (oldIndex < 0 || newIndex < 0) return previous;
      const moved = arrayMove(previous, oldIndex, newIndex);
      nextList = normalizeCriteriaOrder(moved);
      return nextList;
    });

    if (nextList.length > 0) {
      await saveCriteriaState(nextList);
    }
  }, [normalizeCriteriaOrder, saveCriteriaState]);

  const handleSelectCriterion = useCallback(
    (criterion: RubricCriterionItem) => {
      setIsAddingNew(false);
      setSelectedCriterionId(criterion.classRubricCriteriaId);
      setFormFromCriterion(criterion);
      setErrors({});
      onSelectCriteria?.(criterion.classRubricCriteriaId);
    },
    [onSelectCriteria, setFormFromCriterion],
  );

  const mergeFormIntoLocalCriteria = useCallback((): RubricCriterionItem[] => {
    return localCriteria.map((c) => {
      if (
        selectedCriterionId === null ||
        c.classRubricCriteriaId !== selectedCriterionId
      ) {
        return c;
      }
      const parsedWeight = Number(formData.weight);
      const parsedDisplayOrder = Number(formData.displayOrder);
      return {
        ...c,
        criteriaName: formData.criteriaName,
        criteriaDescription: formData.criteriaDescription,
        weight:
          formData.weight.trim() === ""
            ? 0
            : Number.isFinite(parsedWeight)
              ? parsedWeight
              : 0,
        displayOrder:
          formData.displayOrder.trim() === ""
            ? 0
            : Number.isFinite(parsedDisplayOrder)
              ? Math.trunc(parsedDisplayOrder)
              : 0,
      };
    });
  }, [localCriteria, selectedCriterionId, formData]);





  const handleUpdateCurrentCriterion = async () => {
    const updated = mergeFormIntoLocalCriteria();
    const current = updated.find((c) => c.classRubricCriteriaId === selectedCriterionId);
    if (current) {
      const fieldErrors = validateCriterionFields(current);
      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors);
        return;
      }
    }
    setErrors({});
    await saveCriteriaState(updated);
  };


  const handleConfirmAddNew = async () => {
    const dummyCriterion: RubricCriterionItem = {
      classRubricCriteriaId: tempCriterionIdSeed,
      criteriaName: formData.criteriaName,
      criteriaDescription: formData.criteriaDescription,
      weight: formData.weight,
      maxScore: formData.maxScore,
      displayOrder: Number(formData.displayOrder),
      isActive: 1,
    };
    const fieldErrors = validateCriterionFields(dummyCriterion);
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    const nextList = normalizeCriteriaOrder([...localCriteria, dummyCriterion]);
    await saveCriteriaState(nextList);

    setSelectedCriterionId(tempCriterionIdSeed);
    setTempCriterionIdSeed((prev) => prev - 1);
    setIsAddingNew(false);
  };

  const handleDeleteCriterion = async () => {
    if (!deletingCriterion) return;

    // Draft criterion (temporary id) exists only in modal state.
    if (deletingCriterion.classRubricCriteriaId <= 0) {
      setLocalCriteria((previous) =>
        normalizeCriteriaOrder(
          previous.filter(
            (item) =>
              item.classRubricCriteriaId !==
              deletingCriterion.classRubricCriteriaId,
          ),
        ),
      );
      if (selectedCriterionId === deletingCriterion.classRubricCriteriaId) {
        const nextOrderAfterDelete = Math.max(1, localCriteria.length);
        setSelectedCriterionId(null);
        setFormData({
          criteriaName: "",
          criteriaDescription: "",
          weight: "1",
          maxScore: "100",
          displayOrder: String(nextOrderAfterDelete),
        });
        setErrors({});
      }
      setDeletingCriterion(null);
      return;
    }

    if (!onDeleteCriteria) return;
    await onDeleteCriteria(deletingCriterion.classRubricCriteriaId);
    setDeletingCriterion(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
      <div className="w-full max-w-6xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="border-b border-slate-100 bg-gradient-to-r from-sky-50 via-white to-emerald-50 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">
                Mẫu tiêu chí
              </p>
              <h3 className="mt-1 text-xl font-semibold text-slate-900">
                Quản lý tiêu chí
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                {templateName || "Tiêu chí lớp học"}
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

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">
                Tổng tiêu chí
              </p>
              <p className="text-lg font-bold text-slate-900">
                {localCriteria.length}
              </p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white px-3 py-2 relative">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">
                    Phần trăm tổng
                  </p>
                  <p
                    className={`text-lg font-bold ${potentialTotalPercentage > 100
                      ? "text-rose-600"
                      : potentialTotalPercentage >= 99.5
                        ? "text-emerald-600"
                        : "text-amber-600"
                      }`}
                  >
                    {potentialTotalPercentage % 1 === 0
                      ? Math.floor(potentialTotalPercentage)
                      : potentialTotalPercentage.toFixed(1)}
                    %
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>

        <div className="grid grid-cols-1 gap-5 p-5 lg:grid-cols-[1.1fr_1fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between gap-2 mb-3">
              <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Danh sách tiêu chí
              </h4>
              <button
                type="button"
                onClick={handleAddNewCriterion}
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
                placeholder="Tìm theo tên, mô tả..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none transition-colors focus:border-sky-300 focus:bg-white"
              />
            </div>

            <div className="max-h-[460px] space-y-2 overflow-y-auto pr-1">
              {filteredCriteria.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center text-sm text-slate-500">
                  {searchTerm
                    ? "Không có tiêu chí phù hợp với từ khóa tìm kiếm"
                    : "Lớp học này chưa có tiêu chí"}
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
                      (criterion) => criterion.classRubricCriteriaId,
                    )}
                    strategy={verticalListSortingStrategy}
                  >
                    {filteredCriteria.map((criterion) => (
                      <SortableCriterionItem
                        key={criterion.classRubricCriteriaId}
                        criterion={criterion}
                        isEditing={
                          selectedCriterionId ===
                          criterion.classRubricCriteriaId
                        }
                        onSelect={handleSelectCriterion}
                        onDelete={
                          onDeleteCriteria ? setDeletingCriterion : undefined
                        }
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              )}
            </div>

          </section>

          <div className="self-start">
            {!isExistingCriterionSelected && !isAddingNew ? (
              <div className="flex h-[440px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50/50 p-8 text-center">
                <div className="mb-4 rounded-full bg-white p-4 shadow-sm">
                  <Edit className="h-8 w-8 text-slate-300" />
                </div>
                <h4 className="text-base font-semibold text-slate-900">Chưa chọn tiêu chí</h4>
                <p className="mt-2 text-sm text-slate-500 max-w-[240px]">
                  Chọn một tiêu chí từ danh sách bên trái để chỉnh sửa hoặc nhấn
                  <span className="font-semibold text-sky-600"> + Thêm mới </span>
                  để tạo tiêu chí mới.
                </p>
              </div>
            ) : (
              <section className="rounded-3xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div>
                    <h4
                      className={`text-base font-semibold ${isExistingCriterionSelected ? "text-slate-800" : "text-slate-700"
                        }`}
                    >
                      {isExistingCriterionSelected ? "Sửa tiêu chí" : "Tiêu chí mới"}
                    </h4>
                    <p className="text-xs text-slate-500">
                      {isExistingCriterionSelected
                        ? "Cập nhật chi tiết tiêu chí"
                        : "Tạo tiêu chí đánh giá cho lớp học"}
                    </p>
                  </div>
                </div>

                <form onSubmit={(event) => event.preventDefault()} className="space-y-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Tên tiêu chí <RequiredMark />
                    </label>
                    <input
                      name="criteriaName"
                      value={formData.criteriaName}
                      onChange={handleChange}
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
                      Mô tả tiêu chí <RequiredMark />
                    </label>
                    <textarea
                      rows={2}
                      name="criteriaDescription"
                      value={formData.criteriaDescription}
                      onChange={handleChange}
                      className={`w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-200 ${errors.criteriaDescription ? "border-rose-300" : "border-slate-300"
                        }`}
                      placeholder="Đánh giá độ rõ ràng và chiều sâu của tiêu chi tiết"
                    />
                    {errors.criteriaDescription && (
                      <p className="mt-1 text-xs text-rose-600">
                        {errors.criteriaDescription}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Phần trăm (%) <RequiredMark />
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        name="weight"
                        value={formData.weight}
                        onChange={handleChange}
                        onFocus={() => setShowWeightSuggestions(true)}
                        onBlur={() => {
                          setTimeout(() => setShowWeightSuggestions(false), 200);
                          normalizeNumberValue("weight", formData.weight);
                          applyFormToSelectedCriterion(formData);
                        }}
                        className={`w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-200 ${errors.weight ? "border-rose-300" : "border-slate-300"
                          }`}
                        placeholder="30"
                      />
                      {showWeightSuggestions && (
                        <div className="absolute z-20 mt-2 w-full rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
                          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Gợi ý nhanh
                          </p>
                          <div className="max-h-24 overflow-y-auto pr-1">
                            <div className="grid grid-cols-5 gap-2">
                              {WEIGHT_SUGGESTIONS.map((value) => (
                                <button
                                  key={value}
                                  type="button"
                                  onMouseDown={(event) => {
                                    event.preventDefault();
                                    setFormData((prev) => ({
                                      ...prev,
                                      weight: String(value),
                                    }));
                                    setShowWeightSuggestions(false);
                                  }}
                                  className={`flex h-8 w-full items-center justify-center rounded-full border text-[11px] font-semibold leading-none transition ${Number(formData.weight) === value
                                    ? "border-sky-300 bg-sky-100 text-sky-700"
                                    : "border-slate-200 bg-slate-50 text-slate-600 hover:border-sky-200 hover:bg-white hover:text-sky-700"
                                    }`}
                                >
                                  {value}%
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    {errors.weight && (
                      <p className="mt-1 text-xs text-rose-600">
                        {errors.weight}
                      </p>
                    )}
                    {isPercentageExceeded && (
                      <p className="mt-1 text-xs text-amber-600 font-semibold">
                        ⚠️ Tổng các tiêu chí đánh giá sẽ vượt 100%
                      </p>
                    )}
                  </div>

                  {isAddingNew ? (
                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        onClick={handleConfirmAddNew}
                        disabled={isLoading}
                        className="rounded-2xl bg-sky-600 px-8 py-2.5 text-sm font-bold text-white shadow-lg shadow-sky-200 transition-all hover:bg-sky-700 hover:shadow-sky-300 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {isLoading ? "Đang xử lý..." : "Lưu tiêu chí mới"}
                      </button>
                    </div>
                  ) : isExistingCriterionSelected ? (
                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        onClick={handleUpdateCurrentCriterion}
                        disabled={isLoading}
                        className="rounded-2xl bg-sky-600 px-8 py-2.5 text-sm font-bold text-white shadow-lg shadow-sky-200 transition-all hover:bg-sky-700 hover:shadow-sky-300 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {isLoading ? "Đang xử lý..." : "Lưu thay đổi"}
                      </button>
                    </div>
                  ) : null}
                </form>

              </section>
            )}

          </div>
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
                <h4 className="text-base font-semibold text-slate-900">
                  Xóa tiêu chí?
                </h4>
                <p className="mt-1 text-sm text-slate-600">
                  Bạn có chắc muốn xóa{" "}
                  <span className="font-semibold">{deletingCriterion.criteriaName}</span>?<br /> Thao tác này không thể khôi phục.
                </p>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingCriterion(null)}
                className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleDeleteCriterion}
                disabled={isLoading}
                className="rounded-2xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RubricModal;
