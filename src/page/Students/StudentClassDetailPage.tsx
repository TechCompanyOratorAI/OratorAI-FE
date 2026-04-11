import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import * as Tabs from "@radix-ui/react-tabs";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  Calendar,
  User,
  Users,
  BookOpen,
  CheckCircle2,
  Plus,
  Loader2,
  Clock,
  AlertTriangle,
  X,
} from "lucide-react";
import GroupDetailModal from "@/components/Group/GroupDetailModal";
import { useAppDispatch, useAppSelector } from "@/services/store/store";
import { fetchClassDetail } from "@/services/features/admin/classSlice";
import {
  fetchGroupsByClass,
  fetchMyGroupByClass,
  fetchGroupDetail,
  fetchGroupTopic,
  pickGroupTopic,
  createGroup,
  joinGroup,
  Group,
} from "@/services/features/group/groupSlice";
import StudentLayout from "@/components/StudentLayout/StudentLayout";

/* Deadline urgency helper */
const getDeadlineUrgency = (dueDate?: string) => {
  if (!dueDate) return null;
  const diff = new Date(dueDate).getTime() - Date.now();
  const hours = diff / (1000 * 60 * 60);
  if (hours < 0)
    return {
      label: "Đã hết hạn",
      color: "bg-red-100 text-red-700 border-red-200",
      dot: "bg-red-500",
    };
  if (hours < 24)
    return {
      label: "< 24 giờ",
      color: "bg-red-100 text-red-700 border-red-200",
      dot: "bg-red-500",
    };
  if (hours < 72)
    return {
      label: "< 3 ngày",
      color: "bg-amber-100 text-amber-700 border-amber-200",
      dot: "bg-amber-500",
    };
  return {
    label: new Date(dueDate).toLocaleDateString("vi-VN"),
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
  };
};

const StudentClassDetailPage: React.FC = () => {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const {
    selectedClass: classDetail,
    loading,
    error,
  } = useAppSelector((state) => state.class);
  const { user } = useAppSelector((state) => state.auth);
  const {
    groups,
    myGroupForClass,
    groupTopic,
    loading: groupLoading,
    actionLoading: groupActionLoading,
    classInfo: groupClassInfo,
    isEnrolled: isGroupEnrolled,
  } = useAppSelector((state) => state.group);

  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showGroupDetail, setShowGroupDetail] = useState(false);
  const [activeTab, setActiveTab] = useState("topics");
  const classIdNumber = classId ? parseInt(classId) : null;

  const myGroupId =
    myGroupForClass?.groupId != null ? Number(myGroupForClass.groupId) : null;

  useEffect(() => {
    if (classIdNumber) {
      dispatch(fetchClassDetail(classIdNumber));
      dispatch(fetchGroupsByClass(classIdNumber));
      dispatch(fetchMyGroupByClass(classIdNumber));
    }
  }, [classIdNumber, dispatch]);

  useEffect(() => {
    if (myGroupId != null && Number.isFinite(myGroupId)) {
      dispatch(fetchGroupTopic(myGroupId));
    }
  }, [myGroupId, dispatch]);

  useEffect(() => {
    if (loading || !classDetail || !user?.userId) return;
    const enrolled = classDetail.enrollments?.some(
      (e) => e.studentId === user.userId,
    );
    if (!enrolled) {
      toast.warning("Bạn cần ghi danh lớp này trước khi xem chi tiết.");
      navigate("/student/dashboard", { replace: true });
    }
  }, [loading, classDetail, user?.userId, navigate]);

  const isClassEnrolled = (targetClassId: number): boolean => {
    if (!classDetail || !user?.userId) return false;
    return (
      classDetail.classId === targetClassId &&
      !!classDetail.enrollments?.some(
        (enrollment: any) => enrollment.studentId === user.userId,
      )
    );
  };

  const getGroupId = (group: Group) => group.groupId ?? group.id;
  const getGroupName = (group: Group) =>
    group.groupName ?? group.name ?? "Group";
  const getMemberDisplayName = (member: any) => {
    if (!member) return "Member";
    const fullName = [member.firstName, member.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();
    return fullName || member.username || member.email || "Member";
  };
  const getLeaderName = (group: Group) => {
    const students = group.students || [];
    const leader = students.find((s) => s.GroupStudent?.role === "leader");
    return leader ? getMemberDisplayName(leader) : "Unknown";
  };

  const refreshGroups = () => {
    if (classIdNumber) {
      dispatch(fetchGroupsByClass(classIdNumber));
      dispatch(fetchMyGroupByClass(classIdNumber));
    }
  };

  const isMyGroupLeader = myGroupForClass?.myRole === "leader";

  const handleCreateGroup = async () => {
    if (!classIdNumber) return;
    const trimmedName = groupName.trim();
    if (!trimmedName) {
      toast.info("Vui lòng nhập tên nhóm.");
      return;
    }
    try {
      await dispatch(
        createGroup({
          classId: classIdNumber,
          groupName: trimmedName,
          description: groupDescription.trim() || undefined,
        }),
      ).unwrap();
      setGroupName("");
      setGroupDescription("");
      setIsCreateModalOpen(false);
      toast.success("Tạo nhóm thành công!");
      refreshGroups();
    } catch (err: any) {
      toast.error(err?.message || "Tạo nhóm thất bại.");
    }
  };

  const handleJoinGroup = async (groupId: string | number | undefined) => {
    if (!groupId) return;
    try {
      await dispatch(joinGroup(groupId)).unwrap();
      toast.success("Tham gia nhóm thành công!");
      refreshGroups();
    } catch (err: any) {
      toast.error(err?.message || "Tham gia nhóm thất bại.");
    }
  };

  const handlePickTopicForGroup = async (topicId: number) => {
    if (!myGroupId) return;
    try {
      await dispatch(pickGroupTopic({ groupId: myGroupId, topicId })).unwrap();
      toast.success("Đã chọn chủ đề cho nhóm.");
      await dispatch(fetchGroupTopic(myGroupId));
    } catch (err: any) {
      toast.error(err?.message || "Chọn chủ đề thất bại.");
    }
  };

  if (loading) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-500">Đang tải thông tin lớp...</p>
          </div>
        </div>
      </StudentLayout>
    );
  }

  if (error || !classDetail) {
    return (
      <StudentLayout>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mb-6">
            <ArrowLeft className="w-5 h-5" /> Quay lại
          </button>
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
            <p className="text-red-700 font-medium">
              {error || "Không tìm thấy lớp học"}
            </p>
          </div>
        </div>
      </StudentLayout>
    );
  }

  if (
    user?.userId &&
    !classDetail.enrollments?.some((e) => e.studentId === user.userId)
  ) {
    return (
      <StudentLayout>
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 px-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm text-slate-500">Đang chuyển hướng...</p>
        </div>
      </StudentLayout>
    );
  }

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const classDuration = Math.ceil(
    (new Date(classDetail.endDate).getTime() -
      new Date(classDetail.startDate).getTime()) /
    (1000 * 60 * 60 * 24),
  );
  const instructorName = classDetail.instructors?.length
    ? classDetail.instructors
      .map(
        (i) =>
          `${i.firstName || ""} ${i.lastName || ""}`.trim() || i.username,
      )
      .join(", ")
    : "Unknown Instructor";
  const courseInfo = classDetail.course;
  const classTitle = classDetail.className || classDetail.classCode;
  const enrollmentCount =
    classDetail.totalStudents ??
    classDetail.enrollmentCount ??
    classDetail.enrollments?.length ??
    0;
  const groupLimit =
    classDetail.maxGroupMembers ?? groupClassInfo?.maxGroupMembers ?? null;
  const topics = classDetail.topics ?? classDetail.course?.topics ?? [];

  return (
    <StudentLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-medium transition">
            <ArrowLeft className="w-4 h-4" /> Quay lại
          </button>
          <span className="text-slate-300">/</span>
          <span className="text-slate-500 truncate">{classTitle}</span>
        </div>

        {/* Hero Banner */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white shadow-xl shadow-blue-200/40 p-6 sm:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_60%)]" />
          <div className="absolute -bottom-8 -right-8 w-48 h-48 bg-white/5 rounded-full" />

          {/* Hai cột: trái tiêu đề — phải thống kê (lưới đều, không trống một bên) */}
          <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-stretch lg:justify-between lg:gap-8 xl:gap-10">
            <div className="min-w-0 flex-1 flex flex-col justify-center gap-3 lg:max-w-[48%] xl:max-w-[42%]">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold ${classDetail.status === "active" ? "bg-emerald-400/30 text-white" : "bg-white/20 text-white/80"}`}>
                  {classDetail.status === "active" ? "✓ Đang mở" : "Đã đóng"}
                </span>
                <span className="bg-white/20 text-white/90 text-xs px-2.5 py-1 rounded-full font-mono">
                  {classDetail.classCode}
                </span>
                {classId && isClassEnrolled(parseInt(classId)) && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/20 text-white rounded-full text-xs font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Đã ghi danh
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold leading-tight">
                {classTitle}
              </h1>
              <p className="text-white/80 text-sm sm:text-base">
                {courseInfo?.courseCode && courseInfo?.courseName
                  ? `${courseInfo.courseCode} — ${courseInfo.courseName}`
                  : classDetail.classCode}
                {courseInfo?.semester && courseInfo?.academicYear && (
                  <span className="block sm:inline sm:before:content-['_•_'] sm:before:whitespace-pre">
                    {courseInfo.semester} — {courseInfo.academicYear}
                  </span>
                )}
              </p>
            </div>

            <div className="w-full min-w-0 flex-1 lg:min-w-[min(100%,20rem)]">
              <div className="grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-4 xl:gap-3 h-full">
                {[
                  { icon: Calendar, label: "Thời lượng", value: `${classDuration} ngày` },
                  {
                    icon: Users,
                    label: "Học viên",
                    value: `${enrollmentCount}${classDetail.maxStudents ? ` / ${classDetail.maxStudents}` : ""}`,
                  },
                  { icon: User, label: "Giảng viên", value: instructorName },
                  { icon: BookOpen, label: "Chủ đề", value: `${topics.length}` },
                ].map(({ icon: Icon, label, value }, i) => (
                  <div
                    key={i}
                    className="flex min-h-[4.5rem] flex-col justify-center gap-1 rounded-xl border border-white/25 bg-white/15 px-3 py-2.5 text-center backdrop-blur-sm sm:min-h-[5rem] sm:px-3.5 sm:py-3">
                    <Icon className="mx-auto h-4 w-4 shrink-0 text-white/85 sm:h-5 sm:w-5" />
                    <span className="text-[10px] font-medium uppercase tracking-wide text-white/60 sm:text-[11px]">
                      {label}
                    </span>
                    <span className="line-clamp-2 break-words text-xs font-semibold leading-snug text-white sm:text-sm">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
          <Tabs.List className="flex gap-1 bg-white border border-slate-200 rounded-2xl p-1 shadow-sm">
            {[
              { value: "topics", label: "Chủ đề", icon: BookOpen },
              { value: "groups", label: "Nhóm học", icon: Users },
              { value: "info", label: "Thông tin lớp", icon: User },
            ].map(({ value, label, icon: Icon }) => (
              <Tabs.Trigger
                key={value}
                value={value}
                className={`relative flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${activeTab === value ? "text-blue-700 bg-blue-50 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"}`}>
                <Icon className="w-4 h-4" />
                {label}
              </Tabs.Trigger>
            ))}
          </Tabs.List>

          {/* Topics Tab */}
          <Tabs.Content value="topics" className="mt-4 outline-none">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Chủ đề thuyết trình
                  </h3>
                  <p className="text-sm text-slate-500">
                    {topics.length} chủ đề trong lớp này
                  </p>
                </div>
                <span className="bg-blue-100 text-blue-700 text-sm font-semibold px-3 py-1.5 rounded-full">
                  {topics.length} chủ đề
                </span>
              </div>

              {topics.length > 0 ? (
                <div className="space-y-3">
                  {topics.map((topic) => {
                    const isTopicEnrolled = Boolean(
                      myGroupForClass &&
                      groupTopic?.topicId === topic.topicId,
                    );
                    const urgency = getDeadlineUrgency(topic.dueDate);
                    return (
                      <motion.div
                        key={topic.topicId}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="group flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-blue-200 hover:shadow-md bg-slate-50/50 hover:bg-white transition-all duration-200">
                        {/* Sequence number */}
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                          {topic.sequenceNumber}
                        </div>

                        {/* Topic info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-slate-900 truncate">
                            {topic.topicName}
                          </h4>
                          {topic.description && (
                            <p className="text-sm text-slate-500 mt-0.5 line-clamp-1">
                              {topic.description}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-2 mt-2">
                            {urgency && (
                              <span
                                className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-medium ${urgency.color}`}>
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${urgency.dot}`}
                                />
                                Hạn: {urgency.label}
                              </span>
                            )}
                            {topic.maxDurationMinutes && (
                              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                                <Clock className="w-3 h-3" />{" "}
                                {topic.maxDurationMinutes} phút
                              </span>
                            )}
                            {isTopicEnrolled && (
                              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 font-medium">
                                <CheckCircle2 className="w-3 h-3" />{" "}
                                Đã ghi danh (nhóm)
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          {isGroupEnrolled &&
                            myGroupForClass &&
                            !groupTopic &&
                            !isTopicEnrolled &&
                            isMyGroupLeader &&
                            myGroupId && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePickTopicForGroup(topic.topicId);
                                }}
                                disabled={groupActionLoading}
                                className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition disabled:opacity-50">
                                {groupActionLoading ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Plus className="w-3 h-3" />
                                )}
                                Chọn cho nhóm
                              </button>
                            )}
                          {!isGroupEnrolled && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toast.info("Bạn cần ghi danh lớp trước.");
                              }}
                              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-slate-100 text-slate-500 font-semibold cursor-not-allowed">
                              <Plus className="w-3 h-3" /> Ghi danh
                            </button>
                          )}
                          <button
                            onClick={() =>
                              navigate(
                                `/student/class/${classId}/topic/${topic.topicId}`,
                              )
                            }
                            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border border-blue-200 text-blue-700 font-semibold hover:bg-blue-50 transition">
                            Xem chi tiết
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 p-10 text-center">
                  <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">
                    Chưa có chủ đề nào. Giảng viên sẽ thêm khi sẵn sàng.
                  </p>
                </div>
              )}
            </div>
          </Tabs.Content>

          {/* Groups Tab */}
          <Tabs.Content value="groups" className="mt-4 outline-none">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Nhóm làm việc
                  </h3>
                  <p className="text-sm text-slate-500">
                    {groups.length} nhóm trong lớp này
                    {groupLimit
                      ? ` • Tối đa ${groupLimit} thành viên/nhóm`
                      : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {!myGroupForClass && isGroupEnrolled && (
                    <button
                      onClick={() => setIsCreateModalOpen(true)}
                      className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-4 py-2 rounded-xl transition shadow-sm">
                      <Plus className="w-4 h-4" /> Tạo nhóm
                    </button>
                  )}
                  {myGroupForClass && (
                    <button
                      onClick={() => {
                        if (myGroupForClass.groupId)
                          dispatch(
                            fetchGroupDetail(Number(myGroupForClass.groupId)),
                          );
                        setShowGroupDetail(true);
                      }}
                      className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-4 py-2 rounded-xl transition shadow-sm">
                      <Users className="w-4 h-4" /> Nhóm của bạn:{" "}
                      {getGroupName(myGroupForClass)}
                    </button>
                  )}
                </div>
              </div>

              {!isGroupEnrolled && (
                <div className="mb-5 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  Bạn cần ghi danh lớp trước khi tham gia hoặc tạo nhóm.
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                {groupLoading ? (
                  [...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className="rounded-xl border border-slate-200 p-4 animate-pulse">
                      <div className="h-4 bg-slate-200 rounded w-1/2 mb-2" />
                      <div className="h-3 bg-slate-100 rounded w-1/3" />
                    </div>
                  ))
                ) : groups.length ? (
                  groups.map((group) => {
                    const groupId = getGroupId(group);
                    const isMyGroup =
                      myGroupForClass &&
                      `${getGroupId(myGroupForClass)}` === `${groupId}`;
                    const memberCount =
                      group.memberCount ?? group.students?.length ?? 0;
                    const isFull =
                      memberCount >=
                      (group.maxGroupMembers || groupLimit || 0) &&
                      (group.maxGroupMembers || groupLimit);
                    return (
                      <div
                        key={`${groupId ?? group.name}`}
                        className={`rounded-xl border p-4 transition cursor-pointer hover:shadow-md ${isMyGroup ? "border-emerald-300 bg-emerald-50/50 ring-1 ring-emerald-300" : "border-slate-200 bg-slate-50/50 hover:bg-white hover:border-blue-200"}`}
                        onClick={() => {
                          if (isMyGroup) {
                            dispatch(fetchGroupDetail(Number(groupId)));
                            setShowGroupDetail(true);
                          }
                        }}>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-slate-900">
                              {getGroupName(group)}
                            </p>
                            {isMyGroup && (
                              <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full">
                                Nhóm của bạn
                              </span>
                            )}
                          </div>
                          {!myGroupForClass &&
                            (isFull ? (
                              <span className="text-xs text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full font-medium">
                                Đã đủ
                              </span>
                            ) : group.isMember ? (
                              <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Đã tham gia
                              </span>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleJoinGroup(groupId);
                                }}
                                disabled={
                                  groupActionLoading ||
                                  !groupId ||
                                  !isGroupEnrolled
                                }
                                className="text-xs bg-blue-600 text-white px-3 py-1 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50">
                                Tham gia
                              </button>
                            ))}
                        </div>
                        {group.description && (
                          <p className="text-sm text-slate-500 mb-2 line-clamp-2">
                            {group.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Users className="w-3.5 h-3.5" />
                          {memberCount}
                          {groupLimit ? `/${groupLimit}` : ""} thành viên
                          {memberCount > 0 && (
                            <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-500 rounded-full transition-all"
                                style={{
                                  width: `${groupLimit ? Math.min((memberCount / groupLimit) * 100, 100) : 0}%`,
                                }}
                              />
                            </div>
                          )}
                          <span className="text-xs text-slate-400">
                            Trưởng: {getLeaderName(group)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-2 rounded-xl border border-dashed border-slate-200 p-10 text-center">
                    <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 text-sm">
                      Chưa có nhóm nào. Hãy tạo nhóm đầu tiên!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Tabs.Content>

          {/* Info Tab */}
          <Tabs.Content value="info" className="mt-4 outline-none">
            <div
              className={`max-w-4xl mx-auto w-full grid gap-4 ${classDetail.description ? "sm:grid-cols-2" : ""}`}>
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 min-w-0">
                <h3 className="text-base font-bold text-slate-900 mb-4">
                  Thông tin lớp
                </h3>
                <div className="overflow-hidden rounded-xl border border-slate-100 text-sm">
                  {[
                    { label: "Mã lớp", value: classDetail.classCode },
                    {
                      label: "Môn học",
                      value: courseInfo
                        ? `${courseInfo.courseCode} — ${courseInfo.courseName}`
                        : "N/A",
                    },
                    {
                      label: "Học kỳ",
                      value: courseInfo
                        ? `${courseInfo.semester} ${courseInfo.academicYear}`
                        : "N/A",
                    },
                    {
                      label: "Ngày bắt đầu",
                      value: formatDate(classDetail.startDate),
                    },
                    {
                      label: "Ngày kết thúc",
                      value: formatDate(classDetail.endDate),
                    },
                    { label: "Thời lượng", value: `${classDuration} ngày` },
                    { label: "Giảng viên", value: instructorName },
                    {
                      label: "Số học viên",
                      value: `${enrollmentCount}${classDetail.maxStudents ? `/${classDetail.maxStudents}` : ""}`,
                    },
                  ].map(({ label, value }, rowIndex) => (
                    <div
                      key={label}
                      className={`flex flex-col gap-0.5 px-3 py-2.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4 sm:px-4 ${
                        rowIndex % 2 === 0 ? "bg-white" : "bg-slate-50"
                      }`}>
                      <span className="shrink-0 text-slate-500 sm:min-w-[5.5rem]">
                        {label}
                      </span>
                      <span className="min-w-0 flex-1 font-semibold text-slate-900 sm:text-right break-words">
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              {classDetail.description && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                  <h3 className="text-base font-bold text-slate-900 mb-3">
                    Mô tả
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {classDetail.description}
                  </p>
                </div>
              )}
            </div>
          </Tabs.Content>
        </Tabs.Root>
      </div>

      {/* Create Group Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setIsCreateModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    Tạo nhóm mới
                  </h3>
                  <p className="text-sm text-slate-500 mt-0.5">
                    Nhóm của bạn sẽ tham gia lớp này
                  </p>
                </div>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-xl transition">
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Tên nhóm *
                  </label>
                  <input
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="Nhập tên nhóm"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={groupActionLoading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Mô tả{" "}
                    <span className="text-slate-400 font-normal">
                      (tùy chọn)
                    </span>
                  </label>
                  <textarea
                    value={groupDescription}
                    onChange={(e) => setGroupDescription(e.target.value)}
                    placeholder="Mô tả nhóm..."
                    rows={3}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    disabled={groupActionLoading}
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition">
                  Hủy
                </button>
                <button
                  onClick={handleCreateGroup}
                  disabled={groupActionLoading || !groupName.trim()}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition disabled:opacity-50">
                  {groupActionLoading ? "Đang tạo..." : "Tạo nhóm"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Group Detail Modal */}
      {showGroupDetail && myGroupForClass?.groupId && (
        <GroupDetailModal
          isOpen={showGroupDetail}
          onClose={() => setShowGroupDetail(false)}
          groupId={Number(myGroupForClass.groupId)}
        />
      )}
    </StudentLayout>
  );
};

export default StudentClassDetailPage;
