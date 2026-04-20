import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  Clock,
  Calendar,
  User,
  BookOpen,
  XCircle,
  Cpu,
  Star,
} from "lucide-react";
import {
  ThunderboltOutlined,
  CommentOutlined,
  BarChartOutlined,
} from "@ant-design/icons";
import { useAppDispatch, useAppSelector } from "@/services/store/store";
import { fetchPresentationDetail } from "@/services/features/presentation/presentationSlice";
import {
  clearCurrentReport,
  fetchPresentationReport,
  fetchCriterionFeedbacks,
} from "@/services/features/report/reportSlice";
import {
  Button,
  Tabs,
  Card,
  Statistic,
  Tag,
  Typography,
  Empty,
  Space,
  Row,
  Col,
  Divider,
} from "antd";
import PresentationPlayer from "@/components/Presentation/PresentationPlayer";
import SidebarInstructor from "@/components/Sidebar/SidebarInstructor/SidebarInstructor";
import CriterionFeedbackRubricForm from "@/components/CriterionFeedback/CriterionFeedbackRubricForm";
import ConfirmReportModal from "@/components/Report/ConfirmReportModal";
import RejectReportModal from "@/components/Report/RejectReportModal";
import { useSocket } from "@/hooks/useSocket";

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
    rejectLoading,
    criterionFeedbacks,
    error: reportError,
  } = useAppSelector((state) => state.report);

  const [showReport, setShowReport] = useState(false);
  const [reportTab, setReportTab] = useState<"ai" | "instructor">("ai");
  const [reportDecisionModal, setReportDecisionModal] = useState<
    null | "confirm" | "reject"
  >(null);
  const reportSectionRef = useRef<HTMLDivElement | null>(null);
  const currentReportRef = useRef(currentReport);
  currentReportRef.current = currentReport;

  const presentationIdNumber = presentationId
    ? parseInt(presentationId, 10)
    : null;
  const isValidPresentationId =
    Number.isInteger(presentationIdNumber) && (presentationIdNumber || 0) > 0;
  const hasMatchingPresentation =
    !!presentation &&
    !!presentationIdNumber &&
    presentation.presentationId === presentationIdNumber;
  const { on, socket } = useSocket();

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

  // Auto-fetch report on mount so the floating button can appear
  useEffect(() => {
    if (isValidPresentationId && presentationIdNumber) {
      dispatch(fetchPresentationReport(presentationIdNumber));
    }
  }, [isValidPresentationId, presentationIdNumber, dispatch]);

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

  useEffect(() => {
    if (reportError) toast.error(reportError);
  }, [reportError]);

  useEffect(() => {
    if (showReport && currentReport?.reportId) {
      dispatch(fetchCriterionFeedbacks(currentReport.reportId));
    }
  }, [showReport, currentReport?.reportId, dispatch]);

  useEffect(() => {
    if (!presentationIdNumber) return;
    socket.joinPresentation(presentationIdNumber);
  }, [presentationIdNumber, socket]);

  useEffect(() => {
    if (!presentationIdNumber) return;

    const unwatchReportGenerated = on<{
      presentationId: number;
      reportId: number;
      message?: string;
    }>("report:generated", (payload) => {
      if (payload.presentationId === presentationIdNumber) {
        void dispatch(fetchPresentationReport(presentationIdNumber));
        setShowReport(true);
        setReportTab("ai");
        toast.info(payload.message || "Báo cáo AI đã sẵn sàng.");
      }
    });

    const unwatchCriterionFeedbackChanged = on<{
      presentationId: number;
      reportId: number;
    }>("report:criterion-feedback-changed", (payload) => {
      if (payload.presentationId === presentationIdNumber) {
        void dispatch(fetchPresentationReport(presentationIdNumber));
        if (currentReportRef.current?.reportId) {
          void dispatch(
            fetchCriterionFeedbacks(currentReportRef.current.reportId),
          );
        }
      }
    });

    return () => {
      unwatchReportGenerated?.();
      unwatchCriterionFeedbackChanged?.();
    };
  }, [presentationIdNumber, on, socket, dispatch]);

  // Sync criterionFeedbacks from currentReport when it arrives
  const syncedFeedbacks = useMemo(() => {
    if (
      currentReport?.criterionFeedbacks &&
      currentReport.criterionFeedbacks.length > 0
    ) {
      return currentReport.criterionFeedbacks;
    }
    return criterionFeedbacks;
  }, [currentReport?.criterionFeedbacks, criterionFeedbacks]);

  /** Điểm TB tự động từ feedback GV (thang 10) */
  const instructorAvgGrade = useMemo(() => {
    const validFeedbacks = syncedFeedbacks.filter(
      (f) => f.score !== null && f.score !== "",
    );
    if (validFeedbacks.length === 0) return null;
    const sum = validFeedbacks.reduce((s, f) => s + (Number(f.score) || 0), 0);
    return (sum / validFeedbacks.length / 10).toFixed(1);
  }, [syncedFeedbacks]);

  /** Đủ feedback GV cho mọi tiêu chí AI → mới cho phép Xác nhận / Từ chối báo cáo */
  const instructorFeedbackComplete = useMemo(() => {
    if (criteriaScores.length === 0) return false;
    return criteriaScores.every((c) =>
      syncedFeedbacks.some((f) => f.classRubricCriteriaId === c.criteriaId),
    );
  }, [criteriaScores, syncedFeedbacks]);

  /** Điểm tổng AI: overallScore (0–1) → thang 10 (ví dụ 0.66 → 6.6/10) */
  const aiOverallOutOf10 = useMemo(() => {
    const raw = Number(currentReport?.overallScore);
    if (!Number.isFinite(raw)) return null;
    return (raw * 10).toFixed(1);
  }, [currentReport?.overallScore]);

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
                <div className="flex items-center gap-3">
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                    Kết quả đánh giá AI
                  </h2>
                  {currentReport && (
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        currentReport.reportStatus === "confirmed"
                          ? "bg-emerald-100 text-emerald-700"
                          : currentReport.reportStatus === "rejected"
                            ? "bg-red-100 text-red-700"
                            : currentReport.reportStatus === "pending_review"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {currentReport.reportStatus === "confirmed"
                        ? "Đã xác nhận"
                        : currentReport.reportStatus === "rejected"
                          ? "Đã từ chối"
                          : currentReport.reportStatus === "pending_review"
                            ? "Chờ duyệt"
                            : currentReport.reportStatus}
                    </span>
                  )}
                  {currentReport?.reportStatus === "confirmed" &&
                    currentReport.gradeForInstructor !== null && (
                      <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2">
                        <div>
                          <p className="text-xs text-emerald-600 font-medium">
                            Điểm cuối cùng (GV)
                          </p>
                          <p className="text-2xl font-bold text-emerald-700 leading-none">
                            {currentReport.gradeForInstructor}
                          </p>
                        </div>
                        {currentReport.feedbackOfInstructor && (
                          <div className="border-l border-emerald-200 pl-3 max-w-xs">
                            <p className="text-xs text-emerald-600 font-medium">
                              Nhận xét GV
                            </p>
                            <p className="text-xs text-slate-600 line-clamp-2">
                              {currentReport.feedbackOfInstructor}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3 w-full sm:w-auto">
                  {currentReport?.generatedAt && (
                    <span className="text-sm text-slate-500 hidden sm:inline mr-2">
                      {new Date(currentReport.generatedAt).toLocaleString(
                        "vi-VN",
                      )}
                    </span>
                  )}
                  {currentReport &&
                    currentReport.reportStatus === "confirmed" && (
                      <Button
                        danger
                        type="default"
                        icon={<XCircle className="w-4 h-4" />}
                        loading={rejectLoading}
                        onClick={() => setReportDecisionModal("reject")}
                      >
                        Từ chối
                      </Button>
                    )}
                  {currentReport &&
                    currentReport.reportStatus !== "confirmed" &&
                    currentReport.reportStatus !== "rejected" &&
                    instructorFeedbackComplete && (
                      <>
                        <Button
                          danger
                          type="default"
                          icon={<XCircle className="w-4 h-4" />}
                          loading={rejectLoading}
                          onClick={() => setReportDecisionModal("reject")}
                        >
                          Từ chối
                        </Button>
                        <Button
                          type="primary"
                          style={{
                            background: "#059669",
                            borderColor: "#059669",
                          }}
                          loading={confirmLoading}
                          onClick={() => setReportDecisionModal("confirm")}
                        >
                          Xác nhận
                        </Button>
                      </>
                    )}
                </div>
              </div>

              {currentReport &&
                currentReport.reportStatus !== "confirmed" &&
                currentReport.reportStatus !== "rejected" &&
                !instructorFeedbackComplete &&
                criteriaScores.length > 0 && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    <span className="font-semibold">Lưu ý: </span>
                    Vui lòng hoàn thành phản hồi giảng viên cho{" "}
                    <strong>
                      tất cả {criteriaScores.length} tiêu chí
                    </strong>{" "}
                    (tab &quot;Feedback giảng viên&quot;) trước khi có thể xác
                    nhận hoặc từ chối báo cáo AI.
                  </div>
                )}

              {reportLoading ? (
                <div className="flex items-center justify-center py-10 text-slate-500">
                  <div className="w-6 h-6 border-2 border-sky-200 border-t-sky-600 rounded-full animate-spin mr-3" />
                  Đang tải kết quả...
                </div>
              ) : currentReport ? (
                <>
                  <Tabs
                    activeKey={reportTab}
                    onChange={(k) => setReportTab(k as "ai" | "instructor")}
                    size="large"
                    type="line"
                    className="[&_.ant-tabs-nav]:mb-4"
                    items={[
                      {
                        key: "ai",
                        label: (
                          <Space size={6}>
                            <ThunderboltOutlined />
                            AI đánh giá
                          </Space>
                        ),
                        children: (
                          <Space
                            direction="vertical"
                            size="large"
                            className="w-full"
                          >
                            <div>
                              <Typography.Title level={5} className="!mb-0">
                                Đánh giá tự động
                              </Typography.Title>
                              <Typography.Text
                                type="secondary"
                                className="text-sm"
                              >
                                Mỗi tiêu chí đánh giá có form phản hồi riêng bên
                                dưới phần nhận xét AI — lưu từng tiêu chí độc
                                lập.
                              </Typography.Text>
                            </div>

                            <Card
                              size="small"
                              className="bg-sky-50/90 border-sky-100"
                            >
                              <Statistic
                                title="Điểm tổng (AI)"
                                value={aiOverallOutOf10 ?? "—"}
                                suffix={
                                  aiOverallOutOf10 !== null ? "/ 10" : undefined
                                }
                                valueStyle={{ color: "#0369a1", fontSize: 28 }}
                              />
                            </Card>

                            <Space
                              direction="vertical"
                              size="middle"
                              className="w-full"
                            >
                              {criteriaScores.map((criterion) => {
                                const existingFb =
                                  syncedFeedbacks.find(
                                    (f) =>
                                      f.classRubricCriteriaId ===
                                      criterion.criteriaId,
                                  ) ?? null;
                                return (
                                  <Card
                                    key={criterion.criteriaId}
                                    size="small"
                                    title={
                                      <Space wrap>
                                        <span>{criterion.criteriaName}</span>
                                      </Space>
                                    }
                                    extra={
                                      <Typography.Text
                                        strong
                                        className="text-sky-700"
                                      >
                                        {criterion.score}/{criterion.maxScore}{" "}
                                        <Typography.Text
                                          type="secondary"
                                          className="text-xs"
                                        >
                                          (w: {criterion.weight}%)
                                        </Typography.Text>
                                      </Typography.Text>
                                    }
                                  >
                                    <Typography.Paragraph className="!mb-2 text-slate-600">
                                      {criterion.comment}
                                    </Typography.Paragraph>
                                    {criterion.suggestions?.length > 0 && (
                                      <ul className="list-disc list-inside text-sm text-slate-700 space-y-1 pl-0">
                                        {criterion.suggestions.map(
                                          (suggestion, idx) => (
                                            <li
                                              key={`${criterion.criteriaId}-${idx}`}
                                            >
                                              {suggestion}
                                            </li>
                                          ),
                                        )}
                                      </ul>
                                    )}
                                    {currentReport && (
                                      <CriterionFeedbackRubricForm
                                        key={`${currentReport.reportId}-${criterion.criteriaId}`}
                                        reportId={currentReport.reportId}
                                        criterion={criterion}
                                        existingFeedback={existingFb}
                                        onFeedbackChanged={() => {
                                          if (presentationIdNumber) {
                                            void dispatch(
                                              fetchPresentationReport(
                                                presentationIdNumber,
                                              ),
                                            );
                                          }
                                        }}
                                      />
                                    )}
                                  </Card>
                                );
                              })}
                            </Space>
                          </Space>
                        ),
                      },
                      {
                        key: "instructor",
                        label: (
                          <Space size={6}>
                            <CommentOutlined />
                            Feedback giảng viên
                            {syncedFeedbacks.length > 0 ? (
                              <Tag color="processing">
                                {syncedFeedbacks.length}
                              </Tag>
                            ) : null}
                          </Space>
                        ),
                        children: (
                          <Space
                            direction="vertical"
                            size="large"
                            className="w-full"
                          >
                            {syncedFeedbacks.length === 0 ? (
                              <Empty
                                description={
                                  <span>
                                    Chưa có phản hồi giảng viên. Hãy mở tab{" "}
                                    <strong>AI đánh giá</strong> và điền form
                                    dưới mỗi tiêu chí rubric.
                                  </span>
                                }
                              />
                            ) : (
                              <>
                                <Card
                                  size="small"
                                  className="bg-sky-50/90 border-sky-100"
                                >
                                  <Statistic
                                    title="Điểm TB (GV)"
                                    value={(
                                      syncedFeedbacks.reduce(
                                        (sum, f) =>
                                          sum + (Number(f.score) || 0),
                                        0,
                                      ) /
                                      Math.max(
                                        syncedFeedbacks.filter(
                                          (f) =>
                                            f.score !== null && f.score !== "",
                                        ).length,
                                        1,
                                      ) /
                                      10
                                    ).toFixed(1)}
                                    suffix="/ 10"
                                    valueStyle={{
                                      color: "#0369a1",
                                      fontSize: 28,
                                    }}
                                  />
                                </Card>

                                <Space
                                  direction="vertical"
                                  size="middle"
                                  className="w-full"
                                >
                                  {[...syncedFeedbacks]
                                    .sort(
                                      (a, b) =>
                                        a.criterionFeedbackId -
                                        b.criterionFeedbackId,
                                    )
                                    .map((fb) => {
                                      const criteriaLabel =
                                        fb.classRubricCriteria?.criteriaName ||
                                        criteriaScores.find(
                                          (c) =>
                                            c.criteriaId ===
                                            fb.classRubricCriteriaId,
                                        )?.criteriaName ||
                                        `Tiêu chí #${fb.classRubricCriteriaId}`;
                                      const instructorLabel = fb.instructor
                                        ? `${fb.instructor.firstName || ""} ${fb.instructor.lastName || ""}`.trim() ||
                                          fb.instructor.email ||
                                          "Giảng viên"
                                        : "Giảng viên";
                                      const aiCriterion = criteriaScores.find(
                                        (c) =>
                                          c.criteriaId ===
                                          fb.classRubricCriteriaId,
                                      );
                                      const hasAiData = !!aiCriterion;

                                      return (
                                        <Card
                                          key={fb.criterionFeedbackId}
                                          size="small"
                                          className="border-indigo-100 bg-gradient-to-br from-indigo-50/40 to-white"
                                          title={
                                            <Space>
                                              <span className="font-semibold">
                                                {criteriaLabel}
                                              </span>
                                            </Space>
                                          }
                                          extra={
                                            fb.score !== null &&
                                            fb.score !== "" ? (
                                              <Space>
                                                <Star className="w-4 h-4 text-amber-500" />
                                                <Typography.Text
                                                  strong
                                                  className="text-lg text-indigo-700"
                                                >
                                                  {(
                                                    Number(fb.score) / 10
                                                  ).toFixed(1)}
                                                </Typography.Text>
                                                <Typography.Text type="secondary">
                                                  / 10
                                                </Typography.Text>
                                              </Space>
                                            ) : null
                                          }
                                        >
                                          <Typography.Text
                                            type="secondary"
                                            className="text-xs block mb-3"
                                          >
                                            <User className="inline w-3 h-3 mr-1" />
                                            {instructorLabel}
                                            {fb.updatedAt
                                              ? ` · ${new Date(
                                                  fb.updatedAt,
                                                ).toLocaleString("vi-VN", {
                                                  day: "2-digit",
                                                  month: "2-digit",
                                                  year: "numeric",
                                                  hour: "2-digit",
                                                  minute: "2-digit",
                                                })}`
                                              : ""}
                                          </Typography.Text>

                                          {fb.comment ? (
                                            <Typography.Paragraph className="!mb-3 whitespace-pre-wrap">
                                              {fb.comment}
                                            </Typography.Paragraph>
                                          ) : (
                                            <Typography.Text
                                              type="secondary"
                                              italic
                                            >
                                              Chưa có nhận xét
                                            </Typography.Text>
                                          )}

                                          {hasAiData && (
                                            <Card
                                              size="small"
                                              type="inner"
                                              className="bg-sky-50/80 border-sky-100"
                                            >
                                              <Typography.Text
                                                strong
                                                className="text-sky-700 text-xs uppercase block mb-2"
                                              >
                                                <Cpu className="inline w-3.5 h-3.5 mr-1" />
                                                So sánh với AI
                                              </Typography.Text>
                                              <Row gutter={[12, 12]}>
                                                <Col span={12}>
                                                  <Typography.Text
                                                    type="secondary"
                                                    className="text-xs block"
                                                  >
                                                    Điểm AI
                                                  </Typography.Text>
                                                  <Typography.Text
                                                    strong
                                                    className="text-sky-700"
                                                  >
                                                    {aiCriterion!.score}/
                                                    {aiCriterion!.maxScore}{" "}
                                                    <Typography.Text
                                                      type="secondary"
                                                      className="text-xs"
                                                    >
                                                      (
                                                      {(
                                                        (aiCriterion!.score /
                                                          aiCriterion!
                                                            .maxScore) *
                                                        100
                                                      ).toFixed(0)}
                                                      %)
                                                    </Typography.Text>
                                                  </Typography.Text>
                                                </Col>
                                              </Row>
                                              {aiCriterion!.comment && (
                                                <>
                                                  <Divider className="my-2" />
                                                  <Typography.Text
                                                    type="secondary"
                                                    className="text-xs"
                                                  >
                                                    <strong>
                                                      Nhận xét AI:
                                                    </strong>{" "}
                                                    {aiCriterion!.comment}
                                                  </Typography.Text>
                                                </>
                                              )}
                                            </Card>
                                          )}
                                        </Card>
                                      );
                                    })}
                                </Space>
                              </>
                            )}
                          </Space>
                        ),
                      },
                    ]}
                  />
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

      {/* Floating "Xem kết quả AI" button */}
      {!showReport && currentReport && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          style={{ position: "fixed", bottom: 24, right: 24, zIndex: 100 }}
        >
          <Button
            type="primary"
            size="large"
            icon={<BarChartOutlined />}
            onClick={() => {
              setShowReport(true);
              dispatch(fetchPresentationReport(presentationIdNumber ?? 0));
              setTimeout(() => {
                reportSectionRef.current?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });
              }, 100);
            }}
            style={{
              background: "linear-gradient(135deg, #1da9e6 0%, #6966fe 100%)",
              border: "none",
              borderRadius: 14,
              height: 52,
              paddingInline: 24,
              fontWeight: 700,
              fontSize: 15,
              boxShadow: "0 8px 24px rgba(29,169,230,0.35)",
            }}
          >
            Xem kết quả AI
          </Button>
        </motion.div>
      )}

      <ConfirmReportModal
        isOpen={reportDecisionModal === "confirm"}
        reportId={currentReport?.reportId ?? 0}
        initialGrade={instructorAvgGrade ? Number(instructorAvgGrade) : null}
        onClose={() => setReportDecisionModal(null)}
      />

      <RejectReportModal
        isOpen={reportDecisionModal === "reject"}
        reportId={currentReport?.reportId ?? 0}
        presentationId={presentationIdNumber ?? 0}
        onClose={() => setReportDecisionModal(null)}
      />
    </div>
  );
};

export default IntructorPresentationDetailPage;
