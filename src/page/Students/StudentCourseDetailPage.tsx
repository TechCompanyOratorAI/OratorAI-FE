import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, User, BookOpen, Clock, CheckCircle2, Info } from "lucide-react";
import SidebarStudent from "@/components/Sidebar/SidebarStudent/SidebarStudent";
import Button from "@/components/yoodli/Button";
import Toast from "@/components/Toast/Toast";
import { useAppDispatch, useAppSelector } from "@/services/store/store";
import { fetchCourseDetail } from "@/services/features/course/courseSlice";
import { enrollTopic, fetchEnrolledTopics, dropCourse, dropTopic, fetchEnrolledCourses, enrollCourse } from "@/services/features/enrollment/enrollmentSlice";

const StudentCourseDetailPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { selectedCourse: course, loading, error } = useAppSelector(
    (state) => state.course
  );
  const { enrolledTopicIds, enrolledCourseIds, loading: enrollmentLoading } = useAppSelector(
    (state) => state.enrollment
  );

  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const [enrollingTopicId, setEnrollingTopicId] = useState<number | null>(null);
  const [enrollingCourseId, setEnrollingCourseId] = useState<number | null>(null);
  const [droppingTopicId, setDroppingTopicId] = useState<number | null>(null);
  const [droppingCourseId, setDroppingCourseId] = useState<number | null>(null);
  const [dropConfirmCourseId, setDropConfirmCourseId] = useState<number | null>(null);
  const [dropConfirmTopicId, setDropConfirmTopicId] = useState<number | null>(null);

  useEffect(() => {
    if (courseId) {
      dispatch(fetchCourseDetail(parseInt(courseId)));
      dispatch(fetchEnrolledTopics());
      dispatch(fetchEnrolledCourses());
    }
  }, [courseId, dispatch]);

  const handleEnrollCourse = async (courseId: number) => {
    try {
      setEnrollingCourseId(courseId);
      await dispatch(enrollCourse(courseId)).unwrap();
      // Refresh enrolled courses list
      await dispatch(fetchEnrolledCourses());
      setToast({
        message: "Successfully enrolled in course!",
        type: "success",
      });
    } catch (error: unknown) {
      const errorMessage = typeof error === 'string' 
        ? error 
        : (error as Error)?.message || "Failed to enroll in course";
      setToast({
        message: errorMessage,
        type: "error",
      });
    } finally {
      setEnrollingCourseId(null);
    }
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

  const isTopicEnrolled = (topicId: number): boolean => {
    return enrolledTopicIds.includes(topicId);
  };

  const isCourseEnrolled = (courseId: number): boolean => {
    return enrolledCourseIds.includes(courseId);
  };

  const handleDropCourse = async (courseId: number) => {
    try {
      setDroppingCourseId(courseId);
      await dispatch(dropCourse(courseId)).unwrap();
      // Refresh enrolled courses list
      await dispatch(fetchEnrolledCourses());
      setToast({
        message: "Successfully dropped course!",
        type: "success",
      });
      setDropConfirmCourseId(null);
      // Navigate back to courses page
      navigate("/student/my-courses");
    } catch (error: unknown) {
      const errorMessage = typeof error === 'string' 
        ? error 
        : (error as Error)?.message || "Failed to drop course";
      setToast({
        message: errorMessage,
        type: "error",
      });
    } finally {
      setDroppingCourseId(null);
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
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-sky-200 border-t-sky-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading course details...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="flex h-screen bg-gray-50">
        <SidebarStudent activeItem="courses" />
        <main className="flex-1 overflow-y-auto">
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
                {error || "Course not found"}
              </p>
            </div>
          </div>
        </main>
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

  const courseDuration = Math.ceil(
    (new Date(course.endDate).getTime() - new Date(course.startDate).getTime()) /
    (1000 * 60 * 60 * 24)
  );

  const instructorName = course.instructor
    ? `${course.instructor.firstName || ""} ${course.instructor.lastName || ""}`.trim() || course.instructor.username || "Unknown Instructor"
    : "Unknown Instructor";

  return (
    <div className="flex h-screen bg-gray-50">
      <SidebarStudent activeItem="courses" />
      <main className="flex-1 overflow-y-auto lg:ml-0">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          {/* Header */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sky-600 hover:text-sky-700 font-medium mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Courses
          </button>

          {/* Course Header */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      course.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {course.isActive ? "Active" : "Archived"}
                  </span>
                  <span className="text-sm text-gray-600">
                    {course.semester} • {course.academicYear}
                  </span>
                  {courseId && isCourseEnrolled(parseInt(courseId)) && (
                    <div className="flex items-center gap-2 px-2 py-1 bg-green-50 text-green-700 rounded-full border border-green-200">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span className="text-xs font-medium">Enrolled</span>
                    </div>
                  )}
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {course.courseName}
                </h1>
                <p className="text-lg text-gray-600 mb-1">
                  {course.courseCode}
                </p>
                {course.description && (
                  <p className="text-gray-700 mt-3">
                    {course.description}
                  </p>
                )}
              </div>
              {courseId && (
                <div className="flex items-center gap-2">
                  {isCourseEnrolled(parseInt(courseId)) ? (
                    <Button
                      text={droppingCourseId === parseInt(courseId) ? "Dropping..." : "Drop Course"}
                      variant="secondary"
                      fontSize="14px"
                      borderRadius="6px"
                      paddingWidth="16px"
                      paddingHeight="8px"
                      onClick={() => setDropConfirmCourseId(parseInt(courseId))}
                      disabled={droppingCourseId === parseInt(courseId)}
                    />
                  ) : (
                    <Button
                      text={enrollingCourseId === parseInt(courseId) ? "Enrolling..." : "Enroll Course"}
                      variant="primary"
                      fontSize="14px"
                      borderRadius="6px"
                      paddingWidth="16px"
                      paddingHeight="8px"
                      onClick={() => handleEnrollCourse(parseInt(courseId))}
                      disabled={enrollingCourseId === parseInt(courseId) || enrollmentLoading}
                    />
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Timeline</p>
                <div className="flex items-center gap-2 text-gray-800 font-semibold">
                  <Calendar className="w-4 h-4 text-sky-600" />
                  {courseDuration} days
                </div>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Topics</p>
                <div className="flex items-center gap-2 text-gray-800 font-semibold">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  {course.topics?.length || 0} topics
                </div>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Instructor</p>
                <div className="flex items-center gap-2 text-gray-800 font-semibold">
                  <User className="w-4 h-4 text-amber-600" />
                  {instructorName}
                </div>
              </div>
            </div>
          </div>

          {/* Topics Section */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
            <div className="mb-4">
              <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-1">
                Learning modules
              </p>
              <h3 className="text-xl font-bold text-gray-900">
                Topics ({course.topics?.length || 0})
              </h3>
            </div>

            {course.topics && course.topics.length > 0 ? (
              <div className="space-y-3">
                {course.topics.map((topic) => (
                  <div
                    key={topic.topicId}
                    className="rounded-xl border border-gray-200 hover:border-sky-200 hover:shadow transition bg-gray-50/60"
                  >
                    <div className="p-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="w-10 h-10 rounded-full bg-sky-100 text-sky-700 font-bold flex items-center justify-center flex-shrink-0">
                          {topic.sequenceNumber}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1">{topic.topicName}</h4>
                          {topic.description && (
                            <p className="text-sm text-gray-600">
                              {topic.description}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-2 mt-2 text-xs font-semibold text-gray-600">
                            {topic.dueDate && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-white border border-gray-200 px-3 py-1">
                                <Calendar className="w-3 h-3" />
                                Due: {formatDate(topic.dueDate)}
                              </span>
                            )}
                            {topic.maxDurationMinutes && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-white border border-gray-200 px-3 py-1">
                                <Clock className="w-3 h-3" />
                                {topic.maxDurationMinutes} mins
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!courseId || !isCourseEnrolled(parseInt(courseId)) ? (
                          <div className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg border border-gray-200">
                            <span className="text-sm font-medium">Enroll in course first</span>
                          </div>
                        ) : isTopicEnrolled(topic.topicId) ? (
                          <>
                            <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-full border border-green-200">
                              <CheckCircle2 className="w-4 h-4" />
                              <span className="text-sm font-medium">Enrolled</span>
                            </div>
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
                          </>
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
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-gray-200 p-8 text-center text-gray-600 bg-gray-50">
                No topics available yet.
              </div>
            )}
          </div>

          {/* Course Info */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <Info className="w-5 h-5 text-indigo-600" />
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">
                  Course information
                </p>
                <h3 className="text-lg font-bold text-gray-900">Details</h3>
              </div>
            </div>
            <div className="space-y-3 text-sm text-gray-700">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Start Date</span>
                <span className="font-semibold text-gray-900">{formatDate(course.startDate)}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">End Date</span>
                <span className="font-semibold text-gray-900">{formatDate(course.endDate)}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Duration</span>
                <span className="font-semibold text-gray-900">{courseDuration} days</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-gray-600">Status</span>
                <span className={`font-semibold ${course.isActive ? "text-green-700" : "text-gray-700"}`}>
                  {course.isActive ? "Active" : "Archived"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Drop Course Confirmation Dialog */}
      {dropConfirmCourseId !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm mx-4">
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              Drop Course
            </h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to drop this course? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                text="Cancel"
                variant="secondary"
                fontSize="14px"
                borderRadius="6px"
                paddingWidth="16px"
                paddingHeight="8px"
                onClick={() => setDropConfirmCourseId(null)}
              />
              <Button
                text="Drop Course"
                variant="primary"
                fontSize="14px"
                borderRadius="6px"
                paddingWidth="16px"
                paddingHeight="8px"
                onClick={() => handleDropCourse(dropConfirmCourseId)}
              />
            </div>
          </div>
        </div>
      )}

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

export default StudentCourseDetailPage;
