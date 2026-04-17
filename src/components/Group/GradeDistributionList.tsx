import React, { useEffect } from "react";
import {
  Card,
  Typography,
  Avatar,
  Tag,
  Space,
  Spin,
  Empty,
  Divider,
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

const { Text } = Typography;

// ── Status badge config ───────────────────────────────────────────────────────

const statusConfig: Record<DistributionStatus, { label: string; color: string; icon: React.ReactNode }> = {
  submitted: { label: "Đã nộp", color: "orange",  icon: <ClockCircleOutlined /> },
  reopened:  { label: "Đã mở lại", color: "blue",  icon: <UnlockOutlined /> },
  finalized: { label: "Đã chốt", color: "green", icon: <LockOutlined /> },
};

// ── Props ─────────────────────────────────────────────────────────────────────

interface GradeDistributionListProps {
  groupId: number;
  currentUserId?: number;
  leaderId?: number;
  /** If provided, show instructor controls (reopen / finalize) */
  isInstructor?: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────────

const GradeDistributionList: React.FC<GradeDistributionListProps> = ({
  groupId,
  currentUserId,
  leaderId,
  isInstructor = false,
}) => {
  const dispatch = useAppDispatch();
  const { distributions, loading, actionLoading } = useAppSelector((state) => state.groupGrade);

  useEffect(() => {
    if (groupId) void dispatch(fetchGradeDistributionsByGroup(groupId));
  }, [groupId, dispatch]);

  const handleReopen = async (distributionId: number) => {
    try {
      await dispatch(reopenDistribution({ groupId, distributionId })).unwrap();
      void message.success("Đã mở lại cho leader chỉnh sửa!");
      void dispatch(fetchGradeDistributionsByGroup(groupId));
    } catch (e: any) {
      void message.error(e?.message || "Không thể mở lại");
    }
  };

  const handleFinalize = async (distributionId: number, reportId: number) => {
    try {
      await dispatch(finalizeDistribution({ groupId, distributionId, reportId })).unwrap();
      void message.success("Đã chốt điểm thành công!");
      void dispatch(fetchGradeDistributionsByGroup(groupId));
    } catch (e: any) {
      void message.error(e?.message || "Không thể chốt điểm");
    }
  };

  if (loading) {
    return <div className="flex justify-center py-8"><Spin tip="Đang tải lịch sử chia điểm..." /></div>;
  }

  if (!distributions || distributions.length === 0) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="Chưa có phân chia điểm nào cho nhóm này"
        className="py-6"
      />
    );
  }

  return (
    <Space direction="vertical" size="middle" className="w-full">
      {distributions.map((dist) => {
        const statusCfg = statusConfig[dist.status] ?? statusConfig["submitted"];
        const canReopen = isInstructor && dist.status === "submitted" && dist.submittedCount < 2;
        const canFinalize = isInstructor && dist.status !== "finalized";
        const hasPendingFeedback = dist.members?.some((m) => m.memberFeedback);

        return (
          <Card
            key={dist.id}
            size="small"
            className="border-l-4 border-l-amber-300 shadow-sm"
            title={
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <Space size="middle">
                  <TrophyOutlined className="text-amber-500" />
                  <div>
                    <Space size={6}>
                      <Text strong>
                        Điểm gốc: <span className="text-sky-600">{parseFloat(String(dist.instructorGrade)).toFixed(2)}</span> / 10
                      </Text>
                      <Tag color={statusCfg.color} icon={statusCfg.icon}>{statusCfg.label}</Tag>
                      {hasPendingFeedback && (
                        <Badge count={dist.members?.filter((m) => m.memberFeedback).length} className="ml-1">
                          <Tag color="blue" icon={<MessageOutlined />}>Có phản hồi</Tag>
                        </Badge>
                      )}
                    </Space>
                    <Text type="secondary" className="block text-xs mt-0.5">
                      Chia bởi: {dist.leader?.firstName} {dist.leader?.lastName}
                      {" "}•{" "}
                      {dist.distributedAt
                        ? new Date(dist.distributedAt).toLocaleDateString("vi-VN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
                        : "—"}
                      {dist.submittedCount > 0 && ` • Lần nộp ${dist.submittedCount}/2`}
                    </Text>
                    {dist.status === "finalized" && dist.finalizedAt && (
                      <Text type="secondary" className="text-xs block">
                        <CheckCircleOutlined className="text-green-500 mr-1" />
                        Chốt lúc: {new Date(dist.finalizedAt).toLocaleDateString("vi-VN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </Text>
                    )}
                  </div>
                </Space>

                {/* Instructor actions */}
                {isInstructor && (
                  <Space size="small" className="flex-shrink-0">
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
                          style={{ background: "#059669", borderColor: "#059669" }}
                        >
                          Chốt điểm
                        </Button>
                      </Popconfirm>
                    )}
                  </Space>
                )}
              </div>
            }
          >
            {/* Overall reason */}
            {dist.reason && (
              <Text type="secondary" className="text-xs italic block mb-3 px-1">
                &ldquo;{dist.reason}&rdquo;
              </Text>
            )}

            {/* Members table */}
            {dist.members && dist.members.length > 0 && (
              <div>
                <Divider className="!my-2" />
                <div className="space-y-2">
                  {dist.members.map((member) => {
                    const isCurrentUser = currentUserId === member.studentId;
                    const isLeaderMember = leaderId === member.studentId;
                    const hasFeedback = !!member.memberFeedback;

                    return (
                      <div
                        key={member.id ?? member.studentId}
                        className={`px-3 py-2.5 rounded-xl transition ${
                          isCurrentUser ? "bg-sky-50 border border-sky-200" : "bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <Space size="middle">
                            <Badge dot={hasFeedback} color="blue" offset={[-2, 2]}>
                              <Avatar
                                size="small"
                                style={{
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
                            <div>
                              <Space size={4}>
                                <Text
                                  strong={isCurrentUser}
                                  className={`text-sm ${isCurrentUser ? "text-sky-700" : ""}`}
                                >
                                  {member.student?.firstName || member.student?.lastName
                                    ? `${member.student?.firstName ?? ""} ${member.student?.lastName ?? ""}`.trim()
                                    : `Thành viên #${member.studentId}`}
                                </Text>
                                {isLeaderMember && <Tag color="gold" icon={<CrownOutlined />} className="text-xs">Leader</Tag>}
                                {isCurrentUser && <Tag color="blue" className="text-xs">Bạn</Tag>}
                              </Space>
                              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                {member.student?.email && (
                                  <Text type="secondary" className="text-xs">{member.student.email}</Text>
                                )}
                                {member.student?.email && <Text type="secondary" className="text-xs">•</Text>}
                                <Text type="secondary" className="text-xs">
                                  {Number(member.percentage).toFixed(0)}% đóng góp
                                </Text>
                                {member.reason && (
                                  <>
                                    <Text type="secondary" className="text-xs">•</Text>
                                    <Tooltip title={member.reason}>
                                      <Text type="secondary" className="text-xs italic cursor-help" ellipsis style={{ maxWidth: 160 }}>
                                        {member.reason}
                                      </Text>
                                    </Tooltip>
                                  </>
                                )}
                              </div>
                            </div>
                          </Space>

                          <div className="text-right flex-shrink-0">
                            <Text strong className={`text-base ${isCurrentUser ? "text-sky-700" : "text-slate-700"}`}>
                              {parseFloat(String(member.receivedGrade)).toFixed(2)}
                            </Text>
                            <Text type="secondary" className="text-xs block">
                              / {parseFloat(String(dist.instructorGrade)).toFixed(2)}
                            </Text>
                          </div>
                        </div>

                        {/* Member feedback */}
                        {member.memberFeedback && (
                          <div className="mt-2 px-1 py-1.5 bg-blue-50 rounded-lg border border-blue-100">
                            <Text className="text-xs text-blue-700">
                              <MessageOutlined className="mr-1" />
                              <strong>Phản hồi:</strong> {member.memberFeedback}
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
              </div>
            )}

            {/* Finalized notice */}
            {dist.status === "finalized" && (
              <Alert
                type="success"
                icon={<LockOutlined />}
                message="Điểm đã được chốt. Không thể thay đổi."
                className="mt-3 !text-xs"
                showIcon
              />
            )}
          </Card>
        );
      })}
    </Space>
  );
};

export default GradeDistributionList;
