import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  Calendar,
  Clock,
  BookOpen,
  CheckCircle2,
  Plus,
  Upload,
  FileText as FileTextIcon,
  Users,
  X,
  Loader2,
  Crown,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/services/store/store";
import { fetchTopicDetail } from "@/services/features/topic/topicSlice";
import {
  fetchPresentationsByClassAndTopic,
  createPresentation,
} from "@/services/features/presentation/presentationSlice";
import {
  fetchMyGroupByClass,
  fetchGroupTopic,
  pickGroupTopic,
  clearGroupTopic,
} from "@/services/features/group/groupSlice";
import PresentationUploadModal from "@/components/Presentation/PresentationUploadModal";
import StudentLayout from "@/components/StudentLayout/StudentLayout";

interface TopicStudentDetailPageProps {
  isModalMode?: boolean;
  onCloseModal?: () => void;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  draft: { label: "Nháp", color: "bg-slate-100 text-slate-700 border-slate-200", icon: <FileTextIcon className="w-3 h-3" /> },
  submitted: { label: "Đã nộp", color: "bg-blue-100 text-blue-700 border-blue-200", icon: <CheckCircle2 className="w-3 h-3" /> },
  processing: { label: "Đang xử lý", color: "bg-amber-100 text-amber-700 border-amber-200", icon: <Loader2 className="w-3 h-3 animate-spin" /> },
  analyzed: { label: "Đã chấm", color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: <CheckCircle2 className="w-3 h-3" /> },
  done: { label: "Hoàn thành", color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: <CheckCircle2 className="w-3 h-3" /> },
  failed: { label: "Thất bại", color: "bg-red-100 text-red-700 border-red-200", icon: <FileTextIcon className="w-3 h-3" /> },
};

const StudentTopicDetailPage: React.FC<TopicStudentDetailPageProps> = ({
  isModalMode = false,
  onCloseModal,
}) => {
  const { topicId, classId } = useParams<{ topicId: string; classId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { selectedTopic: topic, loading: topicLoading, error: topicError } = useAppSelector((state) => state.topic);
  const { presentations } = useAppSelector((state) => state.presentation);
  const { user } = useAppSelector((state) => state.auth);
  const {
    myGroupForClass,
    groupTopic,
    actionLoading: groupActionLoading,
  } = useAppSelector((state) => state.group);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isUploadResubmit, setIsUploadResubmit] = useState(false);
  const [presentationTitle, setPresentationTitle] = useState("");
  const [presentationDescription, setPresentationDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [selectedPresentationId, setSelectedPresentationId] = useState<number | null>(null);
  const [showRequirements, setShowRequirements] = useState(true);

  const topicIdNumber = topicId ? parseInt(topicId) : null;
  const classIdNumber = classId ? parseInt(classId) : null;
  const myGroupId = myGroupForClass?.groupId != null
    ? Number(myGroupForClass.groupId)
    : null;
  const isGroupTopicThis =
    topicIdNumber != null && groupTopic?.topicId === topicIdNumber;
  /** Chỉ theo chủ đề nhóm (GET /groups/:id/topic), không dùng ghi danh cá nhân — tránh hiển thị sai sau khi rời nhóm */
  const isEnrolled = Boolean(myGroupForClass && isGroupTopicThis);
  const myPresentation = presentations.find((p) => p.studentId === user?.userId);
  const isCurrentUserLeader = myGroupForClass?.myRole === "leader";

  useEffect(() => {
    if (topicIdNumber && classIdNumber) {
      dispatch(fetchTopicDetail(topicIdNumber));
      dispatch(fetchPresentationsByClassAndTopic({ classId: classIdNumber, topicId: topicIdNumber }));
    }
    if (classIdNumber) dispatch(fetchMyGroupByClass(classIdNumber));
  }, [topicIdNumber, classIdNumber, dispatch]);

  useEffect(() => {
    if (myGroupId != null && Number.isFinite(myGroupId)) {
      dispatch(fetchGroupTopic(myGroupId));
    }
  }, [myGroupId, dispatch]);

  const handlePickTopicForGroup = async () => {
    if (!topicIdNumber || !myGroupId) return;
    try {
      await dispatch(pickGroupTopic({ groupId: myGroupId, topicId: topicIdNumber })).unwrap();
      toast.success("Đã chọn chủ đề cho nhóm.");
      await dispatch(fetchGroupTopic(myGroupId));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Chọn chủ đề thất bại");
    }
  };

  const handleClearGroupTopic = async () => {
    if (!myGroupId) return;
    try {
      await dispatch(clearGroupTopic(myGroupId)).unwrap();
      toast.success("Đã hủy chọn chủ đề cho nhóm.");
      await dispatch(fetchGroupTopic(myGroupId));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Hủy chủ đề thất bại");
    }
  };

  const handleCreatePresentation = async () => {
    if (!topicIdNumber || !classIdNumber) return;
    if (!isCurrentUserLeader) { toast.info("Chỉ nhóm trưởng mới có thể tạo bài thuyết trình"); return; }
    const trimmedTitle = presentationTitle.trim();
    if (!trimmedTitle) { toast.info("Vui lòng nhập tiêu đề"); return; }
    setIsCreating(true);
    try {
      const groupCode = myGroupForClass?.groupName || myGroupForClass?.name || undefined;
      await dispatch(createPresentation({ classId: classIdNumber, topicId: topicIdNumber, title: trimmedTitle, description: presentationDescription.trim() || undefined, groupCode })).unwrap();
      toast.success("Tạo bài thuyết trình thành công!");
      setIsCreateModalOpen(false); setPresentationTitle(""); setPresentationDescription("");
      dispatch(fetchPresentationsByClassAndTopic({ classId: classIdNumber, topicId: topicIdNumber }));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Tạo bài thuyết trình thất bại");
    } finally { setIsCreating(false); }
  };

  const handleOpenUploadModal = (presentationId: number, title: string) => {
    setSelectedPresentationId(presentationId);
    setPresentationTitle(title);
    setIsUploadResubmit(false);
    setIsUploadModalOpen(true);
  };

  const handleRetry = (presentationId: number, title: string) => {
    setSelectedPresentationId(presentationId);
    setPresentationTitle(title);
    setIsUploadResubmit(true);
    setIsUploadModalOpen(true);
  };

  if (topicLoading) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-500">Đang tải thông tin chủ đề...</p>
          </div>
        </div>
      </StudentLayout>
    );
  }

  if (topicError || !topic) {
    return (
      <StudentLayout>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <button onClick={() => isModalMode && onCloseModal ? onCloseModal() : navigate(-1)} className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mb-6">
            <ArrowLeft className="w-5 h-5" /> Quay lại
          </button>
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
            <p className="text-red-700 font-medium">{topicError || "Không tìm thấy chủ đề"}</p>
          </div>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm">
          <button onClick={() => isModalMode && onCloseModal ? onCloseModal() : navigate(-1)} className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-medium transition">
            <ArrowLeft className="w-4 h-4" /> Quay lại
          </button>
          <span className="text-slate-300">/</span>
          <span className="text-slate-500 truncate">{topic.topicName}</span>
        </div>

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-600 text-white shadow-xl p-6 sm:p-8"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_60%)]" />
          <div className="absolute -bottom-8 -right-8 w-48 h-48 bg-white/5 rounded-full" />
          <div className="relative">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="bg-white/20 text-white text-xs px-2.5 py-1 rounded-full font-semibold">Chủ đề #{topic.sequenceNumber}</span>
              {isEnrolled && <span className="inline-flex items-center gap-1.5 bg-emerald-400/30 text-white text-xs px-2.5 py-1 rounded-full font-semibold"><CheckCircle2 className="w-3.5 h-3.5" /> Đã ghi danh (nhóm)</span>}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">{topic.topicName}</h1>
            {topic.description && <p className="text-white/80 mb-4 max-w-2xl">{topic.description}</p>}
            <div className="flex flex-wrap gap-3">
              {topic.dueDate && (
                <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 rounded-xl px-3 py-2 text-sm">
                  <Calendar className="w-4 h-4 text-white/80" />
                  <div>
                    <p className="text-white/60 text-xs">Hạn nộp</p>
                    <p className="text-white font-semibold text-xs">{new Date(topic.dueDate).toLocaleDateString("vi-VN")}</p>
                  </div>
                </div>
              )}
              {topic.maxDurationMinutes && (
                <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 rounded-xl px-3 py-2 text-sm">
                  <Clock className="w-4 h-4 text-white/80" />
                  <div>
                    <p className="text-white/60 text-xs">Thời lượng</p>
                    <p className="text-white font-semibold text-xs">{topic.maxDurationMinutes} phút</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 rounded-xl px-3 py-2 text-sm">
                <FileTextIcon className="w-4 h-4 text-white/80" />
                <div>
                  <p className="text-white/60 text-xs">Bài nộp</p>
                  <p className="text-white font-semibold text-xs">{presentations.length}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main content: split layout on desktop */}
        <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
          {/* Left: Topic details + submission history */}
          <div className="space-y-6">
            {/* Requirements accordion */}
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
                    <span className="font-bold text-slate-900">Yêu cầu chủ đề</span>
                  </div>
                  {showRequirements ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
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

            {/* Presentations list */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
                    <FileTextIcon className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">Bài thuyết trình</h3>
                    <p className="text-xs text-slate-500">{presentations.length} bài đã nộp</p>
                  </div>
                </div>
              </div>

              {presentations.length > 0 ? (
                <div className="space-y-3">
                  {presentations.map((presentation) => {
                    const sc = statusConfig[presentation.status?.toLowerCase()] || statusConfig.draft;
                    const isFailed = presentation.status === "failed";
                    return (
                      <div
                        key={presentation.presentationId}
                        className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 hover:border-blue-200 hover:shadow-md bg-slate-50/50 hover:bg-white transition-all duration-200"
                      >
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                          <FileTextIcon className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-slate-900 text-sm truncate">{presentation.title}</h4>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${sc.color}`}>{sc.icon}{sc.label}</span>
                          </div>
                          <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                            {presentation.submissionDate && (
                              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(presentation.submissionDate).toLocaleDateString("vi-VN")}</span>
                            )}
                            {presentation.groupCode && (
                              <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {presentation.groupCode}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Link
                            to={`/student/presentation/${presentation.presentationId}`}
                            className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                          >
                            Xem
                          </Link>
                          {isFailed && (
                            <button
                              onClick={() => handleRetry(presentation.presentationId, presentation.title)}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition shadow-sm"
                            >
                              <RefreshCw className="w-3 h-3" /> Gửi lại
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
                  <FileTextIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">Chưa có bài thuyết trình nào.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right: Action zone */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sticky top-24">
              {!isEnrolled ? (
                <div className="text-center py-4">
                  {myGroupForClass && !isCurrentUserLeader ? (
                    <>
                      <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Users className="w-7 h-7 text-slate-500" />
                      </div>
                      <h3 className="font-bold text-slate-900 mb-1">Chờ nhóm trưởng</h3>
                      <p className="text-sm text-slate-500 mb-4">
                        Chỉ nhóm trưởng mới chọn chủ đề cho cả nhóm. Bạn sẽ được ghi danh khi nhóm trưởng đã chọn.
                      </p>
                      <div className="inline-flex items-center gap-2 px-3 py-2 bg-slate-50 text-slate-600 rounded-xl border border-slate-200 text-sm font-medium">
                        <Users className="w-4 h-4" /> {myGroupForClass.groupName || myGroupForClass.name}
                      </div>
                    </>
                  ) : isCurrentUserLeader && myGroupId && groupTopic ? (
                    <>
                      <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                      </div>
                      <h3 className="font-bold text-slate-900 mb-1">Nhóm đã chọn chủ đề</h3>
                      <p className="text-sm text-slate-500 mb-4">
                        Nhóm đang làm chủ đề:{" "}
                        <span className="font-semibold text-slate-800">{groupTopic.topicName}</span>
                      </p>
                      {classId && groupTopic.topicId !== topicIdNumber ? (
                        <Link
                          to={`/student/class/${classId}/topic/${groupTopic.topicId}`}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-3 rounded-xl transition flex items-center justify-center gap-2"
                        >
                          <BookOpen className="w-4 h-4" /> Đi tới chủ đề của nhóm
                        </Link>
                      ) : null}
                    </>
                  ) : isCurrentUserLeader && myGroupId ? (
                    <>
                      <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Crown className="w-7 h-7 text-amber-600" />
                      </div>
                      <h3 className="font-bold text-slate-900 mb-1">Chọn chủ đề cho nhóm</h3>
                      <p className="text-sm text-slate-500 mb-5">
                        Chọn chủ đề này cho cả nhóm — các thành viên sẽ được ghi danh cùng lúc.
                      </p>
                      <button
                        type="button"
                        onClick={handlePickTopicForGroup}
                        disabled={groupActionLoading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-3 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {groupActionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                        Chọn chủ đề này cho nhóm
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <BookOpen className="w-7 h-7 text-amber-600" />
                      </div>
                      <h3 className="font-bold text-slate-900 mb-1">Tham gia nhóm trước</h3>
                      <p className="text-sm text-slate-500 mb-5">Bạn cần ở trong một nhóm để nhóm trưởng chọn chủ đề.</p>
                      <Link to={`/student/class/${classId}`} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-3 rounded-xl transition flex items-center justify-center gap-2">
                        <Users className="w-4 h-4" /> Đến quản lý nhóm
                      </Link>
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {isCurrentUserLeader && isGroupTopicThis && myGroupId ? (
                    <button
                      type="button"
                      onClick={handleClearGroupTopic}
                      disabled={groupActionLoading}
                      className="w-full border border-red-200 bg-red-50 text-red-800 font-semibold text-sm px-4 py-2.5 rounded-xl hover:bg-red-100 transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {groupActionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                      Hủy chọn chủ đề cho nhóm
                    </button>
                  ) : null}
                  {myPresentation ? (
                    <div className="text-center py-4">
                      <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                      </div>
                      <h3 className="font-bold text-slate-900 mb-1">Bài của bạn</h3>
                        {myPresentation.status === "failed" ? (
                          <p className="text-sm text-red-600 font-medium mb-3">
                            Xử lý thất bại. Bạn có thể gửi lại bài để thử lại.
                          </p>
                        ) : (
                          <p className="text-sm text-slate-500 mb-4">
                            {myPresentation.status === "draft"
                              ? "Đã tạo bài thuyết trình. Tải lên file để bắt đầu xử lý."
                              : myPresentation.status === "submitted" || myPresentation.status === "processing"
                                ? "Bài đã được nộp và đang xử lý AI."
                                : myPresentation.status === "done"
                                  ? "Xử lý hoàn tất! Xem kết quả trong chi tiết bài."
                                  : ""}
                          </p>
                        )}
                        <div className="space-y-3">
                        {/* Chỉ hiện nút upload khi còn ở trạng thái draft */}
                        {myPresentation.status === "draft" && (
                          <button
                            onClick={() => handleOpenUploadModal(myPresentation.presentationId, myPresentation.title)}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-3 rounded-xl transition flex items-center justify-center gap-2"
                          >
                            <Upload className="w-4 h-4" /> Tải lên file
                          </button>
                        )}
                        {myPresentation.status === "failed" && (
                          <button
                            onClick={() => handleRetry(myPresentation.presentationId, myPresentation.title)}
                            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold px-5 py-3 rounded-xl transition flex items-center justify-center gap-2"
                          >
                            <RefreshCw className="w-4 h-4" /> Gửi lại bài (upload file mới)
                          </button>
                        )}
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border font-medium mx-auto ${(statusConfig[myPresentation.status?.toLowerCase()] || statusConfig.draft).color}`}>
                          {(statusConfig[myPresentation.status?.toLowerCase()] || statusConfig.draft).icon}
                          {(statusConfig[myPresentation.status?.toLowerCase()] || statusConfig.draft).label}
                        </div>
                      </div>
                    </div>
                  ) : myGroupForClass && isCurrentUserLeader ? (
                    <div className="text-center py-4">
                      <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Crown className="w-7 h-7 text-blue-600" />
                      </div>
                      <h3 className="font-bold text-slate-900 mb-1">Tạo bài thuyết trình</h3>
                      <p className="text-sm text-slate-500 mb-5">Là nhóm trưởng, bạn có thể tạo bài thuyết trình cho chủ đề này.</p>
                      <button onClick={() => setIsCreateModalOpen(true)} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-3 rounded-xl transition flex items-center justify-center gap-2">
                        <Plus className="w-4 h-4" /> Tạo bài thuyết trình
                      </button>
                    </div>
                  ) : myGroupForClass ? (
                    <div className="text-center py-4">
                      <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Users className="w-7 h-7 text-slate-500" />
                      </div>
                      <h3 className="font-bold text-slate-900 mb-1">Chờ nhóm trưởng</h3>
                      <p className="text-sm text-slate-500 mb-4">Nhóm trưởng cần tạo bài thuyết trình. Vui lòng chờ.</p>
                      <div className="inline-flex items-center gap-2 px-3 py-2 bg-slate-50 text-slate-600 rounded-xl border border-slate-200 text-sm font-medium">
                        <Users className="w-4 h-4" /> {myGroupForClass.groupName || myGroupForClass.name}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Users className="w-7 h-7 text-slate-400" />
                      </div>
                      <h3 className="font-bold text-slate-900 mb-1">Tham gia nhóm trước</h3>
                      <p className="text-sm text-slate-500 mb-5">Bạn cần ở trong một nhóm để tạo bài thuyết trình.</p>
                      <Link to={`/student/class/${classId}`} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-3 rounded-xl transition flex items-center justify-center gap-2">
                        <Users className="w-4 h-4" /> Đến quản lý nhóm
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create Presentation Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsCreateModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Crown className="w-4 h-4 text-amber-500" />
                    <span className="text-xs text-amber-600 font-semibold uppercase tracking-wide">Chỉ nhóm trưởng</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Tạo bài thuyết trình</h3>
                </div>
                <button onClick={() => setIsCreateModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-xl transition"><X className="w-4 h-4 text-slate-500" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Tiêu đề *</label>
                  <input value={presentationTitle} onChange={(e) => setPresentationTitle(e.target.value)} placeholder="Nhập tiêu đề bài thuyết trình" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Mô tả <span className="text-slate-400 font-normal">(tùy chọn)</span></label>
                  <textarea value={presentationDescription} onChange={(e) => setPresentationDescription(e.target.value)} placeholder="Mô tả bài thuyết trình" rows={3} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" />
                </div>
                {myGroupForClass && (
                  <div className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 flex items-center gap-2 text-sm text-blue-700">
                    <Users className="w-4 h-4 shrink-0" />
                    Bài thuyết trình sẽ được tạo cho nhóm: <span className="font-semibold">{myGroupForClass.groupName || myGroupForClass.name}</span>
                  </div>
                )}
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setIsCreateModalOpen(false)} className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition">Hủy</button>
                <button onClick={handleCreatePresentation} disabled={isCreating || !presentationTitle.trim()} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2">
                  {isCreating ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang tạo...</> : "Tạo bài thuyết trình"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {isUploadModalOpen && selectedPresentationId && (
        <PresentationUploadModal
          isOpen={isUploadModalOpen}
          onClose={() => {
            setIsUploadModalOpen(false);
            if (classIdNumber && topicIdNumber) dispatch(fetchPresentationsByClassAndTopic({ classId: classIdNumber, topicId: topicIdNumber }));
          }}
          presentationId={selectedPresentationId}
          presentationTitle={presentationTitle}
          isResubmit={isUploadResubmit}
        />
      )}

    </StudentLayout>
  );
};

export default StudentTopicDetailPage;
