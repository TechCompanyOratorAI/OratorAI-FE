import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, Clock, BookOpen, FileText, CheckCircle2, Info } from "lucide-react";
import SidebarStudent from "@/components/Sidebar/SidebarStudent/SidebarStudent";
import Button from "@/components/yoodli/Button";
import Toast from "@/components/Toast/Toast";
import { useAppDispatch, useAppSelector } from "@/services/store/store";
import { fetchTopicDetail } from "@/services/features/topic/topicSlice";
import { fetchEnrolledTopics, fetchEnrolledCourses, enrollTopic, dropTopic } from "@/services/features/enrollment/enrollmentSlice";

const StudentTopicDetailPage: React.FC = () => {
  const { topicId } = useParams<{ topicId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { selectedTopic: topic, loading, error } = useAppSelector(
    (state) => state.topic
  );
  const { enrolledTopicIds, enrolledCourseIds, loading: enrollmentLoading } = useAppSelector(
    (state) => state.enrollment
  );

  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const [enrollingTopicId, setEnrollingTopicId] = useState<number | null>(null);
  const [droppingTopicId, setDroppingTopicId] = useState<number | null>(null);
  const [dropConfirmTopicId, setDropConfirmTopicId] = useState<number | null>(null);

  useEffect(() => {
    if (topicId) {
      dispatch(fetchTopicDetail(parseInt(topicId)));
      dispatch(fetchEnrolledTopics());
      dispatch(fetchEnrolledCourses());
    }
  }, [topicId, dispatch]);

  useEffect(() => {
    if (error) {
      setToast({
        message: error,
        type: "error",
      });
    }
  }, [error]);

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

  const isTopicEnrolled = (topicId: number): boolean => {
    return enrolledTopicIds.includes(topicId);
  };

  const isCourseEnrolled = (courseId: number): boolean => {
    return enrolledCourseIds.includes(courseId);
  };

  const handleEnrollTopic = async (topicId: number) => {
    try {
      setEnrollingTopicId(topicId);
      await dispatch(enrollTopic(topicId)).unwrap();
      // Refresh enrolled topics list
      await dispatch(fetchEnrolledTopics());
      setToast({
        message: "Successfully enrolled in topic!",
        type: "success",
      });
    } catch (error: unknown) {
      const errorMessage = typeof error === 'string'
        ? error
        : (error as Error)?.message || "Failed to enroll in topic";
      setToast({
        message: errorMessage,
        type: "error",
      });
    } finally {
      setEnrollingTopicId(null);
    }
  };

  const handleDropTopic = async (topicId: number) => {
    try {
      setDroppingTopicId(topicId);
      await dispatch(dropTopic(topicId)).unwrap();
      // Refresh enrolled topics list
      await dispatch(fetchEnrolledTopics());
      setToast({
        message: "Successfully dropped topic!",
        type: "success",
      });
      setDropConfirmTopicId(null);
    } catch (error: unknown) {
      const errorMessage = typeof error === 'string'
        ? error
        : (error as Error)?.message || "Failed to drop topic";
      setToast({
        message: errorMessage,
        type: "error",
      });
    } finally {
      setDroppingTopicId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <SidebarStudent activeItem="courses" />
        <main className="flex-1 overflow-y-auto lg:ml-0">
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-sky-200 border-t-sky-500 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading topic details...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !topic) {
    return (
      <div className="flex h-screen bg-gray-50">
        <SidebarStudent activeItem="courses" />
        <main className="flex-1 overflow-y-auto lg:ml-0">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
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
        </main>
      </div>
    );
  }

  const instructorName = topic.course.instructor
    ? `${topic.course.instructor.firstName || ""} ${topic.course.instructor.lastName || ""}`.trim() || topic.course.instructor.username || "Unknown Instructor"
    : "Unknown Instructor";

  return (
    <div className="flex h-screen bg-gray-50">
      <SidebarStudent activeItem="courses" />
      <main className="flex-1 overflow-y-auto lg:ml-0">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          {/* Back Button */}
          <button
            onClick={() => navigate(`/student/course/${topic.courseId}`)}
            className="flex items-center gap-2 text-sky-600 hover:text-sky-700 font-medium mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to course
          </button>

          {/* Topic Header */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-full bg-sky-100 text-sky-700 font-bold flex items-center justify-center text-lg">
                    {topic.sequenceNumber}
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide bg-sky-100 text-sky-700 border border-sky-200">
                    Topic #{topic.sequenceNumber}
                  </span>
                  {isTopicEnrolled(topic.topicId) && (
                    <div className="flex items-center gap-2 px-2 py-1 bg-green-50 text-green-700 rounded-full border border-green-200">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span className="text-xs font-medium">Enrolled</span>
                    </div>
                  )}
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {topic.topicName}
                </h1>
                {topic.description && (
                  <p className="text-lg text-gray-700 mb-4">
                    {topic.description}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-4">
                  {topic.dueDate && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <Calendar className="w-5 h-5 text-sky-600" />
                      <span className="font-medium">Due: {formatDate(topic.dueDate)}</span>
                    </div>
                  )}
                  {topic.maxDurationMinutes && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <Clock className="w-5 h-5 text-indigo-600" />
                      <span className="font-medium">{topic.maxDurationMinutes} minutes</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!isCourseEnrolled(topic.courseId) ? (
                  <div className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg border border-gray-200">
                    <span className="text-sm font-medium">Enroll in course first</span>
                  </div>
                ) : isTopicEnrolled(topic.topicId) ? (
                  <Button
                    text={droppingTopicId === topic.topicId ? "Dropping..." : "Drop Topic"}
                    variant="secondary"
                    fontSize="14px"
                    borderRadius="6px"
                    paddingWidth="16px"
                    paddingHeight="8px"
                    onClick={() => setDropConfirmTopicId(topic.topicId)}
                    disabled={droppingTopicId === topic.topicId}
                  />
                ) : (
                  <Button
                    text={enrollingTopicId === topic.topicId ? "Enrolling..." : "Enroll Topic"}
                    variant="primary"
                    fontSize="14px"
                    borderRadius="6px"
                    paddingWidth="16px"
                    paddingHeight="8px"
                    onClick={() => handleEnrollTopic(topic.topicId)}
                    disabled={enrollingTopicId === topic.topicId || enrollmentLoading}
                  />
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Course Info */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="rounded-lg bg-sky-100 p-2">
                    <BookOpen className="w-5 h-5 text-sky-700" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Course</p>
                    <h3 className="text-lg font-bold text-gray-900">{topic.course.courseName}</h3>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Course Code</span>
                    <span className="font-semibold text-gray-900">{topic.course.courseCode}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Instructor</span>
                    <span className="font-semibold text-gray-900">
                      {instructorName}
                    </span>
                  </div>
                  <button
                    onClick={() => navigate(`/student/course/${topic.courseId}`)}
                    className="w-full mt-4 text-left px-4 py-2 text-sm text-sky-600 hover:bg-sky-50 rounded-lg transition"
                  >
                    View Course Details →
                  </button>
                </div>
              </div>

              {/* Requirements */}
              {topic.requirements && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="rounded-lg bg-amber-100 p-2">
                      <FileText className="w-5 h-5 text-amber-700" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Requirements</p>
                      <h3 className="text-lg font-bold text-gray-900">Topic Requirements</h3>
                    </div>
                  </div>
                  <div className="prose prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans bg-gray-50 p-4 rounded-lg border border-gray-200">
                      {topic.requirements}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Topic Info */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Info className="w-5 h-5 text-indigo-600" />
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Topic info</p>
                    <h3 className="text-lg font-bold text-gray-900">Details</h3>
                  </div>
                </div>
                <div className="space-y-3 text-sm text-gray-700">
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

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <Button
                    text="Return to course"
                    variant="secondary"
                    fontSize="14px"
                    borderRadius="6px"
                    paddingWidth="16px"
                    paddingHeight="8px"
                    onClick={() => navigate(`/student/course/${topic.courseId}`)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Drop Topic Confirmation Dialog */}
      {dropConfirmTopicId !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm mx-4">
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              Drop Topic
            </h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to drop this topic? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                text="Cancel"
                variant="secondary"
                fontSize="14px"
                borderRadius="6px"
                paddingWidth="16px"
                paddingHeight="8px"
                onClick={() => setDropConfirmTopicId(null)}
              />
              <Button
                text="Drop Topic"
                variant="primary"
                fontSize="14px"
                borderRadius="6px"
                paddingWidth="16px"
                paddingHeight="8px"
                onClick={() => handleDropTopic(dropConfirmTopicId)}
              />
            </div>
          </div>
        </div>
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
