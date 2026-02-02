import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/services/store/store";
import {
  fetchCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  CourseData,
} from "@/services/features/course/courseSlice";
import { fetchInstructorByCourse } from "@/services/features/admin/adminSlice";
import CourseModal from "@/components/Course/CourseModal";
import InstructorModal from "@/components/Course/InstructorModal";
import SidebarAdmin from "@/components/Sidebar/SidebarAdmin/SidebarAdmin";
import Toast from "@/components/Toast/Toast";
import {
  Plus,
  Edit,
  Trash2,
  UserPlus,
  RefreshCw,
  Book,
  GraduationCap,
  Users as UsersIcon,
  AlertCircle,
  BookOpen,
} from "lucide-react";
import axiosInstance from "@/services/constant/axiosInstance";
import {
  ADD_INSTRUCTOR_TO_COURSE_ENDPOINT,
  REMOVE_INSTRUCTOR_FROM_COURSE_ENDPOINT,
} from "@/services/constant/apiConfig";

const AdminCoursePage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { courses, loading, error } = useSelector(
    (state: RootState) => state.course,
  );
  const { users } = useSelector((state: RootState) => state.admin);

  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [isInstructorModalOpen, setIsInstructorModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<
    CourseData | undefined
  >();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSemester, setFilterSemester] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(
    null,
  );
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  useEffect(() => {
    dispatch(fetchCourses({ page: 1, limit: 100 }));
  }, [dispatch]);

  const handleCreateCourse = () => {
    setSelectedCourse(undefined);
    setIsCourseModalOpen(true);
  };

  const handleEditCourse = (course: CourseData) => {
    setSelectedCourse(course);
    setIsCourseModalOpen(true);
  };

  const handleDeleteCourse = async (courseId: number) => {
    try {
      await dispatch(deleteCourse(courseId)).unwrap();
      setShowDeleteConfirm(null);
      setToast({ message: "Course deleted successfully", type: "success" });
    } catch (error) {
      console.error("Failed to delete course:", error);
      setToast({
        message: "Failed to delete course. Please try again.",
        type: "error",
      });
    }
  };

  const handleSubmitCourse = async (courseData: any) => {
    try {
      if (selectedCourse) {
        await dispatch(
          updateCourse({
            courseId: selectedCourse.courseId,
            data: courseData,
          }),
        ).unwrap();
        setToast({ message: "Course updated successfully", type: "success" });
      } else {
        await dispatch(createCourse(courseData)).unwrap();
        setToast({ message: "Course created successfully", type: "success" });
      }
      setIsCourseModalOpen(false);
    } catch (error) {
      console.error("Failed to save course:", error);
      setToast({
        message: selectedCourse
          ? "Failed to update course. Please try again."
          : "Failed to create course. Please try again.",
        type: "error",
      });
    }
  };

  const handleManageInstructors = async (course: CourseData) => {
    setSelectedCourse(course);
    setIsInstructorModalOpen(true);
    // Fetch available instructors for this specific course
    await dispatch(fetchInstructorByCourse(course.courseId.toString()));
  };

  const handleAddInstructor = async (userId: number) => {
    if (!selectedCourse) return;

    try {
      await axiosInstance.post(
        ADD_INSTRUCTOR_TO_COURSE_ENDPOINT(selectedCourse.courseId.toString()),
        { instructorIds: [userId] },
      );
      setToast({
        message: "Instructor added successfully",
        type: "success",
      });
      await dispatch(fetchCourses({ page: 1, limit: 100 }));
      // Reload page after successful add
      setTimeout(() => window.location.reload(), 500);
    } catch (error) {
      console.error("Failed to add instructor:", error);
      setToast({
        message: "Failed to add instructor. Please try again.",
        type: "error",
      });
    }
  };

  const handleRemoveInstructor = async (userId: number) => {
    if (!selectedCourse) return;

    try {
      await axiosInstance.delete(
        REMOVE_INSTRUCTOR_FROM_COURSE_ENDPOINT(
          selectedCourse.courseId.toString(),
          userId.toString(),
        ),
      );
      setToast({
        message: "Instructor removed successfully",
        type: "success",
      });
      await dispatch(fetchCourses({ page: 1, limit: 100 }));
      // Reload page after successful remove
      setTimeout(() => window.location.reload(), 500);
    } catch (error) {
      console.error("Failed to remove instructor:", error);
      setToast({
        message: "Failed to remove instructor. Please try again.",
        type: "error",
      });
    }
  };

  const currentInstructors = selectedCourse?.instructors?.length
    ? selectedCourse.instructors.map((instructor) => ({
        userId: instructor.userId,
        username: instructor.username,
        email: instructor.email,
        firstName: instructor.firstName,
        lastName: instructor.lastName,
      }))
    : selectedCourse?.instructor
      ? [
          {
            userId: selectedCourse.instructor.userId,
            username: selectedCourse.instructor.username,
            email: selectedCourse.instructor.email,
            firstName: selectedCourse.instructor.firstName,
            lastName: selectedCourse.instructor.lastName,
          },
        ]
      : [];

  // Use instructors from API (when InstructorModal is open, users contains available instructors)
  const availableInstructors = users.map((user) => ({
    userId: user.userId,
    username: user.username,
    email: user.email,
    firstName: user.firstName || "",
    lastName: user.lastName || "",
  }));

  // Filter courses
  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const matchesSearch =
        course.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.courseCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (course.majorCode || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
      const matchesSemester = filterSemester
        ? course.semester === filterSemester
        : true;
      return matchesSearch && matchesSemester;
    });
  }, [courses, searchTerm, filterSemester]);

  // Statistics
  const stats = useMemo(() => {
    const total = courses.length;
    const active = courses.filter((c) => c.isActive).length;
    const totalEnrollments = courses.reduce(
      (sum, c) => sum + (c.enrollmentCount || 0),
      0,
    );
    return { total, active, totalEnrollments };
  }, [courses]);

  // Get unique semesters for filter
  const semesters = Array.from(new Set(courses.map((c) => c.semester)));

  return (
    <div className="flex min-h-screen bg-slate-50">
      <SidebarAdmin activeItem="manage-courses" />
      <main className="flex-1 overflow-y-auto p-6 sm:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
                Administration
              </p>
              <h1 className="text-2xl font-bold text-slate-900">
                Course Management
              </h1>
              <p className="text-sm text-slate-600">
                Manage all courses, instructors, and course details
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => dispatch(fetchCourses({ page: 1, limit: 100 }))}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:border-sky-200 hover:text-sky-700"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
              <button
                onClick={handleCreateCourse}
                className="inline-flex items-center gap-2 rounded-full border bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                New Course
              </button>
            </div>
          </div>

          {/* Statistics Cards */}
          <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex items-center gap-3">
              <div className="rounded-lg bg-sky-100 text-sky-700 p-2">
                <Book className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs uppercase text-slate-500 font-semibold">
                  Total Courses
                </p>
                <p className="text-xl font-bold text-slate-900">
                  {stats.total}
                </p>
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex items-center gap-3">
              <div className="rounded-lg bg-emerald-100 text-emerald-700 p-2">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs uppercase text-slate-500 font-semibold">
                  Active Courses
                </p>
                <p className="text-xl font-bold text-slate-900">
                  {stats.active}
                </p>
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex items-center gap-3">
              <div className="rounded-lg bg-indigo-100 text-indigo-700 p-2">
                <UsersIcon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs uppercase text-slate-500 font-semibold">
                  Total Enrollments
                </p>
                <p className="text-xl font-bold text-slate-900">
                  {stats.totalEnrollments}
                </p>
              </div>
            </div>
          </section>

          {/* Main Content */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm">
            {/* Search and Filter Bar */}
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between px-6 py-4 border-b border-slate-200">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
                  Directory
                </p>
                <h2 className="text-lg font-bold text-slate-900">
                  All Courses
                </h2>
              </div>
              <div className="flex rounded-2xl flex-col sm:flex-row gap-2 sm:items-center w-full md:w-auto">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name or code..."
                  className="w-full sm:w-64 rounded-full border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
                />
                <div className="relative w-full sm:w-40">
                  <select
                    value={filterSemester}
                    onChange={(e) => setFilterSemester(e.target.value)}
                    className="w-full rounded-full border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none bg-white appearance-none cursor-pointer pr-8"
                  >
                    <option value="">All Semesters</option>
                    {semesters.map((semester) => (
                      <option key={semester} value={semester}>
                        {semester}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 14l-7 7m0 0l-7-7m7 7V3"
                      />
                    </svg>
                  </div>
                </div>

                <div className="text-xs text-slate-500 whitespace-nowrap">
                  {filteredCourses.length} records
                </div>
              </div>
            </div>
            {/* Table Content */}
            {loading ? (
              <div className="px-6 py-10 text-center text-slate-500">
                <div className="mx-auto mb-3 h-10 w-10 border-4 border-sky-200 border-t-sky-500 rounded-full animate-spin" />
                Loading courses...
              </div>
            ) : error ? (
              <div className="px-6 py-8 flex items-center gap-3 text-rose-600">
                <AlertCircle className="w-5 h-5" />
                {error}
              </div>
            ) : filteredCourses.length === 0 ? (
              <div className="px-6 py-12 text-center text-slate-500 flex flex-col items-center gap-3">
                <BookOpen className="w-10 h-10 text-slate-300" />
                <p>
                  {searchTerm || filterSemester
                    ? "No courses found matching your filters"
                    : "No courses available. Create your first course to get started."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-slate-600 uppercase text-xs tracking-wide">
                    <tr>
                      <th className="px-6 py-3 text-left font-semibold">
                        Course Info
                      </th>
                      <th className="px-6 py-3 text-left font-semibold">
                        Instructor
                      </th>
                      <th className="px-6 py-3 text-left font-semibold">
                        Semester
                      </th>
                      <th className="px-6 py-3 text-left font-semibold">
                        Academic Year
                      </th>
                      <th className="px-6 py-3 text-left font-semibold">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left font-semibold">
                        Enrollments
                      </th>
                      <th className="px-6 py-3 text-right font-semibold">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCourses.map((course) => (
                      <tr
                        key={course.courseId}
                        className="hover:bg-slate-50/80 transition"
                      >
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-900">
                            {course.courseCode}
                          </div>
                          <div className="text-xs text-slate-500">
                            Major: {course.majorCode}
                          </div>
                          <div className="text-slate-700 font-medium">
                            {course.courseName}
                          </div>
                          <div className="text-xs text-slate-500 mt-1 line-clamp-1">
                            {course.description}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {course.instructors &&
                          course.instructors.length > 0 ? (
                            <div className="space-y-2">
                              {course.instructors.map((instructor) => (
                                <div key={instructor.userId}>
                                  <div className="font-semibold text-slate-900">
                                    {instructor.firstName} {instructor.lastName}
                                  </div>
                                  <div className="text-xs text-slate-500">
                                    {instructor.email}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : course.instructor ? (
                            <div>
                              <div className="font-semibold text-slate-900">
                                {course.instructor.firstName}{" "}
                                {course.instructor.lastName}
                              </div>
                              <div className="text-xs text-slate-500">
                                {course.instructor.email}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-xs">
                              No instructor assigned
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border bg-slate-50 text-slate-700 border-slate-200">
                            {course.semester}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-700">
                          {course.academicYear}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                              course.isActive
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-rose-50 text-rose-700 border-rose-200"
                            }`}
                          >
                            {course.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-700 font-medium">
                          {course.enrollmentCount || 0}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => handleManageInstructors(course)}
                              className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                              title="Manage Instructors"
                            >
                              <UserPlus className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEditCourse(course)}
                              className="p-2 text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                              title="Edit Course"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() =>
                                setShowDeleteConfirm(course.courseId)
                              }
                              className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Delete Course"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-full bg-rose-100 p-2">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Delete Course
              </h3>
            </div>
            <p className="text-slate-600 mb-6">
              Are you sure you want to delete this course? This action cannot be
              undone and will affect all enrolled students and course data.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteCourse(showDeleteConfirm)}
                className="px-4 py-2 rounded-lg bg-rose-600 text-white font-semibold hover:bg-rose-700 transition-colors"
              >
                Delete Course
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Course Modal */}
      <CourseModal
        isOpen={isCourseModalOpen}
        onClose={() => setIsCourseModalOpen(false)}
        onSubmit={handleSubmitCourse}
        initialData={selectedCourse}
        isLoading={loading}
      />

      {/* Instructor Modal */}
      <InstructorModal
        isOpen={isInstructorModalOpen}
        onClose={() => setIsInstructorModalOpen(false)}
        currentInstructors={currentInstructors}
        availableInstructors={availableInstructors}
        onAddInstructor={handleAddInstructor}
        onRemoveInstructor={handleRemoveInstructor}
        isLoading={loading}
      />

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default AdminCoursePage;
