import React, { useEffect, useState } from "react";
import {
  Modal,
  Avatar,
  Tag,
  Typography,
  Space,
  List,
  Spin,
  Button,
  Popconfirm,
  Divider,
  message,
  Tabs,
} from "antd";
import {
  TeamOutlined,
  CrownOutlined,
  UserOutlined,
  AimOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import { useAppDispatch, useAppSelector } from "@/services/store/store";
import {
  fetchGroupDetail,
  fetchGroupsByClass,
  fetchMyGroupByClass,
  leaveGroup,
  GroupStudent,
} from "@/services/features/group/groupSlice";
import { useNavigate } from "react-router-dom";
import GradeDistributionList from "./GradeDistributionList";

const { Text, Title } = Typography;

interface GroupDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: number;
  hideFooterActions?: boolean;
  /** Set to true when opened by an instructor to show Reopen/Finalize controls */
  isInstructor?: boolean;
}

const GroupDetailModal: React.FC<GroupDetailModalProps> = ({
  isOpen,
  onClose,
  groupId,
  hideFooterActions = false,
  isInstructor = false,
}) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { groupDetail, loading, actionLoading, error } = useAppSelector(
    (state) => state.group,
  );
  const { user } = useAppSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState("members");

  useEffect(() => {
    if (isOpen && groupId) {
      void dispatch(fetchGroupDetail(groupId));
    }
  }, [isOpen, groupId, dispatch]);

  useEffect(() => {
    if (error) {
      void message.error(error);
    }
  }, [error]);

  const getMemberDisplayName = (member: GroupStudent) => {
    if (!member) return "Thành viên";
    const fullName = [member.firstName, member.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();
    return fullName || member.username || "Thành viên";
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const isCurrentUserMember = groupDetail?.students?.some(
    (member) => `${member.userId ?? member.id}` === `${user?.userId}`,
  );

  const leaderId = (() => {
    const leader = groupDetail?.students?.find(
      (m) => m.GroupStudent?.role === "leader",
    );
    return Number(leader?.userId ?? leader?.id ?? 0);
  })();

  const handleLeaveGroup = async () => {
    if (!groupId) return;
    try {
      const result = await dispatch(leaveGroup(groupId)).unwrap();
      const classId = groupDetail?.class?.classId;
      if (classId) {
        void dispatch(fetchGroupsByClass(classId));
        void dispatch(fetchMyGroupByClass(classId));
      }
      void message.success(result?.message || "Đã rời nhóm thành công.");
      setTimeout(() => {
        onClose();
      }, 600);
    } catch (err: unknown) {
      void message.error(
        err instanceof Error ? err.message : "Không thể rời nhóm.",
      );
    }
  };

  const handleViewTopics = () => {
    if (groupDetail?.classId || groupDetail?.class?.classId) {
      const classId = groupDetail.classId || groupDetail.class?.classId;
      void navigate(`/student/class/${classId}`);
      onClose();
    }
  };

  return (
    <Modal
      title={
        <Space size="middle">
          <Avatar
            style={{ backgroundColor: "#0ea5e9", width: 44, height: 44 }}
            icon={<TeamOutlined />}
            size={44}
          />
          <div>
            <Title level={4} className="!mb-0">
              {groupDetail?.groupName || groupDetail?.name || "Chi tiết nhóm"}
            </Title>
            {groupDetail?.class?.classCode && (
              <Text type="secondary" className="text-xs">
                Lớp: {groupDetail.class.classCode}
              </Text>
            )}
          </div>
        </Space>
      }
      open={isOpen}
      onCancel={onClose}
      footer={null}
      centered
      width={740}
      destroyOnClose
      maskClosable={!actionLoading}
      styles={{ body: { padding: "8px 0" } }}
    >
      <Spin spinning={loading} tip="Đang tải chi tiết nhóm...">
        {groupDetail && (
          <Tabs
            activeKey={activeTab}
            onChange={(key) => setActiveTab(key)}
            className="mb-2"
            items={[
              {
                key: "members",
                label: (
                  <Space>
                    <UserOutlined />
                    Thành viên
                  </Space>
                ),
                children: (
                  <div>
                    {/* Nhóm info */}
                    {!hideFooterActions && (
                      <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 mb-4">
                        <div className="flex items-center gap-4">
                          <Space size="small">
                            <TeamOutlined className="text-sky-600" />
                            <Text className="text-sm">
                              <strong>
                                {groupDetail.memberCount ??
                                  groupDetail.students?.length ??
                                  0}
                              </strong>{" "}
                              thành viên
                            </Text>
                          </Space>
                          {groupDetail.description && (
                            <>
                              <Divider type="vertical" />
                              <Text type="secondary" className="text-xs italic">
                                {groupDetail.description}
                              </Text>
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Danh sách thành viên */}
                    <List
                      header={
                        <Text strong className="text-sm">
                          <UserOutlined className="mr-1" />
                          Thành viên ({groupDetail.students?.length ?? 0})
                        </Text>
                      }
                      dataSource={groupDetail.students ?? []}
                      renderItem={(member, index) => {
                        const memberId = member.userId ?? member.id;
                        const isCurrentUser =
                          `${memberId}` === `${user?.userId}`;
                        const name = getMemberDisplayName(member);
                        const role = member.GroupStudent?.role;

                        return (
                          <List.Item
                            key={`${memberId ?? index}`}
                            className="!py-3 !px-4 hover:bg-slate-50 rounded-xl transition"
                          >
                            <List.Item.Meta
                              avatar={
                                <Avatar
                                  size={42}
                                  style={{
                                    background:
                                      role === "leader"
                                        ? "linear-gradient(135deg,#f59e0b,#d97706)"
                                        : "linear-gradient(135deg, #0ea5e9, #06b6d4)",
                                    fontSize: 16,
                                    fontWeight: 700,
                                  }}
                                >
                                  {getInitials(name)}
                                </Avatar>
                              }
                              title={
                                <Space size={6}>
                                  <Text
                                    strong
                                    style={{ fontSize: 14 }}
                                    className={
                                      isCurrentUser ? "text-sky-700" : undefined
                                    }
                                  >
                                    {name}
                                  </Text>
                                  {isCurrentUser && (
                                    <Tag color="blue" className="text-xs">
                                      Bạn
                                    </Tag>
                                  )}
                                </Space>
                              }
                              description={
                                member.email ? (
                                  <Text type="secondary" className="text-xs">
                                    {member.email}
                                  </Text>
                                ) : undefined
                              }
                            />
                            <Tag
                              color={role === "leader" ? "gold" : "processing"}
                              style={{ fontSize: 13, padding: "3px 10px" }}
                              icon={
                                role === "leader" ? (
                                  <CrownOutlined />
                                ) : (
                                  <UserOutlined />
                                )
                              }
                            >
                              {role === "leader" ? "Trưởng nhóm" : "Thành viên"}
                            </Tag>
                          </List.Item>
                        );
                      }}
                      locale={{ emptyText: "Không có thành viên nào." }}
                    />
                  </div>
                ),
              },
              {
                key: "grades",
                label: (
                  <Space>
                    <TrophyOutlined />
                    Điểm nhóm
                  </Space>
                ),
                children: (
                  <div className="pt-2">
                    <GradeDistributionList
                      groupId={groupId}
                      currentUserId={user?.userId}
                      leaderId={leaderId}
                      isInstructor={isInstructor}
                    />
                  </div>
                ),
              },
            ]}
          />
        )}
      </Spin>

      {!hideFooterActions && groupDetail && (
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
          <Popconfirm
            title="Rời nhóm?"
            description="Bạn có chắc muốn rời nhóm này? Hành động này không thể hoàn tác."
            okText="Rời nhóm"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
            onConfirm={handleLeaveGroup}
            disabled={actionLoading || !isCurrentUserMember}
          >
            <Button
              danger
              type="text"
              disabled={actionLoading || !isCurrentUserMember}
              loading={actionLoading}
            >
              Rời nhóm
            </Button>
          </Popconfirm>
          <Space>
            <Button onClick={onClose}>Đóng</Button>
            <Button
              type="primary"
              icon={<AimOutlined />}
              onClick={handleViewTopics}
              disabled={
                !groupDetail?.classId && !groupDetail?.class?.classId
              }
            >
              Xem chủ đề
            </Button>
          </Space>
        </div>
      )}
    </Modal>
  );
};

export default GroupDetailModal;
