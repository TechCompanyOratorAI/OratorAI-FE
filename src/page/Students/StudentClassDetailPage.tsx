import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import {
  Button,
  Modal,
  Form,
  Input,
  Typography,
  Progress,
  Empty,
  Alert,
  Skeleton,
  Space,
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
const { TextArea } = Input;

const getDeadlineUrgency = (dueDate?: string) => {
  if (!dueDate) return null;
  const diff = new Date(dueDate).getTime() - Date.now();
  const hours = diff / (1000 * 60 * 60);
  if (hours < 0) return { label: "Đã hết hạn", cls: "text-red-600 bg-red-50 border-red-200" };
  if (hours < 24) return { label: "< 24 giờ", cls: "text-red-600 bg-red-50 border-red-200" };
  if (hours < 72) return { label: "< 3 ngày", cls: "text-amber-600 bg-amber-50 border-amber-200" };
  return { label: new Date(dueDate).toLocaleDateString("vi-VN"), cls: "text-emerald-700 bg-emerald-50 border-emerald-200" };
};

type TabKey = "topics" | "groups";

const StudentClassDetailPage: React.FC = () => {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { selectedClass: classDetail, loading, error } = useAppSelector((s) => s.class);
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

  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState<TabKey>("topics");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showGroupDetail, setShowGroupDetail] = useState(false);

  const classIdNumber = useMemo(() => (classId ? parseInt(classId) : null), [classId]);
  const myGroupId = useMemo(
    () => (myGroupForClass?.groupId != null ? Number(myGroupForClass.groupId) : null),
    [myGroupForClass?.groupId],
  );

  const isMyGroupLeader = myGroupForClass?.myRole === "leader";

  const classDuration = useMemo(() => {
    if (!classDetail) return 0;
    return Math.ceil(
      (new Date(classDetail.endDate).getTime() - new Date(classDetail.startDate).getTime()) /
        (1000 * 60 * 60 * 24),
    );
  }, [classDetail]);

  const instructorName = useMemo(() => {
    if (!classDetail?.instructors?.length) return "Unknown Instructor";
    return classDetail.instructors
      .map((i) => `${i.firstName || ""} ${i.lastName || ""}`.trim() || i.username)
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
    () => classDetail?.maxGroupMembers ?? groupClassInfo?.maxGroupMembers ?? null,
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
    const enrolled = classDetail.enrollments?.some((e) => e.studentId === user.userId);
    if (!enrolled) {
      toast.warning("Bạn cần ghi danh lớp này trước khi xem chi tiết.");
      navigate("/student/dashboard", { replace: true });
    }
  }, [loading, classDetail, user?.userId, navigate]);

  const refreshGroups = useCallback(() => {
    if (classIdNumber) {
      dispatch(fetchGroupsByClass(classIdNumber));
      dispatch(fetchMyGroupByClass(classIdNumber));
    }
  }, [classIdNumber, dispatch]);

  const getGroupId = useCallback((group: Group) => group.groupId ?? group.id, []);
  const getGroupName = useCallback((group: Group) => group.groupName ?? group.name ?? "Group", []);

  const getMemberDisplayName = useCallback((member: any) => {
    if (!member) return "Member";
    const fullName = [member.firstName, member.lastName].filter(Boolean).join(" ").trim();
    return fullName || member.username || member.email || "Member";
  }, []);

  const getLeaderName = useCallback(
    (group: Group) => {
      const leader = (group.students || []).find((s) => s.GroupStudent?.role === "leader");
      return leader ? getMemberDisplayName(leader) : "Unknown";
    },
    [getMemberDisplayName],
  );

  const handleCreateGroup = useCallback(async () => {
    try {
      const values = await form.validateFields();
      if (!classIdNumber) return;
      await dispatch(
        createGroup({
          classId: classIdNumber,
          groupName: values.groupName.trim(),
          description: values.description?.trim() || undefined,
        }),
      ).unwrap();
      form.resetFields();
      setIsCreateModalOpen(false);
      toast.success("Tạo nhóm thành công!");
      refreshGroups();
    } catch (err: any) {
      if (err?.message) toast.error(err.message || "Tạo nhóm thất bại.");
    }
  }, [form, classIdNumber, dispatch, refreshGroups]);

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
        await dispatch(pickGroupTopic({ groupId: myGroupId, topicId })).unwrap();
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
        <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">
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
        <div className="max-w-4xl mx-auto px-4 py-10">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-6"
          >
            <ArrowLeft size={15} /> Quay lại
          </button>
          <Alert type="error" message="Không thể tải thông tin lớp" description={error || "Không tìm thấy lớp học"} showIcon />
        </div>
      </StudentLayout>
    );
  }

  /* ── Not enrolled redirect guard ── */
  if (user?.userId && !classDetail.enrollments?.some((e) => e.studentId === user.userId)) {
    return (
      <StudentLayout>
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
          <Loader2 size={28} className="text-slate-400 animate-spin" />
          <Text type="secondary" className="text-sm">Đang chuyển hướng...</Text>
        </div>
      </StudentLayout>
    );
  }

  const tabs: { key: TabKey; label: string; icon: React.ReactNode; count: number }[] = [
    { key: "topics", label: "Chủ đề", icon: <BookOpen size={15} />, count: topics.length },
    { key: "groups", label: "Nhóm học", icon: <Users size={15} />, count: groups.length },
  ];

  return (
    <StudentLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* Breadcrumb */}
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

        {/* ── Hero Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-sm"
        >
          {/* Top stripe */}
          <div className="h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500" />

          <div className="p-6 sm:p-8">
            {/* Status badges */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${
                classDetail.status === "active"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : "bg-slate-100 border-slate-200 text-slate-500"
              }`}>
                {classDetail.status === "active" ? <><CheckCircle2 size={11} /> Đang mở</> : "Đã đóng"}
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-500">
                <Hash size={10} />{classDetail.classCode}
              </span>
              {isEnrolledInClass && (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700">
                  <CheckCircle2 size={11} /> Đã ghi danh
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight mb-1">
              {classTitle}
            </h1>

            {/* Course subtitle */}
            <p className="text-slate-500 text-sm mb-1">
              {courseInfo?.courseCode && courseInfo?.courseName
                ? `${courseInfo.courseCode} — ${courseInfo.courseName}`
                : classDetail.classCode}
              {courseInfo?.semester && courseInfo?.academicYear && (
                <span className="ml-2 text-slate-400">· {courseInfo.semester} / {courseInfo.academicYear}</span>
              )}
            </p>

            {/* Instructor */}
            <p className="flex items-center gap-1.5 text-slate-500 text-sm mb-6">
              <GraduationCap size={14} className="text-slate-400" />
              <span>Giảng viên: <span className="text-slate-700 font-medium">{instructorName}</span></span>
            </p>

            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: <Calendar size={14} />, value: classDuration, label: "ngày học" },
                { icon: <Users size={14} />, value: enrollmentCount, label: classDetail?.maxStudents ? `/ ${classDetail.maxStudents} học viên` : "học viên" },
                { icon: <BookMarked size={14} />, value: topics.length, label: "chủ đề" },
                { icon: <Users size={14} />, value: groups.length, label: groupLimit ? `/ ${groupLimit} TV / nhóm` : "nhóm" },
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-3 bg-blue-50/50 border border-blue-100 rounded-xl px-4 py-3">
                  <div className="text-slate-400">{s.icon}</div>
                  <div>
                    <div className="text-slate-900 font-bold text-lg leading-none">{s.value}</div>
                    <div className="text-slate-400 text-[11px] mt-0.5 truncate">{s.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ── Tab bar ── */}
        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-2xl p-1.5 shadow-sm">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === t.key
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              {t.icon}
              {t.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-normal ${
                activeTab === t.key ? "bg-white/20 text-white" : "bg-slate-100 text-slate-400"
              }`}>
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {/* ── Tab Content ── */}
        <AnimatePresence mode="wait">
          {activeTab === "topics" && (
            <motion.div
              key="topics"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                  <div>
                    <h2 className="text-base font-semibold text-slate-900 m-0">Chủ đề thuyết trình</h2>
                    <p className="text-sm text-slate-400 m-0 mt-0.5">{topics.length} chủ đề trong lớp này</p>
                  </div>
                </div>

                {topics.length > 0 ? (
                  <ol className="divide-y divide-slate-100 list-none p-0 m-0">
                    {topics.map((topic, idx) => {
                      const isTopicSelected = Boolean(myGroupForClass && groupTopic?.topicId === topic.topicId);
                      const urgency = getDeadlineUrgency(topic.dueDate);
                      return (
                        <motion.li
                          key={topic.topicId}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: idx * 0.04 }}
                          className="flex flex-col sm:flex-row sm:items-center gap-4 px-6 py-4 hover:bg-blue-50/40 transition-colors"
                        >
                          {/* Number */}
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500 font-semibold text-sm shrink-0">
                            {topic.sequenceNumber}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-slate-900 text-sm truncate m-0">{topic.topicName}</h3>
                            {topic.description && (
                              <p className="text-xs text-slate-400 mt-0.5 line-clamp-1 m-0">{topic.description}</p>
                            )}
                            <div className="flex flex-wrap items-center gap-1.5 mt-2">
                              {urgency && (
                                <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full border font-medium ${urgency.cls}`}>
                                  Hạn: {urgency.label}
                                </span>
                              )}
                              {topic.maxDurationMinutes && (
                                <span className="inline-flex items-center gap-1 text-xs text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                                  <Clock size={10} />{topic.maxDurationMinutes} phút
                                </span>
                              )}
                              {isTopicSelected && (
                                <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                  <CheckCircle2 size={10} /> Nhóm đã chọn
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 shrink-0">
                            {isGroupEnrolled && myGroupForClass && !groupTopic && !isTopicSelected && isMyGroupLeader && myGroupId && (
                              <Button
                                type="primary"
                                size="small"
                                icon={groupActionLoading ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                                loading={groupActionLoading}
                                onClick={(e) => { e.stopPropagation(); handlePickTopicForGroup(topic.topicId); }}
                                className="!rounded-lg"
                              >
                                Chọn
                              </Button>
                            )}
                            {!isGroupEnrolled && (
                              <Tooltip title="Bạn cần ghi danh lớp trước">
                                <Button size="small" disabled icon={<Plus size={12} />} className="!rounded-lg">Ghi danh</Button>
                              </Tooltip>
                            )}
                            <Button
                              size="small"
                              className="!rounded-lg"
                              onClick={() => navigate(`/student/class/${classId}/topic/${topic.topicId}`)}
                            >
                              Xem chi tiết
                            </Button>
                          </div>
                        </motion.li>
                      );
                    })}
                  </ol>
                ) : (
                  <div className="py-16">
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có chủ đề nào. Giảng viên sẽ thêm khi sẵn sàng." />
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === "groups" && (
            <motion.div
              key="groups"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-5 border-b border-slate-100">
                  <div>
                    <h2 className="text-base font-semibold text-slate-900 m-0">Nhóm làm việc</h2>
                    <p className="text-sm text-slate-400 m-0 mt-0.5">
                      {groups.length} nhóm{groupLimit ? ` · tối đa ${groupLimit} thành viên/nhóm` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {myGroupForClass && (
                      <Button
                        icon={<Users size={14} />}
                        className="!rounded-xl"
                        onClick={() => {
                          if (myGroupForClass.groupId) openGroupDetail(Number(myGroupForClass.groupId));
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
                      message="Bạn cần ghi danh lớp trước khi tham gia hoặc tạo nhóm."
                      className="!rounded-xl"
                    />
                  </div>
                )}

                <div className="p-6">
                  {groupLoading ? (
                    <div className="grid sm:grid-cols-2 gap-3">
                      {[...Array(4)].map((_, i) => <Skeleton key={i} active paragraph={{ rows: 2 }} />)}
                    </div>
                  ) : groups.length ? (
                    <ul className="grid sm:grid-cols-2 gap-3 list-none p-0 m-0">
                      {groups.map((group) => {
                        const groupId = getGroupId(group);
                        const isMyGroup = myGroupForClass && `${getGroupId(myGroupForClass)}` === `${groupId}`;
                        const memberCount = group.memberCount ?? group.students?.length ?? 0;
                        const maxMembers = group.maxGroupMembers || groupLimit || 0;
                        const isFull = maxMembers > 0 && memberCount >= maxMembers;
                        const fillPct = maxMembers > 0 ? Math.min((memberCount / maxMembers) * 100, 100) : 0;
                        const leaderName = getLeaderName(group);
                        const groupName = getGroupName(group);

                        return (
                          <li key={`${groupId ?? group.name}`}>
                            <article
                              className={`rounded-xl border p-4 transition-all duration-200 ${
                                isMyGroup
                                  ? "border-indigo-600 bg-indigo-600 cursor-pointer"
                                  : "border-slate-200 bg-white hover:border-indigo-300 hover:shadow-sm"
                              }`}
                              onClick={() => { if (isMyGroup && groupId) openGroupDetail(Number(groupId)); }}
                            >
                              <div className="flex items-start justify-between gap-2 mb-3">
                                <div className="flex items-center gap-2">
                                  <h3 className={`font-semibold text-sm m-0 ${isMyGroup ? "text-white" : "text-slate-900"}`}>
                                    {groupName}
                                  </h3>
                                  {isMyGroup && (
                                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/20 text-white/80 border border-white/20">
                                      Nhóm của bạn
                                    </span>
                                  )}
                                </div>
                                <div onClick={(e) => e.stopPropagation()}>
                                  {!myGroupForClass && (
                                    isFull ? (
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
                                    )
                                  )}
                                </div>
                              </div>

                              {group.description && (
                                <Paragraph
                                  ellipsis={{ rows: 2 }}
                                  className={`!text-xs !mb-2 ${isMyGroup ? "!text-indigo-100" : "!text-slate-500"}`}
                                >
                                  {group.description}
                                </Paragraph>
                              )}

                              <div className="space-y-1.5">
                                <div className={`flex items-center justify-between text-xs font-medium ${isMyGroup ? "text-indigo-100" : "text-slate-600"}`}>
                                  <span className="flex items-center gap-1">
                                    <Users size={11} />
                                    {memberCount}{maxMembers ? `/${maxMembers}` : ""} thành viên
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
                                    strokeColor={isMyGroup ? "#ffffff" : (isFull ? "#94a3b8" : "#4f46e5")}
                                    trailColor={isMyGroup ? "rgba(255,255,255,0.15)" : "#e2e8f0"}
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
                      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có nhóm nào. Hãy tạo nhóm đầu tiên!" />
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Create Group Modal */}
      <Modal
        title={
          <div>
            <Text strong className="text-base block">Tạo nhóm mới</Text>
            <Text type="secondary" className="text-sm font-normal">Nhóm của bạn sẽ tham gia lớp này</Text>
          </div>
        }
        open={isCreateModalOpen}
        onCancel={() => { setIsCreateModalOpen(false); form.resetFields(); }}
        footer={
          <Space className="w-full justify-end">
            <Button className="!rounded-xl" onClick={() => { setIsCreateModalOpen(false); form.resetFields(); }}>Hủy</Button>
            <Button type="primary" className="!rounded-xl" loading={groupActionLoading} onClick={handleCreateGroup}>Tạo nhóm</Button>
          </Space>
        }
        className="!rounded-2xl"
        centered
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item
            name="groupName"
            label={<Text strong>Tên nhóm</Text>}
            rules={[{ required: true, message: "Vui lòng nhập tên nhóm" }]}
          >
            <Input placeholder="Nhập tên nhóm" size="large" disabled={groupActionLoading} className="!rounded-xl" />
          </Form.Item>
          <Form.Item
            name="description"
            label={<span><Text strong>Mô tả</Text> <Text type="secondary">(tùy chọn)</Text></span>}
          >
            <TextArea placeholder="Mô tả nhóm..." rows={3} disabled={groupActionLoading} className="!rounded-xl" />
          </Form.Item>
        </Form>
      </Modal>

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
