import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "@/lib/toast";
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
  BarChartOutlined,
  ShareAltOutlined,
} from "@ant-design/icons";
import { useAppDispatch, useAppSelector } from "@/services/store/store";
import { fetchPresentationDetail } from "@/services/features/presentation/presentationSlice";
import {
  clearCurrentReport,
  fetchPresentationReport,
  fetchCriterionFeedbacks,
} from "@/services/features/report/reportSlice";
import {
  fetchTranscript,
  clearTranscript,
} from "@/services/features/transcript/transcriptSlice";
import { fetchGradeDistributionByReport } from "@/services/features/groupGrade/groupGradeSlice";
import {
  Button,
  Card,
  Statistic,
  Tag,
  Typography,
  Empty,
  Space,
  Row,
  Col,
  Divider,
  Alert,
  Segmented,
  Skeleton,
} from "antd";
import PresentationPlayer from "@/components/Presentation/PresentationPlayer";
import SidebarInstructor from "@/components/Sidebar/SidebarInstructor/SidebarInstructor";
import CriterionFeedbackRubricForm from "@/components/CriterionFeedback/CriterionFeedbackRubricForm";
import ConfirmReportModal from "@/components/Report/ConfirmReportModal";
import RejectReportModal from "@/components/Report/RejectReportModal";
import ShareModal from "@/components/Share/ShareModal";
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
const PALETTE = {
  primary: "#2563EB",
  primaryDark: "#1D4ED8",
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
  purple: "#8B5CF6",
  white: "#FFFFFF",
  slate: "#64748B",
};
const { Text, Title } = Typography;

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
  const { currentDistribution } = useAppSelector((state) => state.groupGrade);

  const { currentTranscript, loading: transcriptLoading } = useAppSelector(
    (state) => state.transcript,
  );

  const [showReport, setShowReport] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [reportTab, setReportTab] = useState<"transcript" | "ai" | "instructor">("transcript");
  const [playerCurrentTime, setPlayerCurrentTime] = useState(0);
  const transcriptContainerRef = useRef<HTMLDivElement | null>(null);
  const activeSegmentRef = useRef<HTMLDivElement | null>(null);
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
    dispatch(clearTranscript());
    setShowReport(false);
  }, [presentationIdNumber, dispatch]);

  useEffect(() => {
    if (isValidPresentationId && presentationIdNumber) {
      void dispatch(fetchTranscript(presentationIdNumber));
    }
  }, [isValidPresentationId, presentationIdNumber, dispatch]);

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

  // Auto-scroll transcript to active segment
  useEffect(() => {
    if (reportTab !== "transcript" || !activeSegmentRef.current || !transcriptContainerRef.current) return;
    const container = transcriptContainerRef.current;
    const el = activeSegmentRef.current;
    const elTop = el.offsetTop;
    const elBottom = elTop + el.offsetHeight;
    const viewTop = container.scrollTop;
    const viewBottom = viewTop + container.clientHeight;
    if (elTop < viewTop + 60 || elBottom > viewBottom - 60) {
      container.scrollTo({ top: elTop - container.clientHeight / 2 + el.offsetHeight / 2, behavior: "smooth" });
    }
  }, [playerCurrentTime, reportTab]);

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
  const isGradeFinalized = currentDistribution?.status === "finalized";

  useEffect(() => {
    if (showReport && currentReport?.reportId) {
      void dispatch(fetchGradeDistributionByReport(currentReport.reportId));
    }
  }, [showReport, currentReport?.reportId, dispatch]);

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
      color: PALETTE.primary,
      background: "#DBEAFE",
    },
    {
      icon: BookOpen,
      label: "Chủ đề",
      value: presentation.topic?.topicName || "N/A",
      color: PALETTE.success,
      background: "#D1FAE5",
    },
    {
      icon: Clock,
      label: "Thời lượng",
      value: presentation.durationSeconds
        ? `${Math.floor(presentation.durationSeconds / 60)}m ${presentation.durationSeconds % 60}s`
        : "Chưa có",
      color: PALETTE.warning,
      background: "#FEF3C7",
    },
    {
      icon: Calendar,
      label: "Trạng thái",
      value: sc.label,
      color: PALETTE.purple,
      background: "#EDE9FE",
    },
  ];

  const reportSegmentOptions = [
    { label: "Bản dịch", value: "transcript" },
    { label: "AI đánh giá", value: "ai" },
    { label: `Feedback giảng viên${syncedFeedbacks.length ? ` (${syncedFeedbacks.length})` : ""}`, value: "instructor" },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarInstructor activeItem="manage-classes" />
      <main className="flex-1 overflow-y-auto lg:ml-0">
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "20px 8px 32px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
              marginBottom: 16,
            }}
          >
            <Button
              icon={<ArrowLeft size={14} />}
              onClick={() => navigate(-1)}
              type="text"
              style={{ color: PALETTE.slate, padding: "4px 8px", height: "auto" }}
            >
              Quay lại
            </Button>

            {presentationIdNumber && (
              <Button
                icon={<ShareAltOutlined />}
                onClick={() => setShareModalOpen(true)}
              >
                Chia sẻ
              </Button>
            )}
          </div>

          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card
              style={{
                borderRadius: 20,
                border: "none",
                boxShadow: "0 4px 20px rgba(0,0,0,0.07)",
              }}
              styles={{ body: { padding: "24px" } }}
            >
              <Title level={2} style={{ margin: 0, fontWeight: 700, fontSize: 22 }}>
                {presentation.title}
              </Title>
              {presentation.description && (
                <Text style={{ display: "block", marginTop: 8, color: PALETTE.slate, fontSize: 14 }}>
                  {presentation.description}
                </Text>
              )}
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            style={{ marginTop: 16 }}
          >
            <Row gutter={[12, 12]}>
              {statCards.map(({ icon: Icon, label, value, color, background }) => (
                <Col xs={12} sm={12} md={6} key={label}>
                  <Card
                    style={{
                      borderRadius: 16,
                      border: "none",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                    }}
                    styles={{ body: { padding: "16px" } }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 12,
                          background,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Icon size={20} color={color} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <Text
                          style={{
                            fontSize: 11,
                            color: PALETTE.slate,
                            fontWeight: 600,
                            textTransform: "uppercase",
                            letterSpacing: 0.5,
                            display: "block",
                          }}
                        >
                          {label}
                        </Text>
                        <Text strong style={{ fontSize: 13, display: "block" }} ellipsis={{ tooltip: value }}>
                          {value}
                        </Text>
                      </div>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{ marginTop: 16 }}
          >
            <PresentationPlayer
              slides={presentation.slides || []}
              audioRecord={presentation.audioRecord || null}
              title={presentation.title}
              description={presentation.description}
              status={presentation.status}
              studentName={studentName}
              createdAt={presentation.createdAt}
              showHeader={false}
              onTimeUpdate={setPlayerCurrentTime}
            />
          </motion.div>

          {showReport && (
            <motion.div
              ref={reportSectionRef}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ marginTop: 16 }}
            >
              <Card
                style={{
                  borderRadius: 20,
                  border: "none",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.07)",
                }}
                styles={{ body: { padding: "24px 24px 20px" } }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 20,
                    flexWrap: "wrap",
                    gap: 12,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        background: `${PALETTE.primary}15`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <BarChartOutlined style={{ fontSize: 18, color: PALETTE.primary }} />
                    </div>
                    <div>
                      <Title level={4} style={{ margin: 0, fontWeight: 700, fontSize: 18 }}>
                        Kết quả đánh giá
                      </Title>
                      {currentReport?.generatedAt && (
                        <Text style={{ fontSize: 12, color: PALETTE.slate }}>
                          {new Date(currentReport.generatedAt).toLocaleString("vi-VN")}
                        </Text>
                      )}
                    </div>
                    {currentReport && (
                      <Tag
                        style={{
                          borderRadius: 999,
                          padding: "4px 10px",
                          fontWeight: 600,
                          background:
                            currentReport.reportStatus === "confirmed"
                              ? "#DCFCE7"
                              : currentReport.reportStatus === "rejected"
                                ? "#FEE2E2"
                                : currentReport.reportStatus === "pending_review"
                                  ? "#FEF3C7"
                                  : "#F1F5F9",
                          color:
                            currentReport.reportStatus === "confirmed"
                              ? "#15803D"
                              : currentReport.reportStatus === "rejected"
                                ? "#B91C1C"
                                : currentReport.reportStatus === "pending_review"
                                  ? "#B45309"
                                  : "#475569",
                          border: "none",
                        }}
                      >
                        {currentReport.reportStatus === "confirmed"
                          ? "Đã xác nhận"
                          : currentReport.reportStatus === "rejected"
                            ? "Đã từ chối"
                            : currentReport.reportStatus === "pending_review"
                              ? "Chờ duyệt"
                              : currentReport.reportStatus}
                      </Tag>
                    )}
                  </div>
                  <Segmented
                    options={reportSegmentOptions}
                    value={reportTab}
                    onChange={(val) =>
                      setReportTab(val as "transcript" | "ai" | "instructor")
                    }
                    size="large"
                  />
                </div>

                {currentReport?.reportStatus === "confirmed" &&
                  currentReport.gradeForInstructor !== null && (
                    <Card
                      size="small"
                      style={{
                        marginBottom: 16,
                        background: "#ECFDF5",
                        borderColor: "#BBF7D0",
                        borderRadius: 16,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                        <div>
                          <Text style={{ fontSize: 12, color: "#059669", fontWeight: 600 }}>
                            Điểm cuối cùng (GV)
                          </Text>
                          <div style={{ fontSize: 28, fontWeight: 700, color: "#047857", lineHeight: 1.1 }}>
                            {currentReport.gradeForInstructor}
                          </div>
                        </div>
                        {currentReport.feedbackOfInstructor && (
                          <div style={{ borderLeft: "1px solid #A7F3D0", paddingLeft: 16, maxWidth: 360 }}>
                            <Text style={{ fontSize: 12, color: "#059669", fontWeight: 600 }}>
                              Nhận xét GV
                            </Text>
                            <Text style={{ display: "block", marginTop: 4, color: PALETTE.slate }}>
                              {currentReport.feedbackOfInstructor}
                            </Text>
                          </div>
                        )}
                      </div>
                    </Card>
                  )}

                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 8,
                    justifyContent: "flex-end",
                    marginBottom: 16,
                  }}
                >
                  {currentReport &&
                    currentReport.reportStatus !== "confirmed" &&
                    currentReport.reportStatus !== "rejected" &&
                    !isGradeFinalized &&
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
                          style={{ background: "#059669", borderColor: "#059669" }}
                          loading={confirmLoading}
                          onClick={() => setReportDecisionModal("confirm")}
                        >
                          Xác nhận
                        </Button>
                      </>
                    )}
                </div>

              {currentReport &&
                currentReport.reportStatus !== "confirmed" &&
                currentReport.reportStatus !== "rejected" &&
                !instructorFeedbackComplete &&
                criteriaScores.length > 0 && (
                  <Alert
                    style={{ marginBottom: 16, borderRadius: 12 }}
                    type="warning"
                    showIcon
                    message={
                      <>
                        <span style={{ fontWeight: 600 }}>Lưu ý: </span>
                        Vui lòng hoàn thành phản hồi giảng viên cho{" "}
                        <strong>tất cả {criteriaScores.length} tiêu chí</strong>{" "}
                        (tab &quot;Feedback giảng viên&quot;) trước khi có thể xác
                        nhận hoặc từ chối báo cáo AI.
                      </>
                    }
                  />
                )}

              {reportLoading ? (
                <div style={{ textAlign: "center", padding: "40px 0" }}>
                  <Skeleton active paragraph={{ rows: 3 }} />
                </div>
              ) : currentReport ? (
                <>
                  {reportTab === "transcript" ? (
                    transcriptLoading ? (
                      <div style={{ textAlign: "center", padding: "40px 0" }}>
                        <Skeleton active paragraph={{ rows: 4 }} />
                      </div>
                    ) : currentTranscript?.segments?.length ? (
                      <div
                        ref={transcriptContainerRef}
                        style={{ maxHeight: 520, overflowY: "auto", paddingRight: 4 }}
                      >
                        {currentTranscript.segments.map((seg) => {
                          const speakerColors = [
                            PALETTE.primary,
                            PALETTE.success,
                            PALETTE.warning,
                            PALETTE.danger,
                            PALETTE.purple,
                          ];
                          const speakerIndex =
                            parseInt(seg.speaker.aiSpeakerLabel.replace("SPEAKER_", ""), 10) || 0;
                          const color = speakerColors[speakerIndex % speakerColors.length];
                          const mins = Math.floor(seg.startTimestamp / 60);
                          const secs = Math.floor(seg.startTimestamp % 60);
                          const timestamp = `${mins}:${String(secs).padStart(2, "0")}`;
                          const isActive =
                            playerCurrentTime >= seg.startTimestamp &&
                            playerCurrentTime < seg.endTimestamp;
                          return (
                            <div
                              key={seg.segmentId}
                              ref={isActive ? activeSegmentRef : null}
                              style={{
                                display: "flex",
                                gap: 12,
                                marginBottom: 4,
                                alignItems: "flex-start",
                                borderRadius: 10,
                                padding: "10px 8px",
                                transition: "background 0.25s",
                                background: isActive ? `${color}18` : "transparent",
                                cursor: "pointer",
                              }}
                              onClick={() => {
                                const videoEl = document.querySelector<HTMLVideoElement>("video");
                                const audioEl = document.querySelector<HTMLAudioElement>("audio");
                                if (videoEl) videoEl.currentTime = seg.startTimestamp;
                                else if (audioEl) audioEl.currentTime = seg.startTimestamp;
                              }}
                            >
                              <div style={{ flexShrink: 0, width: 36, paddingTop: 2, textAlign: "right" }}>
                                <Text
                                  style={{
                                    fontSize: 11,
                                    color: isActive ? color : "#94A3B8",
                                    fontWeight: isActive ? 700 : 400,
                                    transition: "color 0.25s",
                                  }}
                                >
                                  {timestamp}
                                </Text>
                              </div>
                              <div
                                style={{
                                  flexShrink: 0,
                                  width: 3,
                                  borderRadius: 2,
                                  background: isActive ? color : "#E2E8F0",
                                  alignSelf: "stretch",
                                  transition: "background 0.25s",
                                }}
                              />
                              <div style={{ flex: 1 }}>
                                <Text
                                  style={{
                                    fontSize: 11,
                                    color,
                                    fontWeight: 700,
                                    display: "block",
                                    marginBottom: 4,
                                    opacity: isActive ? 1 : 0.6,
                                    transition: "opacity 0.25s",
                                  }}
                                >
                                  {seg.speaker.isMapped && seg.speaker.mappedStudent
                                    ? `${seg.speaker.mappedStudent.firstName} ${seg.speaker.mappedStudent.lastName}`.trim()
                                    : `Diễn giả ${speakerIndex + 1}`}
                                </Text>
                                {(() => {
                                  const words = seg.segmentText.trim().split(/\s+/);
                                  const segDuration = seg.endTimestamp - seg.startTimestamp;
                                  const isPast = playerCurrentTime >= seg.endTimestamp;
                                  const progressRatio = isActive && segDuration > 0
                                    ? Math.min(1, Math.max(0, (playerCurrentTime - seg.startTimestamp) / segDuration))
                                    : isPast ? 1 : 0;
                                  const litCount = Math.ceil(progressRatio * words.length);
                                  return (
                                    <p style={{ margin: 0, fontSize: 14, lineHeight: 1.75, wordBreak: "break-word" }}>
                                      {words.map((word, wi) => (
                                        <span
                                          key={wi}
                                          style={{
                                            color: wi < litCount
                                              ? (isActive ? color : PALETTE.slate)
                                              : "#94A3B8",
                                            fontWeight: wi < litCount && isActive ? 500 : 400,
                                            transition: "color 0.12s",
                                          }}
                                        >{word}{wi < words.length - 1 ? " " : ""}</span>
                                      ))}
                                    </p>
                                  );
                                })()}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <Alert
                        message="Chưa có transcript cho bài thuyết trình này."
                        type="info"
                        showIcon
                        style={{ borderRadius: 12 }}
                      />
                    )
                  ) : reportTab === "ai" ? (
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
                          dưới phần nhận xét AI.
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
                                f.classRubricCriteriaId === criterion.criteriaId,
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
                                <Typography.Text strong className="text-sky-700">
                                  {criterion.score}/{criterion.maxScore}{" "}
                                  <Typography.Text type="secondary" className="text-xs">
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
                                  {criterion.suggestions.map((suggestion, idx) => (
                                    <li key={`${criterion.criteriaId}-${idx}`}>{suggestion}</li>
                                  ))}
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
                                      void dispatch(fetchPresentationReport(presentationIdNumber));
                                    }
                                  }}
                                />
                              )}
                            </Card>
                          );
                        })}
                      </Space>
                    </Space>
                  ) : (
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
                              <strong>AI đánh giá</strong> và điền form dưới mỗi tiêu chí rubric.
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
                                syncedFeedbacks.reduce((sum, f) => sum + (Number(f.score) || 0), 0) /
                                Math.max(
                                  syncedFeedbacks.filter((f) => f.score !== null && f.score !== "").length,
                                  1,
                                ) /
                                10
                              ).toFixed(1)}
                              suffix="/ 10"
                              valueStyle={{ color: "#0369a1", fontSize: 28 }}
                            />
                          </Card>

                          <Space
                            direction="vertical"
                            size="middle"
                            className="w-full"
                          >
                            {[...syncedFeedbacks]
                              .sort((a, b) => a.criterionFeedbackId - b.criterionFeedbackId)
                              .map((fb) => {
                                const criteriaLabel =
                                  fb.classRubricCriteria?.criteriaName ||
                                  criteriaScores.find((c) => c.criteriaId === fb.classRubricCriteriaId)?.criteriaName ||
                                  `Tiêu chí #${fb.classRubricCriteriaId}`;
                                const instructorLabel = fb.instructor
                                  ? `${fb.instructor.firstName || ""} ${fb.instructor.lastName || ""}`.trim() ||
                                    fb.instructor.email ||
                                    "Giảng viên"
                                  : "Giảng viên";
                                const aiCriterion = criteriaScores.find((c) => c.criteriaId === fb.classRubricCriteriaId);
                                const hasAiData = !!aiCriterion;

                                return (
                                  <Card
                                    key={fb.criterionFeedbackId}
                                    size="small"
                                    className="border-indigo-100 bg-gradient-to-br from-indigo-50/40 to-white"
                                    title={<Space><span className="font-semibold">{criteriaLabel}</span></Space>}
                                    extra={
                                      fb.score !== null && fb.score !== "" ? (
                                        <Space>
                                          <Star className="w-4 h-4 text-amber-500" />
                                          <Typography.Text strong className="text-lg text-indigo-700">
                                            {(Number(fb.score) / 10).toFixed(1)}
                                          </Typography.Text>
                                          <Typography.Text type="secondary">/ 10</Typography.Text>
                                        </Space>
                                      ) : null
                                    }
                                  >
                                    <Typography.Text type="secondary" className="text-xs block mb-3">
                                      <User className="inline w-3 h-3 mr-1" />
                                      {instructorLabel}
                                      {fb.updatedAt
                                        ? ` · ${new Date(fb.updatedAt).toLocaleString("vi-VN", {
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
                                      <Typography.Text type="secondary" italic>
                                        Chưa có nhận xét
                                      </Typography.Text>
                                    )}

                                    {hasAiData && (
                                      <Card
                                        size="small"
                                        type="inner"
                                        className="bg-sky-50/80 border-sky-100"
                                      >
                                        <Typography.Text strong className="text-sky-700 text-xs uppercase block mb-2">
                                          <Cpu className="inline w-3.5 h-3.5 mr-1" />
                                          So sánh với AI
                                        </Typography.Text>
                                        <Row gutter={[12, 12]}>
                                          <Col span={12}>
                                            <Typography.Text type="secondary" className="text-xs block">
                                              Điểm AI
                                            </Typography.Text>
                                            <Typography.Text strong className="text-sky-700">
                                              {aiCriterion!.score}/{aiCriterion!.maxScore}{" "}
                                              <Typography.Text type="secondary" className="text-xs">
                                                ({(((aiCriterion!.score / aiCriterion!.maxScore) * 100)).toFixed(0)}%)
                                              </Typography.Text>
                                            </Typography.Text>
                                          </Col>
                                        </Row>
                                        {aiCriterion!.comment && (
                                          <>
                                            <Divider className="my-2" />
                                            <Typography.Text type="secondary" className="text-xs">
                                              <strong>Nhận xét AI:</strong> {aiCriterion!.comment}
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
                  )}
                </>
              ) : (
                <Alert
                  message="Chưa có kết quả đánh giá cho bài thuyết trình này."
                  type="info"
                  showIcon
                  style={{ borderRadius: 12 }}
                />
              )}
              </Card>
            </motion.div>
          )}
        </div>
      </main>

      {/* Floating "Xem kết quả AI" button */}
      {!showReport && (currentReport || currentTranscript) && (
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

      {presentationIdNumber && (
        <ShareModal
          open={shareModalOpen}
          presentationId={presentationIdNumber}
          onClose={() => setShareModalOpen(false)}
        />
      )}
    </div>
  );
};

export default IntructorPresentationDetailPage;
