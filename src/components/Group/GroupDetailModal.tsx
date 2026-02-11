import React, { useEffect, useState } from "react";
import {
  X,
  Users,
  Crown,
  User,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/services/store/store";
import {
  fetchGroupDetail,
  fetchGroupsByClass,
  fetchMyGroupByClass,
  leaveGroup,
  GroupStudent,
} from "@/services/features/group/groupSlice";
import Button from "@/components/yoodli/Button";
import Toast from "@/components/Toast/Toast";
import { useNavigate } from "react-router-dom";

interface GroupDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: number;
}

const GroupDetailModal: React.FC<GroupDetailModalProps> = ({
  isOpen,
  onClose,
  groupId,
}) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { groupDetail, loading, actionLoading, error } = useAppSelector(
    (state) => state.group
  );
  const { user } = useAppSelector((state) => state.auth);

  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  useEffect(() => {
    if (isOpen && groupId) {
      dispatch(fetchGroupDetail(groupId));
    }
  }, [isOpen, groupId, dispatch]);

  useEffect(() => {
    if (error) {
      setToast({ message: error, type: "error" });
    }
  }, [error]);

  if (!isOpen) return null;

  const getMemberDisplayName = (member: GroupStudent) => {
    if (!member) return "Member";
    const fullName = [member.firstName, member.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();
    return fullName || member.username || "Member";
  };

  const getRoleBadge = (role: string) => {
    if (role === "leader") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
          <Crown className="w-3 h-3" />
          Leader
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-xs font-semibold text-sky-700">
        <User className="w-3 h-3" />
        Member
      </span>
    );
  };

  const isCurrentUserMember = groupDetail?.students?.some(
    (member) =>
      `${member.userId ?? member.id}` === `${user?.userId}`
  );

  const handleLeaveGroup = async () => {
    if (!groupId) return;
    try {
      const result = await dispatch(leaveGroup(groupId)).unwrap();
      // Refresh groups data after leaving
      const classId = groupDetail?.class?.classId;
      if (classId) {
        dispatch(fetchGroupsByClass(classId));
        dispatch(fetchMyGroupByClass(classId));
      }
      // Show toast first, then close modal after a short delay
      setToast({ message: result?.message || "Left group successfully.", type: "success" });
      setTimeout(() => {
        onClose();
      }, 800);
    } catch (err: unknown) {
      setToast({
        message: err instanceof Error ? err.message : "Failed to leave group.",
        type: "error",
      });
    }
  };

  const handleViewTopics = () => {
    // Get classId from group detail and navigate to topics
    if (groupDetail?.classId || groupDetail?.class?.classId) {
      const classId = groupDetail.classId || groupDetail.class?.classId;
      navigate(`/student/class/${classId}`);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-2xl rounded-3xl border border-sky-200 bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-sky-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {groupDetail?.groupName || groupDetail?.name || "Group Details"}
              </h2>
              {groupDetail?.class?.classCode && (
                <p className="text-sm text-slate-500">
                  Class: {groupDetail.class.classCode}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-500 hover:bg-sky-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-sky-200 border-t-sky-500 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-600">Loading group details...</p>
              </div>
            </div>
          ) : groupDetail ? (
            <div className="space-y-6">
              {/* Group Info */}
              <div className="rounded-2xl bg-sky-50 border border-sky-100 p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Users className="w-4 h-4 text-sky-600" />
                    <span>
                      {groupDetail.memberCount ?? groupDetail.students?.length ?? 0} members
                    </span>
                  </div>
                  {groupDetail.description && (
                    <p className="text-sm text-slate-600 col-span-2">
                      {groupDetail.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Members List */}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Members ({groupDetail.students?.length ?? 0})
                </h3>
                <div className="space-y-2">
                  {groupDetail.students?.map((member, index) => {
                    const memberId = member.userId ?? member.id;
                    const isCurrentUser = `${memberId}` === `${user?.userId}`;
                    return (
                      <div
                        key={`${memberId ?? index}`}
                        className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-sky-500 to-cyan-500 flex items-center justify-center">
                            <span className="text-white font-semibold text-xs">
                              {getMemberDisplayName(member)
                                .split(" ")
                                .map((n: string) => n[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2)}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900 flex items-center gap-2">
                              {getMemberDisplayName(member)}
                              {isCurrentUser && (
                                <span className="text-xs text-sky-600">(You)</span>
                              )}
                            </p>
                            {member.email && (
                              <p className="text-xs text-slate-500">{member.email}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getRoleBadge(member.GroupStudent?.role || "member")}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-600">
              No group details available.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-3xl">
          <button
            onClick={handleLeaveGroup}
            disabled={actionLoading || !isCurrentUserMember}
            className="rounded-full border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Leave Group
          </button>
          <div className="flex items-center gap-3">
            <Button
              text="Close"
              variant="secondary"
              fontSize="14px"
              borderRadius="8px"
              paddingWidth="16px"
              paddingHeight="10px"
              onClick={onClose}
            />
            <Button
              text="View Topics"
              variant="primary"
              fontSize="14px"
              borderRadius="8px"
              paddingWidth="16px"
              paddingHeight="10px"
              onClick={handleViewTopics}
              disabled={!groupDetail?.classId && !groupDetail?.class?.classId}
            />
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 max-w-md">
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        </div>
      )}
    </div>
  );
};

export default GroupDetailModal;
