import React, { useEffect } from "react";
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
} from "antd";
import {
  TeamOutlined,
  CrownOutlined,
  UserOutlined,
  AimOutlined,
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

const { Text, Title } = Typography;

interface GroupDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: number;
  hideFooterActions?: boolean;
}

const GroupDetailModal: React.FC<GroupDetailModalProps> = ({
  isOpen,
  onClose,
  groupId,
  hideFooterActions = false,
}) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { groupDetail, loading, actionLoading, error } = useAppSelector(
    (state) => state.group,
  );
  const { user } = useAppSelector((state) => state.auth);

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
            style={{ backgroundColor: "#0ea5e9" }}
            icon={<TeamOutlined />}
            size={40}
          />
          <div>
            <Title level={5} className="!mb-0">
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
      width={520}
      destroyOnClose
      maskClosable={!actionLoading}
    >
      <Spin spinning={loading} tip="Đang tải chi tiết nhóm...">
        {groupDetail && (
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
                    <Divider type="vertical" />
                  )}
                  {groupDetail.description && (
                    <Text type="secondary" className="text-xs italic">
                      {groupDetail.description}
                    </Text>
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
                    className="!py-3 !px-2 hover:bg-slate-50 rounded-lg transition"
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          style={{
                            background:
                              role === "leader"
                                ? "#f59e0b"
                                : "linear-gradient(135deg, #0ea5e9, #06b6d4)",
                          }}
                        >
                          {getInitials(name)}
                        </Avatar>
                      }
                      title={
                        <Space size={4}>
                          <Text
                            strong
                            className={isCurrentUser ? "text-sky-700" : undefined}
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
