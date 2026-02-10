import React, { useEffect, useState } from "react";
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
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/services/store/store";
import { fetchClassDetail } from "@/services/features/admin/classSlice";
import SidebarInstructor from "@/components/Sidebar/SidebarInstructor/SidebarInstructor";
import Button from "@/components/yoodli/Button";
import TopicModal from "@/components/Topic/TopicModal";
import TopicUpdateModal from "@/components/Topic/TopicUpdateModal";
import Toast from "@/components/Toast/Toast";
import { fetchCourseDetail } from "@/services/features/course/courseSlice";
import {
  createTopic,
  CreateTopicData,
  updateTopic,
  deleteTopic,
} from "@/services/features/topic/topicSlice";

const ClassDetailPage: React.FC = () => {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { selectedClass, loading, error } = useAppSelector(
    (state) => state.class,
  );
  const { selectedCourse: courseForTopics } = useAppSelector(
    (state) => state.course,
  );
  const { loading: topicLoading } = useAppSelector((state) => state.topic);

  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [isEditTopicModalOpen, setIsEditTopicModalOpen] = useState(false);
  const [isDeleteTopicModalOpen, setIsDeleteTopicModalOpen] = useState(false);
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
    if (classId) {
      dispatch(fetchClassDetail(parseInt(classId)));
    }
  }, [classId, dispatch]);

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
        createTopic({ courseId: selectedClass.courseId, topicData }),
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

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
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
  const topicsForClass =
    selectedClass.topics || courseForTopics?.topics || [];

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

          <div className="grid grid-cols-1 gap-6">
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
                      Create and manage topics that students will use for their
                      presentations in this class.
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
              (courseForTopics?.topics && courseForTopics.topics.length > 0) ? (
                <div className="space-y-3">
                  {(selectedClass.topics || courseForTopics?.topics || []).map(
                    (topic) => (
                    <div
                      key={topic.topicId}
                      className="rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-50/80 transition-colors"
                    >
                      <div className="px-4 py-3 sm:px-5 sm:py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1">
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
                        </div>
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
                    {selectedClass.enrollmentCount || 0} enrolled students
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
                <div className="rounded-2xl bg-slate-100 p-2">
                  <Clock className="w-5 h-5 text-slate-700" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
                    System info
                  </p>
                  <h3 className="text-lg font-bold text-slate-900">Timeline</h3>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-slate-600">Created:</span>
                  <span className="font-semibold text-slate-900">
                    {formatDateTime(selectedClass.createdAt)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-600">Updated:</span>
                  <span className="font-semibold text-slate-900">
                    {formatDateTime(selectedClass.updatedAt)}
                  </span>
                </div>
              </div>
            </div>
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
