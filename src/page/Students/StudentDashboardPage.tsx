import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import {
  Search,
  GraduationCap,
  Users,
  Calendar,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  TrendingUp,
  Clock,
  Award,
  Target,
  Sparkles,
  Filter,
  SortAsc,
  Bell,
  FileText,
  AlertCircle,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/services/store/store";
import { fetchCourses } from "@/services/features/course/courseSlice";
import StudentLayout from "@/components/StudentLayout/StudentLayout";

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4 },
  }),
};

const StudentDashboardPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const { courses, loading, error, pagination } = useAppSelector(
    (state) => state.course,
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<"name" | "date" | "status">("date");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "closed">(
    "all",
  );

  useEffect(() => {
    dispatch(fetchCourses({ page: currentPage, limit: pageSize }));
  }, [dispatch, currentPage, pageSize]);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  const fullName = user
    ? `${user.firstName} ${user.lastName}`.trim()
    : "Student";

  const initials = fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const filteredCourses = courses
    .filter((course) => {
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      const instructorNames = (
        course.instructors || course.instructor
          ? (course.instructors || [course.instructor])
              .filter(Boolean)
              .map((inst) =>
                `${inst?.firstName || ""} ${inst?.lastName || ""}`.toLowerCase(),
              )
              .join(" ")
          : ""
      ).toLowerCase();
      return (
        course.courseName.toLowerCase().includes(query) ||
        course.courseCode.toLowerCase().includes(query) ||
        (course.majorCode || "").toLowerCase().includes(query) ||
        instructorNames.includes(query)
      );
    })
    .filter((course) => {
      if (filterStatus === "all") return true;
      if (filterStatus === "active") return course.isActive;
      if (filterStatus === "closed") return !course.isActive;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "name") {
        return a.courseName.localeCompare(b.courseName);
      }
      if (sortBy === "date") {
        return (
          new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
        );
      }
      if (sortBy === "status") {
        return (b.isActive ? 1 : 0) - (a.isActive ? 1 : 0);
      }
      return 0;
    });

  const stats = {
    total: courses.length,
    active: courses.filter((c) => c.isActive).length,
    enrolledClasses: 0, // TODO: fetch from enrolled classes
    pendingPresentations: 0, // TODO: fetch from presentations
  };

  // Mock upcoming deadlines (TODO: fetch real data)
  const upcomingDeadlines = [
    {
      id: 1,
      title: "Bài thuyết trình về AI",
      course: "Công nghệ phần mềm",
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      urgent: true,
    },
    {
      id: 2,
      title: "Báo cáo nhóm",
      course: "Quản lý dự án",
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      urgent: false,
    },
  ];

  return (
    <StudentLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Hero / Welcome Section - Improved */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 text-white shadow-2xl">
          {/* Decorative elements */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.2),transparent_50%)]" />
          <div className="absolute -bottom-12 -right-12 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute top-8 right-24 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
          <div className="absolute bottom-8 left-24 w-24 h-24 bg-purple-300/20 rounded-full blur-xl" />

          <div className="relative p-8 sm:p-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              {/* Left: User greeting */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/25 backdrop-blur-md flex items-center justify-center text-xl font-bold shadow-lg border border-white/30">
                  {initials}
                </div>
                <div>
                  <p className="text-blue-100 text-sm font-medium mb-1 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Xin chào 👋
                  </p>
                  <h1 className="text-3xl sm:text-4xl font-bold mb-2 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                    {fullName}
                  </h1>
                  <p className="text-blue-100/90 text-sm max-w-md">
                    Sẵn sàng chinh phục những thử thách mới và nâng cao kỹ năng
                    thuyết trình của bạn
                  </p>
                </div>
              </div>

              {/* Right: Stats grid - Improved with actionable cards */}
              <div className="grid grid-cols-2 gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate("/student/classes")}
                  className="bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl p-4 hover:bg-white/25 transition-all shadow-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                      <GraduationCap className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                  <p className="text-xs text-blue-100 font-medium">
                    Tổng khóa học
                  </p>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setFilterStatus("active");
                  }}
                  className="bg-emerald-500/30 backdrop-blur-md border border-emerald-300/30 rounded-2xl p-4 hover:bg-emerald-500/40 transition-all shadow-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-emerald-100" />
                    </div>
                    <p className="text-2xl font-bold">{stats.active}</p>
                  </div>
                  <p className="text-xs text-emerald-100 font-medium">
                    Đang hoạt động
                  </p>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate("/student/my-class")}
                  className="bg-purple-500/30 backdrop-blur-md border border-purple-300/30 rounded-2xl p-4 hover:bg-purple-500/40 transition-all shadow-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                      <Users className="w-4 h-4 text-purple-100" />
                    </div>
                    <p className="text-2xl font-bold">
                      {stats.enrolledClasses || stats.total}
                    </p>
                  </div>
                  <p className="text-xs text-purple-100 font-medium">
                    Lớp đã ghi danh
                  </p>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate("/student/my-presentations")}
                  className="bg-orange-500/30 backdrop-blur-md border border-orange-300/30 rounded-2xl p-4 hover:bg-orange-500/40 transition-all shadow-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                      <FileText className="w-4 h-4 text-orange-100" />
                    </div>
                    <p className="text-2xl font-bold">
                      {stats.pendingPresentations || 0}
                    </p>
                  </div>
                  <p className="text-xs text-orange-100 font-medium">
                    Bài chưa nộp
                  </p>
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Two column layout - Quick Actions + Upcoming Deadlines */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions - Improved with counts */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                icon: BookOpen,
                title: "Khám phá khóa học",
                desc: "Tìm kiếm và ghi danh",
                count: stats.total,
                gradient: "from-blue-500 via-indigo-500 to-blue-600",
                iconBg: "bg-blue-500",
                action: () => navigate("/student/classes"),
              },
              {
                icon: Users,
                title: "Lớp học của tôi",
                desc: "Quản lý lớp đã đăng ký",
                count: stats.enrolledClasses || stats.active,
                gradient: "from-emerald-500 via-teal-500 to-emerald-600",
                iconBg: "bg-emerald-500",
                action: () => navigate("/student/my-class"),
              },
              {
                icon: Award,
                title: "Bài thuyết trình",
                desc: "Xem và nộp bài tập",
                count: stats.pendingPresentations,
                gradient: "from-violet-500 via-purple-500 to-violet-600",
                iconBg: "bg-violet-500",
                action: () => navigate("/student/my-presentations"),
              },
            ].map(
              (
                { icon: Icon, title, desc, count, gradient, iconBg, action },
                i,
              ) => (
                <motion.button
                  key={title}
                  custom={i}
                  initial="hidden"
                  animate="visible"
                  variants={cardVariants}
                  onClick={action}
                  className="group relative bg-white rounded-2xl p-6 text-left transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 overflow-hidden border border-slate-200 hover:border-transparent">
                  {/* Gradient background on hover */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                  />

                  {/* Content */}
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className={`w-12 h-12 rounded-xl ${iconBg} group-hover:bg-white/20 flex items-center justify-center shadow-lg transition-all`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      {count > 0 && (
                        <span className="px-2.5 py-1 bg-slate-900 group-hover:bg-white/20 text-white text-xs font-bold rounded-full transition-all">
                          {count}
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-slate-900 group-hover:text-white mb-1 transition-colors">
                      {title}
                    </h3>
                    <p className="text-sm text-slate-500 group-hover:text-white/80 mb-3 transition-colors">
                      {desc}
                    </p>
                    <div className="flex items-center gap-1 text-slate-400 group-hover:text-white transition-colors">
                      <span className="text-xs font-medium">Xem chi tiết</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </motion.button>
              ),
            )}
          </div>

          {/* Upcoming Deadlines - NEW */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-6 border border-orange-100 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center">
                <Bell className="w-4 h-4 text-white" />
              </div>
              <h3 className="font-bold text-slate-900">Deadline sắp tới</h3>
            </div>

            {upcomingDeadlines.length > 0 ? (
              <div className="space-y-3">
                {upcomingDeadlines.map((deadline) => {
                  const daysLeft = Math.ceil(
                    (deadline.dueDate.getTime() - Date.now()) /
                      (1000 * 60 * 60 * 24),
                  );
                  return (
                    <div
                      key={deadline.id}
                      className={`p-3 rounded-xl border-2 ${
                        deadline.urgent
                          ? "bg-red-50 border-red-200"
                          : "bg-white border-orange-200"
                      }`}>
                      <div className="flex items-start gap-2 mb-2">
                        {deadline.urgent && (
                          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-slate-900 truncate">
                            {deadline.title}
                          </p>
                          <p className="text-xs text-slate-500 truncate">
                            {deadline.course}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-bold ${
                            deadline.urgent ? "text-red-600" : "text-orange-600"
                          }`}>
                          {daysLeft} ngày
                        </span>
                        <span className="text-xs text-slate-400">
                          {deadline.dueDate.toLocaleDateString("vi-VN")}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Target className="w-12 h-12 text-orange-200 mx-auto mb-2" />
                <p className="text-sm text-slate-500">
                  Không có deadline sắp tới
                </p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Course List Section - Improved with filters */}
        <div>
          {/* Header with Search and Filters */}
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Danh sách khóa học
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  {filteredCourses.length} khóa học được tìm thấy
                </p>
              </div>
              <div className="relative w-full sm:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm theo tên, mã khóa, giảng viên..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-400 shadow-sm hover:border-slate-300 transition-colors"
                />
              </div>
            </div>

            {/* Filters and Sort */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-medium text-slate-600">
                  Bộ lọc:
                </span>
              </div>
              {[
                { value: "all", label: "Tất cả" },
                { value: "active", label: "Đang mở" },
                { value: "closed", label: "Đã đóng" },
              ].map((filter) => (
                <button
                  key={filter.value}
                  onClick={() =>
                    setFilterStatus(filter.value as "all" | "active" | "closed")
                  }
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    filterStatus === filter.value
                      ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}>
                  {filter.label}
                </button>
              ))}

              <div className="ml-auto flex items-center gap-2">
                <SortAsc className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-medium text-slate-600">
                  Sắp xếp:
                </span>
                <select
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(e.target.value as "name" | "date" | "status")
                  }
                  className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-slate-300 transition-colors cursor-pointer">
                  <option value="date">Ngày bắt đầu</option>
                  <option value="name">Tên khóa học</option>
                  <option value="status">Trạng thái</option>
                </select>
              </div>
            </div>
          </div>

          {/* Loading skeleton - Improved */}
          {loading && (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl border-2 border-slate-200 p-6 animate-pulse">
                  <div className="h-1.5 bg-slate-200 rounded-full mb-6 w-full" />
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-14 h-14 bg-slate-200 rounded-xl shrink-0" />
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="h-6 bg-slate-200 rounded-full w-20" />
                        <div className="h-6 bg-slate-100 rounded-md w-16" />
                      </div>
                      <div className="h-5 bg-slate-200 rounded w-2/3" />
                      <div className="h-4 bg-slate-100 rounded w-1/2" />
                      <div className="h-4 bg-slate-100 rounded w-3/4" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="h-20 bg-slate-100 rounded-xl" />
                    <div className="h-20 bg-slate-100 rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty state - Improved */}
          {!loading && filteredCourses.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl border-2 border-dashed border-slate-300 p-12 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <BookOpen className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">
                {searchQuery || filterStatus !== "all"
                  ? "Không tìm thấy khóa học"
                  : "Chưa có khóa học"}
              </h3>
              <p className="text-slate-500 mb-6 max-w-md mx-auto">
                {searchQuery
                  ? "Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc để tìm khóa học phù hợp"
                  : filterStatus !== "all"
                    ? "Không có khóa học nào với trạng thái này. Hãy thử bộ lọc khác"
                    : "Hiện tại chưa có khóa học nào. Vui lòng quay lại sau"}
              </p>
              {(searchQuery || filterStatus !== "all") && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setFilterStatus("all");
                  }}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-200 hover:shadow-xl hover:-translate-y-0.5">
                  Xóa bộ lọc
                </button>
              )}
            </motion.div>
          )}

          {/* Course Cards - Improved design */}
          {!loading && filteredCourses.length > 0 && (
            <div className="grid grid-cols-1 gap-4">
              {filteredCourses.map((course, i) => {
                const instructorNames = course.instructors?.length
                  ? course.instructors
                      .map(
                        (inst) =>
                          `${inst.firstName || ""} ${inst.lastName || ""}`.trim() ||
                          inst.username,
                      )
                      .join(", ")
                  : course.instructor
                    ? `${course.instructor.firstName || ""} ${course.instructor.lastName || ""}`.trim() ||
                      course.instructor.username
                    : null;

                const hasInstructor = instructorNames !== null;
                const startDate = new Date(course.startDate);
                const endDate = new Date(course.endDate);
                const now = new Date();
                const isUpcoming = startDate > now;
                const isOngoing = startDate <= now && endDate >= now;

                return (
                  <motion.div
                    key={course.courseId}
                    custom={i}
                    initial="hidden"
                    animate="visible"
                    variants={cardVariants}
                    className="group bg-white rounded-2xl border-2 border-slate-200 hover:border-blue-300 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden">
                    {/* Status bar */}
                    <div
                      className={`h-1.5 ${
                        course.isActive
                          ? isUpcoming
                            ? "bg-gradient-to-r from-blue-500 to-indigo-500"
                            : isOngoing
                              ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                              : "bg-gradient-to-r from-slate-400 to-slate-500"
                          : "bg-gradient-to-r from-slate-300 to-slate-400"
                      }`}
                    />

                    <div className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                        {/* Left: Course icon and info */}
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                          {/* Icon */}
                          <div
                            className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 shadow-lg ${
                              course.isActive
                                ? "bg-gradient-to-br from-blue-500 to-indigo-600"
                                : "bg-gradient-to-br from-slate-400 to-slate-500"
                            }`}>
                            <GraduationCap className="w-7 h-7 text-white" />
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm ${
                                  course.isActive
                                    ? isUpcoming
                                      ? "bg-blue-100 text-blue-700 border border-blue-200"
                                      : isOngoing
                                        ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                                        : "bg-slate-100 text-slate-600 border border-slate-200"
                                    : "bg-slate-100 text-slate-500 border border-slate-200"
                                }`}>
                                {course.isActive
                                  ? isUpcoming
                                    ? "Sắp mở"
                                    : isOngoing
                                      ? "Đang diễn ra"
                                      : "Đã kết thúc"
                                  : "Đã đóng"}
                              </span>
                              <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-medium">
                                {course.semester}
                              </span>
                              <span className="text-xs text-slate-400 font-medium">
                                {course.academicYear}
                              </span>
                            </div>

                            <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-700 transition-colors mb-1 line-clamp-1">
                              {course.courseName}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
                              <span className="font-mono font-semibold">
                                {course.courseCode}
                              </span>
                              {course.majorCode && (
                                <>
                                  <span className="text-slate-300">•</span>
                                  <span>{course.majorCode}</span>
                                </>
                              )}
                            </div>

                            {course.description && (
                              <p className="text-sm text-slate-600 line-clamp-2 mb-4">
                                {course.description}
                              </p>
                            )}

                            {/* Info grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="flex items-center gap-3 p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                                <div className="w-9 h-9 rounded-lg bg-blue-500 flex items-center justify-center shrink-0">
                                  <Users className="w-4 h-4 text-white" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs text-slate-500 font-medium mb-0.5">
                                    Giảng viên
                                  </p>
                                  {hasInstructor ? (
                                    <p className="text-sm font-bold text-slate-900 truncate">
                                      {instructorNames}
                                    </p>
                                  ) : (
                                    <p className="text-sm font-medium text-amber-600 flex items-center gap-1">
                                      <AlertCircle className="w-3 h-3" />
                                      Chưa phân công
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-3 p-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-100">
                                <div className="w-9 h-9 rounded-lg bg-purple-500 flex items-center justify-center shrink-0">
                                  <Calendar className="w-4 h-4 text-white" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs text-slate-500 font-medium mb-0.5">
                                    Thời gian
                                  </p>
                                  <p className="text-xs font-bold text-slate-900">
                                    {startDate.toLocaleDateString("vi-VN", {
                                      day: "2-digit",
                                      month: "2-digit",
                                    })}{" "}
                                    -{" "}
                                    {endDate.toLocaleDateString("vi-VN", {
                                      day: "2-digit",
                                      month: "2-digit",
                                      year: "numeric",
                                    })}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Right: Action button */}
                        <div className="flex lg:flex-col items-center gap-3">
                          <button
                            onClick={() =>
                              navigate(
                                `/student/classes?courseId=${course.courseId}`,
                              )
                            }
                            className="group/btn relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold px-6 py-3 rounded-xl transition-all duration-300 shadow-lg shadow-blue-200 hover:shadow-xl hover:shadow-blue-300 hover:-translate-y-0.5 flex items-center gap-2 whitespace-nowrap">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Xem chi tiết</span>
                            <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Pagination - Improved */}
          {!loading && !error && pagination.total > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-between mt-8 pt-6 border-t-2 border-slate-200 gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-700 bg-slate-100 px-4 py-2 rounded-lg">
                  <Clock className="w-4 h-4 text-slate-500" />
                  <span>
                    Trang{" "}
                    <span className="font-bold text-blue-600">
                      {pagination.page}
                    </span>{" "}
                    / {pagination.totalPages}
                  </span>
                </div>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(parseInt(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="border-2 border-slate-200 rounded-lg px-3 py-2 text-sm font-medium bg-white hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors cursor-pointer">
                  <option value={10}>10 / trang</option>
                  <option value={20}>20 / trang</option>
                  <option value={50}>50 / trang</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={pagination.page <= 1}
                  className="px-5 py-2.5 text-sm font-bold border-2 border-slate-200 rounded-xl text-slate-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-slate-200 disabled:hover:text-slate-700 transition-all shadow-sm">
                  ← Trước
                </button>
                <button
                  onClick={() =>
                    setCurrentPage((p) =>
                      Math.min(pagination.totalPages, p + 1),
                    )
                  }
                  disabled={pagination.page >= pagination.totalPages}
                  className="px-5 py-2.5 text-sm font-bold border-2 border-slate-200 rounded-xl text-slate-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-slate-200 disabled:hover:text-slate-700 transition-all shadow-sm">
                  Sau →
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </StudentLayout>
  );
};

export default StudentDashboardPage;
