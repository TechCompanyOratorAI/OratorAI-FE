import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import {
  Button,
  Typography,
  Progress,
  Empty,
  Alert,
  Skeleton,
  Tooltip,
} from "antd";
import {
  ArrowLeft,
  Calendar,
  Users,
  User,
  BookOpen,
  CheckCircle2,
  Plus,
  Loader2,
  Clock,
  AlertTriangle,
  BookMarked,
  ChevronRight,
  GraduationCap,
  Hash,
} from "lucide-react";
import GroupDetailModal from "@/components/Group/GroupDetailModal";
import CreateGroupModal from "@/components/Group/CreateGroupModal";
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

const { Text, Paragraph } = Typography;

const getDeadlineUrgency = (dueDate?: string) => {
  if (!dueDate) return null;
  const diff = new Date(dueDate).getTime() - Date.now();
  const hours = diff / (1000 * 60 * 60);
  if (hours < 0)
    return {
      label: "Đã hết hạn",
      cls: "text-red-600 bg-red-50 border-red-200",
    };
  if (hours < 24)
    return { label: "< 24 giờ", cls: "text-red-600 bg-red-50 border-red-200" };
  if (hours < 72)
    return {
      label: "< 3 ngày",
      cls: "text-amber-600 bg-amber-50 border-amber-200",
    };
  return {
    label: new Date(dueDate).toLocaleDateString("vi-VN"),
    cls: "text-emerald-700 bg-emerald-50 border-emerald-200",
  };
};

type TabKey = "topics" | "groups";

const StudentClassDetailPage: React.FC = () => {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const {
    selectedClass: classDetail,
    loading,
    error,
  } = useAppSelector((s) => s.class);
  const { user } = useAppSelector((s) => s.auth);
  const {
    groups,
    myGroupForClass,
    groupTopic,
    loading: groupLoading,
    actionLoading: groupActionLoading,
    classInfo: groupClassInfo,
    isEnrolled: isGroupEnrolled,
  } = useAppSelector((s) => s.group);

  const [activeTab, setActiveTab] = useState<TabKey>("topics");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showGroupDetail, setShowGroupDetail] = useState(false);

  const classIdNumber = useMemo(
    () => (classId ? parseInt(classId) : null),
    [classId],
  );
  const myGroupId = useMemo(
    () =>
      myGroupForClass?.groupId != null ? Number(myGroupForClass.groupId) : null,
    [myGroupForClass?.groupId],
  );

  const isMyGroupLeader = myGroupForClass?.myRole === "leader";

  const classDuration = useMemo(() => {
    if (!classDetail) return 0;
    return Math.ceil(
      (new Date(classDetail.endDate).getTime() -
        new Date(classDetail.startDate).getTime()) /
        (1000 * 60 * 60 * 24),
    );
  }, [classDetail]);

  const instructorName = useMemo(() => {
    if (!classDetail?.instructors?.length) return "Unknown Instructor";
    return classDetail.instructors
      .map(
        (i) => `${i.firstName || ""} ${i.lastName || ""}`.trim() || i.username,
      )
      .join(", ");
  }, [classDetail]);

  const courseInfo = classDetail?.course;
  const classTitle = classDetail?.className || classDetail?.classCode || "";
  const enrollmentCount = useMemo(
    () =>
      classDetail?.totalStudents ??
      classDetail?.enrollmentCount ??
      classDetail?.enrollments?.length ??
      0,
    [classDetail],
  );
  const groupLimit = useMemo(
    () =>
      classDetail?.maxGroupMembers ?? groupClassInfo?.maxGroupMembers ?? null,
    [classDetail, groupClassInfo],
  );
  const topics = useMemo(
    () => classDetail?.topics ?? classDetail?.course?.topics ?? [],
    [classDetail],
  );

  const isEnrolledInClass = useMemo(() => {
    if (!classDetail || !user?.userId || !classId) return false;
    return (
      classDetail.classId === parseInt(classId) &&
      !!classDetail.enrollments?.some((e: any) => e.studentId === user.userId)
    );
  }, [classDetail, user?.userId, classId]);

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
      toast.warning("Bạn cần tham gia lớp này trước khi xem chi tiết.");
      navigate("/student/dashboard", { replace: true });
    }
  }, [loading, classDetail, user?.userId, navigate]);

  const refreshGroups = useCallback(() => {
    if (classIdNumber) {
      dispatch(fetchGroupsByClass(classIdNumber));
      dispatch(fetchMyGroupByClass(classIdNumber));
    }
  }, [classIdNumber, dispatch]);

  const getGroupId = useCallback(
    (group: Group) => group.groupId ?? group.id,
    [],
  );
  const getGroupName = useCallback(
    (group: Group) => group.groupName ?? group.name ?? "Group",
    [],
  );

  const getMemberDisplayName = useCallback((member: any) => {
    if (!member) return "Member";
    const fullName = [member.firstName, member.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();
    return fullName || member.username || member.email || "Member";
  }, []);

  const getLeaderName = useCallback(
    (group: Group) => {
      const leader = (group.students || []).find(
        (s) => s.GroupStudent?.role === "leader",
      );
      return leader ? getMemberDisplayName(leader) : "Unknown";
    },
    [getMemberDisplayName],
  );

  const handleJoinGroup = useCallback(
    async (groupId: string | number | undefined) => {
      if (!groupId) return;
      try {
        await dispatch(joinGroup(groupId)).unwrap();
        toast.success("Tham gia nhóm thành công!");
        refreshGroups();
      } catch (err: any) {
        toast.error(err?.message || "Tham gia nhóm thất bại.");
      }
    },
    [dispatch, refreshGroups],
  );

  const handlePickTopicForGroup = useCallback(
    async (topicId: number) => {
      if (!myGroupId) return;
      try {
        await dispatch(
          pickGroupTopic({ groupId: myGroupId, topicId }),
        ).unwrap();
        toast.success("Đã chọn chủ đề cho nhóm.");
        await dispatch(fetchGroupTopic(myGroupId));
      } catch (err: any) {
        toast.error(err?.message || "Chọn chủ đề thất bại.");
      }
    },
    [myGroupId, dispatch],
  );

  const openGroupDetail = useCallback(
    (groupId: number) => {
      dispatch(fetchGroupDetail(groupId));
      setShowGroupDetail(true);
    },
    [dispatch],
  );

  /* ── Loading ── */
  if (loading) {
    return (
      <StudentLayout>
        <div className="max-w-7xl mx-auto px-4 py-10 space-y-6">
          <Skeleton active paragraph={{ rows: 2 }} />
          <Skeleton active paragraph={{ rows: 6 }} />
        </div>
      </StudentLayout>
    );
  }

  /* ── Error ── */
  if (error || !classDetail) {
    return (
      <StudentLayout>
        <div className="max-w-7xl mx-auto px-4 py-10">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-6"
          >
            <ArrowLeft size={15} /> Quay lại
          </button>
          <Alert
            type="error"
            message="Không thể tải thông tin lớp"
            description={error || "Không tìm thấy lớp học"}
            showIcon
          />
        </div>
      </StudentLayout>
    );
  }

  /* ── Not enrolled redirect guard ── */
  if (
    user?.userId &&
    !classDetail.enrollments?.some((e) => e.studentId === user.userId)
  ) {
    return (
      <StudentLayout>
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
          <Loader2 size={28} className="text-slate-400 animate-spin" />
          <Text type="secondary" className="text-sm">
            Đang chuyển hướng...
          </Text>
        </div>
      </StudentLayout>
    );
  }

  const tabs: {
    key: TabKey;
    label: string;
    icon: React.ReactNode;
    count: number;
  }[] = [
    {
      key: "topics",
      label: "Chủ đề",
      icon: <BookOpen size={15} />,
      count: topics.length,
    },
    {
      key: "groups",
      label: "Nhóm học",
      icon: <Users size={15} />,
      count: groups.length,
    },
  ];

  return (
    <StudentLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        <nav className="flex items-center gap-2 text-sm text-slate-400">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 hover:text-slate-700 transition-colors"
          >
            <ArrowLeft size={14} /> Quay lại
          </button>
          <ChevronRight size={13} />
          <span className="text-slate-600 font-medium truncate">{classTitle}</span>
        </nav>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="grid gap-4 lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)]"
        >
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-sm">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${
                  classDetail.status === "active"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : "bg-slate-100 border-slate-200 text-slate-500"
                }`}
              >
                {classDetail.status === "active" ? (
                  <>
                    <CheckCircle2 size={11} /> Đang mở
                  </>
                ) : (
                  "Đã đóng"
                )}
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-500">
                <Hash size={10} />
                {classDetail.classCode}
              </span>
              {isEnrolledInClass && (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700">
                  <CheckCircle2 size={11} /> Đã tham gia
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight mb-1">
              {classTitle}
            </h1>
            <p className="text-sm text-slate-500 mb-1">
              {courseInfo?.courseCode && courseInfo?.courseName
                ? `${courseInfo.courseCode} - ${courseInfo.courseName}`
                : classDetail.classCode}
              {courseInfo?.semester && courseInfo?.academicYear && (
                <span className="ml-2 text-slate-400">
                  · {courseInfo.semester} / {courseInfo.academicYear}
                </span>
              )}
            </p>
            <p className="flex items-center gap-1.5 text-slate-500 text-sm mb-5">
              <GraduationCap size={14} className="text-slate-400" />
              Giảng viên:{" "}
              <span className="font-medium text-slate-700">{instructorName}</span>
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: <Calendar size={14} />, value: classDuration, label: "ngày học" },
                {
                  icon: <Users size={14} />,
                  value: enrollmentCount,
                  label: classDetail?.maxStudents
                    ? `/ ${classDetail.maxStudents} học viên`
                    : "học viên",
                },
                { icon: <BookMarked size={14} />, value: topics.length, label: "chủ đề" },
                {
                  icon: <Users size={14} />,
                  value: groups.length,
                  label: groupLimit ? `/ ${groupLimit} TV / nhóm` : "nhóm",
                },
              ].map((s, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5"
                >
                  <div className="flex items-center gap-2 text-slate-400 text-xs">
                    {s.icon}
                    <span>{s.label}</span>
                  </div>
                  <div className="text-xl font-bold text-slate-900 mt-1">{s.value}</div>
                </div>
              ))}
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm h-full">
              <h3 className="text-sm font-semibold text-slate-900 m-0">
                Trung tâm thao tác
              </h3>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                Các thao tác nhanh theo trạng thái lớp học của bạn.
              </p>

              <div className="space-y-2">
                <Button
                  block
                  type={activeTab === "topics" ? "primary" : "default"}
                  className="!rounded-xl"
                  onClick={() => setActiveTab("topics")}
                >
                  Mở danh sách chủ đề
                </Button>
                <Button
                  block
                  type={activeTab === "groups" ? "primary" : "default"}
                  className="!rounded-xl"
                  onClick={() => setActiveTab("groups")}
                >
                  Mở danh sách nhóm
                </Button>
                {myGroupForClass?.groupId && (
                  <Button
                    block
                    className="!rounded-xl"
                    onClick={() => openGroupDetail(Number(myGroupForClass.groupId))}
                  >
                    Xem chi tiết nhóm của bạn
                  </Button>
                )}
                {!myGroupForClass && isGroupEnrolled && (
                  <Button
                    block
                    type="primary"
                    icon={<Plus size={14} />}
                    className="!rounded-xl"
                    onClick={() => setIsCreateModalOpen(true)}
                  >
                    Tạo nhóm mới
                  </Button>
                )}
              </div>

              <div className="mt-4 space-y-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <p className="m-0 text-xs text-slate-500">Nhóm hiện tại</p>
                  <p className="m-0 mt-0.5 text-sm font-medium text-slate-900">
                    {myGroupForClass ? getGroupName(myGroupForClass) : "Chưa tham gia nhóm"}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <p className="m-0 text-xs text-slate-500">Chủ đề của nhóm</p>
                  <p className="m-0 mt-0.5 text-sm font-medium text-slate-900 truncate">
                    {groupTopic?.topicName || "Chưa chọn chủ đề"}
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </motion.div>

        <div className="rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
          <div className="grid grid-cols-2 gap-1">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  activeTab === t.key
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {t.icon}
                {t.label}
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full ${
                    activeTab === t.key ? "bg-white/20" : "bg-slate-100"
                  }`}
                >
                  {t.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "topics" && (
            <motion.div
              key="topics"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden"
            >
              <div className="px-6 py-5 border-b border-slate-100">
                <h2 className="text-base font-semibold text-slate-900 m-0">Chủ đề thuyết trình</h2>
                <p className="text-sm text-slate-400 m-0 mt-0.5">
                  Chọn chủ đề phù hợp và theo dõi hạn nộp của từng chủ đề.
                </p>
              </div>

              {topics.length > 0 ? (
                <ol className="list-none p-4 sm:p-5 m-0 grid gap-3">
                  {topics.map((topic, idx) => {
                    const isTopicSelected = Boolean(
                      myGroupForClass && groupTopic?.topicId === topic.topicId,
                    );
                    const urgency = getDeadlineUrgency(topic.dueDate);
                    return (
                      <motion.li
                        key={topic.topicId}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.03 }}
                        className="rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-4"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-md bg-slate-200 text-xs font-semibold text-slate-700">
                                {topic.sequenceNumber}
                              </span>
                              <h3 className="m-0 text-sm sm:text-base font-semibold text-slate-900 truncate">
                                {topic.topicName}
                              </h3>
                            </div>
                            {topic.description && (
                              <p className="m-0 text-xs text-slate-500 line-clamp-2">
                                {topic.description}
                              </p>
                            )}
                            <div className="mt-2 flex flex-wrap items-center gap-1.5">
                              {urgency && (
                                <span
                                  className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full border font-medium ${urgency.cls}`}
                                >
                                  Hạn: {urgency.label}
                                </span>
                              )}
                              {topic.maxDurationMinutes && (
                                <span className="inline-flex items-center gap-1 text-xs text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
                                  <Clock size={10} />
                                  {topic.maxDurationMinutes} phút
                                </span>
                              )}
                              {isTopicSelected && (
                                <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                  <CheckCircle2 size={10} /> Nhóm đã chọn
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {isGroupEnrolled &&
                              myGroupForClass &&
                              !groupTopic &&
                              !isTopicSelected &&
                              isMyGroupLeader &&
                              myGroupId && (
                                <Button
                                  type="primary"
                                  size="small"
                                  icon={
                                    groupActionLoading ? (
                                      <Loader2 size={12} className="animate-spin" />
                                    ) : (
                                      <Plus size={12} />
                                    )
                                  }
                                  loading={groupActionLoading}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handlePickTopicForGroup(topic.topicId);
                                  }}
                                  className="!rounded-full"
                                >
                                  Chọn
                                </Button>
                              )}
                            {!isGroupEnrolled && (
                              <Tooltip title="Bạn cần tham gia lớp trước">
                                <Button
                                  size="small"
                                  disabled
                                  icon={<Plus size={12} />}
                                  className="!rounded-full"
                                >
                                  Tham gia
                                </Button>
                              </Tooltip>
                            )}
                            <Button
                              size="small"
                              className="!rounded-full"
                              onClick={() =>
                                navigate(`/student/class/${classId}/topic/${topic.topicId}`)
                              }
                            >
                              Xem chi tiết
                            </Button>
                          </div>
                        </div>
                      </motion.li>
                    );
                  })}
                </ol>
              ) : (
                <div className="py-16">
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="Chưa có chủ đề nào. Giảng viên sẽ thêm khi sẵn sàng."
                  />
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "groups" && (
            <motion.div
              key="groups"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-5 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-semibold text-slate-900 m-0">Nhóm làm việc</h2>
                  <p className="text-sm text-slate-400 m-0 mt-0.5">
                    Quản lý và tham gia nhóm phù hợp cho lớp học này.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {myGroupForClass && (
                    <Button
                      icon={<Users size={14} />}
                      className="!rounded-xl"
                      onClick={() => {
                        if (myGroupForClass.groupId)
                          openGroupDetail(Number(myGroupForClass.groupId));
                      }}
                    >
                      Nhóm của bạn
                    </Button>
                  )}
                  {!myGroupForClass && isGroupEnrolled && (
                    <Button
                      type="primary"
                      icon={<Plus size={14} />}
                      className="!rounded-xl"
                      onClick={() => setIsCreateModalOpen(true)}
                    >
                      Tạo nhóm
                    </Button>
                  )}
                </div>
              </div>

              {!isGroupEnrolled && (
                <div className="px-6 pt-5">
                  <Alert
                    type="warning"
                    icon={<AlertTriangle size={14} />}
                    showIcon
                    message="Bạn cần tham gia lớp trước khi tham gia hoặc tạo nhóm."
                    className="!rounded-xl"
                  />
                </div>
              )}

              <div className="p-6">
                {groupLoading ? (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[...Array(6)].map((_, i) => (
                      <Skeleton key={i} active paragraph={{ rows: 2 }} />
                    ))}
                  </div>
                ) : groups.length ? (
                  <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 list-none p-0 m-0">
                    {groups.map((group) => {
                      const groupId = getGroupId(group);
                      const isMyGroup =
                        myGroupForClass &&
                        `${getGroupId(myGroupForClass)}` === `${groupId}`;
                      const memberCount = group.memberCount ?? group.students?.length ?? 0;
                      const maxMembers = group.maxGroupMembers || groupLimit || 0;
                      const isFull = maxMembers > 0 && memberCount >= maxMembers;
                      const fillPct =
                        maxMembers > 0 ? Math.min((memberCount / maxMembers) * 100, 100) : 0;
                      const leaderName = getLeaderName(group);
                      const groupName = getGroupName(group);

                      return (
                        <li key={`${groupId ?? group.name}`}>
                          <article
                            className={`rounded-2xl border p-4 transition-all duration-200 ${
                              isMyGroup
                                ? "border-slate-800 bg-slate-800 cursor-pointer"
                                : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
                            }`}
                            onClick={() => {
                              if (isMyGroup && groupId) openGroupDetail(Number(groupId));
                            }}
                          >
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <h3
                                className={`font-semibold text-sm m-0 ${isMyGroup ? "text-white" : "text-slate-900"}`}
                              >
                                {groupName}
                              </h3>
                              <div onClick={(e) => e.stopPropagation()}>
                                {!myGroupForClass &&
                                  (isFull ? (
                                    <span className="text-xs text-slate-400 font-medium">Đã đủ</span>
                                  ) : group.isMember ? (
                                    <span className="inline-flex items-center gap-1 text-xs text-emerald-700">
                                      <CheckCircle2 size={12} /> Đã tham gia
                                    </span>
                                  ) : (
                                    <Button
                                      type="primary"
                                      size="small"
                                      loading={groupActionLoading}
                                      disabled={!groupId || !isGroupEnrolled}
                                      onClick={() => handleJoinGroup(groupId)}
                                      className="!rounded-lg"
                                    >
                                      Tham gia
                                    </Button>
                                  ))}
                              </div>
                            </div>

                            {group.description && (
                              <Paragraph
                                ellipsis={{ rows: 2 }}
                                className={`!text-xs !mb-2 ${isMyGroup ? "!text-slate-200" : "!text-slate-500"}`}
                              >
                                {group.description}
                              </Paragraph>
                            )}

                            <div className="space-y-1.5">
                              <div
                                className={`flex items-center justify-between text-xs font-medium ${isMyGroup ? "text-slate-200" : "text-slate-600"}`}
                              >
                                <span className="flex items-center gap-1">
                                  <Users size={11} />
                                  {memberCount}
                                  {maxMembers ? `/${maxMembers}` : ""} thành viên
                                </span>
                                <span className="flex items-center gap-1">
                                  <User size={11} /> {leaderName}
                                </span>
                              </div>
                              {maxMembers > 0 && (
                                <Progress
                                  percent={fillPct}
                                  showInfo={false}
                                  size="small"
                                  strokeColor={
                                    isMyGroup ? "#ffffff" : isFull ? "#94a3b8" : "#0f172a"
                                  }
                                  trailColor={
                                    isMyGroup ? "rgba(255,255,255,0.15)" : "#e2e8f0"
                                  }
                                />
                              )}
                            </div>
                          </article>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div className="py-12">
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description="Chưa có nhóm nào. Hãy tạo nhóm đầu tiên!"
                    />
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <CreateGroupModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={async (groupName, description) => {
          if (!classIdNumber) return;
          await dispatch(
            createGroup({
              classId: classIdNumber,
              groupName,
              description,
            }),
          ).unwrap();
          toast.success("Tạo nhóm thành công!");
          refreshGroups();
        }}
        isLoading={groupActionLoading}
      />

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
