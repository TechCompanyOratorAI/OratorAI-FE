import React, { useEffect, useState } from "react";
import {
  Avatar,
  Tag,
  Typography,
  Spin,
  Button,
  Popconfirm,
  message,
} from "antd";
import {
  TeamOutlined,
  CrownOutlined,
  UserOutlined,
  AimOutlined,
  MailOutlined,
  LogoutOutlined,
  CloseOutlined,
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
  isInstructor?: boolean;
}

type TabKey = "members" | "grades";

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
  const [activeTab, setActiveTab] = useState<TabKey>("members");

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

  // Reset tab when modal opens
  useEffect(() => {
    if (isOpen) setActiveTab("members");
  }, [isOpen]);

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

  if (!isOpen) return null;

  const memberCount = groupDetail?.memberCount ?? groupDetail?.students?.length ?? 0;
  const groupName = groupDetail?.groupName || groupDetail?.name || "Chi tiết nhóm";
  const classCode = groupDetail?.class?.classCode;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={actionLoading ? undefined : onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* ── Custom Header ─────────────────────────────────────── */}
        <div className="relative overflow-hidden">
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-sky-600 via-sky-500 to-cyan-500" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-sky-400/40 via-transparent to-transparent" />

          {/* Decorative circles */}
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10" />
          <div className="absolute top-12 -right-4 w-16 h-16 rounded-full bg-white/5" />

          {/* Header content */}
          <div className="relative px-6 py-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                {/* Group Avatar */}
                <div className="relative">
                  <Avatar
                    size={56}
                    style={{
                      background: "rgba(255,255,255,0.2)",
                      border: "2px solid rgba(255,255,255,0.4)",
                      backdropFilter: "blur(8px)",
                    }}
                    icon={<TeamOutlined style={{ fontSize: 24, color: "white" }} />}
                  />
                  {/* Online indicator */}
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white" />
                </div>

                <div>
                  <Title level={4} className="!mb-0 !text-white !font-bold text-lg leading-tight">
                    {groupName}
                  </Title>
                  {classCode && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
                      <Text className="text-white/80 text-xs font-medium">
                        Lớp {classCode}
                      </Text>
                    </div>
                  )}
                </div>
              </div>

              {/* Close button */}
                <Button
                  type="text"
                  icon={<CloseOutlined />}
                  onClick={actionLoading ? undefined : onClose}
                  disabled={actionLoading}
                  className="!p-2 !rounded-xl hover:!bg-white/20 active:!bg-white/30 transition-all duration-200 !border-0 !text-white hover:!text-white/80 disabled:!opacity-50"
                />
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/15 backdrop-blur-sm">
                <TeamOutlined className="text-white/90 text-sm" />
                <Text className="text-white text-sm font-semibold">
                  {memberCount} thành viên
                </Text>
              </div>
              {groupDetail?.description && (
                <div className="flex-1 min-w-0">
                  <Text className="text-white/70 text-xs line-clamp-1 italic">
                    {groupDetail.description}
                  </Text>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Tabs ─────────────────────────────────────────────── */}
        <div className="border-b border-slate-100 bg-white px-2">
          <div className="flex gap-1">
            {(["members", "grades"] as TabKey[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative px-4 py-3 text-sm font-medium transition-all duration-200 cursor-pointer ${
                  activeTab === tab
                    ? "text-sky-600"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <div className="flex items-center gap-2">
                  {tab === "members" ? (
                    <UserOutlined className="text-xs" />
                  ) : (
                    <TrophyOutlined className="text-xs" />
                  )}
                  <span>
                    {tab === "members" ? "Thành viên" : "Điểm nhóm"}
                  </span>
                </div>
                {/* Active underline */}
                <div
                  className={`absolute bottom-0 left-0 right-0 h-0.5 rounded-full transition-all duration-300 ${
                    activeTab === tab
                      ? "bg-gradient-to-r from-sky-500 to-cyan-500"
                      : "bg-transparent"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* ── Content Area ──────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto bg-slate-50/50">
          <Spin spinning={loading} tip="Đang tải chi tiết nhóm...">
            {groupDetail && (
              <div>
                {activeTab === "members" && (
                  <div className="p-4">
                    {/* Member list header */}
                    <div className="flex items-center justify-between mb-3 px-1">
                      <Text strong className="text-slate-700 text-sm">
                        Danh sách thành viên
                      </Text>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <div className="w-2 h-2 rounded-full bg-amber-400" />
                        <span>Trưởng nhóm</span>
                        <div className="w-2 h-2 rounded-full bg-sky-400 ml-2" />
                        <span>Thành viên</span>
                      </div>
                    </div>

                    {/* Members */}
                    <div className="space-y-2">
                      {(groupDetail.students ?? []).map((member, index) => {
                        const memberId = member.userId ?? member.id;
                        const isCurrentUser = `${memberId}` === `${user?.userId}`;
                        const name = getMemberDisplayName(member);
                        const role = member.GroupStudent?.role;
                        const isLeader = role === "leader";

                        return (
                          <div
                            key={`${memberId ?? index}`}
                            className={`group relative flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
                              isCurrentUser
                                ? "bg-sky-50 border border-sky-200 shadow-sm"
                                : "bg-white border border-slate-100 hover:border-slate-200 hover:shadow-sm"
                            }`}
                          >
                            {/* Avatar */}
                            <div className="relative flex-shrink-0">
                              <Avatar
                                size={44}
                                src={member.avatar || undefined}
                                style={{
                                  background: isLeader
                                    ? "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
                                    : "linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)",
                                  fontSize: 16,
                                  fontWeight: 700,
                                  boxShadow: isLeader
                                    ? "0 4px 12px rgba(245, 158, 11, 0.35)"
                                    : "0 4px 12px rgba(14, 165, 233, 0.25)",
                                }}
                              >
                                {!member.avatar && getInitials(name)}
                              </Avatar>
                              {isLeader && (
                                <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center shadow-sm border-2 border-white">
                                  <CrownOutlined className="text-[9px] text-white" />
                                </div>
                              )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <Text
                                  strong
                                  className={`text-sm truncate ${
                                    isCurrentUser ? "text-sky-700" : "text-slate-800"
                                  }`}
                                >
                                  {name}
                                </Text>
                                {isCurrentUser && (
                                  <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-sky-100 text-sky-600 rounded-md">
                                    Bạn
                                  </span>
                                )}
                              </div>
                              {member.email && (
                                <div className="flex items-center gap-1 mt-0.5">
                                  <MailOutlined className="text-slate-300 text-[10px]" />
                                  <Text className="text-slate-400 text-xs truncate">
                                    {member.email}
                                  </Text>
                                </div>
                              )}
                            </div>

                            {/* Role badge */}
                            <Tag
                              color={isLeader ? "gold" : "default"}
                              className={`flex-shrink-0 !m-0 ${
                                isLeader
                                  ? "!bg-amber-50 !text-amber-600 !border-amber-200"
                                  : "!bg-slate-50 !text-slate-500 !border-slate-200"
                              }`}
                              icon={
                                isLeader ? (
                                  <CrownOutlined className="text-[10px]" />
                                ) : (
                                  <UserOutlined className="text-[10px]" />
                                )
                              }
                            >
                              <span className="text-xs">
                                {isLeader ? "Trưởng nhóm" : "Thành viên"}
                              </span>
                            </Tag>
                          </div>
                        );
                      })}
                    </div>

                    {memberCount === 0 && (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-slate-100 flex items-center justify-center">
                          <TeamOutlined className="text-2xl text-slate-300" />
                        </div>
                        <Text type="secondary" className="text-sm">
                          Không có thành viên nào trong nhóm
                        </Text>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "grades" && (
                  <div className="p-4">
                    <GradeDistributionList
                      groupId={groupId}
                      currentUserId={user?.userId}
                      leaderId={leaderId}
                      isInstructor={isInstructor}
                    />
                  </div>
                )}
              </div>
            )}
          </Spin>
        </div>

        {/* ── Footer ───────────────────────────────────────────── */}
        {!hideFooterActions && groupDetail && (
          <div className="flex-shrink-0 px-4 py-3.5 bg-white border-t border-slate-100">
            <div className="flex items-center justify-between">
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
                  icon={<LogoutOutlined />}
                  disabled={actionLoading || !isCurrentUserMember}
                  loading={actionLoading}
                  className="!text-slate-500 hover:!text-red-500 hover:!bg-red-50"
                >
                  Rời nhóm
                </Button>
              </Popconfirm>

              <div className="flex items-center gap-2">
                <Button
                  onClick={onClose}
                  disabled={actionLoading}
                  className="!rounded-xl !border-slate-200 !text-slate-600 hover:!border-slate-300 hover:!text-slate-700"
                >
                  Đóng
                </Button>
                <Button
                  type="primary"
                  icon={<AimOutlined />}
                  onClick={handleViewTopics}
                  disabled={
                    actionLoading ||
                    (!groupDetail?.classId && !groupDetail?.class?.classId)
                  }
                  className="!rounded-xl !bg-gradient-to-r !from-sky-500 !to-cyan-500 !border-0 !shadow-lg !shadow-sky-500/25 hover:!from-sky-600 hover:!to-cyan-600 hover:!shadow-sky-500/30"
                >
                  Xem chủ đề
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupDetailModal;
