import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, Clock, BookOpen, User, FileText, CheckCircle2, XCircle, Info } from "lucide-react";
import Button from "@/components/yoodli/Button";
import { useAppDispatch, useAppSelector } from "@/services/store/store";
import { fetchTopicDetail } from "@/services/features/topic/topicSlice";

const TopicDetailPage: React.FC = () => {
  const { topicId } = useParams<{ topicId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { selectedTopic: topic, loading, error } = useAppSelector(
    (state) => state.topic
  );

  useEffect(() => {
    if (topicId) {
      dispatch(fetchTopicDetail(parseInt(topicId)));
    }
  }, [topicId, dispatch]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-sky-200 border-t-sky-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading topic details...</p>
        </div>
      </div>
    );
  }

  if (error || !topic) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-[1280px] mx-auto px-4 py-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sky-600 hover:text-sky-700 font-medium mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-700 font-medium">
              {error || "Topic not found"}
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
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateOnly = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
      draft: {
        bg: "bg-gray-100 text-gray-700",
        text: "Draft",
        icon: <FileText className="w-3 h-3" />,
      },
      submitted: {
        bg: "bg-blue-100 text-blue-700",
        text: "Submitted",
        icon: <CheckCircle2 className="w-3 h-3" />,
      },
      graded: {
        bg: "bg-green-100 text-green-700",
        text: "Graded",
        icon: <CheckCircle2 className="w-3 h-3" />,
      },
    };

    const config = statusConfig[status.toLowerCase()] || statusConfig.draft;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${config.bg}`}>
        {config.icon}
        {config.text}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <header className="border-b border-slate-200/80 bg-white/70 backdrop-blur">
        <div className="max-w-[1280px] mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-sky-700 hover:text-sky-800 font-semibold"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to course
          </button>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <BookOpen className="w-4 h-4" />
            Topic overview
          </div>
        </div>
      </header>

      <main className="max-w-[1280px] mx-auto px-4 py-8 space-y-6">
        {/* Hero Section */}
        <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-500 text-white shadow-lg">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.15),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.12),transparent_30%)]" aria-hidden />
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
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Course Info */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="rounded-lg bg-sky-100 p-2">
                  <BookOpen className="w-5 h-5 text-sky-700" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Course</p>
                  <h3 className="text-lg font-bold text-slate-900">{topic.course.courseName}</h3>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Course Code</span>
                  <span className="font-semibold text-slate-900">{topic.course.courseCode}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Instructor</span>
                  <span className="font-semibold text-slate-900">
                    {topic.course.instructor.firstName} {topic.course.instructor.lastName}
                  </span>
                </div>
                <button
                  onClick={() => navigate(`/instructor/course/${topic.courseId}`)}
                  className="w-full mt-4 text-left px-4 py-2 text-sm text-sky-600 hover:bg-sky-50 rounded-lg transition"
                >
                  View Course Details →
                </button>
              </div>
            </div>

            {/* Requirements */}
            {topic.requirements && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="rounded-lg bg-amber-100 p-2">
                    <FileText className="w-5 h-5 text-amber-700" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Requirements</p>
                    <h3 className="text-lg font-bold text-slate-900">Topic Requirements</h3>
                  </div>
                </div>
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap text-sm text-slate-700 font-sans bg-slate-50 p-4 rounded-lg border border-slate-200">
                    {topic.requirements}
                  </pre>
                </div>
              </div>
            )}

            {/* Presentations */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Student Submissions</p>
                  <h3 className="text-xl font-bold text-slate-900">
                    Presentations ({topic.presentations.length})
                  </h3>
                </div>
              </div>

              {topic.presentations.length > 0 ? (
                <div className="space-y-3">
                  {topic.presentations.map((presentation) => (
                    <div
                      key={presentation.presentationId}
                      className="rounded-xl border border-slate-200 hover:border-sky-200 hover:shadow transition bg-slate-50/60 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-semibold text-slate-900">{presentation.title}</h4>
                            {getStatusBadge(presentation.status)}
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                            <span>Student ID: {presentation.studentId}</span>
                            {presentation.submissionDate && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Submitted: {formatDateOnly(presentation.submissionDate)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-slate-600 bg-slate-50">
                  <FileText className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                  <p>No presentations submitted yet.</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Topic Info */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <Info className="w-5 h-5 text-indigo-600" />
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Topic info</p>
                  <h3 className="text-lg font-bold text-slate-900">Details</h3>
                </div>
              </div>
              <div className="space-y-3 text-sm text-slate-700">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-2 w-2 rounded-full bg-indigo-500" aria-hidden />
                  Sequence: {topic.sequenceNumber}
                </div>
                {topic.dueDate && (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-2 w-2 rounded-full bg-amber-500" aria-hidden />
                    Due: {formatDateOnly(topic.dueDate)}
                  </div>
                )}
                {topic.maxDurationMinutes && (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-2 w-2 rounded-full bg-sky-500" aria-hidden />
                    Duration: {topic.maxDurationMinutes} minutes
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
                  Created: {formatDateOnly(topic.createdAt)}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-200">
                <Button
                  text="Return to course"
                  variant="secondary"
                  fontSize="14px"
                  borderRadius="10px"
                  paddingWidth="14px"
                  paddingHeight="10px"
                  onClick={() => navigate(`/instructor/course/${topic.courseId}`)}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TopicDetailPage;
