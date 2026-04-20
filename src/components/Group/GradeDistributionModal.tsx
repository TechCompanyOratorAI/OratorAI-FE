import React, { useEffect, useState, useMemo } from "react";
import {
  Modal,
  Button,
  Space,
  Typography,
  Input,
  Slider,
  Card,
  Divider,
  Avatar,
  Tag,
  Spin,
  Alert,
  Statistic,
  Row,
  Col,
  Progress,
  Empty,
  message,
  Steps,
  Badge,
} from "antd";
import {
  TrophyOutlined,
  CrownOutlined,
  SaveOutlined,
  InfoCircleOutlined,
  LockOutlined,
  SendOutlined,
  CheckCircleOutlined,
  MessageOutlined,
} from "@ant-design/icons";
import { useAppDispatch, useAppSelector } from "@/services/store/store";
import {
  distributeGrade,
  fetchGradeDistributionByReport,
  clearCurrentDistribution,
  submitMemberFeedback,
  DistributionStatus,
} from "@/services/features/groupGrade/groupGradeSlice";
import { GroupStudent } from "@/services/features/group/groupSlice";

const { Text } = Typography;
const { TextArea } = Input;

// ── Status config ─────────────────────────────────────────────────────────────

const statusConfig: Record<
  DistributionStatus,
  { label: string; color: string; antColor: string }
> = {
  submitted: {
    label: "Đã nộp — chờ phản hồi",
    color: "#d97706",
    antColor: "orange",
  },
  reopened: {
    label: "Đã mở lại — leader chỉnh sửa",
    color: "#0284c7",
    antColor: "blue",
  },
  finalized: { label: "Đã chốt điểm", color: "#059669", antColor: "green" },
};

// ── Interfaces ────────────────────────────────────────────────────────────────

interface MemberGradeEntry {
  studentId: number;
  studentName: string;
  studentEmail?: string;
  studentAvatar?: string | null;
  isLeader: boolean;
  percentage: number;
  reason: string;
}

interface GradeDistributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportId: number;
  instructorGrade: number;
  groupMembers: GroupStudent[];
  leaderId: number;
  currentUserId?: number;
  /** groupId needed for feedback API */
  groupId?: number;
  onSuccess?: (distributionId: number) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

const GradeDistributionModal: React.FC<GradeDistributionModalProps> = ({
  isOpen,
  onClose,
  reportId,
  instructorGrade: instructorGradeProp,
  groupMembers,
  leaderId,
  currentUserId,
  groupId,
  onSuccess,
}) => {
  const dispatch = useAppDispatch();
  const { currentDistribution, loading, actionLoading, error } = useAppSelector(
    (state) => state.groupGrade,
  );

  const [overallReason, setOverallReason] = useState("");
  const [members, setMembers] = useState<MemberGradeEntry[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [myFeedback, setMyFeedback] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);

  const instructorGrade = Number(instructorGradeProp);
  const isLeader = currentUserId === leaderId;
  const status = currentDistribution?.status ?? null;
  const isFinalized = status === "finalized";
  const isSubmitted = status === "submitted";
  const isReopened = status === "reopened";
  const hasDistribution = !!currentDistribution;

  // Leader can edit only if no distribution yet, or status is reopened
  const leaderCanEdit = isLeader && (!hasDistribution || isReopened);
  // Leader can't edit if submitted (waiting) or finalized
  const leaderIsLocked = isLeader && (isSubmitted || isFinalized);

  // ── Init members ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (isOpen && groupMembers.length > 0) {
      if (hasDistribution && currentDistribution?.members) {
        const entries: MemberGradeEntry[] = groupMembers.map((gm) => {
          const existing = currentDistribution.members?.find(
            (m) => m.studentId === (gm.userId ?? gm.id),
          );
          const role = gm.GroupStudent?.role;
          const name =
            [gm.firstName, gm.lastName].filter(Boolean).join(" ") ||
            gm.username ||
            "Thành viên";
          return {
            studentId: Number(gm.userId ?? gm.id),
            studentName: name,
            studentEmail: gm.email,
            studentAvatar: gm.avatar ?? null,
            isLeader: role === "leader",
            percentage: existing ? Number(existing.percentage) : 100,
            reason: existing?.reason || "",
          };
        });
        setMembers(entries);
        setOverallReason(currentDistribution.reason || "");
      } else {
        const entries: MemberGradeEntry[] = groupMembers.map((gm) => {
          const role = gm.GroupStudent?.role;
          const name =
            [gm.firstName, gm.lastName].filter(Boolean).join(" ") ||
            gm.username ||
            "Thành viên";
          return {
            studentId: Number(gm.userId ?? gm.id),
            studentName: name,
            studentEmail: gm.email,
            studentAvatar: gm.avatar ?? null,
            isLeader: role === "leader",
            percentage: 100,
            reason: "",
          };
        });
        setMembers(entries);
        setOverallReason("");
      }
      setHasChanges(false);

      // Init my feedback state
      const me = currentDistribution?.members?.find(
        (m) => m.studentId === currentUserId,
      );
      setMyFeedback(me?.memberFeedback || "");
      setFeedbackSent(!!me?.memberFeedback);
    }
  }, [isOpen, groupMembers, hasDistribution, currentDistribution]);

  // ── Fetch dist ───────────────────────────────────────────────────────────

  useEffect(() => {
    if (isOpen && reportId) {
      void dispatch(fetchGradeDistributionByReport(reportId));
    }
    return () => {
      void dispatch(clearCurrentDistribution());
    };
  }, [isOpen, reportId, dispatch]);

  // ── Error display ────────────────────────────────────────────────────────

  useEffect(() => {
    if (error) void message.error(error);
  }, [error]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handlePercentageChange = (studentId: number, val: number) => {
    setMembers((prev) =>
      prev.map((m) =>
        m.studentId === studentId ? { ...m, percentage: val } : m,
      ),
    );
    setHasChanges(true);
  };

  const handleReasonChange = (studentId: number, val: string) => {
    setMembers((prev) =>
      prev.map((m) => (m.studentId === studentId ? { ...m, reason: val } : m)),
    );
    setHasChanges(true);
  };

  const gradePreview = useMemo(
    () =>
      members.map((m) => ({
        ...m,
        receivedGrade: parseFloat(
          ((instructorGrade * m.percentage) / 100).toFixed(2),
        ),
      })),
    [members, instructorGrade],
  );

  const handleSave = async () => {
    if (members.length === 0) {
      void message.warning("Không có thành viên nào để phân chia điểm.");
      return;
    }
    const bad = members.find((m) => m.percentage < 0 || m.percentage > 100);
    if (bad) {
      void message.warning(
        `Phần trăm của "${bad.studentName}" phải từ 0 đến 100.`,
      );
      return;
    }

    try {
      const result = await dispatch(
        distributeGrade({
          reportId,
          reason: overallReason || undefined,
          members: members.map((m) => ({
            studentId: m.studentId,
            percentage: m.percentage,
            reason: m.reason || undefined,
          })),
        }),
      ).unwrap();
      void message.success("Đã nộp phân chia điểm thành công!");
      setHasChanges(false);
      // Refresh data first, then close modal
      await dispatch(fetchGradeDistributionByReport(reportId));
      onSuccess?.(result.id);
      onClose();
    } catch {
      /* handled by error effect */
    }
  };

  const handleSendFeedback = async () => {
    if (!currentDistribution?.id || !groupId) return;
    if (!myFeedback.trim()) {
      void message.warning("Vui lòng nhập nội dung phản hồi.");
      return;
    }
    try {
      await dispatch(
        submitMemberFeedback({
          groupId,
          distributionId: currentDistribution.id,
          feedback: myFeedback,
        }),
      ).unwrap();
      void message.success("Đã gửi phản hồi thành công!");
      setFeedbackSent(true);
      void dispatch(fetchGradeDistributionByReport(reportId));
    } catch {
      /* handled */
    }
  };

  const handleClose = () => {
    if (hasChanges) {
      Modal.confirm({
        title: "Có thay đổi chưa lưu",
        content: "Bạn có chắc muốn đóng mà không lưu không?",
        okText: "Đóng",
        cancelText: "Hủy",
        onOk: () => {
          setHasChanges(false);
          onClose();
        },
      });
    } else {
      onClose();
    }
  };

  // ── Status step indicator ────────────────────────────────────────────────

  const stepCurrent =
    status === "submitted"
      ? 1
      : status === "reopened"
        ? 2
        : status === "finalized"
          ? 3
          : 0;

  // ── Footer ───────────────────────────────────────────────────────────────

  const renderFooter = () => (
    <Space wrap>
      <Button onClick={handleClose} disabled={actionLoading}>
        Đóng
      </Button>

      {/* Leader submit button */}
      {leaderCanEdit && (
        <Button
          type="primary"
          icon={<SaveOutlined />}
          loading={actionLoading}
          onClick={handleSave}
          style={{
            background: "linear-gradient(135deg,#d97706,#ea580c)",
            borderColor: "#d97706",
          }}
        >
          {isReopened ? "Nộp lại điểm" : "Nộp phân chia điểm"}
        </Button>
      )}

      {/* Leader locked info */}
      {leaderIsLocked && (
        <Tag
          icon={<LockOutlined />}
          color={isFinalized ? "green" : "orange"}
          className="!py-1 !px-3 !text-sm"
        >
          {isFinalized
            ? "Đã chốt — không thể sửa"
            : "Đã nộp — chờ phản hồi hoặc instructor mở lại"}
        </Tag>
      )}
    </Space>
  );

  return (
    <Modal
      title={
        <Space align="center">
          <TrophyOutlined className="text-amber-500 text-lg" />
          <span>Phân chia điểm cho nhóm</span>
          {status && (
            <Tag color={statusConfig[status].antColor} className="!ml-2">
              {statusConfig[status].label}
            </Tag>
          )}
        </Space>
      }
      open={isOpen}
      onCancel={handleClose}
      width={780}
      centered
      destroyOnClose
      maskClosable={!actionLoading}
      footer={renderFooter()}
      styles={{
        body: {
          maxHeight: "min(78vh, 660px)",
          overflowY: "auto",
          padding: "12px 24px",
        },
      }}
    >
      <Spin spinning={loading}>
        {/* ── State machine steps ── */}
        {hasDistribution && (
          <Steps
            size="small"
            current={stepCurrent}
            className="mb-4"
            items={[
              { title: "Leader nộp điểm", icon: <SendOutlined /> },
              { title: "Thành viên phản hồi", icon: <MessageOutlined /> },
              {
                title: "Instructor mở lại (nếu cần)",
                icon: <InfoCircleOutlined />,
              },
              { title: "Chốt điểm", icon: <CheckCircleOutlined /> },
            ]}
          />
        )}

        {/* ── Header stats ── */}
        <Card
          size="small"
          className="mb-4"
          style={{
            background: "linear-gradient(135deg,#f0f9ff,#e0f2fe)",
            border: "1px solid #bae6fd",
          }}
        >
          <Row gutter={24} align="middle">
            <Col span={12}>
              <Statistic
                title="Điểm giảng viên"
                value={instructorGrade}
                suffix="/ 10"
                valueStyle={{
                  fontSize: "1.5rem",
                  color: "#0284c7",
                  fontWeight: 700,
                }}
              />
            </Col>
            <Col span={12}>
              <Statistic
                title="Số thành viên"
                value={members.length}
                valueStyle={{
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  color: "#0f172a",
                }}
              />
            </Col>
          </Row>
        </Card>

        {/* ── Info banners ── */}
        {isFinalized && (
          <Alert
            type="success"
            icon={<LockOutlined />}
            message={`Điểm đã được chốt bởi instructor${currentDistribution?.finalizedAt ? ` vào ${new Date(currentDistribution.finalizedAt).toLocaleDateString("vi-VN")}` : ""}. Không thể thay đổi.`}
            className="mb-4"
            showIcon
          />
        )}
        {isSubmitted && !isLeader && (
          <Alert
            type="info"
            message="Leader đã nộp điểm. Bạn có thể xem điểm cá nhân và gửi phản hồi bên dưới."
            className="mb-4"
            showIcon
          />
        )}
        {isReopened && isLeader && (
          <Alert
            type="warning"
            message="Instructor đã mở lại. Hãy điều chỉnh và nộp lại điểm (lần cuối)."
            className="mb-4"
            showIcon
          />
        )}
        {!isLeader && !hasDistribution && (
          <Alert
            type="info"
            message="Chỉ trưởng nhóm mới có quyền phân chia điểm."
            className="mb-4"
            showIcon
            icon={<InfoCircleOutlined />}
          />
        )}

        {hasDistribution && currentDistribution && (
          <Alert
            type={isFinalized ? "success" : "info"}
            message={`Phân chia bởi ${currentDistribution.leader?.firstName ?? ""} ${currentDistribution.leader?.lastName ?? ""} • ${currentDistribution.distributedAt ? new Date(currentDistribution.distributedAt).toLocaleDateString("vi-VN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : ""}`}
            className="mb-4"
            showIcon
          />
        )}

        {/* ── Overall reason (editable by leader when allowed) ── */}
        <div className="mb-4">
          <Text strong className="block mb-1">
            Lý do phân chia điểm (tổng quát)
          </Text>
          <TextArea
            rows={2}
            placeholder="VD: Chia điểm theo mức độ đóng góp của từng thành viên..."
            value={overallReason}
            onChange={(e) => {
              setOverallReason(e.target.value);
              setHasChanges(true);
            }}
            disabled={!leaderCanEdit}
            maxLength={500}
            showCount
          />
        </div>

        <Divider className="!my-4" />

        {/* ── Member list ── */}
        {members.length === 0 ? (
          <Empty description="Không có thành viên nào trong nhóm" />
        ) : (
          <Space direction="vertical" size="middle" className="w-full">
            {gradePreview.map((member) => {
              const distMember = currentDistribution?.members?.find(
                (m) => m.studentId === member.studentId,
              );
              const isMe = member.studentId === currentUserId;

              return (
                <Card
                  key={member.studentId}
                  size="small"
                  className={`border-l-4 ${member.isLeader ? "border-l-amber-400" : "border-l-sky-400"} ${isMe ? "ring-1 ring-sky-300" : ""}`}
                >
                  {/* Header row */}
                  <div className="flex items-center justify-between mb-3">
                    <Space size="middle">
                      <Badge dot={!!distMember?.memberFeedback} color="blue">
                        <Avatar
                          src={member.studentAvatar || undefined}
                          style={{
                            background: member.isLeader
                              ? "linear-gradient(135deg,#f59e0b,#d97706)"
                              : "linear-gradient(135deg,#0ea5e9,#06b6d4)",
                          }}
                        >
                          {!member.studentAvatar &&
                            member.studentName.charAt(0).toUpperCase()}
                        </Avatar>
                      </Badge>
                      <div>
                        <Space size={4}>
                          <Text strong className="text-sm">
                            {member.studentName}
                          </Text>
                          {member.isLeader && (
                            <Tag
                              color="gold"
                              icon={<CrownOutlined />}
                              className="text-xs"
                            >
                              Trưởng nhóm
                            </Tag>
                          )}
                          {isMe && (
                            <Tag color="blue" className="text-xs">
                              Bạn
                            </Tag>
                          )}
                        </Space>
                        {member.studentEmail && (
                          <Text type="secondary" className="text-xs block">
                            {member.studentEmail}
                          </Text>
                        )}
                      </div>
                    </Space>

                    <div className="text-right">
                      <Text strong className="text-lg text-sky-700">
                        {member.receivedGrade.toFixed(2)}
                      </Text>
                      <Text type="secondary" className="text-xs block">
                        / {Number(instructorGrade).toFixed(2)} điểm
                      </Text>
                    </div>
                  </div>

                  {/* Slider (leader edit mode) */}
                  {leaderCanEdit && (
                    <div className="mb-2">
                      <div className="flex items-center justify-between mb-1">
                        <Text type="secondary" className="text-xs">
                          Phần trăm đóng góp
                        </Text>
                        <Text strong className="text-sm">
                          {member.percentage}%
                        </Text>
                      </div>
                      <Slider
                        min={0}
                        max={100}
                        value={member.percentage}
                        onChange={(val) =>
                          handlePercentageChange(member.studentId, val)
                        }
                        tooltip={{ formatter: (val) => `${val}%` }}
                        marks={{ 0: "0%", 50: "50%", 100: "100%" }}
                      />
                      <Progress
                        percent={member.percentage}
                        showInfo={false}
                        strokeColor={member.isLeader ? "#f59e0b" : "#0ea5e9"}
                        trailColor="#e2e8f0"
                        size="small"
                      />
                    </div>
                  )}

                  {/* Percentage display (read-only) */}
                  {!leaderCanEdit && hasDistribution && (
                    <div className="mb-2 flex items-center gap-2">
                      <Progress
                        percent={member.percentage}
                        showInfo
                        strokeColor={member.isLeader ? "#f59e0b" : "#0ea5e9"}
                        size="small"
                        format={(p) => `${p}%`}
                      />
                    </div>
                  )}

                  {/* Leader's reason for this member */}
                  {leaderCanEdit ? (
                    <div>
                      <Text type="secondary" className="text-xs mb-1 block">
                        Lý do (tùy chọn)
                      </Text>
                      <TextArea
                        rows={1}
                        placeholder="Nhập lý do..."
                        value={member.reason}
                        onChange={(e) =>
                          handleReasonChange(member.studentId, e.target.value)
                        }
                        maxLength={300}
                        showCount
                        style={{ fontSize: "13px" }}
                      />
                    </div>
                  ) : (
                    distMember?.reason && (
                      <Text
                        type="secondary"
                        className="text-xs italic block mt-1"
                      >
                        Lý do: {distMember.reason}
                      </Text>
                    )
                  )}

                  {/* Member feedback (shown to all, editable by that member) */}
                  {hasDistribution && !isFinalized && isMe && !isLeader && (
                    <div className="mt-3 pt-2 border-t border-slate-100">
                      <Text strong className="text-xs block mb-1">
                        <MessageOutlined className="mr-1" />
                        Phản hồi của bạn về điểm này
                      </Text>
                      <TextArea
                        rows={2}
                        placeholder={
                          feedbackSent
                            ? "Đã gửi phản hồi. Bạn có thể cập nhật lại."
                            : "Nếu không đồng ý với điểm này, hãy nhập phản hồi..."
                        }
                        value={myFeedback}
                        onChange={(e) => setMyFeedback(e.target.value)}
                        maxLength={500}
                        showCount
                        disabled={actionLoading}
                      />
                      <Button
                        size="small"
                        type={feedbackSent ? "default" : "primary"}
                        icon={<SendOutlined />}
                        loading={actionLoading}
                        onClick={handleSendFeedback}
                        className="mt-2"
                      >
                        {feedbackSent ? "Cập nhật phản hồi" : "Gửi phản hồi"}
                      </Button>
                    </div>
                  )}

                  {/* Show member feedback to leader/instructor */}
                  {hasDistribution &&
                    distMember?.memberFeedback &&
                    (isLeader || isFinalized) && (
                      <div className="mt-2 pt-2 border-t border-slate-100">
                        <Text type="secondary" className="text-xs">
                          <MessageOutlined className="mr-1 text-blue-400" />
                          <strong>Phản hồi của thành viên:</strong>{" "}
                          {distMember.memberFeedback}
                        </Text>
                      </div>
                    )}
                </Card>
              );
            })}
          </Space>
        )}
      </Spin>
    </Modal>
  );
};

export default GradeDistributionModal;
