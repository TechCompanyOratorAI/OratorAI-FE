import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Plus,
  Pencil,
  Trash2,
  Users,
  RefreshCw,
  BookOpen,
  AlertCircle,
} from "lucide-react";
import SidebarAdmin from "@/components/Sidebar/SidebarAdmin/SidebarAdmin";
import ClassModal from "@/components/Course/ClassModal";
import InstructorModal from "@/components/Course/InstructorModal";
import Toast from "@/components/Toast/Toast";
import {
  fetchClasses,
  createClass,
  updateClass,
  deleteClass,
  addInstructorToClass,
  removeInstructorFromClass,
  ClassData,
  InstructorInfo,
} from "@/services/features/admin/classSlice";
import { fetchInstructorByClass } from "@/services/features/admin/adminSlice";
import { fetchCourses } from "@/services/features/course/courseSlice";
import { RootState, AppDispatch } from "@/services/store/store";

const AdminClassPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { classes, loading, error, pagination } = useSelector(
    (state: RootState) => state.class,
  );
  const { users } = useSelector((state: RootState) => state.admin);
  const { courses = [] } = useSelector((state: RootState) => state.course);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInstructorModalOpen, setIsInstructorModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassData | undefined>();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "active" | "inactive" | "archived"
  >("all");
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(
    null,
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const reloadAfterAction = () => {
    setTimeout(() => window.location.reload(), 500);
  };

  useEffect(() => {
    dispatch(fetchClasses({ page: currentPage, limit: pageSize }));
  }, [dispatch, currentPage]);

  useEffect(() => {
    dispatch(fetchCourses({ page: 1, limit: 100 }));
  }, [dispatch]);

  const handleCreateClass = () => {
    setSelectedClass(undefined);
    setIsModalOpen(true);
  };

  const handleEditClass = (classData: ClassData) => {
    setSelectedClass(classData);
    setIsModalOpen(true);
  };

  const handleDeleteClass = async (classId: number) => {
    const result = await dispatch(deleteClass(classId));
    if (deleteClass.fulfilled.match(result)) {
      await dispatch(fetchClasses({ page: currentPage, limit: pageSize }));
      setToast({
        message: "Class deleted successfully",
        type: "success",
      });
    } else {
      setToast({
        message: "Failed to delete class",
        type: "error",
      });
    }
    setShowDeleteConfirm(null);
  };

  const handleSubmitClass = async (formData: any) => {
    if (selectedClass) {
      const result = await dispatch(
        updateClass({
          classId: selectedClass.classId,
          classData: formData,
        }),
      );
      if (updateClass.fulfilled.match(result)) {
        // Refresh the list after update
        await dispatch(fetchClasses({ page: currentPage, limit: pageSize }));
        setToast({
          message: "Class updated successfully",
          type: "success",
        });
      } else {
        setToast({
          message: "Failed to update class",
          type: "error",
        });
      }
    } else {
      const result = await dispatch(createClass(formData));
      if (createClass.fulfilled.match(result)) {
        // Refresh the list after creation
        await dispatch(fetchClasses({ page: currentPage, limit: pageSize }));
        setToast({
          message: "Class created successfully",
          type: "success",
        });
        reloadAfterAction();
      } else {
        setToast({
          message: "Failed to create class",
          type: "error",
        });
      }
    }
    setIsModalOpen(false);
    setSelectedClass(undefined);
  };

  const handleManageInstructors = async (classData: ClassData) => {
    setSelectedClass(classData);
    setIsInstructorModalOpen(true);
    // Fetch instructors for this specific class
    await dispatch(fetchInstructorByClass(classData.classId.toString()));
  };

  const handleAddInstructor = async (userId: number) => {
    if (selectedClass) {
      const result = await dispatch(
        addInstructorToClass({
          classId: selectedClass.classId,
          userId: userId,
        }),
      );
      if (addInstructorToClass.fulfilled.match(result)) {
        // Refresh class data after adding instructor
        const refreshResult = await dispatch(
          fetchClasses({ page: currentPage, limit: pageSize }),
        );
        if (fetchClasses.fulfilled.match(refreshResult)) {
          // Update selected class with new data
          const data = Array.isArray(refreshResult.payload.data)
            ? refreshResult.payload.data
            : [refreshResult.payload.data];
          const updatedClass = data.find(
            (c: ClassData) => c.classId === selectedClass.classId,
          );
          if (updatedClass) {
            setSelectedClass(updatedClass);
          }
        }
        setToast({
          message: "Instructor added successfully",
          type: "success",
        });
      } else {
        setToast({
          message: "Failed to add instructor",
          type: "error",
        });
      }
    }
  };

  const handleRemoveInstructor = async (userId: number) => {
    if (selectedClass) {
      const result = await dispatch(
        removeInstructorFromClass({
          classId: selectedClass.classId,
          userId: userId,
        }),
      );
      if (removeInstructorFromClass.fulfilled.match(result)) {
        // Refresh class data after removing instructor
        const refreshResult = await dispatch(
          fetchClasses({ page: currentPage, limit: pageSize }),
        );
        if (fetchClasses.fulfilled.match(refreshResult)) {
          // Update selected class with new data
          const data = Array.isArray(refreshResult.payload.data)
            ? refreshResult.payload.data
            : [refreshResult.payload.data];
          const updatedClass = data.find(
            (c: ClassData) => c.classId === selectedClass.classId,
          );
          if (updatedClass) {
            setSelectedClass(updatedClass);
          }
        }
        setToast({
          message: "Instructor removed successfully",
          type: "success",
        });
      } else {
        setToast({
          message: "Failed to remove instructor",
          type: "error",
        });
      }
    }
  };

  // Filter and search classes
  const filteredClasses = useMemo(
    () =>
      classes.filter((classItem: ClassData) => {
        const matchesSearch =
          classItem.classCode
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          classItem.className
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          (classItem.course?.courseCode
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ??
            false);

        const matchesStatus =
          filterStatus === "all" || classItem.status === filterStatus;

        return matchesSearch && matchesStatus;
      }),
    [classes, searchTerm, filterStatus],
  );

  const stats = useMemo(() => {
    const total = classes.length;
    const active = classes.filter(
      (c: ClassData) => c.status === "active",
    ).length;
    const totalStudents = classes.reduce(
      (sum: number, c: ClassData) => sum + (c.enrollmentCount || 0),
      0,
    );
    return { total, active, totalStudents };
  }, [classes]);

  // Get available instructors from users (populated by fetchInstructorByClass API)
  const getAvailableInstructors = (): InstructorInfo[] => {
    return users.map((user: any) => ({
      userId: user.userId,
      username: user.username,
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email,
    }));
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <SidebarAdmin activeItem="manage-classes" />
      <main className="flex-1 overflow-y-auto p-6 sm:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
                Administration
              </p>
              <h1 className="text-2xl font-bold text-slate-900">
                Class Management
              </h1>
              <p className="text-sm text-slate-600">
                Manage classes, instructors, and student enrollments.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() =>
                  dispatch(fetchClasses({ page: currentPage, limit: pageSize }))
                }
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:border-sky-200 hover:text-sky-700"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
              <button
                onClick={handleCreateClass}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-full border bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                New Class
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex items-center gap-3">
              <div className="rounded-lg bg-sky-100 text-sky-700 p-2">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs uppercase text-slate-500 font-semibold">
                  Total Classes
                </p>
                <p className="text-xl font-bold text-slate-900">
                  {stats.total}
                </p>
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex items-center gap-3">
              <div className="rounded-lg bg-emerald-100 text-emerald-700 p-2">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs uppercase text-slate-500 font-semibold">
                  Active
                </p>
                <p className="text-xl font-bold text-slate-900">
                  {stats.active}
                </p>
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex items-center gap-3">
              <div className="rounded-lg bg-indigo-100 text-indigo-700 p-2">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs uppercase text-slate-500 font-semibold">
                  Total Students
                </p>
                <p className="text-xl font-bold text-slate-900">
                  {stats.totalStudents}
                </p>
              </div>
            </div>
          </section>

          {/* Classes Table */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm">
            {/* Search and Filter Bar */}
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between px-6 py-4 border-b border-slate-200">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
                  Directory
                </p>
                <h2 className="text-lg font-bold text-slate-900">Classes</h2>
              </div>
              <div className="flex rounded-2xl flex-col sm:flex-row gap-2 sm:items-center w-full md:w-auto">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by code, name, or course..."
                  className="w-full sm:w-64 rounded-full border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
                />
                <div className="relative w-full sm:w-40">
                  <select
                    value={filterStatus}
                    onChange={(e) =>
                      setFilterStatus(
                        e.target.value as
                          | "all"
                          | "active"
                          | "inactive"
                          | "archived",
                      )
                    }
                    className="w-full rounded-full border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none bg-white appearance-none cursor-pointer pr-8"
                  >
                    <option value="all">All status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="archived">Archived</option>
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
                  {filteredClasses.length} records
                </div>
              </div>
            </div>

            {/* Table Content */}
            {loading ? (
              <div className="px-6 py-10 text-center text-slate-500">
                <div className="mx-auto mb-3 h-10 w-10 border-4 border-sky-200 border-t-sky-500 rounded-full animate-spin" />
                Loading classes...
              </div>
            ) : error ? (
              <div className="px-6 py-8 flex items-center gap-3 text-rose-600">
                <AlertCircle className="w-5 h-5" />
                {error}
              </div>
            ) : filteredClasses.length === 0 ? (
              <div className="px-6 py-12 text-center text-slate-500 flex flex-col items-center gap-3">
                <BookOpen className="w-10 h-10 text-slate-300" />
                <p>
                  {searchTerm || filterStatus !== "all"
                    ? "No classes found matching your filters"
                    : "No classes available. Create your first class to get started."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-slate-600 uppercase text-xs tracking-wide">
                    <tr>
                      <th className="px-6 py-3 text-left font-semibold">
                        Class
                      </th>
                      <th className="px-6 py-3 text-left font-semibold">
                        Course
                      </th>
                      <th className="px-6 py-3 text-left font-semibold">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left font-semibold">
                        Enrollment
                      </th>
                      <th className="px-6 py-3 text-left font-semibold">
                        Instructors
                      </th>
                      <th className="px-6 py-3 text-left font-semibold">
                        Start Date
                      </th>
                      <th className="px-6 py-3 text-left font-semibold">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredClasses.map((classItem: ClassData) => (
                      <tr
                        key={classItem.classId}
                        className="hover:bg-slate-50/80 transition"
                      >
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-900">
                            {classItem.classCode}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-900">
                            {classItem.course?.courseCode}
                          </div>
                          <div className="text-xs text-slate-500">
                            {classItem.course?.courseName}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                              classItem.status === "active"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : classItem.status === "inactive"
                                  ? "bg-slate-50 text-slate-700 border-slate-200"
                                  : "bg-rose-50 text-rose-700 border-rose-200"
                            }`}
                          >
                            {classItem.status.charAt(0).toUpperCase() +
                              classItem.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-700">
                          {classItem.enrollmentCount} / {classItem.maxStudents}
                        </td>
                        <td className="px-6 py-4">
                          {classItem.instructors &&
                          classItem.instructors.length > 0 ? (
                            <div className="space-y-2">
                              {classItem.instructors.map((instructor) => (
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
                          ) : (
                            <span className="text-slate-400 italic text-xs">
                              No instructor assigned
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-slate-700">
                          {new Date(classItem.startDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleManageInstructors(classItem)}
                              title="Manage Instructors"
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            >
                              <Users className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEditClass(classItem)}
                              title="Edit"
                              className="p-2 text-sky-600 hover:bg-sky-50 rounded-lg transition"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() =>
                                setShowDeleteConfirm(classItem.classId)
                              }
                              title="Delete"
                              className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition"
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
            {!loading && !error && pagination.total > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 px-6 py-4 border-t border-slate-200">
                
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <div className="text-sm text-slate-600">
                      Page {pagination.page} of {pagination.totalPages}
                    </div>

                    <select
                      value={pageSize}
                      onChange={(e) => {
                        const nextSize = parseInt(e.target.value);
                        setPageSize(nextSize);
                        setCurrentPage(1);
                      }}
                      className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-sm focus:border-sky-500 focus:outline-none"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(1, prev - 1))
                    }
                    disabled={pagination.page <= 1}
                    className="px-3 py-1.5 rounded-full border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() =>
                      setCurrentPage((prev) =>
                        Math.min(pagination.totalPages, prev + 1),
                      )
                    }
                    disabled={pagination.page >= pagination.totalPages}
                    className="px-3 py-1.5 rounded-full border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
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
              <h3 className="text-lg font-bold text-slate-900">Delete Class</h3>
            </div>
            <p className="text-slate-600 mb-6">
              Are you sure you want to delete this class? This action cannot be
              undone and will affect enrolled students.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 rounded-full border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteClass(showDeleteConfirm)}
                className="px-4 py-2 rounded-full bg-rose-600 text-white font-semibold hover:bg-rose-700 transition-colors"
              >
                Delete Class
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Class Modal */}
      <ClassModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedClass(undefined);
        }}
        onSubmit={handleSubmitClass}
        initialData={selectedClass}
        isLoading={loading}
        courses={courses}
      />

      {/* Instructor Modal */}
      <InstructorModal
        isOpen={isInstructorModalOpen}
        onClose={() => {
          setIsInstructorModalOpen(false);
          setSelectedClass(undefined);
        }}
        currentInstructors={selectedClass?.instructors ?? []}
        availableInstructors={getAvailableInstructors()}
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

export default AdminClassPage;
