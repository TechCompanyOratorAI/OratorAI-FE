import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Card,
  List,
  Tag,
  Typography,
  Spin,
  Empty,
  Avatar,
  Badge,
  Modal,
  Button as AntButton,
  Select,
  Checkbox,
  Tooltip,
  Switch,
} from "antd";
import {
  TeamOutlined,
  CrownOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  SaveOutlined,
  ArrowLeftOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  CloudUploadOutlined,
  CloudOutlined,
  ExclamationCircleOutlined,
  CheckOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import {
  Calendar,
  Users,
  BookOpen,
  CheckCircle2,
  Clock,
  KeyRound,
  MoreVertical,
  Edit,
  Trash2,
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
import {
  setUploadPermissionByClass as setUploadPermissionByClassAction,
} from "@/services/features/uploadPermission/uploadPermissionSlice";
import SidebarInstructor from "@/components/Sidebar/SidebarInstructor/SidebarInstructor";
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
        className={`rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 transition-shadow ${isDragging
          ? "opacity-80 shadow-xl ring-2 ring-sky-200 cursor-grabbing"
          : "cursor-grab"
          }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-white border border-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-600">
                {criterion.displayOrder}
              </span>
              <p className="font-semibold text-slate-900">
                {criterion.criteriaName}
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold mt-2 ml-8">
              <span className="inline-flex items-center rounded-full bg-white border border-slate-200 px-3 py-1 text-slate-600">
                Phần trăm: {Number(criterion.weight).toFixed(0)}%
              </span>
              <span className="inline-flex items-center rounded-full bg-white border border-slate-200 px-3 py-1 text-slate-600">
                Điểm tối đa: {Number(criterion.maxScore).toFixed(0)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <AntButton
              type="text"
              icon={<EditOutlined style={{ color: "#0284c7" }} />}
              onClick={(e) => {
                e.stopPropagation();
                onEdit(criterion);
              }}
            />
            <AntButton
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                onDelete(criterion);
              }}
            />
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
  const uploadPermission = useAppSelector((state) => state.uploadPermission.permissions[classIdNumber ?? -1]);
  const isUploadEnabled = uploadPermission?.isUploadEnabled ?? selectedClass?.isUploadEnabled ?? false;

  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [isEditTopicModalOpen, setIsEditTopicModalOpen] = useState(false);
  const [isDeleteTopicModalOpen, setIsDeleteTopicModalOpen] = useState(false);
  const [showGroupDetail, setShowGroupDetail] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [isRubricModalOpen, setIsRubricModalOpen] = useState(false);
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
        enableAiReport: true,
      };

      payload.requireInstructorConfirmation =
        pickSettings.requireInstructorConfirmation;
      payload.allowInstructorEdit = pickSettings.allowInstructorEdit;
      payload.feedbackLanguage = pickSettings.feedbackLanguage;
      payload.reportFormat = pickSettings.reportFormat;
      payload.includeCriterionComments = pickSettings.includeCriterionComments;
      payload.includeOverallSummary = pickSettings.includeOverallSummary;
      payload.includeSuggestions = pickSettings.includeSuggestions;

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
        message: "Tạo chủ đề thành công.",
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
            : error?.message || "Không thể tạo chủ đề.",
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
        message: "Cập nhật chủ đề thành công.",
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
            : error?.message || "Không thể cập nhật chủ đề.",
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

  const totalRubricPercentage = useMemo(() => {
    return sortedRubricCriteria
      .filter((criterion) => Number(criterion.isActive ?? 1) === 1)
      .reduce((sum, criterion) => sum + Number(criterion.weight), 0);
  }, [sortedRubricCriteria]);

  const isRubricActive = useMemo(() => {
    return totalRubricPercentage >= 100;
  }, [totalRubricPercentage]);

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
      setToast({ message: "Đã cập nhật thứ tự rubric.", type: "success" });
      dispatch(fetchRubricByClass(classIdNumber));
    } catch (error: any) {
      setToast({
        message:
          typeof error === "string"
            ? error
            : error?.message || "Không thể cập nhật thứ tự rubric.",
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
    setPickSettings({
      rubricTemplateId: templateId,
      enableAiReport: true,
      requireInstructorConfirmation: false,
      allowInstructorEdit: true,
      feedbackLanguage: "en",
      reportFormat: "detailed",
      includeCriterionComments: true,
      includeOverallSummary: true,
      includeSuggestions: true,
    });
    setIsTemplateConfigModalOpen(true);
    setToast({
      message: "Đã chọn mẫu. Hãy cấu hình AI trong modal và áp dụng.",
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
        message: "Đã chọn mẫu cho lớp học này.",
        type: "success",
      });
    } catch (error: any) {
      setToast({
        message:
          typeof error === "string"
            ? error
            : error?.message || "Không thể chọn mẫu rubric.",
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
      const targetCriterionId = criterionId;

      if (targetCriterionId) {
        await dispatch(
          updateRubricCriteria({
            classRubricCriteriaId: targetCriterionId,
            rubricData: payload,
          }),
        ).unwrap();
      } else {
        await dispatch(
          createRubricCriteria({
            classId: classIdNumber,
            rubricData: payload,
          }),
        ).unwrap();
      }

      // Fetch updated rubric to calculate total percentage
      const result = await dispatch(fetchRubricByClass(classIdNumber)).unwrap();

      // Calculate total percentage of active criteria
      if (result && Array.isArray(result)) {
        const totalPercentage = result
          .filter((c: ClassRubricCriteria) => Number(c.isActive ?? 1) === 1)
          .reduce(
            (sum: number, c: ClassRubricCriteria) => sum + Number(c.weight),
            0,
          );

        if (totalPercentage > 100) {
          setToast({
            message: `⚠️ Đã ${targetCriterionId ? "cập nhật" : "tạo"} tiêu chí. Tổng % vượt quá 100% (${totalPercentage.toFixed(1)}%)`,
            type: "info",
          });
        } else {
          setToast({
            message: `Đã ${targetCriterionId ? "cập nhật" : "tạo"} tiêu chí đánh giá thành công.`,
            type: "success",
          });
        }
      } else {
        setToast({
          message: `Đã ${targetCriterionId ? "cập nhật" : "tạo"} tiêu chí đánh giá thành công.`,
          type: "success",
        });
      }

      // Close modal for both create and edit
      setIsRubricModalOpen(false);
      setEditingRubric(null);
    } catch (error: any) {
      setToast({
        message:
          typeof error === "string"
            ? error
            : error?.message || "Thao tác tiêu chí đánh giá thất bại.",
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

      setToast({ message: "Đã xóa tiêu chí rubric.", type: "success" });
      await dispatch(fetchRubricByClass(classIdNumber)).unwrap();

      if (editingRubric?.classRubricCriteriaId === criterionId) {
        setEditingRubric(null);
      }
    } catch (error: any) {
      setToast({
        message:
          typeof error === "string"
            ? error
            : error?.message || "Không thể xóa tiêu chí rubric.",
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

      setToast({ message: "Đã cập nhật thứ tự rubric.", type: "success" });
      await dispatch(fetchRubricByClass(classIdNumber)).unwrap();
    } catch (error: any) {
      setToast({
        message:
          typeof error === "string"
            ? error
            : error?.message || "Không thể cập nhật thứ tự rubric.",
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
      setToast({ message: "Đã xóa tiêu chí rubric.", type: "success" });
      dispatch(fetchRubricByClass(classIdNumber));
      setIsDeleteRubricModalOpen(false);
      setEditingRubric(null);
    } catch (error: any) {
      setToast({
        message:
          typeof error === "string"
            ? error
            : error?.message || "Không thể xóa tiêu chí rubric.",
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
            <p className="text-gray-600">Đang tải chi tiết lớp học...</p>
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
            <AntButton
              type="link"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate(-1)}
              style={{
                fontWeight: 600,
                paddingLeft: 0,
                color: "#0369a1",
                marginBottom: 24,
              }}
            >
              Quay lại
            </AntButton>
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <p className="text-red-700 font-medium">
                {error || "Không tìm thấy lớp học"}
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Không có";
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
      label: "Đang hoạt động",
      bg: "bg-emerald-100 text-emerald-700",
      icon: <CheckCircle2 className="w-3 h-3" />,
    },
    inactive: {
      label: "Không hoạt động",
      bg: "bg-slate-100 text-slate-700",
      icon: <Clock className="w-3 h-3" />,
    },
    archived: {
      label: "Đã lưu trữ",
      bg: "bg-rose-100 text-rose-700",
      icon: <Clock className="w-3 h-3" />,
    },
  };

  const status = statusConfig[selectedClass.status] || statusConfig.inactive;
  const enrollKeyValue =
    selectedClass.activeKeys?.[0]?.keyValue ||
    selectedClass.enrollKeys?.[0]?.keyValue ||
    "Không có";
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
    group.groupName ?? group.name ?? "Nhóm";
  const getGroupId = (group: Group) => group.groupId ?? group.id;
  const getMemberName = (member: any) => {
    const fullName = [member?.firstName, member?.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();
    return fullName || member?.username || member?.email || "Không rõ";
  };
  const getGroupLeaderName = (group: Group) => {
    const leader = (group.students || []).find(
      (student) => student.GroupStudent?.role === "leader",
    );
    return leader ? getMemberName(leader) : "Không rõ";
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarInstructor activeItem="manage-classes" />
      <main className="flex-1 overflow-y-auto lg:ml-0">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 space-y-6">
          <div className="flex items-center justify-between">
            <AntButton
              type="link"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate("/instructor/manage-classes")}
              style={{ fontWeight: 600, paddingLeft: 0, color: "#0369a1" }}
            >
              Quay lại danh sách lớp
            </AntButton>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <InfoCircleOutlined />
              Tổng quan lớp học của giảng viên
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
                      Lớp học
                    </span>
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-bold">
                    {selectedClass.classCode}
                  </h1>
                  <p className="text-white/90 text-lg font-semibold tracking-wide">
                    {[
                      selectedClass.course?.courseName,
                      selectedClass.course?.courseCode,
                    ]
                      .filter(Boolean)
                      .join(" - ") || "Khóa học"}
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
                        {totalStudents} / {selectedClass.maxStudents} sinh viên
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                {[
                  {
                    label: "Học kỳ",
                    value: selectedClass.course?.semester || "Không có",
                    Icon: BookOpen,
                  },
                  {
                    label: "Năm học",
                    value: selectedClass.course?.academicYear || "Không có",
                    Icon: Calendar,
                  },
                  {
                    label: "Mã tham gia",
                    value: enrollKeyValue,
                    Icon: KeyRound,
                  },
                  {
                    label: "Ngày tạo",
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

          {/* Upload Permission Card */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isUploadEnabled ? "bg-white/20" : "bg-white/10"
                  }`}>
                  {isUploadEnabled ? (
                    <CloudUploadOutlined className="text-xl text-white" />
                  ) : (
                    <CloudOutlined className="text-xl text-white/60" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Quyền Upload Presentation</h3>
                  <p className="text-xs text-white/70">
                    {isUploadEnabled
                      ? "Sinh viên đang được phép upload bài thuyết trình"
                      : "Sinh viên chưa được phép upload bài thuyết trình"
                    }
                  </p>
                </div>
              </div>
              <Switch
                checked={isUploadEnabled}
                onChange={(checked) => {
                  if (selectedClass.classId) {
                    dispatch(setUploadPermissionByClassAction({
                      classId: selectedClass.classId,
                      isUploadEnabled: checked,
                    }));
                  }
                }}
                checkedChildren={<CheckOutlined />}
                unCheckedChildren={<CloseOutlined />}
                className={`${isUploadEnabled ? "bg-emerald-400" : "bg-slate-300"}`}
              />
            </div>
            {isUploadEnabled && (
              <div className="px-6 py-3 bg-emerald-50 border-t border-emerald-100 flex items-center gap-2">
                <CheckCircleOutlined className="text-emerald-500 text-sm" />
                <span className="text-sm text-emerald-700">Tính năng upload đang hoạt động</span>
              </div>
            )}
            {!isUploadEnabled && (
              <div className="px-6 py-3 bg-amber-50 border-t border-amber-100 flex items-center gap-2">
                <ExclamationCircleOutlined className="text-amber-500 text-sm" />
                <span className="text-sm text-amber-700">Tính năng upload đang bị tắt</span>
              </div>
            )}
          </section>

          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,2fr)_360px] gap-6 items-start">
            <div className="space-y-6">
              {/* Student Groups - Main Section */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Avatar
                    icon={<TeamOutlined />}
                    size={44}
                    style={{ backgroundColor: "#7c3aed", flexShrink: 0 }}
                  />
                  <div>
                    <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold">
                      Nhóm sinh viên
                    </p>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold text-slate-900">
                        Danh sách nhóm
                      </h3>
                      <Badge
                        count={groupsForClass.length}
                        showZero
                        style={{ backgroundColor: "#7c3aed" }}
                      />
                    </div>
                  </div>
                </div>

                {groupLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <Spin size="large" />
                  </div>
                ) : groupsForClass.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {groupsForClass.map((group, index) => {
                      const groupId = Number(getGroupId(group));
                      const memberCount =
                        group.memberCount ?? group.students?.length ?? 0;
                      const leaderName = getGroupLeaderName(group);
                      const hue = (groupId * 47) % 360;
                      const isEven = index % 2 === 0;

                      return (
                        <Tooltip
                          key={group.groupId ?? group.id ?? index}
                          title="Nhấn để xem chi tiết nhóm"
                          placement="top"
                        >
                          <div
                            onClick={() => {
                              if (!Number.isFinite(groupId)) return;
                              setSelectedGroupId(groupId);
                              dispatch(fetchGroupDetail(groupId));
                              setShowGroupDetail(true);
                            }}
                            className={`cursor-pointer rounded-2xl border border-slate-200 p-4 hover:border-violet-300 hover:bg-violet-50/50 hover:shadow-md transition-all group relative ${isEven ? "bg-slate-50" : "bg-white"
                              }`}
                          >
                            <div className="flex items-center gap-3 mb-3">
                              <Avatar
                                size={46}
                                style={{
                                  backgroundColor: `hsl(${hue}, 60%, 55%)`,
                                  fontWeight: 700,
                                  fontSize: 18,
                                  flexShrink: 0,
                                }}
                              >
                                {getGroupName(group).charAt(0).toUpperCase()}
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <Typography.Text
                                  strong
                                  style={{ fontSize: 15, color: "#1e293b" }}
                                  className="block truncate"
                                >
                                  {getGroupName(group)}
                                </Typography.Text>
                                <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                                  <CrownOutlined
                                    style={{ color: "#f59e0b", fontSize: 11 }}
                                  />
                                  <span className="truncate">{leaderName}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex justify-between items-center">
                              <Tag
                                icon={<TeamOutlined />}
                                color="purple"
                                style={{
                                  borderRadius: 20,
                                  fontWeight: 600,
                                  padding: "2px 10px",
                                }}
                              >
                                {memberCount} thành viên
                              </Tag>
                              <span className="group-hover:text-violet-500 text-slate-300 text-lg transition-colors duration-150">
                                ›
                              </span>
                            </div>
                          </div>
                        </Tooltip>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-10">
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description={
                        <Typography.Text type="secondary">
                          Không tìm thấy nhóm nào cho lớp học này.
                        </Typography.Text>
                      }
                    />
                  </div>
                )}
              </div>
            </div>

            <aside className="xl:sticky xl:top-6 space-y-6">
              <Card
                variant="borderless"
                style={{
                  borderRadius: 16,
                  boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                }}
                styles={{ body: { padding: 0 } }}
                title={
                  <div className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2">
                      <div className="rounded-xl bg-sky-100 p-2">
                        <BookOpen className="w-4 h-4 text-sky-700" />
                      </div>
                      <div>
                        <Typography.Text
                          style={{ fontSize: 11, letterSpacing: "0.08em" }}
                          className="text-xs uppercase text-slate-400 font-semibold block"
                        >
                          Thuyết trình
                        </Typography.Text>
                        <Typography.Text
                          strong
                          style={{ fontSize: 15, color: "#1e293b" }}
                        >
                          Chủ đề
                          <Badge
                            count={topicsForClass.length}
                            showZero
                            style={{
                              backgroundColor: "#0284c7",
                              marginLeft: 8,
                              fontSize: 11,
                            }}
                          />
                        </Typography.Text>
                      </div>
                    </div>
                    <AntButton
                      type="primary"
                      shape="round"
                      size="small"
                      icon={<PlusOutlined />}
                      onClick={() => setIsTopicModalOpen(true)}
                    >
                      Thêm
                    </AntButton>
                  </div>
                }
              >
                {topicsForClass.length > 0 ? (
                  <List
                    dataSource={topicsForClass}
                    renderItem={(topic, index) => {
                      const isEven = index % 2 === 0;
                      return (
                        <Tooltip
                          key={topic.topicId}
                          title="Nhấn để xem chi tiết chủ đề"
                          placement="top"
                        >
                          <List.Item
                            style={{ padding: "10px 16px", cursor: "pointer" }}
                            className={`transition-colors duration-150 hover:bg-sky-50 group ${isEven ? "bg-white" : "bg-slate-50/50"
                              }`}
                            onClick={() =>
                              navigate(
                                `/instructor/class/${selectedClass.classId}/topic/${topic.topicId}`,
                              )
                            }
                          >
                            <div className="flex items-center gap-3 w-full">
                              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-100 text-xs font-bold text-sky-700 shrink-0">
                                {topic.sequenceNumber}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-slate-900 truncate">
                                  {topic.topicName}
                                </p>
                                {topic.dueDate && (
                                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                    <Calendar className="w-3 h-3" />
                                    Hạn {formatDate(topic.dueDate)}
                                  </p>
                                )}
                              </div>
                              <span className="group-hover:text-sky-500 text-slate-300 text-lg transition-colors duration-150 mr-2">
                                ›
                              </span>
                              <div
                                className="group/menu relative shrink-0"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button className="p-1.5 hover:bg-slate-200 rounded-lg transition">
                                  <MoreVertical className="w-4 h-4 text-slate-500" />
                                  <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-slate-200 rounded-xl shadow-lg opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-10">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEditTopic(topic.topicId);
                                      }}
                                      className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 first:rounded-t-xl flex items-center gap-2"
                                    >
                                      <Edit className="w-3.5 h-3.5 text-sky-600" />
                                      Sửa
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteTopic({
                                          topicId: topic.topicId,
                                          topicName: topic.topicName,
                                        });
                                      }}
                                      className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 last:rounded-b-xl flex items-center gap-2"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      Xóa
                                    </button>
                                  </div>
                                </button>
                              </div>
                            </div>
                          </List.Item>
                        </Tooltip>
                      );
                    }}
                  />
                ) : (
                  <div className="py-10 px-6">
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description={
                        <Typography.Text type="secondary">
                          Chưa có chủ đề. Nhấn + Thêm để tạo mới.
                        </Typography.Text>
                      }
                    />
                  </div>
                )}
              </Card>
              <Card
                variant="borderless"
                style={{
                  borderRadius: 16,
                  boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                }}
                styles={{ body: { padding: 0 } }}
                title={
                  <div className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2">
                      <div className="rounded-xl bg-emerald-100 p-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                      </div>
                      <div>
                        <Typography.Text
                          style={{ fontSize: 11, letterSpacing: "0.08em" }}
                          className="text-xs uppercase text-slate-400 font-semibold block"
                        >
                          Mẫu đánh giá
                        </Typography.Text>
                        <Typography.Text
                          strong
                          style={{ fontSize: 15, color: "#1e293b" }}
                        >
                          Tiêu chí đánh giá
                          <Badge
                            count={localCriteria.length}
                            showZero
                            style={{
                              backgroundColor: "#059669",
                              marginLeft: 8,
                              fontSize: 11,
                            }}
                          />
                        </Typography.Text>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {!isRubricActive && (
                        <span className="inline-flex items-center rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700 mr-1">
                          Chưa đạt
                        </span>
                      )}
                      <Tooltip
                        title={
                          <div>
                            <p className="font-semibold">Hướng dẫn tiêu chí</p>
                            <p className="mt-1">
                              Tiêu chí chỉ hoạt động khi tổng phần trăm
                              chính xác bằng 100%.
                            </p>
                            <p className="mt-1 text-red-300 font-medium">
                              Tổng khi thêm tiêu chí không được vượt quá 100%.
                            </p>
                          </div>
                        }
                        trigger="click"
                        placement="bottomRight"
                      >
                        <AntButton
                          type="text"
                          shape="circle"
                          icon={<InfoCircleOutlined />}
                          size="small"
                        />
                      </Tooltip>
                      {selectedTemplateId && (
                        <AntButton
                          type="primary"
                          shape="round"
                          size="small"
                          icon={<PlusOutlined />}
                          onClick={() => {
                            setEditingRubric(null);
                            setIsRubricModalOpen(true);
                          }}
                        >
                          Thêm
                        </AntButton>
                      )}
                    </div>
                  </div>
                }
              >
                {!selectedTemplateId && (
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-slate-700">
                        Chọn mẫu cho lớp học này
                      </p>
                      <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                        Chưa chọn mẫu
                      </span>
                    </div>

                    {rubricTemplatesLoading ? (
                      <div className="rounded-xl border border-dashed border-slate-300 p-3 text-xs text-slate-600 text-center">
                        Đang tải mẫu rubric...
                      </div>
                    ) : rubricTemplates.length > 0 ? (
                      <div className="space-y-2">
                        <Select
                          className="w-full"
                          placeholder="Chọn mẫu"
                          loading={rubricTemplatesLoading}
                          disabled={rubricPickLoading || rubricTemplatesLoading}
                          value={selectedTemplateOptionId ?? undefined}
                          onChange={(val) => {
                            setSelectedTemplateOptionId(val);
                            setExpandedTemplateId(val);
                          }}
                          options={rubricTemplates.map((t) => ({
                            value: t.rubricTemplateId,
                            label: (
                              <div>
                                <div className="font-medium text-sm">
                                  {t.templateName}
                                </div>
                                <div className="text-xs text-slate-500">
                                  {t.assignmentType}
                                </div>
                              </div>
                            ),
                          }))}
                        />
                        <AntButton
                          type="primary"
                          shape="round"
                          size="small"
                          icon={<PlusOutlined />}
                          loading={rubricPickLoading}
                          disabled={!selectedTemplateOptionId}
                          className="w-full"
                          onClick={() => {
                            if (!selectedTemplateOptionId) return;
                            handleChooseTemplate(selectedTemplateOptionId);
                          }}
                        >
                          Thêm mẫu
                        </AntButton>

                        {expandedTemplateId && (
                          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                            {(() => {
                              const expandedTemplate = rubricTemplates.find(
                                (template) =>
                                  template.rubricTemplateId ===
                                  expandedTemplateId,
                              );
                              if (!expandedTemplate) return null;
                              return (
                                <>
                                  <p className="text-xs font-semibold text-slate-900 mb-2">
                                    {expandedTemplate.templateName}
                                  </p>
                                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
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
                                            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5"
                                          >
                                            <div className="flex items-center justify-between gap-2">
                                              <p className="text-xs font-semibold text-slate-800">
                                                {criterion.displayOrder}.{" "}
                                                {criterion.criteriaName}
                                              </p>
                                              <span className="text-xs text-slate-600 shrink-0">
                                                {Number(
                                                  criterion.weight,
                                                ).toFixed(0)}
                                                % | Tối đa {criterion.maxScore}
                                              </span>
                                            </div>
                                          </div>
                                        ))
                                    ) : (
                                      <p className="text-xs text-slate-500">
                                        Mẫu này chưa có tiêu chí.
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
                      <div className="rounded-xl border border-dashed border-slate-300 p-3 text-xs text-slate-600 text-center">
                        Không có mẫu tiêu chí khả dụng.
                      </div>
                    )}
                  </div>
                )}

                {rubricLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Spin size="small" />
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
                      <div className="p-3 space-y-2">
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
                ) : selectedTemplateId ? (
                  <div className="p-4 text-center">
                    <p className="text-xs text-slate-500">
                      Chưa có tiêu chí. Nhấn + Thêm để tạo mới.
                    </p>
                  </div>
                ) : null}

                {isRubricOrderChanged && (
                  <div className="p-3 flex items-center justify-end gap-2 border-t border-slate-100">
                    <AntButton
                      shape="round"
                      size="small"
                      onClick={handleCancelRubricReorder}
                      disabled={rubricActionLoading}
                    >
                      Hủy
                    </AntButton>
                    <AntButton
                      type="primary"
                      shape="round"
                      size="small"
                      icon={<SaveOutlined />}
                      loading={rubricActionLoading}
                      onClick={handleSaveRubricReorder}
                    >
                      Lưu thứ tự
                    </AntButton>
                  </div>
                )}
              </Card>
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
          isInstructor
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
        mode={editingRubric ? "edit" : "create"}
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

      <Modal
        open={isTemplateConfigModalOpen && !!pendingTemplate}
        title={
          <div className="flex items-center gap-2">
            <CheckCircleOutlined style={{ color: "#0284c7" }} />
            <span>Cấu hình mẫu rubric</span>
          </div>
        }
        width={640}
        closable={!rubricPickLoading}
        maskClosable={!rubricPickLoading}
        onCancel={() => {
          if (rubricPickLoading) return;
          setIsTemplateConfigModalOpen(false);
          setPendingTemplateId(null);
          setConfirmApplyPick(false);
        }}
        footer={[
          <AntButton
            key="cancel"
            shape="round"
            disabled={rubricPickLoading}
            onClick={() => {
              setIsTemplateConfigModalOpen(false);
              setPendingTemplateId(null);
              setConfirmApplyPick(false);
            }}
          >
            Hủy
          </AntButton>,
          <AntButton
            key="apply"
            type="primary"
            shape="round"
            loading={rubricPickLoading}
            disabled={!confirmApplyPick}
            onClick={handleApplyPickTemplate}
          >
            Sử dụng mẫu
          </AntButton>,
        ]}
      >
        {pendingTemplate && (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
                Mẫu đã chọn
              </p>
              <p className="text-base font-bold text-slate-900 mt-1">
                {pendingTemplate.templateName}
              </p>
              <p className="text-sm text-slate-500 mt-0.5">
                Loại bài nộp: {pendingTemplate.assignmentType}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-4">
              <Checkbox checked disabled>
                Bật báo cáo AI
              </Checkbox>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-slate-700">
                    Ngôn ngữ phản hồi
                  </span>
                  <Select
                    value={pickSettings.feedbackLanguage || "en"}
                    onChange={(val) =>
                      setPickSettings((prev) => ({
                        ...prev,
                        feedbackLanguage: val,
                      }))
                    }
                    options={[
                      { value: "en", label: "Tiếng Anh" },
                      { value: "vi", label: "Tiếng Việt" },
                    ]}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-slate-700">
                    Định dạng báo cáo
                  </span>
                  <Select
                    value={pickSettings.reportFormat || "detailed"}
                    onChange={(val) =>
                      setPickSettings((prev) => ({
                        ...prev,
                        reportFormat: val,
                      }))
                    }
                    options={[
                      { value: "detailed", label: "Chi tiết" },
                      { value: "summary", label: "Tóm tắt" },
                    ]}
                  />
                </div>
                <Checkbox
                  checked={!!pickSettings.requireInstructorConfirmation}
                  onChange={(e) =>
                    setPickSettings((prev) => ({
                      ...prev,
                      requireInstructorConfirmation: e.target.checked,
                    }))
                  }
                >
                  Yêu cầu giảng viên xác nhận
                </Checkbox>
                <Checkbox
                  checked={!!pickSettings.allowInstructorEdit}
                  onChange={(e) =>
                    setPickSettings((prev) => ({
                      ...prev,
                      allowInstructorEdit: e.target.checked,
                    }))
                  }
                >
                  Cho phép giảng viên chỉnh sửa
                </Checkbox>
                <Checkbox
                  checked={!!pickSettings.includeCriterionComments}
                  onChange={(e) =>
                    setPickSettings((prev) => ({
                      ...prev,
                      includeCriterionComments: e.target.checked,
                    }))
                  }
                >
                  Bao gồm nhận xét theo tiêu chí
                </Checkbox>
                <Checkbox
                  checked={!!pickSettings.includeOverallSummary}
                  onChange={(e) =>
                    setPickSettings((prev) => ({
                      ...prev,
                      includeOverallSummary: e.target.checked,
                    }))
                  }
                >
                  Bao gồm tổng kết chung
                </Checkbox>
                <Checkbox
                  className="md:col-span-2"
                  checked={!!pickSettings.includeSuggestions}
                  onChange={(e) =>
                    setPickSettings((prev) => ({
                      ...prev,
                      includeSuggestions: e.target.checked,
                    }))
                  }
                >
                  Bao gồm gợi ý
                </Checkbox>
              </div>

              <div className="rounded-xl border border-sky-200 bg-sky-50 p-3">
                <Checkbox
                  checked={confirmApplyPick}
                  onChange={(e) => setConfirmApplyPick(e.target.checked)}
                >
                  Xác nhận sử dụng mẫu này và các tiêu chí
                  đánh giá cho lớp học này. Chỉ được chọn một lần.
                </Checkbox>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={isDeleteRubricModalOpen && !!editingRubric}
        title={
          <div className="flex items-center gap-2 text-red-600">
            <DeleteOutlined />
            <span>Xóa tiêu chí rubric</span>
          </div>
        }
        closable={!rubricActionLoading}
        maskClosable={!rubricActionLoading}
        onCancel={() => {
          setIsDeleteRubricModalOpen(false);
          setEditingRubric(null);
        }}
        footer={[
          <AntButton
            key="cancel"
            shape="round"
            disabled={rubricActionLoading}
            onClick={() => {
              setIsDeleteRubricModalOpen(false);
              setEditingRubric(null);
            }}
          >
            Hủy
          </AntButton>,
          <AntButton
            key="delete"
            danger
            type="primary"
            shape="round"
            loading={rubricActionLoading}
            onClick={handleDeleteRubric}
          >
            Xóa
          </AntButton>,
        ]}
      >
        <p className="text-slate-600">
          Bạn có chắc muốn xóa tiêu chí rubric{" "}
          <strong>{editingRubric?.criteriaName}</strong>? Hành động này không thể
          hoàn tác.
        </p>
      </Modal>

      {/* Edit Topic Modal */}
      <TopicUpdateModal
        isOpen={isEditTopicModalOpen}
        onClose={() => {
          setIsEditTopicModalOpen(false);
          setEditingTopic(null);
        }}
        onSubmit={handleUpdateTopicSubmit}
        isLoading={topicLoading}
        title="Sửa chủ đề"
        submitText="Lưu thay đổi"
        initialData={{
          topicName: editingTopic?.topicName,
          dueDate: editingTopic?.dueDate,
          maxDurationMinutes: editingTopic?.maxDurationMinutes || 20,
        }}
      />

      {/* Delete Topic Modal */}
      <Modal
        open={isDeleteTopicModalOpen && !!editingTopic}
        title={
          <div className="flex items-center gap-2 text-red-600">
            <DeleteOutlined />
            <span>Xóa chủ đề</span>
          </div>
        }
        onCancel={() => {
          setIsDeleteTopicModalOpen(false);
          setEditingTopic(null);
        }}
        footer={[
          <AntButton
            key="cancel"
            shape="round"
            onClick={() => {
              setIsDeleteTopicModalOpen(false);
              setEditingTopic(null);
            }}
          >
            Hủy
          </AntButton>,
          <AntButton
            key="delete"
            danger
            type="primary"
            shape="round"
            onClick={async () => {
              if (!editingTopic) return;
              try {
                await dispatch(deleteTopic(editingTopic.topicId)).unwrap();
                setToast({
                  message: "Xóa chủ đề thành công.",
                  type: "success",
                });
                if (selectedClass?.courseId)
                  dispatch(fetchCourseDetail(selectedClass.courseId));
              } catch (error: unknown) {
                const msg =
                  error instanceof Error
                    ? error.message
                    : typeof error === "string"
                      ? error
                      : "Không thể xóa chủ đề.";
                setToast({ message: msg, type: "error" });
              } finally {
                setIsDeleteTopicModalOpen(false);
                setEditingTopic(null);
              }
            }}
          >
            Xóa
          </AntButton>,
        ]}
      >
        <p className="text-slate-600">
          Bạn có chắc muốn xóa chủ đề{" "}
          <strong>{editingTopic?.topicName}</strong>? Hành động này không thể
          hoàn tác.
        </p>
      </Modal>

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
