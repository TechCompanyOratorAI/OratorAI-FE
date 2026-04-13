import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  FileText,
  Clock,
  Calendar,
  User,
  BookOpen,
  Link2,
  MessageSquare,
  Cpu,
  Star,
  Award,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { TrophyOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { useAppDispatch, useAppSelector } from "@/services/store/store";
import {
  fetchPresentationDetail,
} from "@/services/features/presentation/presentationSlice";
import {
  clearCurrentReport,
  fetchPresentationReport,
  fetchCriterionFeedbacks,
} from "@/services/features/report/reportSlice";
import PresentationPlayer from "@/components/Presentation/PresentationPlayer";
import PresentationProgressTracker from "@/components/Presentation/PresentationProgressTracker";
import PresentationUploadModal from "@/components/Presentation/PresentationUploadModal";
import ShareModal from "@/components/Share/ShareModal";
import StudentLayout from "@/components/StudentLayout/StudentLayout";
import GradeDistributionModal from "@/components/Group/GradeDistributionModal";
import {
  fetchMyGroupByClass,
  fetchGroupDetail,
  GroupStudent,
} from "@/services/features/group/groupSlice";

const statusConfig: Record<
  string,
  { label: string; gradient: string; border: string }
> = {
  draft: {
    label: "Nháp",
    gradient: "from-slate-100 to-slate-200",
    border: "border-slate-300",
  },
  submitted: {
    label: "Đã nộp",
    gradient: "from-sky-100 to-blue-200",
    border: "border-blue-300",
  },
  processing: {
    label: "Đang xử lý",
    gradient: "from-amber-100 to-orange-200",
    border: "border-amber-300",
  },
  analyzed: {
    label: "Đã chấm",
    gradient: "from-emerald-100 to-green-200",
    border: "border-emerald-300",
  },
  done: {
    label: "Hoàn thành",
    gradient: "from-emerald-100 to-green-200",
    border: "border-emerald-300",
  },
  failed: {
    label: "Thất bại",
    gradient: "from-red-100 to-rose-200",
    border: "border-red-300",
  },
};

const REPORT_SCROLL_TOP_GAP = 12;

const PresentationDetailPage: React.FC = () => {
  const { presentationId } = useParams<{ presentationId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const {
    currentPresentationDetail: presentation,
    detailLoading,
    error,
  } = useAppSelector((state) => state.presentation);
  const {
    currentReport,
    loading: reportLoading,
    error: reportError,
    criterionFeedbacks,
  } = useAppSelector((state) => state.report);
  const { myGroupForClass: group } = useAppSelector((state) => state.group);
  const { user } = useAppSelector((state) => state.auth);

  const [showReport, setShowReport] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [reportTab, setReportTab] = useState<"ai" | "instructor">("ai");
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadResubmit, setUploadResubmit] = useState(false);
  const reportSectionRef = useRef<HTMLDivElement | null>(null);
  const [gradeDistributionModalOpen, setGradeDistributionModalOpen] = useState(false);
  const [groupDetail, setGroupDetail] = useState<{
    groupId?: number | string;
    students?: GroupStudent[];
    myRole?: string | null;
  } | null>(null);

  const presentationIdNumber = presentationId ? parseInt(presentationId) : null;

  useEffect(() => {
    if (presentationIdNumber)
      dispatch(fetchPresentationDetail(presentationIdNumber));
  }, [presentationIdNumber, dispatch]);

  useEffect(() => {
    dispatch(clearCurrentReport());
    setShowReport(false);
  }, [presentationIdNumber, dispatch]);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  useEffect(() => {
    if (reportError) toast.error(reportError);
  }, [reportError]);

  // Fetch instructor feedbacks when report is shown
  useEffect(() => {
    if (showReport && currentReport?.reportId) {
      dispatch(fetchCriterionFeedbacks(currentReport.reportId));
    }
  }, [showReport, currentReport?.reportId, dispatch]);

  // Fetch group info khi có classId để biết leader/students
  useEffect(() => {
    if (presentation?.classId) {
      void dispatch(fetchMyGroupByClass(presentation.classId));
    }
  }, [presentation?.classId, dispatch]);

  // Handler mở modal chia điểm cho leader
  const handleOpenGradeDistribution = async () => {
    if (!presentation?.classId || !currentReport?.reportId) return;
    try {
      const groupId = Number(group?.groupId);
      if (!groupId) return;
      const result = await dispatch(fetchGroupDetail(groupId)).unwrap();
      if (result) {
        setGroupDetail({
          groupId: result.groupId ?? result.id,
          students: result.students,
          myRole: result.myRole,
        });
      } else {
        // fallback: dùng myGroupForClass
        if (group?.groupId) {
          setGroupDetail({
            groupId: group.groupId,
            students: group.students,
            myRole: group.myRole,
          });
        }
      }
      setGradeDistributionModalOpen(true);
    } catch {
      // fallback: dùng myGroupForClass khi API lỗi
      if (group?.groupId) {
        setGroupDetail({
          groupId: group.groupId,
          students: group.students,
          myRole: group.myRole,
        });
      }
      setGradeDistributionModalOpen(true);
    }
  };

  // Kiểm tra user hiện tại có phải là leader không
  const isCurrentUserLeader = group?.myRole === "leader";

  const syncedFeedbacks = useMemo(() => {
    if (currentReport?.criterionFeedbacks && currentReport.criterionFeedbacks.length > 0) {
      return currentReport.criterionFeedbacks;
    }
    return criterionFeedbacks;
  }, [currentReport?.criterionFeedbacks, criterionFeedbacks]);

  const criteriaScores = useMemo(() => {
    if (!currentReport?.criterionScores) return [];

    return Object.values(currentReport.criterionScores).sort(
      (a, b) => a.criteriaId - b.criteriaId,
    );
  }, [currentReport]);

  const aiOverallOutOf10 = useMemo(() => {
    const raw = Number(currentReport?.overallScore);
    if (!Number.isFinite(raw)) return null;
    return (raw * 10).toFixed(1);
  }, [currentReport?.overallScore]);

  const scrollToReportSection = () => {
    window.requestAnimationFrame(() => {
      if (!reportSectionRef.current) return;

      const stickyHeader = document.querySelector("header.sticky") as HTMLElement | null;
      const stickyHeaderHeight = stickyHeader?.offsetHeight || 0;

      const targetTop =
        window.scrollY +
        reportSectionRef.current.getBoundingClientRect().top +
        -stickyHeaderHeight -
        REPORT_SCROLL_TOP_GAP;

      window.scrollTo({
        top: targetTop,
        behavior: "smooth",
      });
    });
  };

  useEffect(() => {
    if (showReport) {
      scrollToReportSection();
    }
  }, [showReport]);

  useEffect(() => {
    if (showReport && !reportLoading) {
      scrollToReportSection();
    }
  }, [showReport, reportLoading, currentReport]);

  if (detailLoading) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-500">Đang tải bài thuyết trình...</p>
          </div>
        </div>
      </StudentLayout>
    );
  }

  if (error || !presentation) {
    return (
      <StudentLayout>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mb-6"
          >
            <ArrowLeft className="w-5 h-5" /> Quay lại
          </button>
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
            <p className="text-red-700 font-medium">
              {error || "Không tìm thấy bài thuyết trình"}
            </p>
          </div>
        </div>
      </StudentLayout>
    );
  }

  const studentName = presentation.student
    ? `${presentation.student.firstName || ""} ${presentation.student.lastName || ""}`.trim() ||
    "Student"
    : "Unknown";

  const sc =
    statusConfig[presentation.status?.toLowerCase()] || statusConfig.draft;

  const handleViewReport = () => {
    if (!presentationIdNumber) return;
    if (showReport) {
      scrollToReportSection();
    }
    setShowReport(true);
    dispatch(fetchPresentationReport(presentationIdNumber));
  };

  const statCards = [
    {
      icon: User,
      label: "Người thuyết trình",
      value: studentName,
      gradient: "from-blue-50 to-indigo-50",
      iconColor: "text-blue-600",
      iconBg: "bg-blue-100",
    },
    {
      icon: BookOpen,
      label: "Chủ đề",
      value: presentation.topic?.topicName || "N/A",
      gradient: "from-emerald-50 to-teal-50",
      iconColor: "text-emerald-600",
      iconBg: "bg-emerald-100",
    },
    {
      icon: Clock,
      label: "Thời lượng",
      value: presentation.durationSeconds
        ? `${Math.floor(presentation.durationSeconds / 60)}m ${presentation.durationSeconds % 60}s`
        : "Chưa có",
      gradient: "from-amber-50 to-orange-50",
      iconColor: "text-amber-600",
      iconBg: "bg-amber-100",
    },
    {
      icon: Calendar,
      label: "Trạng thái",
      value: sc.label,
      gradient: `bg-gradient-to-br ${sc.gradient}`,
      iconColor: "text-slate-600",
      iconBg: "bg-white",
    },
  ];

  return (
    <StudentLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-medium transition text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại
          </button>
          <div className="flex items-center gap-2">
            <Button
              icon={<Link2 className="w-4 h-4" />}
              onClick={() => setShareModalOpen(true)}
            >
              Chia sẻ
            </Button>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border font-semibold bg-gradient-to-r ${sc.gradient} ${sc.border}`}
            >
              <FileText className="w-3.5 h-3.5" /> {sc.label}
            </span>
          </div>
        </div>

        {/* Page title */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            {presentation.title}
          </h1>
          {presentation.description && (
            <p className="text-slate-500 mt-1">{presentation.description}</p>
          )}
        </motion.div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map(
            ({ icon: Icon, label, value, gradient, iconColor, iconBg }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className={`bg-gradient-to-br ${gradient} rounded-2xl border border-slate-200 shadow-sm p-5 flex items-center gap-4`}
              >
                <div
                  className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}
                >
                  <Icon className={`w-5 h-5 ${iconColor}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-0.5">
                    {label}
                  </p>
                  <p className="font-bold text-slate-900 truncate">{value}</p>
                </div>
              </motion.div>
            ),
          )}
        </div>

        {/* Presentation Player */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <PresentationPlayer
            slides={presentation.slides || []}
            audioRecord={presentation.audioRecord || null}
            title={presentation.title}
            description={presentation.description}
            status={presentation.status}
            studentName={studentName}
            createdAt={presentation.createdAt}
            onResultClick={handleViewReport}
            resultLoading={reportLoading}
          />
        </motion.div>

        {/* Progress Tracker — hiển thị khi đang xử lý */}
        {(presentation.status === "submitted" || presentation.status === "processing") && presentationIdNumber && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <PresentationProgressTracker
              presentationId={presentationIdNumber}
              onCompleted={() => {
                dispatch(fetchPresentationDetail(presentationIdNumber));
              }}
            />
          </motion.div>
        )}

        {/* Retry button when presentation failed — hiển thị ngoài report section */}
        {presentation.status === "failed" && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between gap-3 bg-red-50 border border-red-200 rounded-xl px-5 py-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-red-700">Xử lý AI thất bại</p>
                <p className="text-xs text-red-600">
                  Bài thuyết trình không thể được phân tích. Bạn có thể gửi lại để thử lại.
                </p>
              </div>
            </div>
            <Button
              type="primary"
              danger
              icon={<RefreshCw className="w-4 h-4" />}
              onClick={() => {
                setUploadResubmit(true);
                setUploadModalOpen(true);
              }}
            >
              Gửi lại
            </Button>
          </motion.div>
        )}

        {showReport && (
          <motion.div
            ref={reportSectionRef}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4"
          >
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                Kết quả đánh giá
              </h2>
              {currentReport?.generatedAt && (
                <span className="text-sm text-slate-500">
                  {new Date(currentReport.generatedAt).toLocaleString("vi-VN")}
                </span>
              )}
            </div>

            {/* Retry button when report is rejected */}
            {currentReport?.reportStatus === "rejected" && (
              <div className="flex items-center justify-between gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-red-700">Báo cáo AI bị từ chối</p>
                    <p className="text-xs text-red-600">
                      Bạn có thể gửi lại bài thuyết trình để được đánh giá lại.
                    </p>
                  </div>
                </div>
                <Button
                  type="primary"
                  danger
                  icon={<RefreshCw className="w-4 h-4" />}
                  onClick={() => {
                    setUploadResubmit(true);
                    setUploadModalOpen(true);
                  }}
                >
                  Gửi lại
                </Button>
              </div>
            )}

            {/* Tabs: AI vs Giảng viên */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-fit">
              <button
                type="button"
                onClick={() => setReportTab("ai")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${reportTab === "ai"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                  }`}
              >
                <Cpu className="w-4 h-4" />
                AI Đánh giá
              </button>
              <button
                type="button"
                onClick={() => setReportTab("instructor")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${reportTab === "instructor"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                  }`}
              >
                <MessageSquare className="w-4 h-4" />
                Phản hồi GV
                {syncedFeedbacks.length > 0 && (
                  <span className="bg-emerald-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {syncedFeedbacks.length}
                  </span>
                )}
              </button>
            </div>

            {reportLoading ? (
              <div className="flex items-center justify-center py-10 text-slate-500">
                <div className="w-6 h-6 border-2 border-sky-200 border-t-sky-600 rounded-full animate-spin mr-3" />
                Đang tải kết quả...
              </div>
            ) : currentReport ? (
              <>
                {/* ── Tab AI ── */}
                {reportTab === "ai" && (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-sky-100 bg-gradient-to-r from-sky-50 to-blue-50 p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-slate-600">Điểm tổng (AI)</p>
                          <p className="text-3xl font-bold text-sky-700">
                            {aiOverallOutOf10 !== null ? (
                              <>
                                {aiOverallOutOf10}
                                <span className="text-2xl font-semibold text-sky-600">
                                  {" "}
                                  / 10
                                </span>
                              </>
                            ) : (
                              "—"
                            )}
                          </p>
                        </div>
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-sky-100 to-blue-100 flex items-center justify-center">
                          <Cpu className="w-8 h-8 text-sky-600" />
                        </div>
                      </div>
                    </div>

                    {/* Điểm GV đã confirm - hiện nút chia điểm cho leader */}
                    {currentReport?.reportStatus === "confirmed" &&
                      currentReport.gradeForInstructor !== null &&
                      isCurrentUserLeader && (
                        <div className="rounded-xl border-2 border-amber-200 bg-amber-50 p-4 flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-amber-800">
                              Điểm GV: <span className="text-amber-900">{currentReport.gradeForInstructor}/10</span>
                            </p>
                            <p className="text-xs text-amber-600">
                              Là trưởng nhóm — bạn có thể phân chia điểm cho từng thành viên
                            </p>
                          </div>
                          <Button
                            type="primary"
                            icon={<TrophyOutlined className="w-4 h-4" />}
                            style={{ background: "#d97706", borderColor: "#d97706" }}
                            onClick={handleOpenGradeDistribution}
                          >
                            Chia điểm
                          </Button>
                        </div>
                      )}

                    <div className="space-y-3">
                      {criteriaScores.map((criterion) => {
                        const hasInstructorFeedback = syncedFeedbacks.some(
                          (fb) => fb.classRubricCriteriaId === criterion.criteriaId,
                        );
                        return (
                          <div
                            key={criterion.criteriaId}
                            className="rounded-xl border border-slate-200 p-4 hover:border-sky-200 transition-colors"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-slate-900">
                                  {criterion.criteriaName}
                                </h3>
                                {hasInstructorFeedback && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-xs font-medium border border-emerald-200">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Có phản hồi GV
                                  </span>
                                )}
                              </div>
                              <span className="text-sm font-bold text-sky-700">
                                {criterion.score}/{criterion.maxScore}
                                <span className="text-slate-400 font-normal"> ({(criterion.score / criterion.maxScore * 100).toFixed(0)}%)</span>
                              </span>
                            </div>
                            <p className="text-sm text-slate-600 mb-3">
                              {criterion.comment}
                            </p>
                            {criterion.suggestions?.length > 0 && (
                              <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
                                <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-2">Đề xuất cải thiện</p>
                                <ul className="space-y-1">
                                  {criterion.suggestions.map((suggestion, index) => (
                                    <li key={`${criterion.criteriaId}-${index}`} className="flex items-start gap-2 text-sm text-slate-700">
                                      <span className="text-amber-500 mt-0.5">•</span>
                                      {suggestion}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── Tab Feedback Giảng viên ── */}
                {reportTab === "instructor" && (
                  <div className="space-y-4">
                    {syncedFeedbacks.length === 0 ? (
                      <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-gradient-to-b from-slate-50 to-slate-100 p-10 text-center">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center mx-auto mb-4">
                          <MessageSquare className="w-10 h-10 text-slate-400" />
                        </div>
                        <h4 className="text-lg font-bold text-slate-700 mb-2">
                          Chưa có phản hồi từ giảng viên
                        </h4>
                        <p className="text-sm text-slate-500 max-w-md mx-auto">
                          Giảng viên sẽ gửi phản hồi chi tiết cho từng tiêu chí đánh giá sau khi xem xét bài thuyết trình của bạn.
                        </p>
                      </div>
                    ) : (
                      <>
                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-3">
                          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-100">
                            <div className="flex items-center gap-2 mb-1">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              <span className="text-xs font-medium text-emerald-600 uppercase tracking-wide">Đã feedback</span>
                            </div>
                            <p className="text-2xl font-bold text-emerald-700">{syncedFeedbacks.length}</p>
                            <p className="text-xs text-emerald-500">/ {criteriaScores.length} tiêu chí</p>
                          </div>
                          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100">
                            <div className="flex items-center gap-2 mb-1">
                              <Star className="w-4 h-4 text-indigo-600" />
                              <span className="text-xs font-medium text-indigo-600 uppercase tracking-wide">Điểm TB</span>
                            </div>
                            <p className="text-2xl font-bold text-indigo-700">
                              {(
                                syncedFeedbacks.reduce((sum, f) => sum + (Number(f.score) || 0), 0) /
                                Math.max(syncedFeedbacks.filter((f) => f.score !== null && f.score !== "").length, 1)
                              ).toFixed(1)}
                            </p>
                            <p className="text-xs text-indigo-500">trên 100</p>
                          </div>
                          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-100">
                            <div className="flex items-center gap-2 mb-1">
                              <Award className="w-4 h-4 text-amber-600" />
                              <span className="text-xs font-medium text-amber-600 uppercase tracking-wide">Chưa feedback</span>
                            </div>
                            <p className="text-2xl font-bold text-amber-700">
                              {criteriaScores.length - syncedFeedbacks.length}
                            </p>
                            <p className="text-xs text-amber-500">tiêu chí</p>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                              style={{
                                width: `${(syncedFeedbacks.length / Math.max(criteriaScores.length, 1)) * 100}%`,
                              }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-slate-500">
                            {syncedFeedbacks.length}/{criteriaScores.length} tiêu chí
                          </span>
                        </div>

                        {/* Feedback Cards */}
                        <div className="space-y-3">
                          {[...syncedFeedbacks]
                            .sort((a, b) => a.criterionFeedbackId - b.criterionFeedbackId)
                            .map((fb) => {
                              const criteriaLabel =
                                fb.classRubricCriteria?.criteriaName ||
                                criteriaScores.find(
                                  (c) => c.criteriaId === fb.classRubricCriteriaId,
                                )?.criteriaName ||
                                `Tiêu chí #${fb.classRubricCriteriaId}`;
                              const instructorLabel = fb.instructor
                                ? `${fb.instructor.firstName || ""} ${fb.instructor.lastName || ""}`.trim() ||
                                fb.instructor.email ||
                                "Giảng viên"
                                : "Giảng viên";
                              const aiCriterion = criteriaScores.find(
                                (c) => c.criteriaId === fb.classRubricCriteriaId,
                              );
                              const hasAiData = !!aiCriterion;
                              const scoreDiff = aiCriterion && fb.score !== null && fb.score !== ""
                                ? (Number(fb.score) - (aiCriterion.score / aiCriterion.maxScore) * 100).toFixed(1)
                                : null;

                              return (
                                <motion.div
                                  key={fb.criterionFeedbackId}
                                  initial={{ opacity: 0, y: 8 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50/80 via-white to-teal-50/80 p-5 shadow-sm hover:shadow-md transition-shadow"
                                >
                                  {/* Header */}
                                  <div className="flex items-start justify-between gap-3 mb-3">
                                    <div className="flex items-center gap-3">
                                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                                        {criteriaLabel.charAt(0).toUpperCase()}
                                      </div>
                                      <div>
                                        <h4 className="font-bold text-slate-900 text-lg">{criteriaLabel}</h4>
                                        <div className="flex items-center gap-2 mt-0.5">
                                          <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                                            <User className="w-3 h-3 text-emerald-600" />
                                          </div>
                                          <p className="text-sm text-slate-500">
                                            {instructorLabel}
                                            {fb.updatedAt && (
                                              <> · {new Date(fb.updatedAt).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}</>
                                            )}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                    {fb.score !== null && fb.score !== "" && (
                                      <div className="text-right">
                                        <div className="flex items-center gap-1 justify-end">
                                          <Star className="w-5 h-5 text-amber-500" />
                                          <span className="text-2xl font-bold text-emerald-700">
                                            {Number(fb.score).toFixed(1)}
                                          </span>
                                        </div>
                                        <p className="text-xs text-slate-400">/ 100 điểm</p>
                                      </div>
                                    )}
                                  </div>

                                  {/* Comment */}
                                  {fb.comment ? (
                                    <div className="bg-white rounded-xl p-4 border border-emerald-100 mb-3 shadow-sm">
                                      <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                                        {fb.comment}
                                      </p>
                                    </div>
                                  ) : (
                                    <div className="bg-slate-50 rounded-xl p-4 border border-dashed border-slate-200 mb-3 text-center">
                                      <p className="text-sm text-slate-400 italic">Chưa có nhận xét</p>
                                    </div>
                                  )}

                                  {/* AI comparison */}
                                  {hasAiData && (
                                    <div className="bg-gradient-to-r from-slate-50 to-sky-50 rounded-xl p-4 border border-slate-200">
                                      <div className="flex items-center gap-2 mb-3">
                                        <Cpu className="w-4 h-4 text-sky-600" />
                                        <span className="text-xs font-bold text-sky-600 uppercase tracking-wide">So sánh với đánh giá AI</span>
                                      </div>
                                      <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-white rounded-lg p-3 border border-sky-100">
                                          <p className="text-xs text-slate-500 mb-1">Điểm AI</p>
                                          <div className="flex items-center gap-1">
                                            <Cpu className="w-3 h-3 text-sky-500" />
                                            <span className="font-bold text-sky-700">
                                              {aiCriterion.score}/{aiCriterion.maxScore}
                                            </span>
                                            <span className="text-xs text-slate-400">
                                              ({(aiCriterion.score / aiCriterion.maxScore * 100).toFixed(0)}%)
                                            </span>
                                          </div>
                                        </div>
                                        {scoreDiff !== null && (
                                          <div className="bg-white rounded-lg p-3 border border-sky-100">
                                            <p className="text-xs text-slate-500 mb-1">Chênh lệch</p>
                                            <div className="flex items-center gap-1">
                                              {Number(scoreDiff) >= 0 ? (
                                                <span className="text-emerald-500">▲</span>
                                              ) : (
                                                <span className="text-red-500">▼</span>
                                              )}
                                              <span className={`font-bold ${Number(scoreDiff) >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                                                {Number(scoreDiff) >= 0 ? "+" : ""}{scoreDiff}%
                                              </span>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                      {aiCriterion.comment && (
                                        <div className="mt-2 pt-2 border-t border-slate-200">
                                          <p className="text-xs text-slate-500 line-clamp-2">
                                            <span className="font-semibold">Nhận xét AI: </span>{aiCriterion.comment}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </motion.div>
                              );
                            })}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-slate-600">
                Chưa có kết quả đánh giá cho bài thuyết trình này.
              </div>
            )}
          </motion.div>
        )}
      </div>

      {presentationIdNumber && (
        <PresentationUploadModal
          isOpen={uploadModalOpen}
          onClose={() => {
            setUploadModalOpen(false);
            if (presentationIdNumber) {
              dispatch(fetchPresentationDetail(presentationIdNumber));
              dispatch(clearCurrentReport());
              setShowReport(false);
            }
          }}
          presentationId={presentationIdNumber}
          presentationTitle={presentation?.title || ""}
          isResubmit={uploadResubmit}
        />
      )}

      {presentationIdNumber && (
        <ShareModal
          open={shareModalOpen}
          presentationId={presentationIdNumber}
          onClose={() => setShareModalOpen(false)}
        />
      )}

      {/* Modal phân chia điểm cho nhóm (Leader) */}
      <GradeDistributionModal
        isOpen={gradeDistributionModalOpen}
        onClose={() => setGradeDistributionModalOpen(false)}
        reportId={currentReport?.reportId ?? 0}
        instructorGrade={currentReport?.gradeForInstructor ?? 0}
        groupMembers={groupDetail?.students ?? group?.students ?? []}
        leaderId={(() => {
          const students = groupDetail?.students ?? group?.students ?? [];
          const leader = students.find((s) => s.GroupStudent?.role === "leader");
          return Number(leader?.userId ?? leader?.id ?? 0);
        })()}
        currentUserId={user?.userId}
        onSuccess={() => {
          if (presentationIdNumber) {
            void dispatch(fetchPresentationReport(presentationIdNumber));
          }
          setGradeDistributionModalOpen(false);
        }}
      />
    </StudentLayout>
  );
};

export default PresentationDetailPage;
