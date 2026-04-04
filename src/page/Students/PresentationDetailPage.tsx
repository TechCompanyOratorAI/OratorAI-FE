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
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/services/store/store";
import { fetchPresentationDetail } from "@/services/features/presentation/presentationSlice";
import {
  clearCurrentReport,
  fetchPresentationReport,
} from "@/services/features/report/reportSlice";
import PresentationPlayer from "@/components/Presentation/PresentationPlayer";
import PresentationProgressTracker from "@/components/Presentation/PresentationProgressTracker";
import ShareModal from "@/components/Share/ShareModal";
import StudentLayout from "@/components/StudentLayout/StudentLayout";

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
  } = useAppSelector((state) => state.report);

  const [showReport, setShowReport] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const reportSectionRef = useRef<HTMLDivElement | null>(null);

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

  const criteriaScores = useMemo(() => {
    if (!currentReport?.criterionScores) return [];

    return Object.values(currentReport.criterionScores).sort(
      (a, b) => a.criteriaId - b.criteriaId,
    );
  }, [currentReport]);

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
            <button
              onClick={() => setShareModalOpen(true)}
              className="flex items-center gap-1.5 text-sm text-sky-600 hover:text-sky-700 font-medium transition border border-sky-200 hover:border-sky-300 bg-sky-50 hover:bg-sky-100 px-3 py-1.5 rounded-lg"
            >
              <Link2 className="w-4 h-4" />
              Chia sẻ
            </button>
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

        {showReport && (
          <motion.div
            ref={reportSectionRef}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4"
          >
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                Kết quả đánh giá AI
              </h2>
              {currentReport?.generatedAt && (
                <span className="text-sm text-slate-500">
                  {new Date(currentReport.generatedAt).toLocaleString("vi-VN")}
                </span>
              )}
            </div>

            {reportLoading ? (
              <div className="flex items-center justify-center py-10 text-slate-500">
                <div className="w-6 h-6 border-2 border-sky-200 border-t-sky-600 rounded-full animate-spin mr-3" />
                Đang tải kết quả...
              </div>
            ) : currentReport ? (
              <>
                <div className="rounded-xl border border-sky-100 bg-sky-50 p-4">
                  <p className="text-sm text-slate-600">Điểm tổng</p>
                  <p className="text-2xl font-bold text-sky-700">
                    {`${(Number(currentReport.overallScore) * 100).toFixed(0)}%`}
                  </p>
                </div>

                <div className="space-y-3">
                  {criteriaScores.map((criterion) => (
                    <div
                      key={criterion.criteriaId}
                      className="rounded-xl border border-slate-200 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <h3 className="font-semibold text-slate-900">
                          {criterion.criteriaName}
                        </h3>
                        <span className="text-sm font-semibold text-sky-700">
                          {criterion.score}/{criterion.maxScore} (w:{" "}
                          {criterion.weight}%)
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 mb-3">
                        {criterion.comment}
                      </p>
                      {criterion.suggestions?.length > 0 && (
                        <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
                          {criterion.suggestions.map((suggestion, index) => (
                            <li key={`${criterion.criteriaId}-${index}`}>
                              {suggestion}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
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
        <ShareModal
          open={shareModalOpen}
          presentationId={presentationIdNumber}
          onClose={() => setShareModalOpen(false)}
        />
      )}
    </StudentLayout>
  );
};

export default PresentationDetailPage;
