import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { ArrowLeft, Clock, Calendar, User, BookOpen } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/services/store/store";
import { fetchPresentationDetail } from "@/services/features/presentation/presentationSlice";
import {
  clearCurrentReport,
  confirmPresentationReport,
  fetchPresentationReport,
} from "@/services/features/report/reportSlice";
import PresentationPlayer from "@/components/Presentation/PresentationPlayer";
import SidebarInstructor from "@/components/Sidebar/SidebarInstructor/SidebarInstructor";

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

const IntructorPresentationDetailPage: React.FC = () => {
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
    confirmLoading,
    error: reportError,
  } = useAppSelector((state) => state.report);

  const [showReport, setShowReport] = useState(false);
  const reportSectionRef = useRef<HTMLDivElement | null>(null);

  const presentationIdNumber = presentationId
    ? parseInt(presentationId, 10)
    : null;
  const isValidPresentationId =
    Number.isInteger(presentationIdNumber) && (presentationIdNumber || 0) > 0;
  const hasMatchingPresentation =
    !!presentation &&
    !!presentationIdNumber &&
    presentation.presentationId === presentationIdNumber;

  useEffect(() => {
    if (isValidPresentationId && presentationIdNumber)
      dispatch(fetchPresentationDetail(presentationIdNumber));
  }, [isValidPresentationId, presentationIdNumber, dispatch]);

  useEffect(() => {
    dispatch(clearCurrentReport());
    setShowReport(false);
  }, [presentationIdNumber, dispatch]);

  useEffect(() => {
    if (isValidPresentationId && error) toast.error(error);
  }, [isValidPresentationId, error]);

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

      const stickyHeader = document.querySelector(
        "header.sticky",
      ) as HTMLElement | null;
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

  if (
    isValidPresentationId &&
    (detailLoading || !hasMatchingPresentation) &&
    !error
  ) {
    return (
      <div className="flex h-screen bg-gray-50">
        <SidebarInstructor activeItem="manage-classes" />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-500">Đang tải bài thuyết trình...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!isValidPresentationId || error || !hasMatchingPresentation) {
    return (
      <div className="flex h-screen bg-gray-50">
        <SidebarInstructor activeItem="manage-classes" />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mb-6"
            >
              <ArrowLeft className="w-5 h-5" /> Quay lại
            </button>
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
              <p className="text-red-700 font-medium">
                {!isValidPresentationId
                  ? "ID bài thuyết trình không hợp lệ"
                  : error || "Không tìm thấy bài thuyết trình"}
              </p>
            </div>
          </div>
        </main>
      </div>
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

  const handleConfirmReport = async () => {
    if (!currentReport?.reportId || !presentationIdNumber) return;

    const confirmed = window.confirm(
      "Bạn có chắc chắn muốn xác nhận AI report này không?",
    );
    if (!confirmed) return;

    try {
      await dispatch(
        confirmPresentationReport(currentReport.reportId),
      ).unwrap();
      await dispatch(fetchPresentationReport(presentationIdNumber)).unwrap();
      toast.success("Đã xác nhận AI report");
    } catch (error: any) {
      toast.error(
        typeof error === "string"
          ? error
          : error?.message || "Không thể xác nhận AI report",
      );
    }
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
    <div className="flex min-h-screen bg-gray-50">
      <SidebarInstructor activeItem="manage-classes" />
      <main className="flex-1 overflow-y-auto lg:ml-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            <ArrowLeft className="w-5 h-5" /> Quay lại
          </button>

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

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map(
              (
                { icon: Icon, label, value, gradient, iconColor, iconBg },
                i,
              ) => (
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
                <div className="flex items-center gap-3">
                  {currentReport && !currentReport.confirmedAt && (
                    <button
                      type="button"
                      onClick={handleConfirmReport}
                      disabled={confirmLoading}
                      className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {confirmLoading ? "Đang xác nhận..." : "Confirm"}
                    </button>
                  )}
                  {currentReport?.confirmedAt && (
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-100 text-emerald-700">
                      Đã xác nhận
                    </span>
                  )}
                  {currentReport?.generatedAt && (
                    <span className="text-sm text-slate-500">
                      {new Date(currentReport.generatedAt).toLocaleString(
                        "vi-VN",
                      )}
                    </span>
                  )}
                </div>
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
      </main>
    </div>
  );
};

export default IntructorPresentationDetailPage;
