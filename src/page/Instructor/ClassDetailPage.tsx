import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Users,
  BookOpen,
  Info,
  CheckCircle2,
  Clock,
  KeyRound,
  MoreVertical,
  Edit,
  Trash2,
  Plus,
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
import { useAppDispatch, useAppSelector } from "@/services/store/store";
import { fetchClassDetail } from "@/services/features/admin/classSlice";
import SidebarInstructor from "@/components/Sidebar/SidebarInstructor/SidebarInstructor";
import Button from "@/components/yoodli/Button";
import TopicModal from "@/components/Topic/TopicModal";
import TopicUpdateModal from "@/components/Topic/TopicUpdateModal";
import GroupDetailModal from "@/components/Group/GroupDetailModal";
import RubricModal from "@/components/Rubric/RubricModal";
import Toast from "@/components/Toast/Toast";
import { fetchCourseDetail } from "@/services/features/course/courseSlice";
import {
  fetchGroupsByClass,
  fetchGroupDetail,
  Group,
} from "@/services/features/group/groupSlice";
import {
  createTopic,
  CreateTopicData,
  updateTopic,
  deleteTopic,
} from "@/services/features/topic/topicSlice";
import {
  ClassRubricCriteria,
  PickRubricTemplatePayload,
  RubricCriteriaPayload,
  deleteRubricCriteria,
  fetchRubricTemplatesForInstructor,
  fetchRubricByClass,
  pickRubricTemplateForClass,
  updateRubricCriteria,
  createRubricCriteria,
} from "@/services/features/rubric/rubricSilce";

type SortableCriterionItemProps = {
  criterion: ClassRubricCriteria;
  onEdit: (criterion: ClassRubricCriteria) => void;
  onDelete: (criterion: ClassRubricCriteria) => void;
};

const SortableCriterionItem = React.memo(
  ({ criterion, onEdit, onDelete }: SortableCriterionItemProps) => {
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
        className={`rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 transition-shadow ${
          isDragging
            ? "opacity-80 shadow-xl ring-2 ring-sky-200 cursor-grabbing"
            : "cursor-grab"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-white border border-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-600">
                {criterion.displayOrder}
              </span>
              <p className="font-semibold text-slate-900">
                {criterion.criteriaName}
              </p>
            </div>
            {criterion.criteriaDescription && (
              <p className="text-sm text-slate-600 mt-1">
                {criterion.criteriaDescription}
              </p>
            )}
            {criterion.evaluationGuide && (
              <p className="text-xs text-slate-500 mt-1">
                Guide: {criterion.evaluationGuide}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-xs font-semibold">
              <span className="inline-flex items-center rounded-full bg-white border border-slate-200 px-3 py-1 text-slate-600">
                Persen {Number(criterion.weight).toFixed(0)}%
              </span>
              <span className="inline-flex items-center rounded-full bg-white border border-slate-200 px-3 py-1 text-slate-600">
                Max {Number(criterion.maxScore).toFixed(0)}
              </span>
            </div>
            <div className="group relative">
              <button className="p-2 hover:bg-slate-200 rounded-lg transition">
                <MoreVertical className="w-5 h-5 text-slate-600" />
                <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(criterion);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 first:rounded-t-xl flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4 text-sky-600" />
                    Edit Rubric
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(criterion);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 last:rounded-b-xl flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Rubric
                  </button>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  },
);

const ClassDetailPage: React.FC = () => {
  const { classId } = useParams<{ classId: string }>();
  const classIdNumber = classId ? parseInt(classId, 10) : null;
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { selectedClass, loading, error } = useAppSelector(
    (state) => state.class,
  );
  const { selectedCourse: courseForTopics } = useAppSelector(
    (state) => state.course,
  );
  const { loading: topicLoading } = useAppSelector((state) => state.topic);
  const { groups, loading: groupLoading } = useAppSelector(
    (state) => state.group,
  );
  const {
    criteria: rubricCriteria,
    templates: rubricTemplates,
    selectedTemplateId,
    loading: rubricLoading,
    templatesLoading: rubricTemplatesLoading,
    pickLoading: rubricPickLoading,
    actionLoading: rubricActionLoading,
  } = useAppSelector((state) => state.rubric);

  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [isEditTopicModalOpen, setIsEditTopicModalOpen] = useState(false);
  const [isDeleteTopicModalOpen, setIsDeleteTopicModalOpen] = useState(false);
  const [showGroupDetail, setShowGroupDetail] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [isRubricModalOpen, setIsRubricModalOpen] = useState(false);
  const [isCreateCriteriaModalOpen, setIsCreateCriteriaModalOpen] =
    useState(false);
  const [isDeleteRubricModalOpen, setIsDeleteRubricModalOpen] = useState(false);
  const [editingRubric, setEditingRubric] =
    useState<ClassRubricCriteria | null>(null);
  const [expandedTemplateId, setExpandedTemplateId] = useState<number | null>(
    null,
  );
  const [isTemplateConfigModalOpen, setIsTemplateConfigModalOpen] =
    useState(false);
  const [pendingTemplateId, setPendingTemplateId] = useState<number | null>(
    null,
  );
  const [selectedTemplateOptionId, setSelectedTemplateOptionId] = useState<
    number | null
  >(null);
  const [isTemplateDropdownOpen, setIsTemplateDropdownOpen] = useState(false);
  const [confirmApplyPick, setConfirmApplyPick] = useState(false);
  const [pickSettings, setPickSettings] = useState<PickRubricTemplatePayload>({
    rubricTemplateId: 0,
    enableAiReport: true,
    requireInstructorConfirmation: false,
    allowInstructorEdit: true,
    feedbackLanguage: "en",
    reportFormat: "detailed",
    includeCriterionComments: true,
    includeOverallSummary: true,
    includeSuggestions: true,
  });
  const [localCriteria, setLocalCriteria] = useState<ClassRubricCriteria[]>([]);
  const [originalCriteria, setOriginalCriteria] = useState<
    ClassRubricCriteria[]
  >([]);
  const [editingTopic, setEditingTopic] = useState<{
    topicId: number;
    topicName: string;
    sequenceNumber: number;
    description?: string;
    dueDate?: string;
    maxDurationMinutes?: number;
    requirements?: string;
  } | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  useEffect(() => {
    if (classIdNumber) {
      dispatch(fetchClassDetail(classIdNumber));
      dispatch(fetchGroupsByClass(classIdNumber));
      dispatch(fetchRubricByClass(classIdNumber));
      dispatch(fetchRubricTemplatesForInstructor());
    }
  }, [classIdNumber, dispatch]);

  useEffect(() => {
    if (!selectedTemplateId) return;
    setPickSettings((prev) => ({
      ...prev,
      rubricTemplateId: selectedTemplateId,
    }));
  }, [selectedTemplateId]);

  const configuredTemplateId = pendingTemplateId ?? selectedTemplateId ?? null;

  useEffect(() => {
    setSelectedTemplateOptionId(configuredTemplateId);
  }, [configuredTemplateId]);

  const pendingTemplate = useMemo(
    () =>
      rubricTemplates.find(
        (template) => template.rubricTemplateId === pendingTemplateId,
      ) || null,
    [pendingTemplateId, rubricTemplates],
  );

  const buildPickPayload = useCallback(
    (templateId: number): PickRubricTemplatePayload => {
      const payload: PickRubricTemplatePayload = {
        rubricTemplateId: templateId,
        enableAiReport: pickSettings.enableAiReport,
      };

      if (pickSettings.enableAiReport) {
        payload.requireInstructorConfirmation =
          pickSettings.requireInstructorConfirmation;
        payload.allowInstructorEdit = pickSettings.allowInstructorEdit;
        payload.feedbackLanguage = pickSettings.feedbackLanguage;
        payload.reportFormat = pickSettings.reportFormat;
        payload.includeCriterionComments =
          pickSettings.includeCriterionComments;
        payload.includeOverallSummary = pickSettings.includeOverallSummary;
        payload.includeSuggestions = pickSettings.includeSuggestions;
      }

      return payload;
    },
    [pickSettings],
  );

  // When class details are loaded, also fetch course detail
  // so we can manage presentation topics for this class's course.
  useEffect(() => {
    if (selectedClass?.courseId) {
      dispatch(fetchCourseDetail(selectedClass.courseId));
    }
  }, [selectedClass?.courseId, dispatch]);

  const handleCreateTopicSubmit = async (topicData: CreateTopicData) => {
    if (!selectedClass?.courseId) return;
    try {
      await dispatch(
        createTopic({ classId: selectedClass.classId, topicData }),
      ).unwrap();
      setToast({
        message: "Topic created successfully.",
        type: "success",
      });
      setIsTopicModalOpen(false);
      // Refresh details to get latest topics
      dispatch(fetchCourseDetail(selectedClass.courseId));
      dispatch(fetchClassDetail(selectedClass.classId));
    } catch (error: any) {
      setToast({
        message:
          typeof error === "string"
            ? error
            : error?.message || "Failed to create topic.",
        type: "error",
      });
    }
  };

  const handleEditTopic = (topicId: number) => {
    const topic = topicsForClass.find((t) => t.topicId === topicId);
    if (!topic) return;
    setEditingTopic(topic);
    setIsEditTopicModalOpen(true);
  };

  const handleUpdateTopicSubmit = async (data: Partial<CreateTopicData>) => {
    if (!editingTopic) return;
    try {
      const payload = {
        topicName: data.topicName,
        maxDurationMinutes: data.maxDurationMinutes,
        dueDate: data.dueDate,
      };
      await dispatch(
        updateTopic({ topicId: editingTopic.topicId, topicData: payload }),
      ).unwrap();
      setToast({
        message: "Topic updated successfully.",
        type: "success",
      });
      setIsEditTopicModalOpen(false);
      setEditingTopic(null);
      if (selectedClass?.courseId) {
        dispatch(fetchCourseDetail(selectedClass.courseId));
      }
      if (selectedClass?.classId) {
        dispatch(fetchClassDetail(selectedClass.classId));
      }
    } catch (error: any) {
      setToast({
        message:
          typeof error === "string"
            ? error
            : error?.message || "Failed to update topic.",
        type: "error",
      });
    }
  };

  const handleDeleteTopic = (topic: { topicId: number; topicName: string }) => {
    setEditingTopic((prev) => ({
      topicId: topic.topicId,
      topicName: topic.topicName,
      sequenceNumber: prev?.sequenceNumber || 0,
      description: prev?.description,
      dueDate: prev?.dueDate,
      maxDurationMinutes: prev?.maxDurationMinutes,
      requirements: prev?.requirements,
    }));
    setIsDeleteTopicModalOpen(true);
  };

  const sortedRubricCriteria = useMemo(
    () => [...rubricCriteria].sort((a, b) => a.displayOrder - b.displayOrder),
    [rubricCriteria],
  );

  useEffect(() => {
    setLocalCriteria(sortedRubricCriteria);
    setOriginalCriteria(sortedRubricCriteria);
  }, [sortedRubricCriteria]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  );

  const isRubricOrderChanged = useMemo(() => {
    if (localCriteria.length !== originalCriteria.length) return true;
    return localCriteria.some(
      (item, index) =>
        item.classRubricCriteriaId !==
        originalCriteria[index]?.classRubricCriteriaId,
    );
  }, [localCriteria, originalCriteria]);

  const handleRubricDragEnd = useCallback((event: DragEndEvent) => {
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
      return arrayMove(previous, oldIndex, newIndex);
    });
  }, []);

  const handleCancelRubricReorder = useCallback(() => {
    setLocalCriteria(originalCriteria);
  }, [originalCriteria]);

  const handleSaveRubricReorder = useCallback(async () => {
    if (!classIdNumber || !isRubricOrderChanged) return;

    try {
      const reorderedCriteria = localCriteria.map((criterion, index) => ({
        ...criterion,
        displayOrder: index + 1,
      }));

      await Promise.all(
        reorderedCriteria.map((criterion) =>
          dispatch(
            updateRubricCriteria({
              classRubricCriteriaId: criterion.classRubricCriteriaId,
              rubricData: {
                criteriaName: criterion.criteriaName,
                criteriaDescription: criterion.criteriaDescription,
                weight: Number(criterion.weight),
                maxScore: Number(criterion.maxScore),
                displayOrder: criterion.displayOrder,
                evaluationGuide: criterion.evaluationGuide,
              },
            }),
          ).unwrap(),
        ),
      );

      setLocalCriteria(reorderedCriteria);
      setOriginalCriteria(reorderedCriteria);
      setToast({ message: "Rubric order updated.", type: "success" });
      dispatch(fetchRubricByClass(classIdNumber));
    } catch (error: any) {
      setToast({
        message:
          typeof error === "string"
            ? error
            : error?.message || "Failed to update rubric order.",
        type: "error",
      });
    }
  }, [classIdNumber, dispatch, isRubricOrderChanged, localCriteria, setToast]);

  const openEditRubricModal = (criterion: ClassRubricCriteria) => {
    setEditingRubric(criterion);
    setIsRubricModalOpen(true);
  };

  const handleChooseTemplate = (templateId: number) => {
    setPendingTemplateId(templateId);
    setConfirmApplyPick(false);
    setPickSettings((prev) => ({
      ...prev,
      rubricTemplateId: templateId,
    }));
    setIsTemplateConfigModalOpen(true);
    setToast({
      message: "Template selected. Configure AI settings in modal and use it.",
      type: "info",
    });
  };

  const handleApplyPickTemplate = async () => {
    if (!classIdNumber || !configuredTemplateId) return;

    try {
      const payload = buildPickPayload(configuredTemplateId);

      await dispatch(
        pickRubricTemplateForClass({
          classId: classIdNumber,
          data: payload,
        }),
      ).unwrap();

      setPendingTemplateId(null);
      setConfirmApplyPick(false);
      setIsTemplateConfigModalOpen(false);

      await dispatch(fetchRubricByClass(classIdNumber)).unwrap();
      setToast({
        message: "Template selected for this class.",
        type: "success",
      });
    } catch (error: any) {
      setToast({
        message:
          typeof error === "string"
            ? error
            : error?.message || "Failed to pick rubric template.",
        type: "error",
      });
    }
  };

  const handleSubmitRubric = async (
    payload: RubricCriteriaPayload,
    criterionId?: number,
  ) => {
    if (!classIdNumber) return;

    try {
      const targetCriterionId =
        criterionId || editingRubric?.classRubricCriteriaId;

      if (targetCriterionId) {
        await dispatch(
          updateRubricCriteria({
            classRubricCriteriaId: targetCriterionId,
            rubricData: payload,
          }),
        ).unwrap();
        setToast({ message: "Rubric criteria updated.", type: "success" });
      } else {
        await dispatch(
          createRubricCriteria({
            classId: classIdNumber,
            rubricData: payload,
          }),
        ).unwrap();
        setToast({
          message: "Rubric criteria created successfully.",
          type: "success",
        });
      }

      dispatch(fetchRubricByClass(classIdNumber));
      if (targetCriterionId) {
        setIsRubricModalOpen(false);
        setEditingRubric(null);
      }
    } catch (error: any) {
      setToast({
        message:
          typeof error === "string"
            ? error
            : error?.message || "Rubric action failed.",
        type: "error",
      });
    }
  };

  const handleCreateCriteria = async (payload: RubricCriteriaPayload) => {
    if (!classIdNumber) return;

    try {
      await dispatch(
        createRubricCriteria({
          classId: classIdNumber,
          rubricData: payload,
        }),
      ).unwrap();
      setToast({
        message: "Rubric criteria created successfully.",
        type: "success",
      });

      dispatch(fetchRubricByClass(classIdNumber));
    } catch (error: any) {
      setToast({
        message:
          typeof error === "string"
            ? error
            : error?.message || "Failed to create rubric criteria.",
        type: "error",
      });
    }
  };

  const handleDeleteRubricById = async (criterionId: number) => {
    if (!classIdNumber) return;

    try {
      await dispatch(
        deleteRubricCriteria({
          classRubricCriteriaId: criterionId,
        }),
      ).unwrap();

      setToast({ message: "Rubric criteria deleted.", type: "success" });
      await dispatch(fetchRubricByClass(classIdNumber)).unwrap();

      if (editingRubric?.classRubricCriteriaId === criterionId) {
        setEditingRubric(null);
      }
    } catch (error: any) {
      setToast({
        message:
          typeof error === "string"
            ? error
            : error?.message || "Failed to delete rubric criteria.",
        type: "error",
      });
    }
  };

  const handleSelectRubricFromModal = (criterionId: number) => {
    const criterion = sortedRubricCriteria.find(
      (item) => item.classRubricCriteriaId === criterionId,
    );

    if (criterion) {
      setEditingRubric(criterion);
    }
  };

  const handleReorderRubricFromModal = async (
    criteria: Array<{
      classRubricCriteriaId: number;
      criteriaName: string;
      criteriaDescription: string;
      weight: number | string;
      maxScore: number | string;
      displayOrder: number;
      evaluationGuide?: string;
    }>,
  ) => {
    if (!classIdNumber) return;

    try {
      await Promise.all(
        criteria.map((criterion, index) =>
          dispatch(
            updateRubricCriteria({
              classRubricCriteriaId: criterion.classRubricCriteriaId,
              rubricData: {
                criteriaName: criterion.criteriaName,
                criteriaDescription: criterion.criteriaDescription,
                weight: Number(criterion.weight),
                maxScore: Number(criterion.maxScore),
                displayOrder: index + 1,
                evaluationGuide: criterion.evaluationGuide || "",
              },
            }),
          ).unwrap(),
        ),
      );

      setToast({ message: "Rubric order updated.", type: "success" });
      await dispatch(fetchRubricByClass(classIdNumber)).unwrap();
    } catch (error: any) {
      setToast({
        message:
          typeof error === "string"
            ? error
            : error?.message || "Failed to update rubric order.",
        type: "error",
      });
    }
  };

  const handleDeleteRubric = async () => {
    if (!editingRubric || !classIdNumber) return;

    try {
      await dispatch(
        deleteRubricCriteria({
          classRubricCriteriaId: editingRubric.classRubricCriteriaId,
        }),
      ).unwrap();
      setToast({ message: "Rubric criteria deleted.", type: "success" });
      dispatch(fetchRubricByClass(classIdNumber));
      setIsDeleteRubricModalOpen(false);
      setEditingRubric(null);
    } catch (error: any) {
      setToast({
        message:
          typeof error === "string"
            ? error
            : error?.message || "Failed to delete rubric criteria.",
        type: "error",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <SidebarInstructor activeItem="manage-classes" />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-sky-200 border-t-sky-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading class details...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !selectedClass) {
    return (
      <div className="flex h-screen bg-gray-50">
        <SidebarInstructor activeItem="manage-classes" />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[1280px] mx-auto px-4 py-8">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-sky-600 hover:text-sky-700 font-medium mb-6"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <p className="text-red-700 font-medium">
                {error || "Class not found"}
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const statusConfig: Record<
    string,
    { label: string; bg: string; icon: React.ReactNode }
  > = {
    active: {
      label: "Active",
      bg: "bg-emerald-100 text-emerald-700",
      icon: <CheckCircle2 className="w-3 h-3" />,
    },
    inactive: {
      label: "Inactive",
      bg: "bg-slate-100 text-slate-700",
      icon: <Clock className="w-3 h-3" />,
    },
    archived: {
      label: "Archived",
      bg: "bg-rose-100 text-rose-700",
      icon: <Clock className="w-3 h-3" />,
    },
  };

  const status = statusConfig[selectedClass.status] || statusConfig.inactive;
  const enrollKeyValue =
    selectedClass.activeKeys?.[0]?.keyValue ||
    selectedClass.enrollKeys?.[0]?.keyValue ||
    "N/A";
  const totalStudents =
    selectedClass.totalStudents ??
    selectedClass.enrollmentCount ??
    selectedClass.enrollments?.length ??
    0;
  const topicsForClass = selectedClass.topics || courseForTopics?.topics || [];
  const groupsForClass = groups.filter((group) => {
    const groupClassId = Number(
      group.classId ?? group.class?.classId ?? selectedClass.classId,
    );
    return groupClassId === selectedClass.classId;
  });

  const getGroupName = (group: Group) =>
    group.groupName ?? group.name ?? "Group";
  const getGroupId = (group: Group) => group.groupId ?? group.id;
  const getMemberName = (member: any) => {
    const fullName = [member?.firstName, member?.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();
    return fullName || member?.username || member?.email || "Unknown";
  };
  const getGroupLeaderName = (group: Group) => {
    const leader = (group.students || []).find(
      (student) => student.GroupStudent?.role === "leader",
    );
    return leader ? getMemberName(leader) : "Unknown";
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarInstructor activeItem="manage-classes" />
      <main className="flex-1 overflow-y-auto lg:ml-0">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 space-y-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate("/instructor/manage-classes")}
              className="inline-flex items-center gap-2 text-sky-700 hover:text-sky-800 font-semibold"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to classes
            </button>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Info className="w-4 h-4" />
              Instructor class overview
            </div>
          </div>

          <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-r from-indigo-600 via-sky-600 to-sky-500 text-white shadow-lg">
            <div
              className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.15),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.12),transparent_30%)]"
              aria-hidden
            />
            <div className="relative p-6 sm:p-8 space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-3 max-w-3xl">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide bg-white/20 text-white border border-white/30">
                      Class
                    </span>
                    <span className="text-xs text-white/80">
                      {selectedClass.course?.courseCode || ""}
                    </span>
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-bold">
                    {selectedClass.classCode}
                  </h1>
                  <p className="text-white/90 text-lg">
                    {selectedClass.course?.courseName || "Course"}
                  </p>
                  <div className="flex flex-wrap items-center gap-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${status.bg}`}
                    >
                      {status.icon}
                      {status.label}
                    </span>
                    <div className="flex items-center gap-2 text-white/90">
                      <Calendar className="w-5 h-5" />
                      <span className="font-medium">
                        {formatDate(selectedClass.startDate)} - {""}
                        {formatDate(selectedClass.endDate)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-white/90">
                      <Users className="w-5 h-5" />
                      <span className="font-medium">
                        {totalStudents} / {selectedClass.maxStudents} students
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                {[
                  {
                    label: "Semester",
                    value: selectedClass.course?.semester || "N/A",
                    Icon: BookOpen,
                  },
                  {
                    label: "Academic Year",
                    value: selectedClass.course?.academicYear || "N/A",
                    Icon: Calendar,
                  },
                  {
                    label: "Enroll Key",
                    value: enrollKeyValue,
                    Icon: KeyRound,
                  },
                  {
                    label: "Created",
                    value: formatDate(selectedClass.createdAt),
                    Icon: Clock,
                  },
                ].map(({ label, value, Icon }, idx) => (
                  <div
                    key={idx}
                    className="rounded-3xl bg-white/15 border border-white/20 px-4 py-3 flex items-center gap-3"
                  >
                    <span className="rounded-full bg-white/20 p-2">
                      <Icon className="w-5 h-5 text-white" />
                    </span>
                    <div>
                      <p className="text-white/80 text-xs uppercase tracking-wide font-semibold">
                        {label}
                      </p>
                      <p className="font-semibold truncate max-w-[180px]">
                        {value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,2fr)_360px] gap-6 items-start">
            <div className="space-y-6">
              {/* Presentation Topics for this class's course */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-start justify-between gap-3 mb-5">
                  <div className="flex items-center gap-2">
                    <div className="rounded-2xl bg-sky-100 p-2">
                      <BookOpen className="w-5 h-5 text-sky-700" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
                        Presentation topics
                      </p>
                      <h3 className="text-xl font-bold text-slate-900">
                        Topics for student presentations
                      </h3>
                      <p className="mt-1 text-sm text-slate-600 max-w-xl">
                        Create and manage topics that students will use for
                        their presentations in this class.
                      </p>
                    </div>
                  </div>
                  <Button
                    text="Create Topic"
                    variant="primary"
                    fontSize="14px"
                    borderRadius="999px"
                    paddingWidth="18px"
                    paddingHeight="9px"
                    onClick={() => setIsTopicModalOpen(true)}
                  />
                </div>

                {(selectedClass.topics && selectedClass.topics.length > 0) ||
                (courseForTopics?.topics &&
                  courseForTopics.topics.length > 0) ? (
                  <div className="space-y-3">
                    {(
                      selectedClass.topics ||
                      courseForTopics?.topics ||
                      []
                    ).map((topic) => (
                      <div
                        key={topic.topicId}
                        className="rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-50/80 transition-colors"
                      >
                        <div className="px-4 py-3 sm:px-5 sm:py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <button
                            type="button"
                            onClick={() =>
                              navigate(
                                `/instructor/class/${selectedClass.classId}/topic/${topic.topicId}`,
                              )
                            }
                            className="flex items-start gap-3 flex-1 text-left"
                          >
                            <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-xs font-semibold text-sky-700">
                              {topic.sequenceNumber}
                            </div>
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Topic {topic.sequenceNumber}
                              </p>
                              <h4 className="mt-0.5 text-sm sm:text-base font-semibold text-slate-900">
                                {topic.topicName}
                              </h4>
                              {topic.description && (
                                <p className="mt-1 text-sm text-slate-600 max-w-3xl">
                                  {topic.description}
                                </p>
                              )}
                            </div>
                          </button>
                          <div className="flex items-center gap-2">
                            <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
                              {topic.dueDate && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-white border border-slate-200 px-3 py-1">
                                  <Calendar className="w-3 h-3" />
                                  Due {formatDate(topic.dueDate)}
                                </span>
                              )}
                              {topic.maxDurationMinutes && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-white border border-slate-200 px-3 py-1">
                                  <Clock className="w-3 h-3" />
                                  {topic.maxDurationMinutes} mins
                                </span>
                              )}
                            </div>
                            <div className="group relative">
                              <button className="p-2 hover:bg-slate-200 rounded-lg transition">
                                <MoreVertical className="w-5 h-5 text-slate-600" />
                                {/* Dropdown menu */}
                                <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditTopic(topic.topicId);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 first:rounded-t-xl flex items-center gap-2"
                                  >
                                    <Edit className="w-4 h-4 text-sky-600" />
                                    Edit Topic
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteTopic({
                                        topicId: topic.topicId,
                                        topicName: topic.topicName,
                                      });
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 last:rounded-b-xl flex items-center gap-2"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    Delete Topic
                                  </button>
                                </div>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-600 bg-slate-50">
                    No topics yet. Use{" "}
                    <span className="font-semibold text-slate-800">
                      Create Topic
                    </span>{" "}
                    to add the first presentation topic for this class.
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="rounded-2xl bg-emerald-100 p-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
                        Rubric Templates
                      </p>
                      <h3 className="text-lg font-bold text-slate-900">
                        Class Evaluation Criteria ({localCriteria.length})
                      </h3>
                    </div>
                  </div>
                </div>

                {!selectedTemplateId && (
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 mb-6 space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-800">
                        Choose template for this class
                      </p>
                      <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                        No template selected
                      </span>
                    </div>

                    {localCriteria.length >
                    0 ? null : rubricTemplatesLoading ? (
                      <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-600 text-center">
                        Loading rubric templates...
                      </div>
                    ) : rubricTemplates.length > 0 ? (
                      <div className="space-y-3">
                        <div className="flex gap-3">
                          <div className="flex-1 relative">
                            <button
                              type="button"
                              onClick={() =>
                                setIsTemplateDropdownOpen((prev) => !prev)
                              }
                              disabled={
                                rubricPickLoading || rubricTemplatesLoading
                              }
                              className="w-full px-4 py-2.5 border border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-left bg-white hover:border-slate-400 disabled:bg-slate-100 disabled:cursor-not-allowed"
                            >
                              {selectedTemplateOptionId
                                ? rubricTemplates.find(
                                    (item) =>
                                      item.rubricTemplateId ===
                                      selectedTemplateOptionId,
                                  )?.templateName || "Select template"
                                : "Select template"}
                            </button>
                            {isTemplateDropdownOpen && (
                              <div className="absolute top-full left-0 right-0 mt-1 border border-slate-300 rounded-2xl bg-white shadow-lg z-10 max-h-44 overflow-y-auto">
                                {rubricTemplates.map((template) => (
                                  <button
                                    key={template.rubricTemplateId}
                                    type="button"
                                    onClick={() => {
                                      setSelectedTemplateOptionId(
                                        template.rubricTemplateId,
                                      );
                                      setExpandedTemplateId(
                                        template.rubricTemplateId,
                                      );
                                      setIsTemplateDropdownOpen(false);
                                    }}
                                    className="w-full text-left px-4 py-3 hover:bg-sky-50 border-b border-slate-100 last:border-b-0"
                                  >
                                    <div className="font-medium text-slate-900">
                                      {template.templateName}
                                    </div>
                                    <div className="text-sm text-slate-600">
                                      {template.assignmentType}
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                          <Button
                            text="Add"
                            variant="primary"
                            fontSize="14px"
                            borderRadius="999px"
                            paddingWidth="18px"
                            paddingHeight="9px"
                            icon={<Plus className="w-4 h-4" />}
                            onClick={() => {
                              if (!selectedTemplateOptionId) return;
                              handleChooseTemplate(selectedTemplateOptionId);
                            }}
                            disabled={
                              rubricPickLoading || !selectedTemplateOptionId
                            }
                          />
                        </div>

                        {expandedTemplateId && (
                          <div className="rounded-2xl border border-slate-200 bg-white p-4">
                            {(() => {
                              const expandedTemplate = rubricTemplates.find(
                                (template) =>
                                  template.rubricTemplateId ===
                                  expandedTemplateId,
                              );
                              if (!expandedTemplate) return null;

                              return (
                                <>
                                  <div className="flex items-center justify-between gap-2 mb-3">
                                    <p className="text-sm font-semibold text-slate-900">
                                      {expandedTemplate.templateName}
                                    </p>
                                  </div>
                                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                                    {expandedTemplate.criteria?.length ? (
                                      expandedTemplate.criteria
                                        .slice()
                                        .sort(
                                          (a, b) =>
                                            a.displayOrder - b.displayOrder,
                                        )
                                        .map((criterion) => (
                                          <div
                                            key={criterion.criteriaId}
                                            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
                                          >
                                            <div className="flex items-center justify-between gap-2">
                                              <p className="text-sm font-semibold text-slate-800">
                                                {criterion.displayOrder}.{" "}
                                                {criterion.criteriaName}
                                              </p>
                                              <span className="text-xs text-slate-600">
                                                {Number(
                                                  criterion.weight,
                                                ).toFixed(0)}
                                                % | Max {criterion.maxScore}
                                              </span>
                                            </div>
                                          </div>
                                        ))
                                    ) : (
                                      <p className="text-sm text-slate-500">
                                        Template has no criteria.
                                      </p>
                                    )}
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-600 text-center">
                        No rubric templates available.
                      </div>
                    )}
                  </div>
                )}

                {rubricLoading ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-600 bg-slate-50">
                    Loading class rubric...
                  </div>
                ) : localCriteria.length > 0 ? (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    modifiers={[restrictToVerticalAxis]}
                    onDragEnd={handleRubricDragEnd}
                  >
                    <SortableContext
                      items={localCriteria.map(
                        (criterion) => criterion.classRubricCriteriaId,
                      )}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-3">
                        {localCriteria.map((criterion) => (
                          <SortableCriterionItem
                            key={criterion.classRubricCriteriaId}
                            criterion={criterion}
                            onEdit={openEditRubricModal}
                            onDelete={(selectedCriterion) => {
                              setEditingRubric(selectedCriterion);
                              setIsDeleteRubricModalOpen(true);
                            }}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-600 bg-slate-50">
                    No rubric criteria configured for this class.
                  </div>
                )}
                {isRubricOrderChanged && (
                  <div className="mb-4 flex items-center justify-end gap-2 mt-6">
                    <button
                      type="button"
                      onClick={handleSaveRubricReorder}
                      disabled={rubricActionLoading}
                      className="px-6 py-2 bg-sky-600 text-white rounded-full font-medium hover:bg-sky-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                    >
                      {rubricActionLoading ? "Processing..." : "Save"}
                    </button>
                    <Button
                      text="Cancel"
                      variant="secondary"
                      fontSize="14px"
                      borderRadius="999px"
                      paddingWidth="18px"
                      paddingHeight="10px"
                      onClick={handleCancelRubricReorder}
                      disabled={rubricActionLoading}
                    />
                  </div>
                )}
              </div>
            </div>

            <aside className="space-y-6 xl:sticky xl:top-6">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="rounded-2xl bg-sky-100 p-2">
                    <BookOpen className="w-5 h-5 text-sky-700" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
                      Course
                    </p>
                    <h3 className="text-lg font-bold text-slate-900">
                      {selectedClass.course?.courseName || "Course"}
                    </h3>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-600">Course code:</span>
                    <span className="font-semibold text-slate-900">
                      {selectedClass.course?.courseCode || "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-600">Schedule:</span>
                    <span className="font-semibold text-slate-900">
                      {formatDate(selectedClass.startDate)} - {""}
                      {formatDate(selectedClass.endDate)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-600">Academic year:</span>
                    <span className="font-semibold text-slate-900">
                      {selectedClass.course?.academicYear || "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="rounded-2xl bg-indigo-100 p-2">
                    <Users className="w-5 h-5 text-indigo-700" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
                      Enrollment
                    </p>
                    <h3 className="text-lg font-bold text-slate-900">
                      {totalStudents} enrolled students
                    </h3>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-600">Capacity:</span>
                    <span className="font-semibold text-slate-900">
                      {selectedClass.maxStudents} students
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="rounded-2xl bg-violet-100 p-2">
                    <Users className="w-5 h-5 text-violet-700" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
                      Groups
                    </p>
                    <h3 className="text-lg font-bold text-slate-900">
                      Student Groups ({groupsForClass.length})
                    </h3>
                  </div>
                </div>

                {groupLoading ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-600 bg-slate-50">
                    Loading groups...
                  </div>
                ) : groupsForClass.length > 0 ? (
                  <div className="space-y-3">
                    {groupsForClass.map((group, index) => {
                      const groupId = Number(getGroupId(group));
                      const memberCount =
                        group.memberCount ?? group.students?.length ?? 0;

                      return (
                        <button
                          key={group.groupId ?? group.id ?? index}
                          type="button"
                          onClick={() => {
                            if (!Number.isFinite(groupId)) return;
                            setSelectedGroupId(groupId);
                            dispatch(fetchGroupDetail(groupId));
                            setShowGroupDetail(true);
                          }}
                          className="w-full text-left rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 hover:border-violet-200 hover:bg-white hover:shadow-sm transition"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div>
                              <p className="font-semibold text-slate-900">
                                {getGroupName(group)}
                              </p>
                              <p className="text-xs text-slate-500 mt-0.5">
                                Leader: {getGroupLeaderName(group)}
                              </p>
                            </div>
                            <span className="inline-flex items-center gap-1 rounded-full bg-white border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600">
                              <Users className="w-3.5 h-3.5" />
                              {memberCount} members
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-600 bg-slate-50">
                    No groups found for this class.
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </main>
      {/* Topic creation modal */}
      <TopicModal
        isOpen={isTopicModalOpen}
        onClose={() => setIsTopicModalOpen(false)}
        onSubmit={handleCreateTopicSubmit}
        isLoading={topicLoading}
      />

      {showGroupDetail && selectedGroupId && (
        <GroupDetailModal
          isOpen={showGroupDetail}
          onClose={() => {
            setShowGroupDetail(false);
            setSelectedGroupId(null);
          }}
          groupId={selectedGroupId}
          hideFooterActions
        />
      )}

      <RubricModal
        isOpen={isRubricModalOpen}
        onClose={() => {
          if (rubricActionLoading) return;
          setIsRubricModalOpen(false);
          setEditingRubric(null);
        }}
        onSubmit={handleSubmitRubric}
        onDeleteCriteria={handleDeleteRubricById}
        onSelectCriteria={handleSelectRubricFromModal}
        onReorderCriteria={handleReorderRubricFromModal}
        isLoading={rubricActionLoading}
        mode="edit"
        initialData={
          editingRubric
            ? {
                criteriaName: editingRubric.criteriaName,
                criteriaDescription: editingRubric.criteriaDescription,
                weight: Number(editingRubric.weight),
                maxScore: Number(editingRubric.maxScore),
                displayOrder: editingRubric.displayOrder,
                evaluationGuide: editingRubric.evaluationGuide,
              }
            : undefined
        }
        defaultDisplayOrder={sortedRubricCriteria.length + 1}
        templateName={selectedClass.classCode}
        criteriaList={sortedRubricCriteria}
        activeCriteriaId={editingRubric?.classRubricCriteriaId}
      />

      <RubricModal
        isOpen={isCreateCriteriaModalOpen}
        onClose={() => {
          if (rubricActionLoading) return;
          setIsCreateCriteriaModalOpen(false);
        }}
        onSubmit={handleCreateCriteria}
        isLoading={rubricActionLoading}
        mode="create"
        defaultDisplayOrder={sortedRubricCriteria.length + 1}
        templateName={selectedClass.classCode}
        criteriaList={sortedRubricCriteria}
      />

      {isTemplateConfigModalOpen && pendingTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => {
              if (rubricPickLoading) return;
              setIsTemplateConfigModalOpen(false);
              setPendingTemplateId(null);
              setConfirmApplyPick(false);
            }}
          />
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-xl border border-slate-200 p-6 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
                Selected Template
              </p>
              <p className="text-lg font-bold text-slate-900 mt-1">
                {pendingTemplate.templateName}
              </p>
              <p className="text-sm text-slate-600 mt-1">
                Assignment: {pendingTemplate.assignmentType}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-4">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={pickSettings.enableAiReport}
                  onChange={(e) =>
                    setPickSettings((prev) => ({
                      ...prev,
                      enableAiReport: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                />
                Enable AI Report
              </label>

              {pickSettings.enableAiReport && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                  <label className="flex flex-col gap-1 text-sm text-slate-700">
                    <span className="font-medium">Feedback Language</span>
                    <select
                      value={pickSettings.feedbackLanguage || "en"}
                      onChange={(e) =>
                        setPickSettings((prev) => ({
                          ...prev,
                          feedbackLanguage: e.target.value,
                        }))
                      }
                      className="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                      <option value="en">English</option>
                      <option value="vi">Vietnamese</option>
                    </select>
                  </label>

                  <label className="flex flex-col gap-1 text-sm text-slate-700">
                    <span className="font-medium">Report Format</span>
                    <select
                      value={pickSettings.reportFormat || "detailed"}
                      onChange={(e) =>
                        setPickSettings((prev) => ({
                          ...prev,
                          reportFormat: e.target.value,
                        }))
                      }
                      className="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                      <option value="detailed">Detailed</option>
                      <option value="summary">Summary</option>
                    </select>
                  </label>

                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={!!pickSettings.requireInstructorConfirmation}
                      onChange={(e) =>
                        setPickSettings((prev) => ({
                          ...prev,
                          requireInstructorConfirmation: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                    />
                    Require Instructor Confirmation
                  </label>

                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={!!pickSettings.allowInstructorEdit}
                      onChange={(e) =>
                        setPickSettings((prev) => ({
                          ...prev,
                          allowInstructorEdit: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                    />
                    Allow Instructor Edit
                  </label>

                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={!!pickSettings.includeCriterionComments}
                      onChange={(e) =>
                        setPickSettings((prev) => ({
                          ...prev,
                          includeCriterionComments: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                    />
                    Include Criterion Comments
                  </label>

                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={!!pickSettings.includeOverallSummary}
                      onChange={(e) =>
                        setPickSettings((prev) => ({
                          ...prev,
                          includeOverallSummary: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                    />
                    Include Overall Summary
                  </label>

                  <label className="flex items-center gap-2 text-sm text-slate-700 md:col-span-2">
                    <input
                      type="checkbox"
                      checked={!!pickSettings.includeSuggestions}
                      onChange={(e) =>
                        setPickSettings((prev) => ({
                          ...prev,
                          includeSuggestions: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                    />
                    Include Suggestions
                  </label>
                </div>
              )}

              <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 space-y-3">
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={confirmApplyPick}
                    onChange={(e) => setConfirmApplyPick(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                  />
                  I confirm that I want to apply this template and overwrite
                  existing rubric criteria for this class.
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  if (rubricPickLoading) return;
                  setIsTemplateConfigModalOpen(false);
                  setPendingTemplateId(null);
                  setConfirmApplyPick(false);
                }}
                className="px-4 py-2 rounded-full border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyPickTemplate}
                disabled={!confirmApplyPick || rubricPickLoading}
                className="px-4 py-2 rounded-full bg-sky-600 text-white text-sm font-semibold hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {rubricPickLoading ? "Apply Template..." : "Use Template"}
              </button>
            </div>
          </div>
        </div>
      )}

      {isDeleteRubricModalOpen && editingRubric && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => {
              if (rubricActionLoading) return;
              setIsDeleteRubricModalOpen(false);
              setEditingRubric(null);
            }}
          />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-900">Delete rubric</h3>
            <p className="text-sm text-slate-600 mt-2">
              Are you sure you want to delete rubric criteria{" "}
              <span className="font-semibold">
                {editingRubric.criteriaName}
              </span>
              ?
            </p>
            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => {
                  setIsDeleteRubricModalOpen(false);
                  setEditingRubric(null);
                }}
                disabled={rubricActionLoading}
                className="px-4 py-2 rounded-full border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteRubric}
                disabled={rubricActionLoading}
                className="px-4 py-2 rounded-full bg-rose-600 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {rubricActionLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Topic Modal */}
      <TopicUpdateModal
        isOpen={isEditTopicModalOpen}
        onClose={() => {
          setIsEditTopicModalOpen(false);
          setEditingTopic(null);
        }}
        onSubmit={handleUpdateTopicSubmit}
        isLoading={topicLoading}
        title="Edit Topic"
        submitText="Save Changes"
        initialData={{
          topicName: editingTopic?.topicName,
          dueDate: editingTopic?.dueDate,
          maxDurationMinutes: editingTopic?.maxDurationMinutes || 20,
        }}
      />

      {/* Delete Topic Modal */}
      {isDeleteTopicModalOpen && editingTopic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => {
              setIsDeleteTopicModalOpen(false);
              setEditingTopic(null);
            }}
          />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-full bg-rose-100 p-2">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Delete topic
                </h3>
                <p className="text-sm text-slate-600">
                  Are you sure you want to delete{" "}
                  <span className="font-semibold">
                    {editingTopic.topicName}
                  </span>
                  ? This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => {
                  setIsDeleteTopicModalOpen(false);
                  setEditingTopic(null);
                }}
                className="px-4 py-2 rounded-full border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!editingTopic) return;
                  try {
                    await dispatch(deleteTopic(editingTopic.topicId)).unwrap();
                    setToast({
                      message: "Topic deleted successfully.",
                      type: "success",
                    });
                    if (selectedClass?.courseId) {
                      dispatch(fetchCourseDetail(selectedClass.courseId));
                    }
                  } catch (error: any) {
                    setToast({
                      message:
                        typeof error === "string"
                          ? error
                          : error?.message || "Failed to delete topic.",
                      type: "error",
                    });
                  } finally {
                    setIsDeleteTopicModalOpen(false);
                    setEditingTopic(null);
                  }
                }}
                className="px-4 py-2 rounded-full bg-rose-600 text-sm font-semibold text-white hover:bg-rose-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 max-w-md">
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        </div>
      )}
    </div>
  );
};

export default ClassDetailPage;
