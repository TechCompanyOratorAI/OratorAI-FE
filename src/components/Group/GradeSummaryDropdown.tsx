import React, { useEffect, useState } from "react";
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
  Collapse,
  Badge,
  Popconfirm,
  message,
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
  DownOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { useAppDispatch, useAppSelector } from "@/services/store/store";
import {
  fetchGradeDistributionsByClass,
  reopenDistribution,
  finalizeDistribution,
  DistributionStatus,
} from "@/services/features/groupGrade/groupGradeSlice";
import { getErrorMessage, getResponseMessage } from "@/lib/toast";

const { Text } = Typography;

const statusConfig: Record<DistributionStatus, { label: string; color: string; icon: React.ReactNode }> = {
  submitted: { label: "Đã nộp", color: "orange", icon: <ClockCircleOutlined /> },
  reopened:  { label: "Đã mở lại", color: "blue",  icon: <UnlockOutlined /> },
  finalized: { label: "Đã chốt", color: "green", icon: <LockOutlined /> },
};

interface GradeSummaryDropdownProps {
  classId: number;
  isInstructor?: boolean;
}

const GradeSummaryDropdown: React.FC<GradeSummaryDropdownProps> = ({
  classId,
  isInstructor = true,
}) => {
  const dispatch = useAppDispatch();
  const { classDistributions, loading, actionLoading } = useAppSelector((state) => state.groupGrade);
  const [activeKeys, setActiveKeys] = useState<string[]>([]);

  useEffect(() => {
    if (classId) void dispatch(fetchGradeDistributionsByClass(classId));
  }, [classId, dispatch]);

  // Group distributions by groupId
  const groupedByGroup = classDistributions.reduce<Record<number, typeof classDistributions>>((acc, dist) => {
    const gid = dist.groupId;
    if (!acc[gid]) acc[gid] = [];
    acc[gid].push(dist);
    return acc;
  }, {});

  const groupList = Object.entries(groupedByGroup).map(([groupId, distributions]) => {
    const latestDist = distributions.find((d) => d.status === "finalized") ?? distributions[0];
    const memberCount = latestDist.members?.length ?? 0;
    return {
      groupId: Number(groupId),
      groupName: latestDist.group?.groupName ?? `Nhóm #${groupId}`,
      distributions,
      latestDist,
      memberCount,
      hasFinalized: distributions.some((d) => d.status === "finalized"),
      hasSubmitted: distributions.some((d) => d.status === "submitted"),
      hasReopened: distributions.some((d) => d.status === "reopened"),
      instructorGrade: latestDist.instructorGrade,
    };
  });

  const handleReopen = async (groupId: number, distributionId: number) => {
    try {
      const result = await dispatch(
        reopenDistribution({ groupId, distributionId }),
      ).unwrap();
      void message.success(
        getResponseMessage(result, "Đã mở lại cho leader chỉnh sửa!"),
      );
      void dispatch(fetchGradeDistributionsByClass(classId));
    } catch (error: unknown) {
      void message.error(getErrorMessage(error, "Không thể mở lại"));
    }
  };

  const handleFinalize = async (groupId: number, distributionId: number, reportId: number) => {
    try {
      const result = await dispatch(
        finalizeDistribution({ groupId, distributionId, reportId }),
      ).unwrap();
      void message.success(getResponseMessage(result, "Đã chốt điểm thành công!"));
      void dispatch(fetchGradeDistributionsByClass(classId));
    } catch (error: unknown) {
      void message.error(getErrorMessage(error, "Không thể chốt điểm"));
    }
  };

  const collapseItems = groupList.map((group) => {
    return {
      key: String(group.groupId),
      label: (
        <div className="flex items-center justify-between w-full pr-2">
          <Space size="middle">
            <Badge count={group.distributions.length} style={{ backgroundColor: "#0284c7" }}>
              <Avatar
                size={36}
                style={{
                  background: "linear-gradient(135deg, #0284c7, #0ea5e9)",
                  fontWeight: 700,
                }}
              >
                {group.groupName.charAt(0).toUpperCase()}
              </Avatar>
            </Badge>
            <div>
              <Text strong style={{ fontSize: 14, color: "#1e293b" }}>{group.groupName}</Text>
              <div className="flex items-center gap-2 mt-0.5">
                <TeamOutlined style={{ fontSize: 11, color: "#64748b" }} />
                <Text type="secondary" className="text-xs">{group.memberCount} thành viên</Text>
                {group.instructorGrade > 0 && (
                  <>
                    <Text type="secondary" className="text-xs">•</Text>
                    <Text type="secondary" className="text-xs">
                      Điểm gốc: <span className="font-medium text-sky-700">{group.instructorGrade.toFixed(2)}</span>
                    </Text>
                  </>
                )}
              </div>
            </div>
          </Space>
          <Space size="small">
            {group.hasFinalized && (
              <Tag color="green" icon={<CheckCircleOutlined />}>Đã chốt</Tag>
            )}
            {group.hasSubmitted && !group.hasFinalized && (
              <Tag color="orange" icon={<ClockCircleOutlined />}>Chờ chốt</Tag>
            )}
            {group.hasReopened && !group.hasFinalized && (
              <Tag color="blue" icon={<UnlockOutlined />}>Đang chỉnh sửa</Tag>
            )}
            <DownOutlined style={{ fontSize: 11, color: "#94a3b8" }} />
          </Space>
        </div>
      ),
      children: (
        <div className="space-y-4">
          {group.distributions.map((dist) => {
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
                            Điểm gốc:{" "}
                            <span className="text-sky-600">
                              {parseFloat(String(dist.instructorGrade)).toFixed(2)}
                            </span>{" "}
                            / 10
                          </Text>
                          <Tag color={statusCfg.color} icon={statusCfg.icon}>
                            {statusCfg.label}
                          </Tag>
                          {hasPendingFeedback && (
                            <Badge
                              count={dist.members?.filter((m) => m.memberFeedback).length}
                              className="ml-1"
                            >
                              <Tag color="blue" icon={<MessageOutlined />}>
                                Có phản hồi
                              </Tag>
                            </Badge>
                          )}
                        </Space>
                        <Text type="secondary" className="block text-xs mt-0.5">
                          Chia bởi: {dist.leader?.firstName} {dist.leader?.lastName}
                          {" • "}
                          {dist.distributedAt
                            ? new Date(dist.distributedAt).toLocaleDateString("vi-VN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "—"}
                          {dist.submittedCount > 0 && ` • Lần nộp ${dist.submittedCount}/2`}
                        </Text>
                        {dist.status === "finalized" && dist.finalizedAt && (
                          <Text type="secondary" className="text-xs block">
                            <CheckCircleOutlined className="text-green-500 mr-1" />
                            Chốt lúc:{" "}
                            {new Date(dist.finalizedAt).toLocaleDateString("vi-VN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </Text>
                        )}
                      </div>
                    </Space>

                    {isInstructor && (
                      <Space size="small" className="flex-shrink-0">
                        {canReopen && (
                          <Popconfirm
                            title="Mở lại cho leader chỉnh sửa?"
                            description={`Leader sẽ được sửa điểm lần ${dist.submittedCount + 1}/2 (lần cuối).`}
                            okText="Mở lại"
                            cancelText="Hủy"
                            onConfirm={() => handleReopen(group.groupId, dist.id)}
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
                            onConfirm={() => handleFinalize(group.groupId, dist.id, dist.reportId)}
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
                {dist.reason && (
                  <Text type="secondary" className="text-xs italic block mb-3 px-1">
                    &ldquo;{dist.reason}&rdquo;
                  </Text>
                )}

                {dist.members && dist.members.length > 0 && (
                  <div>
                    <Divider className="!my-2" />
                    <div className="space-y-2">
                      {dist.members.map((member) => {
                        const isLeader = member.studentId === dist.leaderStudentId;
                        const hasFeedback = !!member.memberFeedback;

                        return (
                          <div
                            key={member.id ?? member.studentId}
                            className="px-3 py-2.5 rounded-xl bg-slate-50 transition"
                          >
                            <div className="flex items-center justify-between">
                              <Space size="middle">
                                <Badge dot={hasFeedback} color="blue" offset={[-2, 2]}>
                                  <Avatar
                                    size="small"
                                    style={{
                                      background: isLeader
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
                                    <Text strong className="text-sm">
                                      {member.student?.firstName || member.student?.lastName
                                        ? `${member.student?.firstName ?? ""} ${member.student?.lastName ?? ""}`.trim()
                                        : `Thành viên #${member.studentId}`}
                                    </Text>
                                    {isLeader && (
                                      <Tag color="gold" icon={<CrownOutlined />} className="text-xs">
                                        Leader
                                      </Tag>
                                    )}
                                  </Space>
                                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                    {member.student?.email && (
                                      <Text type="secondary" className="text-xs">
                                        {member.student.email}
                                      </Text>
                                    )}
                                    {member.student?.email && (
                                      <Text type="secondary" className="text-xs">•</Text>
                                    )}
                                    <Text type="secondary" className="text-xs">
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
                                            style={{ maxWidth: 160 }}
                                          >
                                            {member.reason}
                                          </Text>
                                        </Tooltip>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </Space>

                              <div className="text-right flex-shrink-0">
                                <Text strong className="text-base text-slate-700">
                                  {parseFloat(String(member.receivedGrade)).toFixed(2)}
                                </Text>
                                <Text type="secondary" className="text-xs block">
                                  / {parseFloat(String(dist.instructorGrade)).toFixed(2)}
                                </Text>
                              </div>
                            </div>

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
              </Card>
            );
          })}
        </div>
      ),
    };
  });

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Spin tip="Đang tải danh sách điểm nhóm..." />
      </div>
    );
  }

  if (!classDistributions || classDistributions.length === 0) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="Chưa có phân chia điểm nào trong lớp này"
        className="py-6"
      />
    );
  }

  return (
    <div className="w-full">
      <Collapse
        items={collapseItems}
        activeKey={activeKeys}
        onChange={(keys) => setActiveKeys(keys as string[])}
        bordered={false}
        className="bg-transparent"
        expandIcon={() => null}
      />
    </div>
  );
};

export default GradeSummaryDropdown;
