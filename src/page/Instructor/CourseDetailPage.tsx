import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  User,
  BookOpen,
  Clock,
  CheckCircle2,
  Info,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
} from "lucide-react";
import Button from "@/components/yoodli/Button";
import TopicModal from "@/components/Topic/TopicModal";
import TopicUpdateModal from "@/components/Topic/TopicUpdateModal";
import Toast from "@/components/Toast/Toast";
import { useAppDispatch, useAppSelector } from "@/services/store/store";
import { fetchCourseDetail } from "@/services/features/course/courseSlice";
import {
  createTopic,
  CreateTopicData,
  updateTopic,
  deleteTopic,
} from "@/services/features/topic/topicSlice";
import SidebarInstructor from "@/components/Sidebar/SidebarInstructor/SidebarInstructor";

const CourseDetailPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const {
    selectedCourse: course,
    loading,
    error,
  } = useAppSelector((state) => state.course);
  const { loading: topicLoading } = useAppSelector((state) => state.topic);
  const [topicModalOpen, setTopicModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
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
    if (courseId) {
      dispatch(fetchCourseDetail(parseInt(courseId)));
    }
  }, [courseId, dispatch]);

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <SidebarInstructor activeItem="manage-courses" />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-sky-200 border-t-sky-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading course details...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="flex h-screen bg-gray-50">
        <SidebarInstructor activeItem="manage-courses" />
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
                {error || "Course not found"}
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const courseDuration = Math.ceil(
    (new Date(course.endDate).getTime() -
      new Date(course.startDate).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  const handleTopicSubmit = async (topicData: CreateTopicData) => {
    if (!courseId) return;
    try {
      await dispatch(
        createTopic({ courseId: parseInt(courseId), topicData }),
      ).unwrap();
      setToast({
        message: "Topic created successfully!",
        type: "success",
      });
      setTopicModalOpen(false);
      // Refresh course detail to get updated topics
      dispatch(fetchCourseDetail(parseInt(courseId)));
    } catch (error: any) {
      setToast({
        message: error || "Failed to create topic. Please try again.",
        type: "error",
      });
    }
  };

  const handleEditTopic = (topicId: number) => {
    const topic = course.topics?.find((t) => t.topicId === topicId);
    if (!topic) return;
    setEditingTopic(topic);
    setEditModalOpen(true);
  };

  const handleDeleteTopic = async (topicId: number) => {
    if (window.confirm("Are you sure you want to delete this topic?")) {
      try {
        await dispatch(deleteTopic(topicId)).unwrap();
        setToast({
          message: "Topic deleted successfully!",
          type: "success",
        });
        // Refresh course detail
        if (courseId) {
          dispatch(fetchCourseDetail(parseInt(courseId)));
        }
      } catch (error: any) {
        setToast({
          message: error || "Failed to delete topic. Please try again.",
          type: "error",
        });
      }
    }
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
      setToast({ message: "Topic updated successfully!", type: "success" });
      setEditModalOpen(false);
      setEditingTopic(null);
      if (courseId) dispatch(fetchCourseDetail(parseInt(courseId)));
    } catch (error: any) {
      setToast({
        message: error || "Failed to update topic. Please try again.",
        type: "error",
      });
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <SidebarInstructor activeItem="manage-courses" />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto lg:ml-0">
        <div className="max-w-[1280px] mx-auto px-4 py-8 space-y-6">
          {/* Back Button */}
          <button
            onClick={() => navigate("/instructor/manage-courses")}
            className="flex items-center gap-2 text-sky-600 hover:text-sky-700 font-medium mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to courses
          </button>

          {/* Hero */}
          <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-r from-sky-600 via-sky-500 to-indigo-500 text-white shadow-lg">
            <div
              className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.15),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.12),transparent_30%)]"
              aria-hidden
            />
            <div className="relative p-6 sm:p-8 flex flex-col gap-6">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="space-y-3 max-w-3xl">
                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide shadow-sm ${
                        course.isActive
                          ? "bg-white/20 text-white border border-white/30"
                          : "bg-slate-900/30 text-white border border-white/20"
                      }`}
                    >
                      {course.isActive ? "Active" : "Archived"}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/15 border border-white/20">
                      Semester {course.semester}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/15 border border-white/20">
                      Academic year {course.academicYear}
                    </span>
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-bold leading-tight drop-shadow-sm">
                    {course.courseName}
                  </h1>
                  {course.description && (
                    <p className="text-white/90 text-base leading-relaxed">
                      {course.description}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-3 items-start lg:items-end">
                  <div className="rounded-xl bg-white/15 border border-white/20 px-4 py-3 text-sm">
                    <div className="font-semibold">Course Code</div>
                    <div className="text-white/90">{course.courseCode}</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                {[
                  {
                    label: "Duration",
                    value: `${courseDuration} days`,
                    Icon: Calendar,
                  },
                  {
                    label: "Modules",
                    value: `${course.topics?.length || 0} modules`,
                    Icon: BookOpen,
                  },
                  {
                    label: "Start date",
                    value: formatDate(course.startDate),
                    Icon: Calendar,
                  },
                  {
                    label: "End date",
                    value: formatDate(course.endDate),
                    Icon: Clock,
                  },
                ].map(({ label, value, Icon }, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl bg-white/15 border border-white/20 px-4 py-3 flex items-center gap-3"
                  >
                    <span className="rounded-full bg-white/20 p-2">
                      <Icon className="w-5 h-5 text-white" />
                    </span>
                    <div>
                      <p className="text-white/80 text-xs uppercase tracking-wide font-semibold">
                        {label}
                      </p>
                      <p className="font-semibold">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Course overview
                    </p>
                    <h2 className="text-xl font-bold text-slate-900 mt-1">
                      Learning path & outcomes
                    </h2>
                    <p className="text-sm text-slate-600 mt-2 max-w-3xl">
                      Use the outline below to follow sessions, assignments, and
                      milestones for this course.
                    </p>
                  </div>
                  <div className="hidden sm:flex items-center gap-2 rounded-full bg-slate-50 border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Ready to deliver
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase">
                      Timeline
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-slate-800 font-semibold">
                      <Calendar className="w-4 h-4 text-sky-600" />
                      {courseDuration} days
                    </div>
                    <p className="text-xs text-slate-600 mt-2">
                      Track progress weekly to keep the cohort in rhythm.
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase">
                      Key modules
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-slate-800 font-semibold">
                      <BookOpen className="w-4 h-4 text-indigo-600" />
                      {course.topics?.length || 0} modules
                    </div>
                    <p className="text-xs text-slate-600 mt-2">
                      Each module is goal-based with measurable outcomes.
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase">
                      Last updated
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-slate-800 font-semibold">
                      <Clock className="w-4 h-4 text-amber-600" />
                      {formatDate(course.updatedAt)}
                    </div>
                    <p className="text-xs text-slate-600 mt-2">
                      Keep content fresh and aligned with assessment standards.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="rounded-lg bg-sky-100 p-2">
                      <Calendar className="w-5 h-5 text-sky-700" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
                        Milestones
                      </p>
                      <h3 className="text-lg font-bold text-slate-900">
                        Teaching timeline
                      </h3>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {[
                      {
                        label: "Start date",
                        value: formatDate(course.startDate),
                        tone: "from-emerald-50 to-white",
                      },
                      {
                        label: "End date",
                        value: formatDate(course.endDate),
                        tone: "from-amber-50 to-white",
                      },
                    ].map((item, idx) => (
                      <div
                        key={idx}
                        className={`rounded-xl border border-slate-200 bg-gradient-to-r ${item.tone} p-4 flex items-center justify-between`}
                      >
                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase">
                            {item.label}
                          </p>
                          <p className="text-sm font-semibold text-slate-900">
                            {item.value}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                          <Clock className="w-4 h-4 text-slate-500" />
                          {courseDuration} days
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="rounded-lg bg-indigo-100 p-2">
                      <BookOpen className="w-5 h-5 text-indigo-700" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
                        Course assets
                      </p>
                      <h3 className="text-lg font-bold text-slate-900">
                        Resources
                      </h3>
                    </div>
                  </div>
                  <ul className="space-y-3 text-sm text-slate-700">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5" />
                      Syllabus and grading criteria.
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5" />
                      Readings or slides per module.
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5" />
                      Assignments and deadlines.
                    </li>
                  </ul>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
                      Learning modules
                    </p>
                    <h3 className="text-xl font-bold text-slate-900">
                      Topic list ({course.topics?.length || 0})
                    </h3>
                  </div>
                  <Button
                    text="Create Topic"
                    variant="primary"
                    fontSize="14px"
                    borderRadius="8px"
                    paddingWidth="16px"
                    paddingHeight="8px"
                    icon={<Plus className="w-4 h-4 text-white" />}
                    iconPosition="left"
                    onClick={() => setTopicModalOpen(true)}
                  />
                </div>

                {course.topics && course.topics.length > 0 ? (
                  <div className="space-y-3">
                    {course.topics.map((topic) => (
                      <div
                        key={topic.topicId}
                        className="rounded-xl border border-slate-200 hover:border-sky-200 hover:shadow transition bg-slate-50/60"
                      >
                        <div className="p-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                          <div
                            className="flex items-start gap-3 flex-1 cursor-pointer"
                            onClick={() =>
                              navigate(`/instructor/topic/${topic.topicId}`)
                            }
                          >
                            <div className="w-10 h-10 rounded-full bg-sky-100 text-sky-700 font-bold flex items-center justify-center">
                              {topic.sequenceNumber}
                            </div>
                            <div>
                              <h4 className="font-semibold text-slate-900">
                                {topic.topicName}
                              </h4>
                              {topic.description && (
                                <p className="text-sm text-slate-600 mt-1 max-w-3xl">
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
                                  Due: {formatDate(topic.dueDate)}
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
                                      handleDeleteTopic(topic.topicId);
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
                  <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-slate-600 bg-slate-50">
                    No topics yet. Add modules with objectives and deadlines to
                    keep students oriented.
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="rounded-lg bg-sky-100 p-2">
                    <User className="w-5 h-5 text-sky-700" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
                      Instructor of record
                    </p>
                    <h3 className="text-lg font-bold text-slate-900">
                      Faculty profile
                    </h3>
                  </div>
                </div>
                {course.instructor ? (
                  <>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 mx-auto flex items-center justify-center text-white text-xl font-bold">
                        {course.instructor.firstName?.charAt(0)}
                        {course.instructor.lastName?.charAt(0)}
                      </div>
                      <h4 className="mt-3 text-lg font-semibold text-slate-900">
                        {course.instructor.firstName} {course.instructor.lastName}
                      </h4>
                      <p className="text-sm text-slate-600">
                        @{course.instructor.username}
                      </p>
                    </div>
                    <div className="mt-4 space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">Instructor ID</span>
                        <span className="font-semibold text-slate-900">
                          {course.instructor.userId}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">Email</span>
                        <span className="font-semibold text-slate-900 break-all text-right">
                          {course.instructor.email}
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
                    <p className="text-slate-600">
                      Instructor information not available
                    </p>
                  </div>
                )}
                <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-xs text-slate-600">
                  Respond to questions within 24 hours and refresh materials after
                  each session.
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Info className="w-5 h-5 text-indigo-600" />
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
                      Academic info
                    </p>
                    <h3 className="text-lg font-bold text-slate-900">
                      Governance & support
                    </h3>
                  </div>
                </div>
                <div className="space-y-3 text-sm text-slate-700">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-flex h-2 w-2 rounded-full bg-emerald-500"
                      aria-hidden
                    />
                    Course is{" "}
                    {course.isActive
                      ? "active and visible to students"
                      : "currently archived"}
                    .
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-flex h-2 w-2 rounded-full bg-sky-500"
                      aria-hidden
                    />
                    Last updated: {formatDate(course.updatedAt)}.
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-200">
                  <Button
                    text="Return to list"
                    variant="secondary"
                    fontSize="14px"
                    borderRadius="10px"
                    paddingWidth="14px"
                    paddingHeight="10px"
                    onClick={() => navigate("/instructor/manage-courses")}
                  />
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Topic Modal */}
      <TopicModal
        isOpen={topicModalOpen}
        onClose={() => setTopicModalOpen(false)}
        onSubmit={handleTopicSubmit}
        isLoading={topicLoading}
      />

      {/* Edit Topic Modal */}
      <TopicUpdateModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
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

export default CourseDetailPage;
