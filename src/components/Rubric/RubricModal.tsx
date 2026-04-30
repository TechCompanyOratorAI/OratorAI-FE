import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  addNewTrigger?: number;
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
              {criterion.displayOrder}. {criterion.criteriaName}
            </p>
            <p className="mt-1 text-xs text-slate-600 line-clamp-2">
              {criterion.criteriaDescription || "Không có mô tả"}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
              <span className="rounded-full bg-slate-100 px-2 py-0.5">
                Phần trăm: {Number(criterion.weight).toFixed(0)}%
              </span>
              <span
                className={`rounded-full px-2 py-0.5 ${Number(criterion.isActive ?? 1) === 1
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-rose-100 text-rose-700"
                  }`}
              >
                {Number(criterion.isActive ?? 1) === 1
                  ? "Đang hoạt động"
                  : "Không hoạt động"}
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
  addNewTrigger = 0,
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
  const lastHandledAddTriggerRef = useRef(0);

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

  const normalizedTotalActivePercentage = useMemo(() => {
    return Math.round((totalActivePercentage + Number.EPSILON) * 100) / 100;
  }, [totalActivePercentage]);

  // Calculate what the total would be if current form is submitted
  const potentialTotalPercentage = useMemo(() => {
    if (selectedCriterionId !== null) {
      // If editing, replace the old weight with new weight
      const oldCriterion = localCriteria.find(
        (item) => item.classRubricCriteriaId === selectedCriterionId,
      );
      if (!oldCriterion) return totalActivePercentage;

      const oldWeight = Number(oldCriterion.weight);
      const newWeight = Number(formData.weight);
      return totalActivePercentage - oldWeight + newWeight;
    } else {
      // If creating new, add the new weight
      const newWeight = Number(formData.weight);
      return totalActivePercentage + newWeight;
    }
  }, [selectedCriterionId, formData, localCriteria, totalActivePercentage]);

  const isPercentageComplete = useMemo(() => {
    return normalizedTotalActivePercentage >= 99.5;
  }, [normalizedTotalActivePercentage]);

  const isPercentageExceeded = useMemo(() => {
    return potentialTotalPercentage > 100;
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

    const initialSelectedId =
      activeCriteriaId ?? criteriaList[0]?.classRubricCriteriaId ?? null;
    setSelectedCriterionId(initialSelectedId);

    const selectedCriterion = criteriaList.find(
      (item) => item.classRubricCriteriaId === initialSelectedId,
    );

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

  const hasCriteriaChanged = useMemo(() => {
    if (localCriteria.length !== originalCriteria.length) return true;
    return localCriteria.some(
      (criterion, index) => {
        const original = originalCriteria[index];
        if (!original) return true;
        return (
          criterion.classRubricCriteriaId !== original.classRubricCriteriaId ||
          criterion.criteriaName !== original.criteriaName ||
          criterion.criteriaDescription !== original.criteriaDescription ||
          Number(criterion.weight) !== Number(original.weight) ||
          Number(criterion.maxScore) !== Number(original.maxScore) ||
          criterion.displayOrder !== original.displayOrder
        );
      },
    );
  }, [localCriteria, originalCriteria]);

  const activeCount = localCriteria.filter(
    (item) => Number(item.isActive ?? 1) === 1,
  ).length;
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

  const normalizeNumberValue = (field: "weight" | "displayOrder", raw: string) => {
    if (raw.trim() === "") {
      setFormData((prev) => ({ ...prev, [field]: "" }));
      return;
    }

    const parsed = Number(raw);
    if (Number.isNaN(parsed)) return;

    if (field === "displayOrder") {
      setFormData((prev) => ({ ...prev, [field]: String(Math.trunc(parsed)) }));
      return;
    }

    setFormData((prev) => ({ ...prev, [field]: String(parsed) }));
  };

  const normalizeCriteriaOrder = useCallback((criteria: RubricCriterionItem[]) => {
    return [...criteria]
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((criterion, index) => ({
        ...criterion,
        displayOrder: index + 1,
      }));
  }, []);

  const handleAddNewCriterion = useCallback(() => {
    const existingDraft = localCriteria.find(
      (criterion) => criterion.classRubricCriteriaId <= 0,
    );

    if (existingDraft) {
      setSelectedCriterionId(existingDraft.classRubricCriteriaId);
      setFormData({
        criteriaName: existingDraft.criteriaName || "",
        criteriaDescription: existingDraft.criteriaDescription || "",
        weight: String(Number(existingDraft.weight) || 1),
        maxScore: String(Number(existingDraft.maxScore) || 100),
        displayOrder: String(existingDraft.displayOrder),
      });
      setErrors({});
      return;
    }

    const nextTempId = tempCriterionIdSeed;
    const draftCriterion: RubricCriterionItem = {
      classRubricCriteriaId: nextTempId,
      criteriaName: "",
      criteriaDescription: "",
      weight: 1,
      maxScore: 100,
      displayOrder: nextOrder,
      isActive: 1,
    };
    setLocalCriteria((previous) =>
      normalizeCriteriaOrder([...previous, draftCriterion]),
    );
    setSelectedCriterionId(nextTempId);
    setTempCriterionIdSeed((previous) => previous - 1);
    setFormData({
      criteriaName: "",
      criteriaDescription: "",
      weight: "1",
      maxScore: "100",
      displayOrder: String(nextOrder),
    });
    setErrors({});
  }, [localCriteria, nextOrder, normalizeCriteriaOrder, tempCriterionIdSeed]);

  useEffect(() => {
    if (!isOpen) return;
    if (addNewTrigger <= 0) return;
    if (mode !== "create") return;
    if (lastHandledAddTriggerRef.current === addNewTrigger) return;
    lastHandledAddTriggerRef.current = addNewTrigger;
    handleAddNewCriterion();
  }, [addNewTrigger, handleAddNewCriterion, isOpen, mode]);

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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = {
        ...prev,
        [name]: value,
      };
      if (name !== "displayOrder") {
        applyFormToSelectedCriterion(next);
      }
      return next;
    });

    if (errors[name as keyof RubricCriteriaPayload]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setLocalCriteria((previous) => {
      const oldIndex = previous.findIndex(
        (item) => item.classRubricCriteriaId === Number(active.id),
      );
      const newIndex = previous.findIndex(
        (item) => item.classRubricCriteriaId === Number(over.id),
      );

      if (oldIndex < 0 || newIndex < 0) return previous;
      return arrayMove(previous, oldIndex, newIndex).map((criterion, index) => ({
        ...criterion,
        displayOrder: index + 1,
      }));
    });
  }, []);

  const handleSelectCriterion = useCallback(
    (criterion: RubricCriterionItem) => {
      setSelectedCriterionId(criterion.classRubricCriteriaId);
      setFormFromCriterion(criterion);
      setErrors({});
      onSelectCriteria?.(criterion.classRubricCriteriaId);
    },
    [onSelectCriteria, setFormFromCriterion],
  );

  const handleSubmitAllChanges = async () => {
    const changedCriteria = localCriteria
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
    await onSubmit(changedCriteria);
    setOriginalCriteria(
      localCriteria.map((criterion, index) => ({
        ...criterion,
        displayOrder: index + 1,
      })),
    );
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

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-3xl border border-slate-200 bg-white px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">
                Tổng
              </p>
              <p className="text-lg font-bold text-slate-900">
                {localCriteria.length}
              </p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">
                Đang hoạt động
              </p>
              <p className="text-lg font-bold text-emerald-700">
                {activeCount}
              </p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white px-3 py-2 relative">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">
                    Phần trăm
                  </p>
                  <p
                    className={`text-lg font-bold ${normalizedTotalActivePercentage > 100
                      ? "text-rose-700"
                      : isPercentageComplete
                        ? "text-emerald-700"
                        : "text-rose-700"
                      }`}
                  >
                    {Math.round(normalizedTotalActivePercentage)}
                    %
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">
                Thứ tự tiếp theo
              </p>
              <p className="text-lg font-bold text-slate-900">{nextOrder}</p>
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
                  Tên tiêu chí
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
                  Mô tả tiêu chí 
                </label>
                <textarea
                  rows={2}
                  name="criteriaDescription"
                  value={formData.criteriaDescription}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-200"
                  placeholder="Đánh giá độ rõ ràng và chiều sâu của tiêu chi tiết"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Phần trăm (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="1"
                      name="weight"
                      value={formData.weight}
                      onWheel={(event) => event.preventDefault()}
                      onFocus={() => setShowWeightSuggestions(true)}
                      onBlur={() => {
                        normalizeNumberValue("weight", formData.weight);
                        applyFormToSelectedCriterion({
                          ...formData,
                          weight: String(
                            Math.trunc(Number(formData.weight || 0)) || 1,
                          ),
                        });
                        setTimeout(() => setShowWeightSuggestions(false), 120);
                      }}
                      onChange={handleChange}
                      className={`w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-200 ${errors.weight ? "border-rose-300" : "border-slate-300"
                        }`}
                    />
                    {showWeightSuggestions && (
                      <div className="absolute z-20 mt-2 w-full rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
                        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                          Gợi ý nhanh
                        </p>
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
                              className={`flex h-8 w-full items-center justify-center rounded-full border text-[11px] font-semibold leading-none transition ${
                                Number(formData.weight) === value
                                  ? "border-sky-300 bg-sky-100 text-sky-700"
                                  : "border-slate-200 bg-slate-50 text-slate-600 hover:border-sky-200 hover:bg-white hover:text-sky-700"
                              }`}
                            >
                              {value}%
                            </button>
                          ))}
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
                      ⚠️ Tổng sẽ vượt 100%

                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Thứ tự hiển thị
                  </label>
                  <input
                    type="number"
                    name="displayOrder"
                    value={formData.displayOrder}
                    onChange={handleChange}
                    onBlur={() =>
                      (() => {
                        normalizeNumberValue(
                          "displayOrder",
                          formData.displayOrder,
                        );
                        applyFormToSelectedCriterion(formData);
                      })()
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

            </form>
            
          </section>
          <div className="mt-2">
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Đóng
              </button>
              {normalizedTotalActivePercentage >= 99.5 && (
                <button
                  type="button"
                  onClick={handleSubmitAllChanges}
                  disabled={isLoading || !hasCriteriaChanged}
                  className="rounded-2xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoading ? "Đang cập nhật..." : "Cập nhật tất cả"}
                </button>
              )}
            </div>
            {hasCriteriaChanged && (
              <p className="mt-1 text-xs font-medium text-sky-700 text-right">
                Có thay đổi chưa lưu. Nhấn "Cập nhật tất cả".
              </p>
            )}
          </div>
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
