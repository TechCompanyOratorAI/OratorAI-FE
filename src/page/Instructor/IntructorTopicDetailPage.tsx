import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  Clock,
  FileText as FileTextIcon,
  CheckCircle2,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/services/store/store";
import { fetchTopicDetail } from "@/services/features/topic/topicSlice";
import {
  fetchPresentationsByClassAndTopic,
  fetchPresentationsByTopic,
} from "@/services/features/presentation/presentationSlice";
import SidebarInstructor from "@/components/Sidebar/SidebarInstructor/SidebarInstructor";

const statusConfig: Record<
  string,
  { label: string; color: string; icon: React.ReactNode }
> = {
  draft: {
    label: "Nháp",
    color: "bg-slate-100 text-slate-700 border-slate-200",
    icon: <FileTextIcon className="w-3 h-3" />,
  },
  submitted: {
    label: "Đã nộp",
    color: "bg-blue-100 text-blue-700 border-blue-200",
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  processing: {
    label: "Đang xử lý",
    color: "bg-amber-100 text-amber-700 border-amber-200",
    icon: <Loader2 className="w-3 h-3 animate-spin" />,
  },
  analyzed: {
    label: "Đã chấm",
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  done: {
    label: "Hoàn thành",
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  failed: {
    label: "Thất bại",
    color: "bg-red-100 text-red-700 border-red-200",
    icon: <FileTextIcon className="w-3 h-3" />,
  },
};

const IntructorTopicDetailPage: React.FC = () => {
  const { topicId, classId } = useParams<{
    topicId: string;
    classId: string;
  }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const {
    selectedTopic: topic,
    loading: topicLoading,
    error: topicError,
  } = useAppSelector((state) => state.topic);
  const { presentations, loading: presentationLoading } = useAppSelector(
    (state) => state.presentation,
  );

  const [showRequirements, setShowRequirements] = useState(true);

  const topicIdNumber = topicId ? parseInt(topicId) : null;
  const classIdNumber = classId ? parseInt(classId) : null;

  useEffect(() => {
    if (!topicIdNumber) return;

    dispatch(fetchTopicDetail(topicIdNumber));

    if (classIdNumber) {
      dispatch(
        fetchPresentationsByClassAndTopic({
          classId: classIdNumber,
          topicId: topicIdNumber,
        }),
      );
      return;
    }

    dispatch(fetchPresentationsByTopic(topicIdNumber));
  }, [topicIdNumber, classIdNumber, dispatch]);

  const isPageLoading = topicLoading || presentationLoading;

  const mergedPresentations = useMemo(() => {
    if (presentations.length > 0) return presentations;
    return topic?.presentations || [];
  }, [presentations, topic?.presentations]);

  const handleBack = () => {
    navigate(-1);
  };

  if (isPageLoading && !topic) {
    return (
      <div className="flex h-screen bg-gray-50">
        <SidebarInstructor activeItem="manage-classes" />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-500">Đang tải thông tin chủ đề...</p>
          </div>
        </main>
      </div>
    );
  }

  if (topicError || !topic) {
    return (
      <div className="flex h-screen bg-gray-50">
        <SidebarInstructor activeItem="manage-classes" />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mb-6"
            >
              <ArrowLeft className="w-5 h-5" /> Quay lại
            </button>
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
              <p className="text-red-700 font-medium">
                {topicError || "Không tìm thấy chủ đề"}
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarInstructor activeItem="manage-classes" />
      <main className="flex-1 overflow-y-auto lg:ml-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <div className="flex items-center gap-2 text-sm">
            <button
              onClick={handleBack}
              className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-medium transition"
            >
              <ArrowLeft className="w-4 h-4" /> Quay lại
            </button>
            <span className="text-slate-300">/</span>
            <span className="text-slate-500 truncate">{topic.topicName}</span>
          </div>

          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-600 text-white shadow-xl p-6 sm:p-8"
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_60%)]" />
            <div className="absolute -bottom-8 -right-8 w-48 h-48 bg-white/5 rounded-full" />
            <div className="relative">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="bg-white/20 text-white text-xs px-2.5 py-1 rounded-full font-semibold">
                  Chủ đề #{topic.sequenceNumber}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">
                {topic.topicName}
              </h1>
              {topic.description && (
                <p className="text-white/80 mb-4 max-w-2xl">
                  {topic.description}
                </p>
              )}
              <div className="flex flex-wrap gap-3">
                {topic.dueDate && (
                  <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 rounded-xl px-3 py-2 text-sm">
                    <Calendar className="w-4 h-4 text-white/80" />
                    <div>
                      <p className="text-white/60 text-xs">Hạn nộp</p>
                      <p className="text-white font-semibold text-xs">
                        {new Date(topic.dueDate).toLocaleDateString("vi-VN")}
                      </p>
                    </div>
                  </div>
                )}
                {topic.maxDurationMinutes && (
                  <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 rounded-xl px-3 py-2 text-sm">
                    <Clock className="w-4 h-4 text-white/80" />
                    <div>
                      <p className="text-white/60 text-xs">Thời lượng</p>
                      <p className="text-white font-semibold text-xs">
                        {topic.maxDurationMinutes} phút
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 rounded-xl px-3 py-2 text-sm">
                  <FileTextIcon className="w-4 h-4 text-white/80" />
                  <div>
                    <p className="text-white/60 text-xs">Bài nộp</p>
                    <p className="text-white font-semibold text-xs">
                      {mergedPresentations.length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <div className="space-y-6">
            {topic.requirements && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <button
                  onClick={() => setShowRequirements(!showRequirements)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">
                      <FileTextIcon className="w-5 h-5 text-amber-600" />
                    </div>
                    <span className="font-bold text-slate-900">
                      Yêu cầu chủ đề
                    </span>
                  </div>
                  {showRequirements ? (
                    <ChevronUp className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  )}
                </button>
                <AnimatePresence initial={false}>
                  {showRequirements && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: "auto" }}
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-5 pt-0">
                        <pre className="whitespace-pre-wrap text-sm text-slate-700 font-sans bg-slate-50 p-4 rounded-xl border border-slate-200 leading-relaxed">
                          {topic.requirements}
                        </pre>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
                    <FileTextIcon className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">
                      Bài thuyết trình
                    </h3>
                    <p className="text-xs text-slate-500">
                      {mergedPresentations.length} bài đã nộp
                    </p>
                  </div>
                </div>
              </div>

              {mergedPresentations.length > 0 ? (
                <div className="space-y-3">
                  {mergedPresentations.map((presentation) => {
                    const sc =
                      statusConfig[presentation.status?.toLowerCase()] ||
                      statusConfig.draft;

                    return (
                      <Link
                        key={presentation.presentationId}
                        to={`/intructor/presentation/${presentation.presentationId}`}
                        state={{ presentation }}
                        className="group flex items-start gap-3 p-4 rounded-xl border border-slate-200 hover:border-blue-200 hover:shadow-md bg-slate-50/50 hover:bg-white transition-all duration-200 block"
                      >
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                          <FileTextIcon className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-slate-900 text-sm truncate">
                              {presentation.title}
                            </h4>
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${sc.color}`}
                            >
                              {sc.icon}
                              {sc.label}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                            {presentation.submissionDate && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(
                                  presentation.submissionDate,
                                ).toLocaleDateString("vi-VN")}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
                  <FileTextIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">
                    Chưa có bài thuyết trình nào.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default IntructorTopicDetailPage;
