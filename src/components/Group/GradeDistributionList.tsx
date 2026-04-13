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
} from "antd";
import { TrophyOutlined, CrownOutlined, UserOutlined } from "@ant-design/icons";
import { useAppDispatch, useAppSelector } from "@/services/store/store";
import { fetchGradeDistributionsByGroup } from "@/services/features/groupGrade/groupGradeSlice";

const { Text } = Typography;

interface GradeDistributionListProps {
  groupId: number;
  /** studentId của user hiện tại (để highlight dòng mình) */
  currentUserId?: number;
  /** leaderId của nhóm (để highlight leader) */
  leaderId?: number;
}

const GradeDistributionList: React.FC<GradeDistributionListProps> = ({
  groupId,
  currentUserId,
  leaderId,
}) => {
  const dispatch = useAppDispatch();
  const { distributions, loading } = useAppSelector(
    (state) => state.groupGrade,
  );

  useEffect(() => {
    if (groupId) {
      void dispatch(fetchGradeDistributionsByGroup(groupId));
    }
  }, [groupId, dispatch]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Spin tip="Đang tải lịch sử chia điểm..." />
      </div>
    );
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
      {distributions.map((dist) => (
        <Card
          key={dist.id}
          size="small"
          className="border-l-4 border-l-amber-300 shadow-sm"
          title={
            <Space size="middle">
              <TrophyOutlined className="text-amber-500" />
              <div>
                <Text strong>
                  Điểm gốc:{" "}
                  <span className="text-sky-600">{parseFloat(String(dist.instructorGrade)).toFixed(2)}</span>{" "}
                  / 10
                </Text>
                <Text type="secondary" className="block text-xs">
                  Chia bởi:{" "}
                  {dist.leader?.firstName} {dist.leader?.lastName} &bull;{" "}
                  {dist.distributedAt
                    ? new Date(dist.distributedAt).toLocaleDateString("vi-VN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—"}
                </Text>
              </div>
            </Space>
          }
        >
          {/* Lý do tổng quát */}
          {dist.reason && (
            <Text type="secondary" className="text-xs italic block mb-3 px-1">
              &ldquo;{dist.reason}&rdquo;
            </Text>
          )}

          {/* Bảng thành viên */}
          {dist.members && dist.members.length > 0 && (
            <div>
              <Divider className="!my-2" />
              <div className="space-y-2">
                {dist.members.map((member) => {
                  const isCurrentUser = currentUserId === member.studentId;
                  const isLeaderMember = leaderId === member.studentId;

                  return (
                    <div
                      key={member.id ?? member.studentId}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg transition ${
                        isCurrentUser
                          ? "bg-sky-50 border border-sky-200"
                          : "bg-slate-50"
                      }`}
                    >
                      <Space size="middle">
                        <Avatar
                          size="small"
                          style={{
                            background: isLeaderMember
                              ? "linear-gradient(135deg, #f59e0b, #d97706)"
                              : "linear-gradient(135deg, #0ea5e9, #06b6d4)",
                          }}
                        >
                          {member.student?.firstName
                            ? member.student.firstName.charAt(0).toUpperCase()
                            : <UserOutlined />}
                        </Avatar>
                        <div>
                          <Space size={4}>
                            <Text
                              strong={isCurrentUser}
                              className={`text-sm ${isCurrentUser ? "text-sky-700" : ""}`}
                            >
                              {member.student?.firstName} {member.student?.lastName}
                            </Text>
                            {isLeaderMember && (
                              <Tag color="gold" icon={<CrownOutlined />} className="text-xs">
                                Leader
                              </Tag>
                            )}
                            {isCurrentUser && (
                              <Tag color="blue" className="text-xs">Bạn</Tag>
                            )}
                          </Space>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Text type="secondary" className="text-xs">
                              {member.percentage}% đóng góp
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

                      <div className="text-right">
                        <Text
                          strong
                          className={`text-base ${isCurrentUser ? "text-sky-700" : "text-slate-700"}`}
                        >
                          {parseFloat(String(member.receivedGrade)).toFixed(2)}
                        </Text>
                        <Text type="secondary" className="text-xs block">
                          / {parseFloat(String(dist.instructorGrade)).toFixed(2)}
                        </Text>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Card>
      ))}
    </Space>
  );
};

export default GradeDistributionList;
