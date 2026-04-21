import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  Clock,
  User,
  Users,
  BookOpen,
  MessageSquare,
  Cpu,
  CheckCircle2,
  FileText,
  Target,
  Lightbulb,
} from "lucide-react";
import {
  TrophyOutlined,
  EditOutlined,
  EyeOutlined,
  LockOutlined,
  MessageOutlined,
  SendOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  UserSwitchOutlined,
  ShareAltOutlined,
  ReloadOutlined,
  BarChartOutlined,
  RobotOutlined,
  CommentOutlined,
  TrophyOutlined as TrophyAD,
} from "@ant-design/icons";
import {
  Button,
  Tag,
  Input,
  message as antdMessage,
  Popconfirm,
  Card,
  Row,
  Col,
  Segmented,
  Progress,
  Badge,
  Space,
  Collapse,
  List,
  Avatar,
  Rate,
  Spin,
  Alert,
  Typography,
  Skeleton,
  ConfigProvider,
} from "antd";
import type { SegmentedProps } from "antd";
import SpeakerMappingModal from "@/components/Speaker/SpeakerMappingModal";
import { useAppDispatch, useAppSelector } from "@/services/store/store";
import { fetchPresentationDetail } from "@/services/features/presentation/presentationSlice";
import {
  approvePresentation,
  unapprovePresentation,
} from "@/services/features/instructor/instructorApprovalSlice";
import {
  clearCurrentReport,
  fetchPresentationReport,
  fetchCriterionFeedbacks,
} from "@/services/features/report/reportSlice";
import {
  fetchGradeDistributionByReport,
  clearCurrentDistribution,
  submitMemberFeedback,
} from "@/services/features/groupGrade/groupGradeSlice";
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
import { fetchUploadPermission } from "@/services/features/admin/classSlice";
import { useClassUploadPermission, useSocket } from "@/hooks/useSocket";
import {
  setCurrentDistribution,
  GradeDistribution,
} from "@/services/features/groupGrade/groupGradeSlice";

const { Text, Title, Paragraph } = Typography;
const { Panel } = Collapse;

const REPORT_SCROLL_TOP_GAP = 12;

// ── Color Palette (Ant Design CSS Variables) ───────────────────────────────────
const PALETTE = {
  primary: "#4F46E5", // Indigo-600
  primaryLight: "#818CF8", // Indigo-400
  primaryDark: "#3730A3", // Indigo-800
  success: "#059669", // Emerald-600
  successLight: "#D1FAE5", // Emerald-100
  warning: "#D97706", // Amber-600
  warningLight: "#FEF3C7", // Amber-100
  danger: "#DC2626", // Red-600
  dangerLight: "#FEE2E2", // Red-100
  info: "#0284C7", // Sky-600
  infoLight: "#E0F2FE", // Sky-100
  purple: "#7C3AED", // Violet-600
  purpleLight: "#EDE9FE", // Violet-100
  slate: "#475569", // Slate-600
  slateLight: "#F1F5F9", // Slate-100
  white: "#FFFFFF",
  bg: "#F8FAFC", // Slate-50
};

// ── Status Config ──────────────────────────────────────────────────────────────
const statusConfig: Record<
  string,
  { label: string; color: string; bg: string; border: string; dot: string }
> = {
  draft: {
    label: "Nháp",
    color: "#64748B",
    bg: "#F1F5F9",
    border: "#CBD5E1",
    dot: "default",
  },
  submitted: {
    label: "Đã nộp",
    color: "#0284C7",
    bg: "#E0F2FE",
    border: "#BAE6FD",
    dot: "processing",
  },
  processing: {
    label: "Đang xử lý",
    color: "#D97706",
    bg: "#FEF3C7",
    border: "#FDE68A",
    dot: "processing",
  },
  analyzed: {
    label: "Đã chấm",
    color: "#059669",
    bg: "#D1FAE5",
    border: "#A7F3D0",
    dot: "success",
  },
  done: {
    label: "Hoàn thành",
    color: "#059669",
    bg: "#D1FAE5",
    border: "#A7F3D0",
    dot: "success",
  },
  failed: {
    label: "Thất bại",
    color: "#DC2626",
    bg: "#FEE2E2",
    border: "#FECACA",
    dot: "error",
  },
};

// ── Inline member feedback sub-component ──────────────────────────────────────
const MemberFeedbackInline: React.FC<{
  groupId: number;
  distributionId: number;
  existingFeedback: string | null;
}> = ({ groupId, distributionId, existingFeedback }) => {
  const dispatch = useAppDispatch();
  const { actionLoading } = useAppSelector((s) => s.groupGrade);
  const [text, setText] = useState(existingFeedback || "");
  const [sent, setSent] = useState(!!existingFeedback);

  const handleSend = async () => {
    if (!text.trim()) {
      void antdMessage.warning("Vui lòng nhập nội dung phản hồi.");
      return;
    }
    try {
      await dispatch(
        submitMemberFeedback({ groupId, distributionId, feedback: text }),
      ).unwrap();
      void antdMessage.success("Gửi phản hồi thành công!");
      setSent(true);
    } catch (e: any) {
      void antdMessage.error(e?.message || "Không thể gửi phản hồi.");
    }
  };

  return (
    <Card
      size="small"
      style={{
        background: PALETTE.slateLight,
        border: `1px solid ${PALETTE.slateLight}`,
      }}
      className="mt-3"
    >
      <div className="flex items-center gap-2 mb-2">
        <MessageOutlined style={{ color: PALETTE.info }} />
        <Text strong style={{ fontSize: 12, color: PALETTE.slate }}>
          {sent ? "Phản hồi của bạn" : "Gửi phản hồi về điểm này"}
        </Text>
      </div>
      <Input.TextArea
        rows={2}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Nếu không đồng ý với điểm này, hãy nhập lý do..."
        maxLength={500}
        showCount
        disabled={actionLoading}
        style={{ fontSize: 13 }}
      />
      <Button
        size="small"
        type={sent ? "default" : "primary"}
        icon={<SendOutlined />}
        loading={actionLoading}
        onClick={handleSend}
        className="mt-2"
        style={
          sent
            ? {}
            : { background: PALETTE.primary, borderColor: PALETTE.primary }
        }
      >
        {sent ? "Cập nhật phản hồi" : "Gửi phản hồi"}
      </Button>
    </Card>
  );
};

// ── Score Badge ────────────────────────────────────────────────────────────────
const ScoreBadge: React.FC<{
  score: number;
  max: number;
  size?: "small" | "default";
}> = ({ score, max, size = "default" }) => {
  const percent = (score / max) * 100;
  const color =
    percent >= 80
      ? PALETTE.success
      : percent >= 60
        ? PALETTE.warning
        : PALETTE.danger;

  return (
    <div className="flex items-center gap-2">
      <Tag
        color={color}
        style={{
          fontSize: size === "small" ? 12 : 14,
          fontWeight: 700,
          padding: size === "small" ? "0 6px" : "2px 10px",
          borderRadius: 20,
          border: "none",
        }}
      >
        {score}/{max}
      </Tag>
      <Progress
        percent={percent}
        showInfo={false}
        size="small"
        strokeColor={color}
        style={{ width: 60 }}
        trailColor="#E2E8F0"
      />
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────
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
  const { currentDistribution } = useAppSelector((state) => state.groupGrade);
  const { approvingIds } = useAppSelector((state) => state.instructorApproval);

  const [showReport, setShowReport] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [reportTab, setReportTab] = useState<"ai" | "instructor">("ai");
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadResubmit, setUploadResubmit] = useState(false);
  const reportSectionRef = useRef<HTMLDivElement | null>(null);
  const currentReportRef = useRef(currentReport);
  currentReportRef.current = currentReport;
  const [gradeDistributionModalOpen, setGradeDistributionModalOpen] =
    useState(false);
  const [speakerModalOpen, setSpeakerModalOpen] = useState(false);
  const [groupDetail, setGroupDetail] = useState<{
    groupId?: number | string;
    students?: GroupStudent[];
    myRole?: string | null;
  } | null>(null);

  const presentationIdNumber = presentationId ? parseInt(presentationId) : null;
  useClassUploadPermission(presentation?.classId ?? 0);

  // ── Socket ───────────────────────────────────────────────────────────────────
  const { joinGroup, leaveGroup, on, socket } = useSocket();

  useEffect(() => {
    if (!presentationIdNumber) return;
    socket.joinPresentation(presentationIdNumber);
  }, [presentationIdNumber, socket]);

  useEffect(() => {
    if (!presentationIdNumber) return;

    const unwatchGenerated = on<{
      presentationId: number;
      reportId: number;
      overallScore: number | null;
      message?: string;
    }>("report:generated", (payload) => {
      if (payload.presentationId === presentationIdNumber) {
        void toast.info(payload.message || "Báo cáo AI đã sẵn sàng!");
        dispatch(fetchPresentationReport(presentationIdNumber));
        if (!showReport) {
          setShowReport(true);
          setReportTab("ai");
        }
      }
    });

    const unwatchConfirmed = on<{ presentationId: number; reportId: number }>(
      "report:confirmed",
      (payload) => {
        if (payload.presentationId === presentationIdNumber) {
          void toast.success("Giảng viên đã xác nhận báo cáo!");
          dispatch(fetchPresentationReport(presentationIdNumber));
        }
      },
    );

    const unwatchRejected = on<{
      presentationId: number;
      reportId: number;
      message?: string;
    }>("report:rejected", (payload) => {
      if (payload.presentationId === presentationIdNumber) {
        void toast.warning(payload.message || "Giảng viên đã từ chối báo cáo!");
        dispatch(fetchPresentationReport(presentationIdNumber));
      }
    });

    const unwatchCriterionFeedbackChanged = on<{
      presentationId: number;
      reportId: number;
    }>("report:criterion-feedback-changed", (payload) => {
      if (payload.presentationId === presentationIdNumber) {
        dispatch(fetchPresentationReport(presentationIdNumber));
        if (currentReportRef.current?.reportId) {
          dispatch(fetchCriterionFeedbacks(currentReportRef.current.reportId));
        }
      }
    });

    return () => {
      unwatchGenerated?.();
      unwatchConfirmed?.();
      unwatchRejected?.();
      unwatchCriterionFeedbackChanged?.();
    };
  }, [presentationIdNumber, showReport, on, socket, dispatch]);

  useEffect(() => {
    const currentGroupId = group?.groupId;
    if (!currentGroupId) return;

    const numGroupId = Number(currentGroupId);
    joinGroup(numGroupId);

    const unwatchDistributed = on<{
      groupId: number;
      reportId: number;
      distribution: GradeDistribution;
    }>("grade:distributed", (payload) => {
      if (
        payload.groupId === numGroupId &&
        payload.reportId === currentReportRef.current?.reportId
      ) {
        dispatch(setCurrentDistribution(payload.distribution));
        void toast.info("Trưởng nhóm đã phân chia điểm! Cập nhật...");
      }
    });

    const unwatchFinalized = on<{
      groupId: number;
      reportId: number;
      distribution: GradeDistribution;
    }>("grade:finalized", (payload) => {
      if (
        payload.groupId === numGroupId &&
        payload.reportId === currentReportRef.current?.reportId
      ) {
        dispatch(setCurrentDistribution(payload.distribution));
        void toast.success("Điểm đã được chốt bởi giảng viên!");
      }
    });

    const unwatchReopened = on<{
      groupId: number;
      reportId: number;
      distribution: GradeDistribution;
    }>("grade:reopened", (payload) => {
      if (
        payload.groupId === numGroupId &&
        payload.reportId === currentReportRef.current?.reportId
      ) {
        dispatch(setCurrentDistribution(payload.distribution));
        void toast.info("Giảng viên đã mở lại phân chia điểm.");
      }
    });

    const unwatchFeedbackUpdated = on<{
      groupId: number;
      reportId: number;
      distribution: GradeDistribution;
    }>("grade:feedback-updated", (payload) => {
      if (
        payload.groupId === numGroupId &&
        payload.reportId === currentReportRef.current?.reportId
      ) {
        dispatch(setCurrentDistribution(payload.distribution));
      }
    });

    return () => {
      leaveGroup(numGroupId);
      unwatchDistributed?.();
      unwatchFinalized?.();
      unwatchReopened?.();
      unwatchFeedbackUpdated?.();
    };
  }, [group?.groupId, joinGroup, leaveGroup, on, dispatch]);

  // ── Data fetching ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (presentationIdNumber)
      dispatch(fetchPresentationDetail(presentationIdNumber));
  }, [presentationIdNumber, dispatch]);

  useEffect(() => {
    if (presentationIdNumber) {
      void dispatch(fetchPresentationReport(presentationIdNumber));
    }
  }, [presentationIdNumber, dispatch]);

  useEffect(() => {
    dispatch(clearCurrentReport());
    dispatch(clearCurrentDistribution());
    setShowReport(false);
  }, [presentationIdNumber, dispatch]);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);
  useEffect(() => {
    if (reportError && !reportError.toLowerCase().includes("không tìm thấy")) {
      toast.error(reportError);
    }
  }, [reportError]);

  useEffect(() => {
    if (showReport && currentReport?.reportId) {
      dispatch(fetchCriterionFeedbacks(currentReport.reportId));
    }
  }, [showReport, currentReport?.reportId, dispatch]);

  useEffect(() => {
    if (
      currentReport?.reportId &&
      currentReport.reportStatus === "confirmed" &&
      showReport
    ) {
      void dispatch(fetchGradeDistributionByReport(currentReport.reportId));
    }
  }, [
    currentReport?.reportId,
    currentReport?.reportStatus,
    showReport,
    dispatch,
  ]);

  useEffect(() => {
    if (presentation?.classId) {
      void dispatch(fetchMyGroupByClass(presentation.classId));
      void dispatch(fetchUploadPermission(presentation.classId));
    }
  }, [presentation?.classId, dispatch]);

  // ── Role checks ───────────────────────────────────────────────────────────────
  const isCurrentUserLeader = group?.myRole === "leader";
  const isGroupMember = !!group?.groupId;
  const hasDistribution = !!currentDistribution;

  const isInstructor = user?.roles?.some(
    (r) => r.roleName === "Instructor" || r.roleName === "Admin",
  );
  const isInstructorOfPresentation = isInstructor && presentation?.classId;
  const canApprove =
    isInstructorOfPresentation && !presentation?.instructorApproved;
  const isApproved = presentation?.instructorApproved;

  // ── Handlers ─────────────────────────────────────────────────────────────────
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
        if (group?.groupId)
          setGroupDetail({
            groupId: group.groupId,
            students: group.students,
            myRole: group.myRole,
          });
      }
      setGradeDistributionModalOpen(true);
    } catch {
      if (group?.groupId)
        setGroupDetail({
          groupId: group.groupId,
          students: group.students,
          myRole: group.myRole,
        });
      setGradeDistributionModalOpen(true);
    }
  };

  const handleApproveSubmission = async () => {
    if (!presentationIdNumber) return;
    try {
      await dispatch(
        approvePresentation({ presentationId: presentationIdNumber }),
      ).unwrap();
      void antdMessage.success("Đã duyệt cho nộp bài!");
      dispatch(fetchPresentationDetail(presentationIdNumber));
    } catch {
      /* handled in slice */
    }
  };

  const handleUnapproveSubmission = async () => {
    if (!presentationIdNumber) return;
    try {
      await dispatch(unapprovePresentation(presentationIdNumber)).unwrap();
      void antdMessage.success("Đã huỷ duyệt!");
      dispatch(fetchPresentationDetail(presentationIdNumber));
    } catch {
      /* handled in slice */
    }
  };

  const handleViewReport = () => {
    if (!presentationIdNumber) return;
    setShowReport(true);
    dispatch(fetchPresentationReport(presentationIdNumber));
  };

  // ── Memos ────────────────────────────────────────────────────────────────────
  const myDistributionGrade = useMemo(() => {
    if (!currentDistribution?.members || !user?.userId) return null;
    return (
      currentDistribution.members.find((m) => m.studentId === user.userId) ??
      null
    );
  }, [currentDistribution, user?.userId]);

  const syncedFeedbacks = useMemo(() => {
    if (
      currentReport?.criterionFeedbacks &&
      currentReport.criterionFeedbacks.length > 0
    ) {
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
      const stickyHeader = document.querySelector(
        "header",
      ) as HTMLElement | null;
      const stickyHeaderHeight = stickyHeader?.offsetHeight || 0;
      const targetTop =
        window.scrollY +
        reportSectionRef.current.getBoundingClientRect().top +
        -stickyHeaderHeight -
        REPORT_SCROLL_TOP_GAP;
      window.scrollTo({ top: targetTop, behavior: "smooth" });
    });
  };

  useEffect(() => {
    if (showReport) scrollToReportSection();
  }, [showReport]);

  useEffect(() => {
    if (showReport && !reportLoading) scrollToReportSection();
  }, [showReport, reportLoading, currentReport]);

  // ── Derived values ────────────────────────────────────────────────────────────
  const studentName = presentation?.student
    ? `${presentation.student.firstName || ""} ${presentation.student.lastName || ""}`.trim() ||
      "Student"
    : "Unknown";
  const presentationGroupName =
    group?.groupName || group?.name || "Nhóm thuyết trình";

  const sc =
    statusConfig[presentation?.status?.toLowerCase() ?? "draft"] ??
    statusConfig.draft;

  // ── Render Loading ───────────────────────────────────────────────────────────
  if (detailLoading) {
    return (
      <StudentLayout>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 16px" }}>
          <Skeleton
            active
            paragraph={{ rows: 1 }}
            style={{ marginBottom: 16 }}
          />
          <Row gutter={[16, 16]}>
            {[1, 2, 3, 4].map((i) => (
              <Col xs={12} sm={12} md={6} key={i}>
                <Card>
                  <Skeleton active paragraph={{ rows: 1 }} />
                </Card>
              </Col>
            ))}
          </Row>
          <Card style={{ marginTop: 16 }}>
            <Skeleton active paragraph={{ rows: 6 }} />
          </Card>
        </div>
      </StudentLayout>
    );
  }

  if (error || !presentation) {
    return (
      <StudentLayout>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 16px" }}>
          <Button
            icon={<ArrowLeft size={16} />}
            onClick={() => navigate(-1)}
            style={{ marginBottom: 16 }}
          >
            Quay lại
          </Button>
          <Alert
            message={error || "Không tìm thấy bài thuyết trình"}
            type="error"
            showIcon
            action={
              <Button size="small" onClick={() => navigate(-1)}>
                Quay lại
              </Button>
            }
          />
        </div>
      </StudentLayout>
    );
  }

  // ── Segmented options ────────────────────────────────────────────────────────
  const reportSegmentOptions: SegmentedProps["options"] = [
    {
      label: (
        <Space size={4}>
          <RobotOutlined />
          <span>AI Đánh giá</span>
        </Space>
      ),
      value: "ai",
    },
    {
      label: (
        <Space size={4}>
          <CommentOutlined />
          <span>Phản hồi GV</span>
          {syncedFeedbacks.length > 0 && (
            <Badge
              count={syncedFeedbacks.length}
              size="small"
              style={{ backgroundColor: PALETTE.success }}
            />
          )}
        </Space>
      ),
      value: "instructor",
    },
  ];

  // ── Main Render ─────────────────────────────────────────────────────────────
  return (
    <StudentLayout>
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: PALETTE.primary,
            colorSuccess: PALETTE.success,
            colorWarning: PALETTE.warning,
            colorError: PALETTE.danger,
            colorInfo: PALETTE.info,
            borderRadius: 12,
            fontFamily:
              "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          },
          components: {
            Card: { borderRadiusLG: 16 },
            Button: { borderRadiusLG: 10 },
            Tag: { borderRadiusSM: 20 },
          },
        }}
      >
        <div
          style={{ maxWidth: 1200, margin: "0 auto", padding: "0 8px 32px" }}
        >
          {/* ── Page Header ── */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Breadcrumb + Action Bar */}
            <div
              className="flex items-center justify-between mb-4"
              style={{ flexWrap: "wrap", gap: 8 }}
            >
              <Button
                icon={<ArrowLeft size={14} />}
                onClick={() => navigate(-1)}
                type="text"
                style={{
                  color: PALETTE.slate,
                  padding: "4px 8px",
                  height: "auto",
                }}
              >
                Quay lại
              </Button>

              <Space wrap size={8} align="center">
                {/* Instructor actions */}
                {isInstructorOfPresentation && canApprove && (
                  <Popconfirm
                    title="Duyệt cho nộp bài?"
                    description="Sinh viên sẽ có thể nộp bài thuyết trình sau khi duyệt."
                    okText="Duyệt"
                    cancelText="Hủy"
                    onConfirm={handleApproveSubmission}
                    okButtonProps={{
                      loading: approvingIds.includes(presentationIdNumber ?? 0),
                    }}
                  >
                    <Button
                      type="primary"
                      icon={<CheckCircleOutlined />}
                      style={{
                        background: PALETTE.success,
                        borderColor: PALETTE.success,
                      }}
                    >
                      Duyệt nộp bài
                    </Button>
                  </Popconfirm>
                )}
                {isInstructorOfPresentation && isApproved && (
                  <Popconfirm
                    title="Huỷ duyệt?"
                    description="Sinh viên sẽ không thể nộp bài cho đến khi được duyệt lại."
                    okText="Huỷ duyệt"
                    cancelText="Hủy"
                    onConfirm={handleUnapproveSubmission}
                    okButtonProps={{
                      danger: true,
                      loading: approvingIds.includes(presentationIdNumber ?? 0),
                    }}
                  >
                    <Button danger icon={<ExclamationCircleOutlined />}>
                      Huỷ duyệt
                    </Button>
                  </Popconfirm>
                )}

                {!isInstructor && isApproved && (
                  <Tag
                    icon={<CheckCircleOutlined />}
                    color="success"
                    style={{
                      borderRadius: 20,
                      padding: "2px 12px",
                      fontWeight: 600,
                    }}
                  >
                    Đã được duyệt
                  </Tag>
                )}

                {isCurrentUserLeader && (
                  <Button
                    icon={<UserSwitchOutlined />}
                    onClick={() => setSpeakerModalOpen(true)}
                  >
                    Ánh xạ diễn giả
                  </Button>
                )}

                <Button
                  icon={<ShareAltOutlined />}
                  onClick={() => setShareModalOpen(true)}
                >
                  Chia sẻ
                </Button>

                <Badge
                  dot
                  status={
                    sc.dot as
                      | "success"
                      | "error"
                      | "default"
                      | "processing"
                      | "warning"
                  }
                >
                  <Tag
                    style={{
                      background: sc.bg,
                      color: sc.color,
                      border: `1px solid ${sc.border}`,
                      fontWeight: 600,
                      borderRadius: 20,
                    }}
                  >
                    {sc.label}
                  </Tag>
                </Badge>
              </Space>
            </div>

          </motion.div>

          {/* ── Stat Cards ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
          >
            <Row gutter={[12, 12]} style={{ marginTop: 16 }}>
              {/* Presenter */}
              <Col xs={12} sm={12} md={6}>
                <Card
                  style={{
                    borderRadius: 16,
                    border: "none",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                  }}
                  styles={{ body: { padding: "16px" } }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 12 }}
                  >
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: PALETTE.infoLight,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <User size={20} color={PALETTE.info} />
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
                        Nhóm thuyết trình
                      </Text>
                      <Text
                        strong
                        style={{ fontSize: 13, display: "block" }}
                        ellipsis={{ tooltip: presentationGroupName }}
                      >
                        {presentationGroupName}
                      </Text>
                    </div>
                  </div>
                </Card>
              </Col>

              {/* Topic */}
              <Col xs={12} sm={12} md={6}>
                <Card
                  style={{
                    borderRadius: 16,
                    border: "none",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                  }}
                  styles={{ body: { padding: "16px" } }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 12 }}
                  >
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: PALETTE.successLight,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <BookOpen size={20} color={PALETTE.success} />
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
                        Chủ đề
                      </Text>
                      <Text
                        strong
                        style={{ fontSize: 13, display: "block" }}
                        ellipsis={{
                          tooltip: presentation.topic?.topicName || "N/A",
                        }}
                      >
                        {presentation.topic?.topicName || "N/A"}
                      </Text>
                    </div>
                  </div>
                </Card>
              </Col>

              {/* Duration */}
              <Col xs={12} sm={12} md={6}>
                <Card
                  style={{
                    borderRadius: 16,
                    border: "none",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                  }}
                  styles={{ body: { padding: "16px" } }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 12 }}
                  >
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: PALETTE.warningLight,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Clock size={20} color={PALETTE.warning} />
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
                        Thời lượng
                      </Text>
                      <Text strong style={{ fontSize: 13, display: "block" }}>
                        {presentation.durationSeconds
                          ? `${Math.floor(presentation.durationSeconds / 60)}m ${presentation.durationSeconds % 60}s`
                          : "Chưa có"}
                      </Text>
                    </div>
                  </div>
                </Card>
              </Col>

              {/* Slides count */}
              <Col xs={12} sm={12} md={6}>
                <Card
                  style={{
                    borderRadius: 16,
                    border: "none",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                  }}
                  styles={{ body: { padding: "16px" } }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 12 }}
                  >
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: PALETTE.purpleLight,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <FileText size={20} color={PALETTE.purple} />
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
                        Số slide
                      </Text>
                      <Text strong style={{ fontSize: 13, display: "block" }}>
                        {presentation.slides?.length ?? 0} slide
                      </Text>
                    </div>
                  </div>
                </Card>
              </Col>
            </Row>
          </motion.div>

          {/* ── Presentation Player ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
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
            />
          </motion.div>

          {/* ── Progress Tracker ── */}
          {(presentation.status === "submitted" ||
            presentation.status === "processing") &&
            presentationIdNumber && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                style={{ marginTop: 16 }}
              >
                <PresentationProgressTracker
                  presentationId={presentationIdNumber}
                  onCompleted={() =>
                    dispatch(fetchPresentationDetail(presentationIdNumber))
                  }
                />
              </motion.div>
            )}

          {/* ── Failed State ── */}
          {presentation.status === "failed" && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              style={{ marginTop: 16 }}
            >
              <Alert
                message="Xử lý AI thất bại"
                description="Bài thuyết trình không thể được phân tích. Bạn có thể gửi lại để thử lại."
                type="error"
                showIcon
                icon={<ExclamationCircleOutlined />}
                action={
                  <Button
                    type="primary"
                    danger
                    icon={<ReloadOutlined />}
                    onClick={() => {
                      setUploadResubmit(true);
                      setUploadModalOpen(true);
                    }}
                  >
                    Gửi lại
                  </Button>
                }
                style={{ borderRadius: 16 }}
              />
            </motion.div>
          )}

          {/* ── Report Section ── */}
          {showReport && (
            <motion.div
              ref={reportSectionRef as React.RefObject<HTMLDivElement>}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
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
                {/* Report Header */}
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
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 12 }}
                  >
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
                      <BarChartOutlined
                        style={{ fontSize: 18, color: PALETTE.primary }}
                      />
                    </div>
                    <div>
                      <Title
                        level={4}
                        style={{ margin: 0, fontWeight: 700, fontSize: 18 }}
                      >
                        Kết quả đánh giá
                      </Title>
                      {currentReport?.generatedAt && (
                        <Text style={{ fontSize: 12, color: PALETTE.slate }}>
                          {new Date(currentReport.generatedAt).toLocaleString(
                            "vi-VN",
                          )}
                        </Text>
                      )}
                    </div>
                  </div>
                  <Segmented
                    options={reportSegmentOptions}
                    value={reportTab}
                    onChange={(val) => setReportTab(val as "ai" | "instructor")}
                    size="large"
                  />
                </div>

                {/* Rejected Alert */}
                {currentReport?.reportStatus === "rejected" && (
                  <Alert
                    message="Báo cáo AI bị từ chối"
                    description="Bạn có thể gửi lại bài thuyết trình để được đánh giá lại."
                    type="warning"
                    showIcon
                    icon={<ExclamationCircleOutlined />}
                    action={
                      <Button
                        type="primary"
                        danger
                        icon={<ReloadOutlined />}
                        onClick={() => {
                          setUploadResubmit(true);
                          setUploadModalOpen(true);
                        }}
                      >
                        Gửi lại
                      </Button>
                    }
                    style={{ marginBottom: 16, borderRadius: 12 }}
                  />
                )}

                {/* Report Content */}
                {reportLoading ? (
                  <div style={{ textAlign: "center", padding: "40px 0" }}>
                    <Spin size="large" />
                    <Text
                      style={{
                        display: "block",
                        marginTop: 12,
                        color: PALETTE.slate,
                      }}
                    >
                      Đang tải kết quả...
                    </Text>
                  </div>
                ) : currentReport ? (
                  <AnimatePresence mode="wait">
                    {reportTab === "ai" && (
                      <motion.div
                        key="ai-tab"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ duration: 0.25 }}
                      >
                        {/* AI Score Hero */}
                        <Card
                          style={{
                            borderRadius: 16,
                            background: `linear-gradient(135deg, ${PALETTE.infoLight} 0%, ${PALETTE.purpleLight} 100%)`,
                            border: `1px solid ${PALETTE.infoLight}`,
                            marginBottom: 16,
                          }}
                          styles={{ body: { padding: "20px 24px" } }}
                        >
                          <Row gutter={24} align="middle">
                            <Col flex="none">
                              <div
                                style={{
                                  width: 72,
                                  height: 72,
                                  borderRadius: "50%",
                                  background: `linear-gradient(135deg, ${PALETTE.primary}, ${PALETTE.primaryDark})`,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  boxShadow: `0 8px 24px ${PALETTE.primary}40`,
                                }}
                              >
                                <RobotOutlined
                                  style={{ fontSize: 28, color: PALETTE.white }}
                                />
                              </div>
                            </Col>
                            <Col flex="auto">
                              <Text
                                style={{
                                  fontSize: 13,
                                  color: PALETTE.slate,
                                  fontWeight: 500,
                                  display: "block",
                                  marginBottom: 4,
                                }}
                              >
                                Điểm tổng (AI)
                              </Text>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "baseline",
                                  gap: 6,
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: 36,
                                    fontWeight: 800,
                                    color: PALETTE.primary,
                                    lineHeight: 1,
                                  }}
                                >
                                  {aiOverallOutOf10 !== null
                                    ? aiOverallOutOf10
                                    : "—"}
                                </span>
                                <span
                                  style={{
                                    fontSize: 20,
                                    fontWeight: 600,
                                    color: PALETTE.primaryLight,
                                  }}
                                >
                                  / 10
                                </span>
                              </div>
                            </Col>
                            <Col flex="none">
                              <Rate
                                disabled
                                allowHalf
                                value={
                                  aiOverallOutOf10 !== null
                                    ? Math.min(
                                        5,
                                        Math.max(
                                          0,
                                          parseFloat(aiOverallOutOf10) / 2,
                                        ),
                                      )
                                    : 0
                                }
                                style={{ fontSize: 18 }}
                              />
                            </Col>
                          </Row>
                        </Card>

                        {/* Confirmed Grade & Distribution */}
                        {currentReport?.reportStatus === "confirmed" &&
                          currentReport.gradeForInstructor !== null &&
                          isGroupMember && (
                            <motion.div
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              style={{ marginBottom: 16 }}
                            >
                              {/* Instructor Grade Card */}
                              <Card
                                style={{
                                  borderRadius: 16,
                                  border: hasDistribution
                                    ? `2px solid ${PALETTE.successLight}`
                                    : `2px solid ${PALETTE.warningLight}`,
                                  background: hasDistribution
                                    ? `linear-gradient(135deg, ${PALETTE.successLight}40 0%, #fff 100%)`
                                    : `linear-gradient(135deg, ${PALETTE.warningLight}40 0%, #fff 100%)`,
                                }}
                                styles={{ body: { padding: "20px 24px" } }}
                              >
                                <Row gutter={24} align="middle">
                                  <Col flex="none">
                                    <div
                                      style={{
                                        width: 52,
                                        height: 52,
                                        borderRadius: 14,
                                        background: hasDistribution
                                          ? `linear-gradient(135deg, ${PALETTE.success}, ${PALETTE.primary})`
                                          : `linear-gradient(135deg, ${PALETTE.warning}, ${PALETTE.danger})`,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        boxShadow:
                                          "0 4px 12px rgba(0,0,0,0.15)",
                                      }}
                                    >
                                      <TrophyAD
                                        style={{
                                          fontSize: 22,
                                          color: PALETTE.white,
                                        }}
                                      />
                                    </div>
                                  </Col>
                                  <Col flex="auto">
                                    <Text
                                      style={{
                                        fontSize: 11,
                                        fontWeight: 600,
                                        textTransform: "uppercase",
                                        letterSpacing: 0.5,
                                        color: PALETTE.slate,
                                        display: "block",
                                        marginBottom: 2,
                                      }}
                                    >
                                      Điểm giảng viên
                                    </Text>
                                    <div
                                      style={{
                                        display: "flex",
                                        alignItems: "baseline",
                                        gap: 6,
                                      }}
                                    >
                                      <span
                                        style={{
                                          fontSize: 28,
                                          fontWeight: 800,
                                          color: PALETTE.slate,
                                        }}
                                      >
                                        {currentReport.gradeForInstructor}
                                      </span>
                                      <span
                                        style={{
                                          fontSize: 16,
                                          color: "#94A3B8",
                                        }}
                                      >
                                        / 10
                                      </span>
                                    </div>
                                  </Col>
                                  <Col flex="none">
                                    {isCurrentUserLeader &&
                                      !hasDistribution && (
                                        <Button
                                          type="primary"
                                          size="large"
                                          icon={<TrophyOutlined />}
                                          onClick={handleOpenGradeDistribution}
                                          style={{
                                            background: `linear-gradient(135deg, ${PALETTE.warning}, ${PALETTE.danger})`,
                                            border: "none",
                                            borderRadius: 12,
                                            height: 44,
                                            fontWeight: 600,
                                            boxShadow:
                                              "0 4px 12px rgba(217,119,6,0.3)",
                                          }}
                                        >
                                          Chia điểm cho nhóm
                                        </Button>
                                      )}
                                    {isCurrentUserLeader &&
                                      hasDistribution &&
                                      currentDistribution?.status ===
                                        "submitted" && (
                                        <Tag
                                          icon={<LockOutlined />}
                                          color="orange"
                                          style={{
                                            fontSize: 12,
                                            padding: "4px 12px",
                                            borderRadius: 20,
                                          }}
                                        >
                                          Đã nộp — chờ instructor xem xét
                                        </Tag>
                                      )}
                                    {isCurrentUserLeader &&
                                      hasDistribution &&
                                      currentDistribution?.status ===
                                        "reopened" && (
                                        <Button
                                          type="primary"
                                          size="large"
                                          icon={<EditOutlined />}
                                          onClick={handleOpenGradeDistribution}
                                          style={{
                                            background: `linear-gradient(135deg, ${PALETTE.primary}, ${PALETTE.info})`,
                                            border: "none",
                                            borderRadius: 12,
                                            height: 44,
                                            fontWeight: 600,
                                          }}
                                        >
                                          Cập nhật điểm (lần cuối)
                                        </Button>
                                      )}
                                    {isCurrentUserLeader &&
                                      hasDistribution &&
                                      currentDistribution?.status ===
                                        "finalized" && (
                                        <Tag
                                          icon={<LockOutlined />}
                                          color="success"
                                          style={{
                                            fontSize: 12,
                                            padding: "4px 12px",
                                            borderRadius: 20,
                                          }}
                                        >
                                          Đã chốt điểm
                                        </Tag>
                                      )}
                                    {!isCurrentUserLeader &&
                                      hasDistribution && (
                                        <Button
                                          icon={<EyeOutlined />}
                                          size="large"
                                          onClick={handleOpenGradeDistribution}
                                        >
                                          Xem chi tiết
                                        </Button>
                                      )}
                                  </Col>
                                </Row>

                                {/* Status Row */}
                                <div
                                  style={{
                                    marginTop: 12,
                                    paddingTop: 12,
                                    borderTop: "1px solid #F1F5F9",
                                  }}
                                >
                                  {hasDistribution ? (
                                    <div
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8,
                                      }}
                                    >
                                      <CheckCircle2
                                        size={14}
                                        color={PALETTE.success}
                                      />
                                      <Text
                                        style={{
                                          fontSize: 13,
                                          color: PALETTE.success,
                                        }}
                                      >
                                        Phân chia bởi{" "}
                                        <strong>
                                          {currentDistribution.leader
                                            ?.firstName ?? ""}{" "}
                                          {currentDistribution.leader
                                            ?.lastName ?? ""}
                                        </strong>
                                        {currentDistribution.distributedAt && (
                                          <Text
                                            style={{
                                              color: "#94A3B8",
                                              fontWeight: 400,
                                            }}
                                          >
                                            {" — "}
                                            {new Date(
                                              currentDistribution.distributedAt,
                                            ).toLocaleDateString("vi-VN", {
                                              day: "2-digit",
                                              month: "short",
                                              year: "numeric",
                                              hour: "2-digit",
                                              minute: "2-digit",
                                            })}
                                          </Text>
                                        )}
                                      </Text>
                                    </div>
                                  ) : (
                                    <div
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8,
                                      }}
                                    >
                                      <Users
                                        size={14}
                                        color={PALETTE.warning}
                                      />
                                      <Text
                                        style={{
                                          fontSize: 13,
                                          color: PALETTE.warning,
                                        }}
                                      >
                                        {isCurrentUserLeader
                                          ? "Bạn là trưởng nhóm — hãy phân chia điểm cho từng thành viên"
                                          : "Trưởng nhóm chưa phân chia điểm. Vui lòng chờ trưởng nhóm thực hiện."}
                                      </Text>
                                    </div>
                                  )}
                                </div>
                              </Card>

                              {/* Personal Grade Card */}
                              {hasDistribution && myDistributionGrade && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.98 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: 0.1 }}
                                >
                                  <Card
                                    style={{
                                      borderRadius: 16,
                                      border: `1px solid ${PALETTE.infoLight}`,
                                      background: `linear-gradient(135deg, ${PALETTE.infoLight}30 0%, #fff 100%)`,
                                      marginTop: 12,
                                    }}
                                    styles={{ body: { padding: "16px 20px" } }}
                                  >
                                    <Row gutter={16} align="middle">
                                      <Col flex="none">
                                        <Avatar
                                          size={44}
                                          src={
                                            presentation.student?.avatar ||
                                            undefined
                                          }
                                          style={{
                                            background: `linear-gradient(135deg, ${PALETTE.info}, ${PALETTE.primary})`,
                                            fontWeight: 700,
                                            fontSize: 16,
                                          }}
                                        >
                                          {!presentation.student?.avatar &&
                                            studentName.charAt(0).toUpperCase()}
                                        </Avatar>
                                      </Col>
                                      <Col flex="auto">
                                        <Text
                                          style={{
                                            fontSize: 11,
                                            fontWeight: 600,
                                            textTransform: "uppercase",
                                            letterSpacing: 0.5,
                                            color: PALETTE.slate,
                                            display: "block",
                                            marginBottom: 2,
                                          }}
                                        >
                                          Điểm cá nhân của bạn
                                        </Text>
                                        <div
                                          style={{
                                            display: "flex",
                                            alignItems: "baseline",
                                            gap: 8,
                                          }}
                                        >
                                          <span
                                            style={{
                                              fontSize: 24,
                                              fontWeight: 800,
                                              color: PALETTE.info,
                                            }}
                                          >
                                            {Number(
                                              myDistributionGrade.receivedGrade,
                                            ).toFixed(2)}
                                          </span>
                                          <span
                                            style={{
                                              fontSize: 13,
                                              color: "#94A3B8",
                                            }}
                                          >
                                            / {currentReport.gradeForInstructor}{" "}
                                            điểm
                                          </span>
                                        </div>
                                      </Col>
                                      <Col flex="none">
                                        <div style={{ textAlign: "center" }}>
                                          <Tag
                                            color="blue"
                                            style={{
                                              fontSize: 16,
                                              fontWeight: 700,
                                              padding: "2px 12px",
                                              borderRadius: 20,
                                              border: "none",
                                            }}
                                          >
                                            {Number(
                                              myDistributionGrade.percentage,
                                            ).toFixed(0)}
                                            %
                                          </Tag>
                                          <Text
                                            style={{
                                              fontSize: 11,
                                              color: "#94A3B8",
                                              display: "block",
                                              marginTop: 2,
                                            }}
                                          >
                                            tỷ lệ đóng góp
                                          </Text>
                                        </div>
                                      </Col>
                                    </Row>
                                    {myDistributionGrade.reason && (
                                      <div
                                        style={{
                                          marginTop: 10,
                                          paddingTop: 10,
                                          borderTop: "1px solid #F1F5F9",
                                        }}
                                      >
                                        <Text
                                          style={{
                                            fontSize: 12,
                                            color: PALETTE.slate,
                                          }}
                                        >
                                          <strong>Lý do:</strong>{" "}
                                          {myDistributionGrade.reason}
                                        </Text>
                                      </div>
                                    )}
                                    {!isCurrentUserLeader &&
                                      currentDistribution?.status !==
                                        "finalized" && (
                                        <MemberFeedbackInline
                                          groupId={Number(
                                            groupDetail?.groupId ??
                                              group?.groupId ??
                                              0,
                                          )}
                                          distributionId={
                                            currentDistribution?.id ?? 0
                                          }
                                          existingFeedback={
                                            myDistributionGrade.memberFeedback ??
                                            null
                                          }
                                        />
                                      )}
                                    {!isCurrentUserLeader &&
                                      currentDistribution?.status ===
                                        "finalized" && (
                                        <div
                                          style={{
                                            marginTop: 10,
                                            paddingTop: 10,
                                            borderTop: "1px solid #F1F5F9",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 6,
                                          }}
                                        >
                                          <LockOutlined
                                            style={{
                                              color: PALETTE.success,
                                              fontSize: 12,
                                            }}
                                          />
                                          <Text
                                            style={{
                                              fontSize: 12,
                                              color: PALETTE.success,
                                              fontWeight: 500,
                                            }}
                                          >
                                            Điểm đã được chốt. Không thể phản
                                            hồi.
                                          </Text>
                                        </div>
                                      )}
                                  </Card>
                                </motion.div>
                              )}

                              {/* Summary Grid for Leader */}
                              {hasDistribution &&
                                isCurrentUserLeader &&
                                currentDistribution.members &&
                                currentDistribution.members.length > 0 && (
                                  <motion.div
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.15 }}
                                    style={{ marginTop: 12 }}
                                  >
                                    <Card
                                      style={{
                                        borderRadius: 16,
                                        border: "1px solid #F1F5F9",
                                      }}
                                      styles={{
                                        body: { padding: "16px 20px" },
                                      }}
                                    >
                                      <div
                                        style={{
                                          display: "flex",
                                          alignItems: "center",
                                          gap: 8,
                                          marginBottom: 12,
                                        }}
                                      >
                                        <Users
                                          size={14}
                                          color={PALETTE.slate}
                                        />
                                        <Text
                                          strong
                                          style={{
                                            fontSize: 12,
                                            textTransform: "uppercase",
                                            letterSpacing: 0.5,
                                            color: PALETTE.slate,
                                          }}
                                        >
                                          Tổng quan phân chia (
                                          {currentDistribution.members.length}{" "}
                                          thành viên)
                                        </Text>
                                      </div>
                                      <List
                                        size="small"
                                        dataSource={currentDistribution.members}
                                        renderItem={(member) => {
                                          const isMe =
                                            member.studentId === user?.userId;
                                          const hasFeedback =
                                            !!member.memberFeedback;
                                          const feedbackStatus =
                                            member.feedbackStatus;
                                          const statusConfig = {
                                            accepted: {
                                              label: "Đã đồng ý",
                                              color: "#10B981",
                                              bg: "#D1FAE5",
                                            },
                                            pending: {
                                              label: "Đã phản hồi",
                                              color: "#F59E0B",
                                              bg: "#FEF3C7",
                                            },
                                            rejected: {
                                              label: "Từ chối",
                                              color: "#EF4444",
                                              bg: "#FEE2E2",
                                            },
                                          };
                                          const feedbackInfo =
                                            hasFeedback && feedbackStatus
                                              ? statusConfig[feedbackStatus]
                                              : null;
                                          return (
                                            <List.Item
                                              style={{
                                                padding: "8px 0",
                                                background: isMe
                                                  ? PALETTE.infoLight
                                                  : hasFeedback
                                                    ? `${PALETTE.primary}08`
                                                    : "transparent",
                                                borderRadius: 10,
                                                paddingLeft: 10,
                                                paddingRight: 10,
                                                marginBottom: 4,
                                                border: "none",
                                              }}
                                            >
                                              <div
                                                style={{
                                                  display: "flex",
                                                  alignItems: "center",
                                                  justifyContent:
                                                    "space-between",
                                                  width: "100%",
                                                }}
                                              >
                                                <div
                                                  style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 10,
                                                  }}
                                                >
                                                  <Avatar
                                                    size={30}
                                                    src={
                                                      member.student?.avatar ||
                                                      undefined
                                                    }
                                                    style={{
                                                      background: isMe
                                                        ? `linear-gradient(135deg, ${PALETTE.info}, ${PALETTE.primary})`
                                                        : "#94A3B8",
                                                      fontSize: 12,
                                                      fontWeight: 600,
                                                    }}
                                                  >
                                                    {!member.student?.avatar &&
                                                      (member.student?.firstName
                                                        ?.charAt(0)
                                                        ?.toUpperCase() ??
                                                        "?")}
                                                  </Avatar>
                                                  <div>
                                                    <div
                                                      style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: 6,
                                                      }}
                                                    >
                                                      <Text
                                                        strong={isMe}
                                                        style={{
                                                          fontSize: 13,
                                                          color: isMe
                                                            ? PALETTE.info
                                                            : PALETTE.slate,
                                                        }}
                                                      >
                                                        {
                                                          member.student
                                                            ?.firstName
                                                        }{" "}
                                                        {
                                                          member.student
                                                            ?.lastName
                                                        }
                                                        {isMe && (
                                                          <Tag
                                                            color="blue"
                                                            style={{
                                                              marginLeft: 6,
                                                              fontSize: 10,
                                                              padding: "0 4px",
                                                              borderRadius: 10,
                                                            }}
                                                          >
                                                            Bạn
                                                          </Tag>
                                                        )}
                                                      </Text>
                                                    </div>
                                                    {feedbackInfo ? (
                                                      <div
                                                        style={{
                                                          display: "flex",
                                                          alignItems: "center",
                                                          gap: 6,
                                                          marginTop: 2,
                                                        }}
                                                      >
                                                        <Tag
                                                          color={
                                                            feedbackStatus ===
                                                            "accepted"
                                                              ? "success"
                                                              : feedbackStatus ===
                                                                  "rejected"
                                                                ? "error"
                                                                : "warning"
                                                          }
                                                          style={{
                                                            fontSize: 10,
                                                            padding: "0 4px",
                                                            borderRadius: 10,
                                                            margin: 0,
                                                            lineHeight: "16px",
                                                          }}
                                                        >
                                                          {feedbackInfo.label}
                                                        </Tag>
                                                        {member.memberFeedback && (
                                                          <Text
                                                            style={{
                                                              fontSize: 11,
                                                              color: "#64748B",
                                                              fontStyle:
                                                                "italic",
                                                              maxWidth: 120,
                                                              overflow:
                                                                "hidden",
                                                              textOverflow:
                                                                "ellipsis",
                                                              whiteSpace:
                                                                "nowrap",
                                                            }}
                                                          >
                                                            "
                                                            {
                                                              member.memberFeedback
                                                            }
                                                            "
                                                          </Text>
                                                        )}
                                                      </div>
                                                    ) : !isMe ? (
                                                      <Text
                                                        style={{
                                                          fontSize: 11,
                                                          color: "#94A3B8",
                                                          marginTop: 2,
                                                          display: "block",
                                                        }}
                                                      >
                                                        Chưa phản hồi
                                                      </Text>
                                                    ) : null}
                                                  </div>
                                                </div>
                                                <div
                                                  style={{ textAlign: "right" }}
                                                >
                                                  <Text
                                                    strong={isMe}
                                                    style={{
                                                      fontSize: 14,
                                                      color: isMe
                                                        ? PALETTE.info
                                                        : PALETTE.slate,
                                                      fontVariantNumeric:
                                                        "tabular-nums",
                                                    }}
                                                  >
                                                    {Number(
                                                      member.receivedGrade,
                                                    ).toFixed(2)}
                                                  </Text>
                                                  <Text
                                                    style={{
                                                      fontSize: 11,
                                                      color: "#94A3B8",
                                                      marginLeft: 4,
                                                    }}
                                                  >
                                                    (
                                                    {Number(
                                                      member.percentage,
                                                    ).toFixed(0)}
                                                    %)
                                                  </Text>
                                                </div>
                                              </div>
                                            </List.Item>
                                          );
                                        }}
                                      />
                                    </Card>
                                  </motion.div>
                                )}
                            </motion.div>
                          )}

                        {/* Criteria Scores */}
                        {criteriaScores.length > 0 && (
                          <div style={{ marginTop: 8 }}>
                            <Title
                              level={5}
                              style={{
                                fontWeight: 700,
                                marginBottom: 12,
                                fontSize: 15,
                              }}
                            >
                              <BarChartOutlined style={{ marginRight: 8 }} />
                              Chi tiết theo tiêu chí
                            </Title>
                            <Collapse
                              ghost
                              expandIconPosition="end"
                              style={{ background: "transparent" }}
                            >
                              {criteriaScores.map((criterion) => {
                                const hasInstructorFeedback =
                                  syncedFeedbacks.some(
                                    (fb) =>
                                      fb.classRubricCriteriaId ===
                                      criterion.criteriaId,
                                  );
                                return (
                                  <Panel
                                    key={criterion.criteriaId}
                                    header={
                                      <div
                                        style={{
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "space-between",
                                          width: "100%",
                                          paddingRight: 8,
                                        }}
                                      >
                                        <div
                                          style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 8,
                                          }}
                                        >
                                          <Target
                                            size={14}
                                            color={PALETTE.primary}
                                          />
                                          <Text strong style={{ fontSize: 14 }}>
                                            {criterion.criteriaName}
                                          </Text>
                                          {hasInstructorFeedback && (
                                            <Tag
                                              color="success"
                                              style={{
                                                fontSize: 10,
                                                padding: "0 6px",
                                                borderRadius: 10,
                                                border: "none",
                                              }}
                                            >
                                              Có phản hồi GV
                                            </Tag>
                                          )}
                                        </div>
                                        <ScoreBadge
                                          score={criterion.score}
                                          max={criterion.maxScore}
                                          size="small"
                                        />
                                      </div>
                                    }
                                    style={{
                                      background: PALETTE.white,
                                      borderRadius: 12,
                                      marginBottom: 8,
                                      border: "1px solid #F1F5F9",
                                      overflow: "hidden",
                                    }}
                                  >
                                    <Paragraph
                                      style={{
                                        fontSize: 13,
                                        color: PALETTE.slate,
                                        marginBottom: 8,
                                      }}
                                    >
                                      {criterion.comment}
                                    </Paragraph>
                                    {criterion.suggestions?.length > 0 && (
                                      <Card
                                        size="small"
                                        style={{
                                          background: PALETTE.warningLight,
                                          border: `1px solid ${PALETTE.warningLight}`,
                                          borderRadius: 10,
                                        }}
                                        styles={{ body: { padding: "12px" } }}
                                      >
                                        <div
                                          style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 6,
                                            marginBottom: 8,
                                          }}
                                        >
                                          <Lightbulb
                                            size={13}
                                            color={PALETTE.warning}
                                          />
                                          <Text
                                            strong
                                            style={{
                                              fontSize: 11,
                                              color: PALETTE.warning,
                                              textTransform: "uppercase",
                                              letterSpacing: 0.5,
                                            }}
                                          >
                                            Đề xuất cải thiện
                                          </Text>
                                        </div>
                                        <ul
                                          style={{ margin: 0, paddingLeft: 16 }}
                                        >
                                          {criterion.suggestions.map(
                                            (suggestion, index) => (
                                              <li
                                                key={index}
                                                style={{
                                                  fontSize: 13,
                                                  color: PALETTE.slate,
                                                  marginBottom: 4,
                                                }}
                                              >
                                                {suggestion}
                                              </li>
                                            ),
                                          )}
                                        </ul>
                                      </Card>
                                    )}
                                  </Panel>
                                );
                              })}
                            </Collapse>
                          </div>
                        )}
                      </motion.div>
                    )}

                    {reportTab === "instructor" && (
                      <motion.div
                        key="instructor-tab"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.25 }}
                      >
                        {/* Criteria Scores */}
                        {reportTab === "instructor" && (
                          <div style={{ marginTop: 8 }}>
                            <Title
                              level={5}
                              style={{
                                fontWeight: 700,
                                marginBottom: 12,
                                fontSize: 15,
                              }}
                            >
                              <CommentOutlined style={{ marginRight: 8 }} />
                              Phản hồi giảng viên
                            </Title>
                            <Collapse
                              ghost
                              expandIconPosition="end"
                              style={{ background: "transparent" }}
                            >
                              {criteriaScores.map((criterion) => {
                                const fb = syncedFeedbacks.find(
                                  (f) =>
                                    f.classRubricCriteriaId ===
                                    criterion.criteriaId,
                                );
                                return (
                                  <Panel
                                    key={criterion.criteriaId}
                                    header={
                                      <div
                                        style={{
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "space-between",
                                          width: "100%",
                                          paddingRight: 8,
                                        }}
                                      >
                                        <div
                                          style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 8,
                                          }}
                                        >
                                          <MessageSquare
                                            size={14}
                                            color={PALETTE.success}
                                          />
                                          <Text strong style={{ fontSize: 14 }}>
                                            {criterion.criteriaName}
                                          </Text>
                                          {fb && (
                                            <Tag
                                              color="success"
                                              style={{
                                                fontSize: 10,
                                                padding: "0 6px",
                                                borderRadius: 10,
                                                border: "none",
                                              }}
                                            >
                                              Có phản hồi
                                            </Tag>
                                          )}
                                          {!fb && (
                                            <Tag
                                              style={{
                                                fontSize: 10,
                                                padding: "0 6px",
                                                borderRadius: 10,
                                                background: PALETTE.slateLight,
                                                color: "#94A3B8",
                                                border: "none",
                                              }}
                                            >
                                              Chưa có phản hồi
                                            </Tag>
                                          )}
                                        </div>
                                        {fb &&
                                          fb.score !== null &&
                                          fb.score !== "" && (
                                            <ScoreBadge
                                              score={Number(fb.score)}
                                              max={100}
                                              size="small"
                                            />
                                          )}
                                      </div>
                                    }
                                    style={{
                                      background: PALETTE.white,
                                      borderRadius: 12,
                                      marginBottom: 8,
                                      border: "1px solid #F1F5F9",
                                      overflow: "hidden",
                                    }}
                                  >
                                    {fb ? (
                                      <>
                                        {fb.comment ? (
                                          <Paragraph
                                            style={{
                                              fontSize: 13,
                                              color: PALETTE.slate,
                                              marginBottom: 8,
                                            }}
                                          >
                                            {fb.comment}
                                          </Paragraph>
                                        ) : (
                                          <div
                                            style={{
                                              textAlign: "center",
                                              padding: "14px",
                                              borderRadius: 12,
                                              background: PALETTE.slateLight,
                                              border: "1px dashed #CBD5E1",
                                              marginBottom: 12,
                                            }}
                                          >
                                            <Text
                                              style={{
                                                fontSize: 13,
                                                color: "#94A3B8",
                                                fontStyle: "italic",
                                              }}
                                            >
                                              Chưa có nhận xét
                                            </Text>
                                          </div>
                                        )}
                                        {/* AI Comparison */}
                                        {criterion.score !== undefined && (
                                          <Card
                                            size="small"
                                            style={{
                                              borderRadius: 12,
                                              background: PALETTE.infoLight,
                                              border: `1px solid ${PALETTE.infoLight}`,
                                            }}
                                            styles={{
                                              body: { padding: "12px" },
                                            }}
                                          >
                                            <div
                                              style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 6,
                                                marginBottom: 8,
                                              }}
                                            >
                                              <Cpu
                                                size={13}
                                                color={PALETTE.info}
                                              />
                                              <Text
                                                strong
                                                style={{
                                                  fontSize: 11,
                                                  color: PALETTE.info,
                                                  textTransform: "uppercase",
                                                  letterSpacing: 0.5,
                                                }}
                                              >
                                                So sánh với đánh giá AI
                                              </Text>
                                            </div>
                                            <Row gutter={[12, 8]}>
                                              <Col span={12}>
                                                <Card
                                                  size="small"
                                                  style={{
                                                    borderRadius: 10,
                                                    background: PALETTE.white,
                                                    border: `1px solid ${PALETTE.infoLight}`,
                                                  }}
                                                  styles={{
                                                    body: {
                                                      padding: "10px 12px",
                                                    },
                                                  }}
                                                >
                                                  <Text
                                                    style={{
                                                      fontSize: 11,
                                                      color: PALETTE.slate,
                                                      display: "block",
                                                      marginBottom: 4,
                                                    }}
                                                  >
                                                    Điểm AI
                                                  </Text>
                                                  <div
                                                    style={{
                                                      display: "flex",
                                                      alignItems: "center",
                                                      gap: 4,
                                                    }}
                                                  >
                                                    <Cpu
                                                      size={12}
                                                      color={PALETTE.info}
                                                    />
                                                    <Text
                                                      strong
                                                      style={{
                                                        fontSize: 13,
                                                        color: PALETTE.info,
                                                      }}
                                                    >
                                                      {criterion.score}/
                                                      {criterion.maxScore}
                                                    </Text>
                                                    <Text
                                                      style={{
                                                        fontSize: 11,
                                                        color: "#94A3B8",
                                                      }}
                                                    >
                                                      (
                                                      {(
                                                        (criterion.score /
                                                          criterion.maxScore) *
                                                        100
                                                      ).toFixed(0)}
                                                      %)
                                                    </Text>
                                                  </div>
                                                </Card>
                                              </Col>
                                              <Col span={12}>
                                                <Card
                                                  size="small"
                                                  style={{
                                                    borderRadius: 10,
                                                    background: PALETTE.white,
                                                    border: `1px solid ${PALETTE.successLight}`,
                                                  }}
                                                  styles={{
                                                    body: {
                                                      padding: "10px 12px",
                                                    },
                                                  }}
                                                >
                                                  <Text
                                                    style={{
                                                      fontSize: 11,
                                                      color: PALETTE.slate,
                                                      display: "block",
                                                      marginBottom: 4,
                                                    }}
                                                  >
                                                    Điểm GV
                                                  </Text>
                                                  <div
                                                    style={{
                                                      display: "flex",
                                                      alignItems: "center",
                                                      gap: 4,
                                                    }}
                                                  >
                                                    <User
                                                      size={12}
                                                      color={PALETTE.success}
                                                    />
                                                    <Text
                                                      strong
                                                      style={{
                                                        fontSize: 13,
                                                        color: PALETTE.success,
                                                      }}
                                                    >
                                                      {Number(fb.score).toFixed(
                                                        1,
                                                      )}
                                                    </Text>
                                                    <Text
                                                      style={{
                                                        fontSize: 11,
                                                        color: "#94A3B8",
                                                      }}
                                                    >
                                                      / 100
                                                    </Text>
                                                  </div>
                                                </Card>
                                              </Col>
                                            </Row>
                                            {criterion.comment && (
                                              <div
                                                style={{
                                                  marginTop: 8,
                                                  paddingTop: 8,
                                                  borderTop:
                                                    "1px solid #E2E8F0",
                                                }}
                                              >
                                                <Text
                                                  style={{
                                                    fontSize: 12,
                                                    color: "#6B7280",
                                                  }}
                                                >
                                                  <strong
                                                    style={{
                                                      color: PALETTE.info,
                                                    }}
                                                  >
                                                    Nhận xét AI:
                                                  </strong>{" "}
                                                  {criterion.comment}
                                                </Text>
                                              </div>
                                            )}
                                          </Card>
                                        )}
                                      </>
                                    ) : (
                                      <div
                                        style={{
                                          textAlign: "center",
                                          padding: "20px",
                                        }}
                                      >
                                        <Text
                                          style={{
                                            fontSize: 13,
                                            color: "#94A3B8",
                                            fontStyle: "italic",
                                          }}
                                        >
                                          Giảng viên chưa có phản hồi cho tiêu
                                          chí này
                                        </Text>
                                      </div>
                                    )}
                                  </Panel>
                                );
                              })}
                            </Collapse>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
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

          {/* Floating "View Report" button */}
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
                onClick={handleViewReport}
                style={{
                  background: `linear-gradient(135deg, ${PALETTE.primary}, ${PALETTE.primaryDark})`,
                  border: "none",
                  borderRadius: 14,
                  height: 52,
                  paddingInline: 24,
                  fontWeight: 700,
                  fontSize: 15,
                  boxShadow: `0 8px 24px ${PALETTE.primary}50`,
                }}
              >
                Xem kết quả AI
              </Button>
            </motion.div>
          )}
        </div>

        {/* ── Modals ── */}
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

        {isCurrentUserLeader && presentationIdNumber && (
          <SpeakerMappingModal
            presentationId={presentationIdNumber}
            open={speakerModalOpen}
            onClose={() => setSpeakerModalOpen(false)}
          />
        )}

        <GradeDistributionModal
          isOpen={gradeDistributionModalOpen}
          onClose={() => {
            setGradeDistributionModalOpen(false);
            if (currentReport?.reportId) {
              void dispatch(
                fetchGradeDistributionByReport(currentReport.reportId),
              );
            }
          }}
          reportId={currentReport?.reportId ?? 0}
          instructorGrade={currentReport?.gradeForInstructor ?? 0}
          groupMembers={groupDetail?.students ?? group?.students ?? []}
          leaderId={(() => {
            const students = groupDetail?.students ?? group?.students ?? [];
            const leader = students.find(
              (s) => s.GroupStudent?.role === "leader",
            );
            return Number(leader?.userId ?? leader?.id ?? 0);
          })()}
          currentUserId={user?.userId}
          groupId={Number(groupDetail?.groupId ?? group?.groupId ?? 0)}
          onSuccess={() => {
            void dispatch(
              fetchGradeDistributionByReport(currentReport?.reportId ?? 0),
            );
          }}
        />
      </ConfigProvider>
    </StudentLayout>
  );
};

export default PresentationDetailPage;
