import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  User,
  BookOpen,
  Clock,
} from "lucide-react";
import Button from "@/components/yoodli/Button";
import { useAppDispatch, useAppSelector } from "@/services/store/store";
import { fetchCourseDetail } from "@/services/features/course/courseSlice";

const CourseDetailPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { selectedCourse: course, loading, error } = useAppSelector(
    (state) => state.course
  );

  useEffect(() => {
    if (courseId) {
      dispatch(fetchCourseDetail(parseInt(courseId)));
    }
  }, [courseId, dispatch]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-sky-200 border-t-sky-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading course details...</p>
        </div>
      </div>
    );
  }

  if (error || !course) {
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
              {error || "Course not found"}
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

  const courseDuration = Math.ceil(
    (new Date(course.endDate).getTime() - new Date(course.startDate).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-[1280px] mx-auto px-4 py-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sky-600 hover:text-sky-700 font-medium mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Courses
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1280px] mx-auto px-4 py-8">
        {/* Course Header */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <span
                  className={`px-3 py-1 rounded-lg text-xs font-medium ${
                    course.isActive
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {course.isActive ? "Active" : "Archived"}
                </span>
                <span className="text-sm text-gray-600">{course.semester}</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {course.courseName}
              </h1>
              <p className="text-gray-600 mb-4">{course.description}</p>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-sky-600" />
                  <div>
                    <p className="text-xs text-gray-600">Course Code</p>
                    <p className="font-semibold text-gray-900">
                      {course.courseCode}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-sky-600" />
                  <div>
                    <p className="text-xs text-gray-600">Duration</p>
                    <p className="font-semibold text-gray-900">
                      {courseDuration} days
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-sky-600" />
                  <div>
                    <p className="text-xs text-gray-600">Academic Year</p>
                    <p className="font-semibold text-gray-900">
                      {course.academicYear}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-sky-600" />
                  <div>
                    <p className="text-xs text-gray-600">Topics</p>
                    <p className="font-semibold text-gray-900">
                      {course.topics?.length || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Course Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Left Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Course Timeline */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Course Timeline
              </h2>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-sky-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-sky-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-600 uppercase">
                      Start Date
                    </p>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatDate(course.startDate)}
                    </p>
                  </div>
                </div>
                <div className="border-l-2 border-gray-300 ml-6 h-8"></div>
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-600 uppercase">
                      End Date
                    </p>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatDate(course.endDate)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Topics */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Course Topics ({course.topics?.length || 0})
              </h2>
              {course.topics && course.topics.length > 0 ? (
                <div className="space-y-3">
                  {course.topics.map((topic) => (
                    <div
                      key={topic.topicId}
                      className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                    >
                      <div className="flex items-start gap-3 mb-2">
                        <div className="flex-shrink-0 w-8 h-8 bg-sky-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-semibold text-sky-600">
                            {topic.sequenceNumber}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">
                            {topic.topicName}
                          </h3>
                          {topic.description && (
                            <p className="text-sm text-gray-600 mt-1">
                              {topic.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mt-3 ml-11 text-xs text-gray-600">
                        {topic.dueDate && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            Due: {formatDate(topic.dueDate)}
                          </div>
                        )}
                        {topic.maxDurationMinutes && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {topic.maxDurationMinutes} min
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-center py-8">
                  No topics added yet
                </p>
              )}
            </div>
          </div>

          {/* Right Column - Instructor */}
          <div className="space-y-6">
            {/* Instructor Card */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Instructor
              </h2>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-sky-400 to-indigo-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <User className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  {course.instructor.firstName} {course.instructor.lastName}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  @{course.instructor.username}
                </p>
                <div className="space-y-3 text-left">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600">User ID</p>
                    <p className="text-sm font-medium text-gray-900">
                      {course.instructor.userId}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600">Email</p>
                    <p className="text-sm font-medium text-gray-900 break-all">
                      {course.instructor.email}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Course Info Card */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Course Info
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-600 uppercase font-medium">
                    Created
                  </p>
                  <p className="text-sm text-gray-900">
                    {formatDate(course.createdAt)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 uppercase font-medium">
                    Last Updated
                  </p>
                  <p className="text-sm text-gray-900">
                    {formatDate(course.updatedAt)}
                  </p>
                </div>
                <div className="pt-4 border-t border-gray-200">
                  <Button
                    text="Back to Courses"
                    variant="secondary"
                    fontSize="14px"
                    borderRadius="6px"
                    paddingWidth="12px"
                    paddingHeight="8px"
                    onClick={() => navigate(-1)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CourseDetailPage;
