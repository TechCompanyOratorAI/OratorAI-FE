import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import {
  Search,
  Users,
  Calendar,
  BookOpen,
  CheckCircle2,
  ArrowRight,
  GraduationCap,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/services/store/store";
import { fetchEnrolledClasses } from "@/services/features/enrollment/enrollmentSlice";
import StudentLayout from "@/components/StudentLayout/StudentLayout";

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.4 },
  }),
};

// Generate a deterministic gradient from a string
const getGradient = (name: string) => {
  const gradients = [
    "from-blue-500 to-indigo-600",
    "from-emerald-500 to-teal-600",
    "from-violet-500 to-purple-600",
    "from-amber-500 to-orange-600",
    "from-rose-500 to-pink-600",
    "from-cyan-500 to-sky-600",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++)
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return gradients[Math.abs(hash) % gradients.length];
};

const StudentMyClassesPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { enrolledClasses, loading, error } = useAppSelector(
    (state) => state.enrollment,
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");

  useEffect(() => {
    dispatch(fetchEnrolledClasses());
  }, [dispatch]);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const getInstructorNames = (cls: (typeof enrolledClasses)[0]) => {
    if (!cls.class.instructors || cls.class.instructors.length === 0)
      return "Chưa gán giảng viên";
    return cls.class.instructors
      .map((i) => `${i.firstName} ${i.lastName}`.trim())
      .join(", ");
  };

  const filteredClasses = enrolledClasses.filter((cls) => {
    const className = cls.class.className?.toLowerCase() || "";
    const classCode = cls.class.classCode?.toLowerCase() || "";
    const courseName = cls.class.course?.courseName?.toLowerCase() || "";
    const courseCode = cls.class.course?.courseCode?.toLowerCase() || "";
    const instructorName =
      cls.class.instructors
        ?.map((i) => `${i.firstName} ${i.lastName}`.toLowerCase())
        .join(" ") || "";
    const searchLower = searchQuery.toLowerCase();

    const matchesSearch =
      !searchQuery ||
      className.includes(searchLower) ||
      classCode.includes(searchLower) ||
      courseName.includes(searchLower) ||
      courseCode.includes(searchLower) ||
      instructorName.includes(searchLower);

    const matchesFilter =
      filter === "all" ||
      (filter === "active" && cls.class.status === "active") ||
      (filter === "inactive" && cls.class.status !== "active");

    return matchesSearch && matchesFilter;
  });

  return (
    <StudentLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Lớp của tôi
          </h1>
          <p className="text-slate-500 mt-1">Xem tất cả lớp bạn đã ghi danh</p>
        </motion.div>

        {/* Search + Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1 sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm lớp học..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-400 shadow-sm"
            />
          </div>
          <div className="flex gap-2 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
            {(["all", "active", "inactive"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  filter === f
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-800 hover:bg-slate-50"
                }`}>
                {f === "all"
                  ? "Tất cả"
                  : f === "active"
                    ? "Đang mở"
                    : "Đã đóng"}
              </button>
            ))}
          </div>
        </div>

        {/* Stats bar */}
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <span className="font-semibold text-slate-900">
            {filteredClasses.length}
          </span>{" "}
          lớp
          {filter !== "all" && (
            <span>
              — bộ lọc:{" "}
              <span className="text-blue-600 font-medium">
                {filter === "active" ? "Đang mở" : "Đã đóng"}
              </span>
            </span>
          )}
        </div>

        {/* Skeleton loading */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden animate-pulse">
                <div className="h-28 bg-gradient-to-br from-slate-200 to-slate-100" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                  <div className="h-8 bg-slate-100 rounded-lg mt-2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && filteredClasses.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-2xl border border-dashed border-slate-300 p-16 text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <GraduationCap className="w-8 h-8 text-blue-300" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">
              {searchQuery
                ? "Không tìm thấy lớp phù hợp"
                : "Bạn chưa ghi danh lớp nào"}
            </h3>
            <p className="text-sm text-slate-500 mb-5">
              {searchQuery
                ? "Thử thay đổi từ khóa tìm kiếm"
                : "Vào mục Khóa học để tìm và ghi danh."}
            </p>
            {!searchQuery && (
              <button
                onClick={() => navigate("/student/dashboard")}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl transition">
                <BookOpen className="w-4 h-4" />
                Tìm khóa học
              </button>
            )}
          </motion.div>
        )}

        {/* Grid of Class Cards */}
        {!loading && filteredClasses.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredClasses.map((cls, i) => {
              const gradient = getGradient(
                cls.class.className || cls.class.classCode,
              );
              const isActive = cls.class.status === "active";
              const instructorName = getInstructorNames(cls);

              return (
                <motion.div
                  key={cls.enrollmentId}
                  custom={i}
                  initial="hidden"
                  animate="visible"
                  variants={cardVariants}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300 overflow-hidden group cursor-pointer"
                  onClick={() => navigate(`/student/class/${cls.classId}`)}>
                  {/* Gradient Header */}
                  <div
                    className={`bg-gradient-to-br ${gradient} p-5 relative overflow-hidden`}>
                    <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/10 rounded-full" />
                    <div className="absolute -bottom-2 -left-2 w-16 h-16 bg-white/10 rounded-full" />
                    <div className="relative flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${isActive ? "bg-white/25 text-white" : "bg-white/15 text-white/80"}`}>
                            {cls.class.classCode}
                          </span>
                          <span
                            className={`w-2 h-2 rounded-full ${isActive ? "bg-emerald-300" : "bg-white/40"}`}
                          />
                          <span className="text-xs text-white/70">
                            {isActive ? "Đang mở" : "Đã đóng"}
                          </span>
                        </div>
                        <h3 className="text-white font-bold text-base leading-snug line-clamp-2">
                          {cls.class.className}
                        </h3>
                        <p className="text-white/70 text-xs mt-1">
                          {cls.class.course?.courseCode} —{" "}
                          {cls.class.course?.courseName}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 space-y-3">
                    {/* Enrolled badge */}
                    <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-2.5 py-1.5 w-fit">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span className="text-xs font-semibold">Đã ghi danh</span>
                      <span className="text-xs text-emerald-500">·</span>
                      <span className="text-xs text-emerald-600">
                        {new Date(cls.enrolledAt).toLocaleDateString("vi-VN")}
                      </span>
                    </div>

                    {/* Info rows */}
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate text-xs">
                          {instructorName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-xs">
                          {formatDate(cls.class.startDate)} –{" "}
                          {formatDate(cls.class.endDate)}
                        </span>
                      </div>
                    </div>

                    {/* CTA */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs text-slate-400">
                        {cls.class.course?.semester} •{" "}
                        {cls.class.course?.academicYear}
                      </span>
                      <div className="flex items-center gap-1 text-blue-600 text-xs font-semibold group-hover:gap-2 transition-all">
                        Vào lớp
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </StudentLayout>
  );
};

export default StudentMyClassesPage;
