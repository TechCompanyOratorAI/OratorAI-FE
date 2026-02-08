import React, { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Users,
  BookOpen,
  Info,
  CheckCircle2,
  Clock,
  KeyRound,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/services/store/store";
import { fetchClassDetail } from "@/services/features/admin/classSlice";
import SidebarInstructor from "@/components/Sidebar/SidebarInstructor/SidebarInstructor";

const ClassDetailPage: React.FC = () => {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { selectedClass, loading, error } = useAppSelector(
    (state) => state.class,
  );

  useEffect(() => {
    if (classId) {
      dispatch(fetchClassDetail(parseInt(classId)));
    }
  }, [classId, dispatch]);

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <SidebarInstructor activeItem="manage-classes" />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-sky-200 border-t-sky-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading class details...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !selectedClass) {
    return (
      <div className="flex h-screen bg-gray-50">
        <SidebarInstructor activeItem="manage-classes" />
        <main className="flex-1 overflow-y-auto">
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
                {error || "Class not found"}
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const statusConfig: Record<
    string,
    { label: string; bg: string; icon: React.ReactNode }
  > = {
    active: {
      label: "Active",
      bg: "bg-emerald-100 text-emerald-700",
      icon: <CheckCircle2 className="w-3 h-3" />,
    },
    inactive: {
      label: "Inactive",
      bg: "bg-slate-100 text-slate-700",
      icon: <Clock className="w-3 h-3" />,
    },
    archived: {
      label: "Archived",
      bg: "bg-rose-100 text-rose-700",
      icon: <Clock className="w-3 h-3" />,
    },
  };

  const status = statusConfig[selectedClass.status] || statusConfig.inactive;
  const enrollKeyValue =
    selectedClass.activeKeys?.[0]?.keyValue ||
    selectedClass.enrollKeys?.[0]?.keyValue ||
    "N/A";

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarInstructor activeItem="manage-classes" />
      <main className="flex-1 overflow-y-auto lg:ml-0">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 space-y-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate("/instructor/manage-classes")}
              className="inline-flex items-center gap-2 text-sky-700 hover:text-sky-800 font-semibold"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to classes
            </button>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Info className="w-4 h-4" />
              Instructor class overview
            </div>
          </div>

          <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-r from-indigo-600 via-sky-600 to-sky-500 text-white shadow-lg">
            <div
              className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.15),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.12),transparent_30%)]"
              aria-hidden
            />
            <div className="relative p-6 sm:p-8 space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-3 max-w-3xl">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide bg-white/20 text-white border border-white/30">
                      Class
                    </span>
                    <span className="text-xs text-white/80">
                      {selectedClass.course?.courseCode || ""}
                    </span>
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-bold">
                    {selectedClass.classCode}
                  </h1>
                  <p className="text-white/90 text-lg">
                    {selectedClass.course?.courseName || "Course"}
                  </p>
                  <div className="flex flex-wrap items-center gap-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${status.bg}`}
                    >
                      {status.icon}
                      {status.label}
                    </span>
                    <div className="flex items-center gap-2 text-white/90">
                      <Calendar className="w-5 h-5" />
                      <span className="font-medium">
                        {formatDate(selectedClass.startDate)} - {""}
                        {formatDate(selectedClass.endDate)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-white/90">
                      <Users className="w-5 h-5" />
                      <span className="font-medium">
                        {selectedClass.enrollmentCount || 0} / {""}
                        {selectedClass.maxStudents} students
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                {[
                  {
                    label: "Semester",
                    value: selectedClass.course?.semester || "N/A",
                    Icon: BookOpen,
                  },
                  {
                    label: "Academic Year",
                    value: selectedClass.course?.academicYear || "N/A",
                    Icon: Calendar,
                  },
                  {
                    label: "Enroll Key",
                    value: enrollKeyValue,
                    Icon: KeyRound,
                  },
                  {
                    label: "Created",
                    value: formatDate(selectedClass.createdAt),
                    Icon: Clock,
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
                      <p className="font-semibold truncate max-w-[180px]">
                        {value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="rounded-2xl bg-sky-100 p-2">
                  <BookOpen className="w-5 h-5 text-sky-700" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
                    Course
                  </p>
                  <h3 className="text-lg font-bold text-slate-900">
                    {selectedClass.course?.courseName || "Course"}
                  </h3>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-slate-600">Course code:</span>
                  <span className="font-semibold text-slate-900">
                    {selectedClass.course?.courseCode || "N/A"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-600">Schedule:</span>
                  <span className="font-semibold text-slate-900">
                    {formatDate(selectedClass.startDate)} - {""}
                    {formatDate(selectedClass.endDate)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-600">Academic year:</span>
                  <span className="font-semibold text-slate-900">
                    {selectedClass.course?.academicYear || "N/A"}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="rounded-2xl bg-indigo-100 p-2">
                  <Users className="w-5 h-5 text-indigo-700" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
                    Enrollment
                  </p>
                  <h3 className="text-lg font-bold text-slate-900">
                    {selectedClass.enrollmentCount || 0} enrolled students
                  </h3>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-slate-600">Capacity:</span>
                  <span className="font-semibold text-slate-900">
                    {selectedClass.maxStudents} students
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-600">Enroll key:</span>
                  <span className="font-semibold text-slate-900">
                    {enrollKeyValue}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="rounded-2xl bg-slate-100 p-2">
                  <Clock className="w-5 h-5 text-slate-700" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
                    System info
                  </p>
                  <h3 className="text-lg font-bold text-slate-900">Timeline</h3>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-slate-600">Created:</span>
                  <span className="font-semibold text-slate-900">
                    {formatDateTime(selectedClass.createdAt)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-600">Updated:</span>
                  <span className="font-semibold text-slate-900">
                    {formatDateTime(selectedClass.updatedAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ClassDetailPage;
