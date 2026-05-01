import React, { useEffect } from "react";
import {
  Typography,
  Avatar,
  Tag,
  Spin,
  Empty,
  Tooltip,
  Button,
  Popconfirm,
  message,
  Alert,
  Badge,
} from "antd";
import {
  TrophyOutlined,
  CrownOutlined,
  UserOutlined,
  LockOutlined,
  UnlockOutlined,
  CheckCircleOutlined,
  MessageOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { useAppDispatch, useAppSelector } from "@/services/store/store";
import {
  fetchGradeDistributionsByGroup,
  reopenDistribution,
  finalizeDistribution,
  DistributionStatus,
} from "@/services/features/groupGrade/groupGradeSlice";
import { getErrorMessage, getResponseMessage } from "@/lib/toast";

const { Text } = Typography;

const statusConfig: Record<
  DistributionStatus,
  { label: string; color: string; icon: React.ReactNode }
> = {
  submitted: {
    label: "Đã nộp",
    color: "orange",
    icon: <ClockCircleOutlined />,
  },
  reopened: { label: "Đã mở lại", color: "blue", icon: <UnlockOutlined /> },
  finalized: { label: "Đã chốt", color: "green", icon: <LockOutlined /> },
};

interface GradeDistributionListProps {
  groupId: number;
  currentUserId?: number;
  leaderId?: number;
  isInstructor?: boolean;
}

const GradeDistributionList: React.FC<GradeDistributionListProps> = ({
  groupId,
  currentUserId,
  leaderId,
  isInstructor = false,
}) => {
  const dispatch = useAppDispatch();
  const { distributions, loading, actionLoading } = useAppSelector(
    (state) => state.groupGrade,
  );

  useEffect(() => {
    if (groupId) void dispatch(fetchGradeDistributionsByGroup(groupId));
  }, [groupId, dispatch]);

  const handleReopen = async (distributionId: number) => {
    try {
      const result = await dispatch(
        reopenDistribution({ groupId, distributionId }),
      ).unwrap();
      void message.success(
        getResponseMessage(result, "Đã mở lại cho leader chỉnh sửa!"),
      );
      void dispatch(fetchGradeDistributionsByGroup(groupId));
    } catch (error: unknown) {
      void message.error(getErrorMessage(error, "Không thể mở lại"));
    }
  };

  const handleFinalize = async (distributionId: number, reportId: number) => {
    try {
      const result = await dispatch(
        finalizeDistribution({ groupId, distributionId, reportId }),
      ).unwrap();
      void message.success(
        getResponseMessage(result, "Đã chốt điểm thành công!"),
      );
      void dispatch(fetchGradeDistributionsByGroup(groupId));
    } catch (error: unknown) {
      void message.error(getErrorMessage(error, "Không thể chốt điểm"));
    }
  };

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  if (loading)
    return (
      <div className="flex justify-center py-8">
        <Spin tip="Đang tải lịch sử chia điểm..." />
      </div>
    );

  if (!distributions || distributions.length === 0)
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="Chưa có phân chia điểm nào cho nhóm này"
        className="py-6"
      />
    );

  return (
    <div className="space-y-4">
      {distributions.map((dist) => {
        const statusCfg = statusConfig[dist.status] ?? statusConfig["submitted"];
        const canReopen =
          isInstructor &&
          dist.status === "submitted" &&
          dist.submittedCount < 2;
        const canFinalize = isInstructor && dist.status !== "finalized";
        const hasPendingFeedback = dist.members?.some((m) => m.memberFeedback);

        return (
          <div
            key={dist.id}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
          >
            {/* ── Card header ── */}
            <div className="px-4 pt-4 pb-3 border-b border-slate-100">
              {/* Row 1: score + status + action buttons */}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                {/* Left: trophy + score + badges */}
                <div className="flex items-center gap-2 flex-wrap min-w-0">
                  <TrophyOutlined className="text-amber-500 flex-shrink-0" />
                  <Text strong className="text-sm">
                    Điểm gốc:
                  </Text>
                  <span className="text-sky-600 font-bold text-base leading-none">
                    {parseFloat(String(dist.instructorGrade)).toFixed(2)}
                  </span>
                  <Text type="secondary" className="text-sm">
                    / 10
                  </Text>
                  <Tag
                    color={statusCfg.color}
                    icon={statusCfg.icon}
                    className="!m-0"
                  >
                    {statusCfg.label}
                  </Tag>
                  {hasPendingFeedback && (
                    <Tag color="blue" icon={<MessageOutlined />} className="!m-0">
                      Phản hồi (
                      {dist.members?.filter((m) => m.memberFeedback).length})
                    </Tag>
                  )}
                </div>

                {/* Right: instructor action buttons */}
                {isInstructor && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {canReopen && (
                      <Popconfirm
                        title="Mở lại cho leader chỉnh sửa?"
                        description={`Leader sẽ được sửa điểm lần ${dist.submittedCount + 1}/2 (lần cuối).`}
                        okText="Mở lại"
                        cancelText="Hủy"
                        onConfirm={() => handleReopen(dist.id)}
                      >
                        <Button
                          size="small"
                          icon={<UnlockOutlined />}
                          loading={actionLoading}
                          className="!border-blue-400 !text-blue-600 hover:!bg-blue-50"
                        >
                          Mở lại
                        </Button>
                      </Popconfirm>
                    )}
                    {canFinalize && (
                      <Popconfirm
                        title="Chốt điểm?"
                        description="Sau khi chốt, leader và thành viên không thể thay đổi điểm nữa."
                        okText="Chốt điểm"
                        okButtonProps={{ danger: false, type: "primary" }}
                        cancelText="Hủy"
                        onConfirm={() => handleFinalize(dist.id, dist.reportId)}
                      >
                        <Button
                          size="small"
                          type="primary"
                          icon={<LockOutlined />}
                          loading={actionLoading}
                          style={{
                            background: "#059669",
                            borderColor: "#059669",
                          }}
                        >
                          Chốt điểm
                        </Button>
                      </Popconfirm>
                    )}
                  </div>
                )}
              </div>

              {/* Row 2: metadata */}
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <Text type="secondary" className="text-xs">
                  Chia bởi:{" "}
                  <span className="font-medium text-slate-600">
                    {dist.leader?.firstName} {dist.leader?.lastName}
                  </span>
                </Text>
                {dist.distributedAt && (
                  <Text type="secondary" className="text-xs">
                    • {fmtDate(dist.distributedAt)}
                  </Text>
                )}
                {dist.submittedCount > 0 && (
                  <Text type="secondary" className="text-xs">
                    • Lần nộp {dist.submittedCount}/2
                  </Text>
                )}
                {dist.status === "finalized" && dist.finalizedAt && (
                  <Text type="secondary" className="text-xs">
                    <CheckCircleOutlined className="text-green-500 mr-1" />
                    Chốt lúc: {fmtDate(dist.finalizedAt)}
                  </Text>
                )}
              </div>

              {/* Row 3: overall reason */}
              {dist.reason && (
                <p className="mt-2 text-xs text-slate-500 italic">
                  &ldquo;{dist.reason}&rdquo;
                </p>
              )}
            </div>

            {/* ── Member rows ── */}
            {dist.members && dist.members.length > 0 && (
              <div className="divide-y divide-slate-50">
                {dist.members.map((member) => {
                  const isCurrentUser = currentUserId === member.studentId;
                  const isLeaderMember = leaderId === member.studentId;
                  const hasFeedback = !!member.memberFeedback;
                  const fullName =
                    member.student?.firstName || member.student?.lastName
                      ? `${member.student?.firstName ?? ""} ${member.student?.lastName ?? ""}`.trim()
                      : `Thành viên #${member.studentId}`;

                  return (
                    <div
                      key={member.id ?? member.studentId}
                      className={`px-4 py-3 ${
                        isCurrentUser ? "bg-sky-50/60" : "bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Avatar */}
                        <Badge dot={hasFeedback} color="blue" offset={[-2, 2]}>
                          <Avatar
                            size={36}
                            src={member.student?.avatar || undefined}
                            style={{
                              flexShrink: 0,
                              background: isLeaderMember
                                ? "linear-gradient(135deg,#f59e0b,#d97706)"
                                : "linear-gradient(135deg,#0ea5e9,#06b6d4)",
                            }}
                          >
                            {member.student?.firstName
                              ? member.student.firstName.charAt(0).toUpperCase()
                              : <UserOutlined />}
                          </Avatar>
                        </Badge>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          {/* Name + role tags */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Text
                              strong={isCurrentUser}
                              className={`text-sm ${isCurrentUser ? "text-sky-700" : "text-slate-800"}`}
                            >
                              {fullName}
                            </Text>
                            {isLeaderMember && (
                              <Tag
                                color="gold"
                                icon={<CrownOutlined />}
                                className="!m-0 !text-xs !leading-none !py-0.5"
                              >
                                Leader
                              </Tag>
                            )}
                            {isCurrentUser && (
                              <Tag color="blue" className="!m-0 !text-xs !leading-none !py-0.5">
                                Bạn
                              </Tag>
                            )}
                          </div>

                          {/* Email + percentage + reason */}
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            {member.student?.email && (
                              <Text type="secondary" className="text-xs truncate max-w-[160px]">
                                {member.student.email}
                              </Text>
                            )}
                            <Text type="secondary" className="text-xs">•</Text>
                            <Text type="secondary" className="text-xs font-medium">
                              {Number(member.percentage).toFixed(0)}% đóng góp
                            </Text>
                            {member.reason && (
                              <>
                                <Text type="secondary" className="text-xs">•</Text>
                                <Tooltip title={member.reason}>
                                  <Text
                                    type="secondary"
                                    className="text-xs italic cursor-help"
                                    ellipsis
                                    style={{ maxWidth: 140 }}
                                  >
                                    {member.reason}
                                  </Text>
                                </Tooltip>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Grade */}
                        <div className="text-right flex-shrink-0">
                          <span
                            className={`text-base font-bold ${isCurrentUser ? "text-sky-600" : "text-slate-700"}`}
                          >
                            {parseFloat(String(member.receivedGrade)).toFixed(2)}
                          </span>
                          <Text type="secondary" className="text-xs block leading-none mt-0.5">
                            / {parseFloat(String(dist.instructorGrade)).toFixed(2)}
                          </Text>
                        </div>
                      </div>

                      {/* Member feedback */}
                      {member.memberFeedback && (
                        <div className="mt-2 ml-[calc(36px+12px)] px-3 py-2 bg-blue-50 rounded-lg border border-blue-100">
                          <Text className="text-xs text-blue-700 leading-relaxed">
                            <MessageOutlined className="mr-1.5" />
                            <span className="font-semibold">Phản hồi: </span>
                            {member.memberFeedback}
                            {member.feedbackAt && (
                              <span className="text-blue-400 ml-2 font-normal">
                                — {new Date(member.feedbackAt).toLocaleDateString("vi-VN")}
                              </span>
                            )}
                          </Text>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Finalized notice */}
            {dist.status === "finalized" && (
              <div className="px-4 pb-4 pt-2">
                <Alert
                  type="success"
                  icon={<LockOutlined />}
                  message="Điểm đã được chốt. Không thể thay đổi."
                  className="!text-xs !rounded-xl"
                  showIcon
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default GradeDistributionList;
