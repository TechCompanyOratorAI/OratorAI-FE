import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Clock,
  BookOpen,
  CheckCircle2,
  Info,
  Plus,
  Upload,
  FileText as FileTextIcon,
  Users,
  X,
  Loader2,
  Bell,
  Menu,
  LogOut,
  GraduationCap,
  Crown,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/services/store/store";
import { fetchTopicDetail } from "@/services/features/topic/topicSlice";
import {
  fetchPresentationsByClassAndTopic,
  createPresentation,
} from "@/services/features/presentation/presentationSlice";
import { enrollTopic, fetchEnrolledTopics } from "@/services/features/enrollment/enrollmentSlice";
import { fetchMyGroupByClass } from "@/services/features/group/groupSlice";
import { logout } from "@/services/features/auth/authSlice";
import Toast from "@/components/Toast/Toast";
import PresentationUploadModal from "@/components/Presentation/PresentationUploadModal";

interface TopicStudentDetailPageProps {
  isModalMode?: boolean;
  onCloseModal?: () => void;
}

const StudentTopicDetailPage: React.FC<TopicStudentDetailPageProps> = ({
  isModalMode = false,
  onCloseModal,
}) => {
  const { topicId, classId } = useParams<{ topicId: string; classId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { selectedTopic: topic, loading: topicLoading, error: topicError } = useAppSelector(
    (state) => state.topic
  );
  const { presentations } = useAppSelector(
    (state) => state.presentation
  );
  const { user } = useAppSelector((state) => state.auth);
  const { enrolledTopicIds, loading: enrollmentLoading } = useAppSelector(
    (state) => state.enrollment
  );
  const { myGroupForClass } = useAppSelector((state) => state.group);

  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [presentationTitle, setPresentationTitle] = useState("");
  const [presentationDescription, setPresentationDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [selectedPresentationId, setSelectedPresentationId] = useState<number | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const topicIdNumber = topicId ? parseInt(topicId) : null;
  const classIdNumber = classId ? parseInt(classId) : null;

  // Check if user is enrolled in topic
  const isEnrolled = topicIdNumber ? enrolledTopicIds.includes(topicIdNumber) : false;

  // Find user's presentation for this topic
  const myPresentation = presentations.find((p) => p.studentId === user?.userId);

  // Check if current user is the leader of their group (using myRole from API)
  const isCurrentUserLeader = myGroupForClass?.myRole === "leader";

  useEffect(() => {
    if (topicIdNumber && classIdNumber) {
      dispatch(fetchTopicDetail(topicIdNumber));
      dispatch(fetchPresentationsByClassAndTopic({ classId: classIdNumber, topicId: topicIdNumber }));
    }
    if (classIdNumber) {
      dispatch(fetchMyGroupByClass(classIdNumber));
    }
    dispatch(fetchEnrolledTopics());
  }, [topicIdNumber, classIdNumber, dispatch]);

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

    if (isUserMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isUserMenuOpen]);

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<
      string,
      { bg: string; text: string; icon: React.ReactNode }
    > = {
      draft: {
        bg: "bg-gray-100 text-gray-700",
        text: "Draft",
        icon: <FileTextIcon className="w-3 h-3" />,
      },
      submitted: {
        bg: "bg-blue-100 text-blue-700",
        text: "Submitted",
        icon: <CheckCircle2 className="w-3 h-3" />,
      },
      processing: {
        bg: "bg-amber-100 text-amber-700",
        text: "Processing",
        icon: <Loader2 className="w-3 h-3 animate-spin" />,
      },
      analyzed: {
        bg: "bg-green-100 text-green-700",
        text: "Analyzed",
        icon: <CheckCircle2 className="w-3 h-3" />,
      },
    };

    const config = statusConfig[status.toLowerCase()] || statusConfig.draft;
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${config.bg}`}
      >
        {config.icon}
        {config.text}
      </span>
    );
  };

  const handleEnroll = async () => {
    if (!topicIdNumber) return;
    try {
      await dispatch(enrollTopic(topicIdNumber)).unwrap();
      setToast({ message: "Successfully enrolled in topic!", type: "success" });
      dispatch(fetchEnrolledTopics());
    } catch (err: unknown) {
      setToast({
        message: err instanceof Error ? err.message : "Failed to enroll in topic",
        type: "error",
      });
    }
  };

  const handleCreatePresentation = async () => {
    if (!topicIdNumber || !classIdNumber) return;

    // Only group leader can create presentation
    if (!isCurrentUserLeader) {
      setToast({ message: "Only group leader can create presentation", type: "info" });
      return;
    }

    const trimmedTitle = presentationTitle.trim();
    if (!trimmedTitle) {
      setToast({ message: "Please enter a presentation title", type: "info" });
      return;
    }

    setIsCreating(true);
    try {
      const groupCode = myGroupForClass?.groupName || myGroupForClass?.name || undefined;
      await dispatch(
        createPresentation({
          classId: classIdNumber,
          topicId: topicIdNumber,
          title: trimmedTitle,
          description: presentationDescription.trim() || undefined,
          groupCode,
        })
      ).unwrap();

      setToast({ message: "Presentation created successfully!", type: "success" });
      setIsCreateModalOpen(false);
      setPresentationTitle("");
      setPresentationDescription("");
      if (classIdNumber && topicIdNumber) {
        dispatch(fetchPresentationsByClassAndTopic({ classId: classIdNumber, topicId: topicIdNumber }));
      }
    } catch (err: unknown) {
      setToast({
        message: err instanceof Error ? err.message : "Failed to create presentation",
        type: "error",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenUploadModal = (presentationId: number, title: string) => {
    setSelectedPresentationId(presentationId);
    setPresentationTitle(title);
    setIsUploadModalOpen(true);
  };

  if (topicLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-sky-200 border-t-sky-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading topic details...</p>
          </div>
        </main>
      </div>
    );
  }

  if (topicError || !topic) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[1280px] mx-auto px-4 py-8">
            <button
              onClick={() => (isModalMode && onCloseModal ? onCloseModal() : navigate(-1))}
              className="flex items-center gap-2 text-sky-600 hover:text-sky-700 font-medium mb-6"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <p className="text-red-700 font-medium">{topicError || "Topic not found"}</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-sky-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-sky-200/60">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900">OratorAI</span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <Link
                to="/student/classes"
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Classes
              </Link>
              <Link
                to="/student/my-class"
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                My Classes
              </Link>
              <Link
                to="/student/feedback"
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                My Presentations
              </Link>
            </nav>

            {/* Right Side Actions */}
            <div className="flex items-center gap-4">
              {/* Notifications */}
              <button className="relative p-2 hover:bg-gray-100 rounded-lg">
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* User Menu */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 p-1 hover:bg-gray-100 rounded-lg"
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
                className="md:hidden p-2 hover:bg-gray-100 rounded-full"
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
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => (isModalMode && onCloseModal ? onCloseModal() : navigate(-1))}
              className="inline-flex items-center gap-2 text-sky-600 hover:text-sky-800 font-semibold"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Info className="w-4 h-4" />
              Student workspace
            </div>
          </div>

          {/* Hero Section */}
          <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-r from-indigo-600 via-purple-600 to-sky-500 text-white shadow-lg">
            <div
              className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.15),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.12),transparent_30%)]"
              aria-hidden
            />
            <div className="relative p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-3 max-w-3xl">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-white/20 text-white font-bold flex items-center justify-center text-lg">
                      {topic.sequenceNumber}
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide bg-white/20 text-white border border-white/30">
                      Topic #{topic.sequenceNumber}
                    </span>
                    {isEnrolled && (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide bg-emerald-500/80 text-white border border-white/30">
                        Enrolled
                      </span>
                    )}
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-bold">{topic.topicName}</h1>
                  <p className="text-white/90 text-lg">{topic.description}</p>
                  <div className="flex flex-wrap items-center gap-4 pt-2">
                    {topic.dueDate && (
                      <div className="flex items-center gap-2 text-white/90">
                        <Calendar className="w-5 h-5" />
                        <span className="font-medium">Due: {formatDate(topic.dueDate)}</span>
                      </div>
                    )}
                    {topic.maxDurationMinutes && (
                      <div className="flex items-center gap-2 text-white/90">
                        <Clock className="w-5 h-5" />
                        <span className="font-medium">{topic.maxDurationMinutes} minutes</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                {[
                  {
                    label: "Due date",
                    value: topic.dueDate
                      ? new Date(topic.dueDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })
                      : "No deadline",
                    Icon: Calendar,
                  },
                  {
                    label: "Duration",
                    value: `${topic.maxDurationMinutes || 0} mins`,
                    Icon: Clock,
                  },
                  {
                    label: "Submissions",
                    value: `${presentations.length}`,
                    Icon: FileTextIcon,
                  },
                  {
                    label: "Course",
                    value: topic.course?.courseName || "N/A",
                    Icon: BookOpen,
                  },
                ].map(({ label, value, Icon }, idx) => (
                  <div
                    key={idx}
                    className="rounded-3xl bg-white/15 border border-white/20 px-4 py-3 flex items-center gap-3"
                  >
                    <span className="rounded-full bg-white/20 p-2">
                      <Icon className="w-5 h-5 text-white" />
                    </span>
                    <div>
                      <p className="text-white/80 text-xs uppercase tracking-wide font-semibold">
                        {label}
                      </p>
                      <p className="font-semibold truncate max-w-[180px]">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Action Section - Enrollment or Create Presentation */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
            {!isEnrolled ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Info className="w-8 h-8 text-amber-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Enroll to Start</h3>
                <p className="text-slate-600 mb-6 max-w-md mx-auto">
                  You need to enroll in this topic before you can create and submit your presentation.
                </p>
                <button
                  onClick={handleEnroll}
                  disabled={enrollmentLoading}
                  className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white font-semibold px-6 py-3 rounded-full transition disabled:opacity-50"
                >
                  {enrollmentLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5" />
                  )}
                  Enroll in Topic
                </button>
              </div>
            ) : myPresentation ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Your Presentation</h3>
                <p className="text-slate-600 mb-6">
                  You have created a presentation for this topic. You can upload files or submit when ready.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <button
                    onClick={() =>
                      handleOpenUploadModal(myPresentation.presentationId, myPresentation.title)
                    }
                    className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white font-semibold px-6 py-3 rounded-full transition"
                  >
                    <Upload className="w-5 h-5" />
                    Upload Files
                  </button>
                  {myPresentation.status === "draft" && (
                    <span className="inline-flex items-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-full font-medium">
                      {getStatusBadge(myPresentation.status)}
                    </span>
                  )}
                  {myPresentation.status !== "draft" && (
                    <span className="inline-flex items-center gap-2 px-4 py-3 bg-green-100 text-green-700 rounded-full font-medium">
                      {getStatusBadge(myPresentation.status)}
                    </span>
                  )}
                </div>
              </div>
            ) : myGroupForClass && isCurrentUserLeader ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-8 h-8 text-sky-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Create Your Presentation</h3>
                <p className="text-slate-600 mb-6 max-w-md mx-auto">
                  As the group leader, you can create the presentation for this topic.
                </p>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white font-semibold px-6 py-3 rounded-full transition"
                >
                  <Plus className="w-5 h-5" />
                  Create Presentation
                </button>
              </div>
            ) : myGroupForClass ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-amber-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Waiting for Leader</h3>
                <p className="text-slate-600 mb-6 max-w-md mx-auto">
                  Your group leader needs to create the presentation. Please wait for them to start.
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-full font-medium">
                  <Users className="w-4 h-4" />
                  Group: {myGroupForClass.groupName || myGroupForClass.name}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-slate-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Join or Create a Group</h3>
                <p className="text-slate-600 mb-6 max-w-md mx-auto">
                  You need to be in a group to create a presentation. Join an existing group or create a new one.
                </p>
                <Link
                  to={`/student/class/${classId}`}
                  className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white font-semibold px-6 py-3 rounded-full transition"
                >
                  <Users className="w-5 h-5" />
                  Go to Group Management
                </Link>
              </div>
            )}
          </div>

          {/* Requirements */}
          {topic.requirements && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="rounded-2xl bg-amber-100 p-2">
                  <FileTextIcon className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
                    Requirements
                  </p>
                  <h3 className="text-lg font-bold text-slate-900">Topic Requirements</h3>
                </div>
              </div>
              <div className="prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap text-sm text-slate-700 font-sans bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  {topic.requirements}
                </pre>
              </div>
            </div>
          )}

          {/* Presentations List */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="rounded-2xl bg-indigo-100 p-2">
                <FileTextIcon className="w-5 h-5 text-indigo-700" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
                  All Submissions
                </p>
                <h3 className="text-lg font-bold text-slate-900">
                  Presentations ({presentations.length})
                </h3>
              </div>
            </div>

            {presentations.length > 0 ? (
              <div className="space-y-3">
                {presentations.map((presentation) => (
                  <Link
                    key={presentation.presentationId}
                    to={`/student/presentation/${presentation.presentationId}`}
                    className="rounded-3xl overflow-hidden border border-slate-200 hover:border-sky-200 hover:shadow transition bg-slate-50/60 p-4 block"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-slate-900">{presentation.title}</h4>
                          {getStatusBadge(presentation.status)}
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                          {presentation.submissionDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Submitted:{" "}
                              {new Date(presentation.submissionDate).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                          )}
                          {presentation.groupCode && (
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              Group: {presentation.groupCode}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {presentation.studentId === user?.userId && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              handleOpenUploadModal(presentation.presentationId, presentation.title);
                            }}
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-sky-100 text-sky-700 rounded-lg text-sm font-medium hover:bg-sky-200 transition"
                          >
                            <Upload className="w-4 h-4" />
                            Manage
                          </button>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-200 p-8 text-center text-slate-600 bg-slate-50">
                <FileTextIcon className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                <p>No presentations submitted yet.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Create Presentation Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setIsCreateModalOpen(false)}
          />
          <div
            className="relative w-full max-w-lg rounded-3xl border border-sky-200 bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Crown className="w-5 h-5 text-amber-500" />
                  <p className="text-xs uppercase tracking-wide text-amber-600 font-semibold">
                    Group Leader Only
                  </p>
                </div>
                <h3 className="text-xl font-semibold text-slate-900">Create your presentation</h3>
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
                <label className="text-sm font-semibold text-slate-700">Title *</label>
                <input
                  value={presentationTitle}
                  onChange={(event) => setPresentationTitle(event.target.value)}
                  placeholder="Enter presentation title"
                  className="mt-2 w-full rounded-xl border border-sky-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-600"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">Description</label>
                <textarea
                  value={presentationDescription}
                  onChange={(event) => setPresentationDescription(event.target.value)}
                  placeholder="Optional description"
                  className="mt-2 min-h-[100px] w-full rounded-xl border border-sky-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-600"
                />
              </div>
              {myGroupForClass && (
                <div className="rounded-xl bg-sky-50 border border-sky-200 p-3">
                  <div className="flex items-center gap-2 text-sm text-sky-700">
                    <Users className="w-4 h-4" />
                    <span className="font-medium">
                      This presentation will be created for group: {myGroupForClass.groupName || myGroupForClass.name}
                    </span>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePresentation}
                disabled={isCreating || !presentationTitle.trim()}
                className="rounded-full bg-sky-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-200/70 hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isCreating ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </span>
                ) : (
                  "Create Presentation"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {isUploadModalOpen && selectedPresentationId && (
        <PresentationUploadModal
          isOpen={isUploadModalOpen}
          onClose={() => {
            setIsUploadModalOpen(false);
            if (classIdNumber && topicIdNumber) {
              dispatch(fetchPresentationsByClassAndTopic({ classId: classIdNumber, topicId: topicIdNumber }));
            }
          }}
          presentationId={selectedPresentationId}
          presentationTitle={presentationTitle}
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

export default StudentTopicDetailPage;
