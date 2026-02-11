import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  User,
  Users,
  BookOpen,
  CheckCircle2,
  Info,
  Bell,
  Menu,
  X,
  LogOut,
  GraduationCap,
  Plus,
  Loader2,
} from "lucide-react";
import Toast from "@/components/Toast/Toast";
import GroupDetailModal from "@/components/Group/GroupDetailModal";
import { useAppDispatch, useAppSelector } from "@/services/store/store";
import { fetchClassDetail } from "@/services/features/admin/classSlice";
import { logout } from "@/services/features/auth/authSlice";
import { enrollTopic, fetchEnrolledTopics } from "@/services/features/enrollment/enrollmentSlice";
import {
  fetchGroupsByClass,
  fetchMyGroupByClass,
  fetchGroupDetail,
  createGroup,
  joinGroup,
  updateGroup,
  removeMemberFromGroup,
  changeLeaderOfGroup,
  Group,
} from "@/services/features/group/groupSlice";

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
    loading: groupLoading,
    actionLoading: groupActionLoading,
    classInfo: groupClassInfo,
    isEnrolled: isGroupEnrolled,
  } = useAppSelector((state) => state.group);

  const {
    enrolledTopicIds,
    loading: enrollmentLoading,
  } = useAppSelector((state) => state.enrollment);

  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showMyGroup, setShowMyGroup] = useState(false);
  const [isEditGroupOpen, setIsEditGroupOpen] = useState(false);
  const [editGroupName, setEditGroupName] = useState("");
  const [editGroupDescription, setEditGroupDescription] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [showGroupDetail, setShowGroupDetail] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const classIdNumber = classId ? parseInt(classId) : null;

  useEffect(() => {
    if (classIdNumber) {
      dispatch(fetchClassDetail(classIdNumber));
      dispatch(fetchGroupsByClass(classIdNumber));
      dispatch(fetchMyGroupByClass(classIdNumber));
      dispatch(fetchEnrolledTopics());
    }
  }, [classIdNumber, dispatch]);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isClassEnrolled = (targetClassId: number): boolean => {
    if (!classDetail || !user?.userId) return false;
    return (
      classDetail.classId === targetClassId &&
      !!classDetail.enrollments?.some(
        (enrollment: any) => enrollment.studentId === user.userId,
      )
    );
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const userInitial =
    user?.firstName?.[0]?.toUpperCase() ||
    user?.username?.[0]?.toUpperCase() ||
    "S";

  const userDisplayName = user
    ? `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
    user.username ||
    "Student"
    : "Student";

  const currentUserId = user?.userId;
  const myRole = myGroupForClass
    ? myGroupForClass.myRole ||
    myGroupForClass.students?.find(
      (member) => `${member.userId ?? member.id}` === `${currentUserId}`,
    )?.GroupStudent?.role
    : null;
  const isLeader = myRole === "leader";

  const getGroupId = (group: Group) => group.groupId ?? group.id;
  const getGroupName = (group: Group) =>
    group.groupName ?? group.name ?? "Group";
  const getMemberDisplayName = (member: any) => {
    if (!member) {
      return "Member";
    }
    const fullName = [member.firstName, member.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();
    return fullName || member.username || member.email || "Member";
  };
  const getLeaderName = (group: Group) => {
    const students = group.students || [];
    const leader = students.find(
      (student) => student.GroupStudent?.role === "leader",
    );
    if (leader) {
      return getMemberDisplayName(leader);
    }
    return "Unknown";
  };

  const refreshGroups = () => {
    if (classIdNumber) {
      dispatch(fetchGroupsByClass(classIdNumber));
      dispatch(fetchMyGroupByClass(classIdNumber));
    }
  };

  useEffect(() => {
    if (showMyGroup && myGroupForClass) {
      setEditGroupName(getGroupName(myGroupForClass));
      setEditGroupDescription(myGroupForClass.description || "");
      setIsEditGroupOpen(false);
    }
  }, [showMyGroup, myGroupForClass]);

  const handleCreateGroup = async () => {
    if (!classIdNumber) {
      return;
    }
    const trimmedName = groupName.trim();
    if (!trimmedName) {
      setToast({ message: "Please enter a group name.", type: "info" });
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
      setShowMyGroup(true);
      setToast({ message: "Group created successfully.", type: "success" });
      refreshGroups();
    } catch (err: any) {
      setToast({
        message: err?.message || "Failed to create group.",
        type: "error",
      });
    }
  };

  const handleJoinGroup = async (groupId: string | number | undefined) => {
    if (!groupId) {
      return;
    }
    try {
      await dispatch(joinGroup(groupId)).unwrap();
      setToast({ message: "Joined group successfully.", type: "success" });
      refreshGroups();
    } catch (err: any) {
      setToast({
        message: err?.message || "Failed to join group.",
        type: "error",
      });
    }
  };

  const handleUpdateGroup = async () => {
    if (!myGroupForClass) {
      return;
    }
    const groupId = getGroupId(myGroupForClass);
    if (!groupId) {
      return;
    }
    const trimmedName = editGroupName.trim();
    if (!trimmedName) {
      setToast({ message: "Please enter a group name.", type: "info" });
      return;
    }
    try {
      await dispatch(
        updateGroup({
          groupId,
          groupName: trimmedName,
          description: editGroupDescription.trim() || undefined,
        }),
      ).unwrap();
      setToast({ message: "Group updated successfully.", type: "success" });
      setIsEditGroupOpen(false);
      refreshGroups();
    } catch (err: any) {
      setToast({
        message: err?.message || "Failed to update group.",
        type: "error",
      });
    }
  };

  const handleRemoveMember = async (memberId?: string | number) => {
    if (!memberId || !myGroupForClass) {
      return;
    }
    const groupId = getGroupId(myGroupForClass);
    if (!groupId) {
      return;
    }
    try {
      await dispatch(
        removeMemberFromGroup({
          groupId,
          userId: memberId,
        }),
      ).unwrap();
      setToast({ message: "Member removed.", type: "success" });
      refreshGroups();
    } catch (err: any) {
      setToast({
        message: err?.message || "Failed to remove member.",
        type: "error",
      });
    }
  };

  const handleChangeLeader = async (memberId?: string | number) => {
    if (!memberId || !myGroupForClass) {
      return;
    }
    const groupId = getGroupId(myGroupForClass);
    if (!groupId) {
      return;
    }
    try {
      await dispatch(
        changeLeaderOfGroup({
          groupId,
          userId: memberId,
        }),
      ).unwrap();
      setToast({ message: "Leader updated.", type: "success" });
      refreshGroups();
    } catch (err: any) {
      setToast({
        message: err?.message || "Failed to change leader.",
        type: "error",
      });
    }
  };

  const handleEnrollTopic = async (topicId: number) => {
    try {
      await dispatch(enrollTopic(topicId)).unwrap();
      setToast({ message: "Successfully enrolled in topic!", type: "success" });
    } catch (err: any) {
      setToast({
        message: err?.message || "Failed to enroll in topic",
        type: "error",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-sky-200 border-t-sky-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading class details...</p>
        </div>
      </div>
    );
  }

  if (error || !classDetail) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sky-600 hover:text-sky-700 font-medium mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-700 font-medium">
              {error || "Class not found"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const classDuration = Math.ceil(
    (new Date(classDetail.endDate).getTime() -
      new Date(classDetail.startDate).getTime()) /
    (1000 * 60 * 60 * 24),
  );

  const instructorName = classDetail.instructors?.length
    ? classDetail.instructors
      .map(
        (instructor) =>
          `${instructor.firstName || ""} ${instructor.lastName || ""}`.trim() ||
          instructor.username ||
          "Unknown Instructor",
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

  const groupsCount = groups.length;
  const topics =
    classDetail.topics ?? classDetail.course?.topics ?? [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50 relative">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -right-16 h-72 w-72 rounded-full bg-sky-200/35 blur-3xl"></div>
        <div className="absolute top-24 -left-24 h-80 w-80 rounded-full bg-sky-200/30 blur-3xl"></div>
        <div className="absolute bottom-0 right-1/3 h-64 w-64 rounded-full bg-teal-200/25 blur-[120px]"></div>
      </div>
      {/* Header */}
      <header className="bg-white/85 backdrop-blur border-b border-slate-200/70 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-sky-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-sky-200/60">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-900 leading-tight">
                  OratorAI
                </p>
                <p className="text-xs text-slate-500">Student workspace</p>
              </div>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-4">
              {/* Notifications */}
              <button className="relative p-2 hover:bg-sky-50 rounded-lg transition">
                <Bell className="w-5 h-5 text-slate-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* User Menu */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 p-1 hover:bg-sky-50 rounded-lg transition"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-sky-500 to-cyan-500 flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {userInitial}
                    </span>
                  </div>
                </button>
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900">
                        {userDisplayName}
                      </p>
                      <p className="text-xs text-gray-500">Student</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5 text-gray-600" />
                ) : (
                  <Menu className="w-5 h-5 text-gray-600" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-sky-600 hover:text-sky-700 font-medium"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Classes
            </button>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="rounded-full bg-emerald-500 px-2 py-1 text-white font-semibold">
                Class code
              </span>
              <span className="font-semibold text-slate-700">
                {classDetail.classCode}
              </span>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <div className="space-y-6">
              <div className="relative overflow-hidden rounded-[32px] border border-sky-100/80 bg-gradient-to-br from-white via-white to-sky-50/70 shadow-2xl shadow-sky-100/50 p-8">
                <div className="absolute -right-24 -top-20 h-56 w-56 rounded-full bg-sky-100/70 blur-3xl"></div>
                <div className="relative flex flex-col gap-6">
                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${classDetail.status === "active"
                        ? "bg-sky-100 text-sky-700"
                        : "bg-slate-100 text-slate-600"
                        }`}
                    >
                      {classDetail.status === "active" ? "Active" : "Inactive"}
                    </span>
                    {courseInfo?.semester && courseInfo?.academicYear && (
                      <span className="text-xs text-slate-500">
                        {courseInfo.semester} • {courseInfo.academicYear}
                      </span>
                    )}
                    {classId && isClassEnrolled(parseInt(classId)) && (
                      <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span className="text-xs font-medium">Enrolled</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <h1 className="text-3xl sm:text-4xl font-semibold text-slate-900 mb-2">
                      {classTitle}
                    </h1>
                    <p className="text-base sm:text-lg text-slate-600">
                      {classDetail.classCode}
                      {courseInfo?.courseCode && courseInfo?.courseName
                        ? ` • ${courseInfo.courseCode} - ${courseInfo.courseName}`
                        : ""}
                    </p>
                    {classDetail.description && (
                      <p className="text-sm text-slate-600 mt-3 max-w-3xl">
                        {classDetail.description}
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="rounded-2xl border border-sky-100 bg-white/90 p-4 shadow-sm">
                      <p className="text-xs font-semibold text-slate-500 uppercase mb-2">
                        Timeline
                      </p>
                      <div className="flex items-center gap-2 text-slate-900 font-semibold">
                        <Calendar className="w-4 h-4 text-sky-600" />
                        {classDuration} days
                      </div>
                    </div>
                    <div className="rounded-2xl border border-sky-100 bg-white/90 p-4 shadow-sm">
                      <p className="text-xs font-semibold text-slate-500 uppercase mb-2">
                        Enrolled students
                      </p>
                      <div className="flex items-center gap-2 text-slate-900 font-semibold">
                        <BookOpen className="w-4 h-4 text-amber-600" />
                        {enrollmentCount}
                        {classDetail.maxStudents
                          ? `/${classDetail.maxStudents}`
                          : ""}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-sky-100 bg-white/90 p-4 shadow-sm">
                      <p className="text-xs font-semibold text-slate-500 uppercase mb-2">
                        Instructor
                      </p>
                      <div className="flex items-center gap-2 text-slate-900 font-semibold">
                        <User className="w-4 h-4 text-amber-600" />
                        {instructorName}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white/95 rounded-3xl border border-sky-100/80 shadow-lg shadow-sky-100/40 p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-sky-600" />
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
                        Presentation topics
                      </p>
                      <h3 className="text-lg font-bold text-slate-900">
                        Topics for this class
                      </h3>
                    </div>
                  </div>
                  <div className="text-xs font-semibold text-sky-700 bg-sky-50 rounded-full px-3 py-1">
                    {topics.length} topics
                  </div>
                </div>

                {topics.length > 0 ? (
                  <div className="space-y-3">
                    {topics.map((topic) => {
                      const isTopicEnrolled = enrolledTopicIds.includes(topic.topicId);
                      return (
                        <div
                          key={topic.topicId}
                          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 sm:px-5 sm:py-4 hover:border-sky-200 hover:shadow-md transition"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="flex items-start gap-3 flex-1">
                              <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-xs font-semibold text-sky-700">
                                {topic.sequenceNumber}
                              </div>
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                  Topic {topic.sequenceNumber}
                                </p>
                                <h4 className="mt-0.5 text-sm sm:text-base font-semibold text-slate-900">
                                  {topic.topicName}
                                </h4>
                                {topic.description && (
                                  <p className="mt-1 text-sm text-slate-600 max-w-3xl line-clamp-2">
                                    {topic.description}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              {topic.dueDate && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-white border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600">
                                  <Calendar className="w-3 h-3" />
                                  Due{" "}
                                  {new Date(topic.dueDate).toLocaleDateString(
                                    "en-US",
                                    {
                                      year: "numeric",
                                      month: "short",
                                      day: "numeric",
                                    },
                                  )}
                                </span>
                              )}
                              {topic.maxDurationMinutes && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-white border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600">
                                  {topic.maxDurationMinutes} mins
                                </span>
                              )}
                              {/* Enroll Button */}
                              {isGroupEnrolled ? (
                                isTopicEnrolled ? (
                                  <span
                                    className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-700 px-4 py-2 text-xs font-semibold border border-emerald-200 cursor-default"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    Enrolled
                                  </span>
                                ) : (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEnrollTopic(topic.topicId);
                                    }}
                                    disabled={enrollmentLoading}
                                    className="inline-flex items-center gap-1.5 rounded-full bg-sky-600 text-white px-4 py-2 text-xs font-semibold hover:bg-sky-500 transition disabled:opacity-50"
                                  >
                                    {enrollmentLoading ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                      <>
                                        <Plus className="w-3.5 h-3.5" />
                                        Enroll Topic
                                      </>
                                    )}
                                  </button>
                                )
                              ) : (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setToast({
                                      message: "You need to enroll in this class first before enrolling in topics.",
                                      type: "info",
                                    });
                                  }}
                                  className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 text-gray-600 px-4 py-2 text-xs font-semibold border border-gray-200 hover:bg-gray-200 transition"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  Enroll Topic
                                </button>
                              )}
                              {/* View Details Button */}
                              <button
                                onClick={() =>
                                  navigate(`/student/class/${classId}/topic/${topic.topicId}`)
                                }
                                className="inline-flex items-center gap-1 rounded-full bg-sky-50 text-sky-700 px-3 py-2 text-xs font-semibold border border-sky-200 hover:bg-sky-100 transition"
                              >
                                View Details
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-600 bg-slate-50">
                    No topics have been assigned yet. Your instructor will add
                    presentation topics here when ready.
                  </div>
                )}
              </div>

              <div className="bg-white/95 rounded-3xl border border-sky-100/80 shadow-lg shadow-sky-100/40 p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-sky-600" />
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
                        Group workspace
                      </p>
                      <h3 className="text-lg font-bold text-slate-900">
                        Groups
                      </h3>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-xs font-semibold text-sky-700 bg-sky-50 rounded-full px-3 py-1">
                      {groupsCount} groups
                    </div>
                    {groupLimit && (
                      <div className="text-xs font-semibold text-slate-600 bg-slate-100 rounded-full px-3 py-1">
                        Max members: {groupLimit}
                      </div>
                    )}
                    {!myGroupForClass && isGroupEnrolled && (
                      <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="inline-flex items-center gap-2 rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-200/60 hover:bg-sky-500 transition"
                      >
                        <Plus className="w-4 h-4" />
                        Create group
                      </button>
                    )}
                    {myGroupForClass && (
                      <button
                        onClick={() => {
                          if (myGroupForClass.groupId) {
                            dispatch(fetchGroupDetail(Number(myGroupForClass.groupId)));
                          }
                          setShowGroupDetail(true);
                        }}
                        className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-200/60 hover:bg-emerald-500 transition"
                      >
                        <Users className="w-4 h-4" />
                        Your Group: {getGroupName(myGroupForClass)}
                      </button>
                    )}
                  </div>
                </div>

                {!isGroupEnrolled && (
                  <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                    You need to enroll in this class before joining or creating
                    a group.
                  </div>
                )}


                <div className="grid gap-4 sm:grid-cols-2">
                  {groupLoading ? (
                    <p className="text-sm text-slate-600">Loading groups...</p>
                  ) : groups.length ? (
                    groups.map((group) => {
                      const groupId = getGroupId(group);
                      const isMyGroup =
                        myGroupForClass &&
                        `${getGroupId(myGroupForClass)}` === `${groupId}`;
                      const memberCount =
                        group.memberCount ?? group.students?.length ?? 0;
                      return (
                        <div
                          key={`${groupId ?? group.name}`}
                          className={`flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg ${isMyGroup
                            ? "ring-1 ring-emerald-200"
                            : ""
                            }`}
                          onClick={() => {
                            if (isMyGroup) {
                              dispatch(fetchGroupDetail(Number(groupId)));
                              setShowGroupDetail(true);
                            }
                          }}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <p className="text-base font-semibold text-slate-900">
                                  {getGroupName(group)}
                                </p>
                                {isMyGroup && (
                                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                                    Your Group
                                  </span>
                                )}
                                {group.myRole && !isMyGroup && (
                                  <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                                    {group.myRole}
                                  </span>
                                )}
                              </div>
                              {/* Join/Full/Joined Status */}
                              {!myGroupForClass && (
                                group.isMember ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-700 px-3 py-1 text-xs font-semibold border border-emerald-200">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    Joined
                                  </span>
                                ) : memberCount >= (group.maxGroupMembers || groupLimit || 0) ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-red-100 text-red-700 px-3 py-1 text-xs font-semibold border border-red-200">
                                    Full
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
                                    className="inline-flex items-center gap-1 rounded-full bg-sky-600 text-white px-4 py-1.5 text-xs font-semibold hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    Join
                                  </button>
                                )
                              )}
                            </div>
                            {group.description && (
                              <p className="text-sm text-slate-600 mt-1">
                                {group.description}
                              </p>
                            )}
                            <p className="text-sm text-slate-600 mt-2">
                              Members: {memberCount}
                              {groupLimit ? `/${groupLimit}` : ""}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              Leader: {getLeaderName(group)}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-slate-600">
                      No groups available yet.
                    </p>
                  )}
                </div>
              </div>


            </div>

            <div className="space-y-6">
              <div className="bg-white/95 rounded-3xl border border-amber-100/80 shadow-lg shadow-amber-100/40 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Info className="w-5 h-5 text-amber-600" />
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
                      Class information
                    </p>
                    <h3 className="text-lg font-bold text-slate-900">
                      Details
                    </h3>
                  </div>
                </div>
                <div className="space-y-3 text-sm text-slate-700">
                  <div className="flex items-center justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-600">Start Date</span>
                    <span className="font-semibold text-slate-900">
                      {formatDate(classDetail.startDate)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-600">End Date</span>
                    <span className="font-semibold text-slate-900">
                      {formatDate(classDetail.endDate)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-600">Duration</span>
                    <span className="font-semibold text-slate-900">
                      {classDuration} days
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-600">Status</span>
                    <span
                      className={`font-semibold ${classDetail.status === "active" ? "text-sky-700" : "text-slate-600"}`}
                    >
                      {classDetail.status === "active" ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-600">Class Code</span>
                    <span className="font-semibold text-slate-900">
                      {classDetail.classCode}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-slate-600">Course</span>
                    <span className="font-semibold text-slate-900">
                      {courseInfo?.courseCode && courseInfo?.courseName
                        ? `${courseInfo.courseCode} - ${courseInfo.courseName}`
                        : "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white/95 rounded-3xl border border-slate-200/70 shadow-lg shadow-slate-200/50 p-6">
                <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
                  Quick stats
                </p>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between text-sm text-slate-700">
                    <span>Groups</span>
                    <span className="font-semibold text-slate-900">
                      {groupsCount}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-slate-700">
                    <span>Enrollment</span>
                    <span className="font-semibold text-slate-900">
                      {enrollmentCount}
                      {classDetail.maxStudents
                        ? `/${classDetail.maxStudents}`
                        : ""}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-slate-700">
                    <span>Topics</span>
                    <span className="font-semibold text-slate-900">
                      {classDetail.topics?.length || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-slate-700">
                    <span>Instructor</span>
                    <span className="font-semibold text-slate-900">
                      {instructorName}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-slate-700">
                    <span>Duration</span>
                    <span className="font-semibold text-slate-900">
                      {classDuration} days
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setIsCreateModalOpen(false)}
          ></div>
          <div
            className="relative w-full max-w-lg rounded-3xl border border-sky-200 bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
                  New group
                </p>
                <h3 className="text-xl font-semibold text-slate-900">
                  Create your group
                </h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="rounded-full p-2 text-slate-500 hover:bg-sky-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Group name
                </label>
                <input
                  value={groupName}
                  onChange={(event) => setGroupName(event.target.value)}
                  placeholder="Enter group name"
                  className="mt-2 w-full rounded-xl border border-sky-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-600"
                  disabled={groupActionLoading}
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Description
                </label>
                <textarea
                  value={groupDescription}
                  onChange={(event) => setGroupDescription(event.target.value)}
                  placeholder="What is your group focusing on?"
                  className="mt-2 min-h-[110px] w-full rounded-xl border border-sky-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-600"
                  disabled={groupActionLoading}
                />
              </div>
            </div>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                onClick={handleCreateGroup}
                disabled={groupActionLoading || !groupName.trim()}
                className="rounded-full bg-sky-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-200/70 hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Create group
              </button>
            </div>
          </div>
        </div>
      )}

      {showMyGroup && myGroupForClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setShowMyGroup(false)}
          ></div>
          <div
            className="relative w-full max-w-2xl rounded-3xl border border-sky-200 bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
                  Your group
                </p>
                <h3 className="text-xl font-semibold text-slate-900">
                  {getGroupName(myGroupForClass)}
                </h3>
                <p className="text-sm text-slate-600 mt-1">
                  Leader: {getLeaderName(myGroupForClass)}
                </p>
              </div>
              <button
                onClick={() => setShowMyGroup(false)}
                className="rounded-full p-2 text-slate-500 hover:bg-sky-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="rounded-2xl border border-sky-200 bg-sky-50/70 p-4 mb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
                    Group details
                  </p>
                  <p className="text-sm text-slate-600">
                    {myGroupForClass.description || "No description provided."}
                  </p>
                </div>
                {isLeader && (
                  <button
                    onClick={() => setIsEditGroupOpen((prev) => !prev)}
                    className="rounded-full border border-sky-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-sky-100"
                  >
                    {isEditGroupOpen ? "Cancel edit" : "Edit group"}
                  </button>
                )}
              </div>
              {isEditGroupOpen && isLeader && (
                <div className="mt-4 grid gap-3">
                  <div>
                    <label className="text-sm font-semibold text-slate-700">
                      Group name
                    </label>
                    <input
                      value={editGroupName}
                      onChange={(event) => setEditGroupName(event.target.value)}
                      className="mt-2 w-full rounded-xl border border-sky-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-600"
                      disabled={groupActionLoading}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-700">
                      Description
                    </label>
                    <textarea
                      value={editGroupDescription}
                      onChange={(event) =>
                        setEditGroupDescription(event.target.value)
                      }
                      className="mt-2 min-h-[90px] w-full rounded-xl border border-sky-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-600"
                      disabled={groupActionLoading}
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={handleUpdateGroup}
                      disabled={groupActionLoading || !editGroupName.trim()}
                      className="rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Save changes
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-3">
                Members
              </p>
              {myGroupForClass.students?.length ? (
                <div className="grid gap-2 text-sm text-slate-700">
                  {myGroupForClass.students.map((member, index) => {
                    const memberId = member.userId ?? member.id;
                    const isMemberLeader =
                      member.GroupStudent?.role === "leader";
                    const isCurrentUser = `${memberId}` === `${currentUserId}`;
                    return (
                      <div
                        key={`${memberId ?? index}`}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2"
                      >
                        <div>
                          <p className="font-medium text-slate-900">
                            {getMemberDisplayName(member)}
                          </p>
                          <p className="text-xs text-slate-500">
                            {member.email || ""}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          {isMemberLeader && (
                            <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-xs font-semibold text-sky-700">
                              Leader
                            </span>
                          )}
                          {isLeader && !isMemberLeader && !isCurrentUser && (
                            <button
                              onClick={() => handleChangeLeader(memberId)}
                              disabled={groupActionLoading}
                              className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
                            >
                              Make leader
                            </button>
                          )}
                          {isLeader && !isCurrentUser && (
                            <button
                              onClick={() => handleRemoveMember(memberId)}
                              disabled={groupActionLoading}
                              className="rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-100"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-slate-600">No members listed yet.</p>
              )}
            </div>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                onClick={() => setShowMyGroup(false)}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Group Detail Modal */}
      {showGroupDetail && myGroupForClass?.groupId && (
        <GroupDetailModal
          isOpen={showGroupDetail}
          onClose={() => setShowGroupDetail(false)}
          groupId={Number(myGroupForClass.groupId)}
        />
      )}

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

export default StudentClassDetailPage;
