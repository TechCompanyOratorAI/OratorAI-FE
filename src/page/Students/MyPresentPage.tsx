import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import {
  PlayCircle,
  FileText,
  Clock,
  Calendar,
  ChevronRight,
  Search,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/services/store/store";
import {
  fetchPresentations,
  clearError,
} from "@/services/features/presentation/presentationSlice";
import StudentLayout from "@/components/StudentLayout/StudentLayout";

const statusConfig: Record<string, { label: string; color: string }> = {
  draft: { label: "Nháp", color: "bg-slate-100 text-slate-700 border-slate-200" },
  processing: { label: "Đang xử lý", color: "bg-amber-100 text-amber-700 border-amber-200" },
  analyzed: { label: "Đã chấm", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  failed: { label: "Thất bại", color: "bg-red-100 text-red-700 border-red-200" },
  submitted: { label: "Đã nộp", color: "bg-sky-100 text-sky-700 border-sky-200" },
};

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.35 } }),
};

const MyPresentationsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { presentations, loading, error } = useAppSelector((state) => state.presentation);
  const { user } = useAppSelector((state) => state.auth);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const fullName = user ? `${user.firstName} ${user.lastName}`.trim() : "Student";

  useEffect(() => {
    dispatch(fetchPresentations());
  }, [dispatch]);

  useEffect(() => {
    if (error) { toast.error(String(error)); dispatch(clearError()); }
  }, [error, dispatch]);

  const formatDate = (iso?: string | null) => {
    if (!iso) return "Chưa nộp";
    return new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const formatDuration = (seconds: number | null | undefined) => {
    if (!seconds || seconds <= 0) return "—";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins === 0 ? `${secs}s` : `${mins}m${secs ? ` ${secs}s` : ""}`;
  };

  const filtered = presentations.filter((p) => {
    const q = search.toLowerCase();
    const matchesSearch = !search || p.title.toLowerCase().includes(q) || (p.topic?.topicName || "").toLowerCase().includes(q) || (p.class?.classCode || "").toLowerCase().includes(q);
    const matchesStatus = filterStatus === "all" || p.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const statuses = [...new Set(presentations.map((p) => p.status))];

  return (
    <StudentLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Bài thuyết trình của tôi</h1>
          <p className="text-slate-500 mt-1">Tất cả bài thuyết trình của <span className="font-semibold text-slate-700">{fullName}</span></p>
        </motion.div>

        {/* Stats row */}
        {!loading && presentations.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Tổng cộng", value: presentations.length, color: "from-blue-50 to-indigo-50 border-blue-200", text: "text-blue-700" },
              { label: "Đã chấm", value: presentations.filter((p) => p.status === "analyzed").length, color: "from-emerald-50 to-teal-50 border-emerald-200", text: "text-emerald-700" },
              { label: "Đang xử lý", value: presentations.filter((p) => p.status === "processing").length, color: "from-amber-50 to-orange-50 border-amber-200", text: "text-amber-700" },
              { label: "Đã nộp", value: presentations.filter((p) => p.status === "submitted").length, color: "from-sky-50 to-blue-50 border-sky-200", text: "text-sky-700" },
            ].map(({ label, value, color, text }) => (
              <div key={label} className={`bg-gradient-to-br ${color} border rounded-2xl p-4 text-center`}>
                <p className={`text-2xl font-bold ${text}`}>{value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo tên, chủ đề, lớp..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400 shadow-sm"
            />
          </div>
          <div className="flex gap-2 bg-white border border-slate-200 rounded-xl p-1 shadow-sm flex-wrap">
            <button onClick={() => setFilterStatus("all")} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${filterStatus === "all" ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-50"}`}>
              Tất cả
            </button>
            {statuses.map((s) => {
              const sc = statusConfig[s] || { label: s, color: "" };
              return (
                <button key={s} onClick={() => setFilterStatus(s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${filterStatus === s ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-50"}`}>
                  {sc.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-200 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-1/3" />
                    <div className="h-3 bg-slate-100 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filtered.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl border border-dashed border-slate-300 p-16 text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <PlayCircle className="w-8 h-8 text-blue-300" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">
              {search || filterStatus !== "all" ? "Không tìm thấy bài nào" : "Chưa có bài thuyết trình"}
            </h3>
            <p className="text-sm text-slate-500 mb-5">
              {search || filterStatus !== "all" ? "Thử thay đổi điều kiện lọc." : "Vào lớp học và nộp bài để bắt đầu."}
            </p>
            {!search && filterStatus === "all" && (
              <button onClick={() => navigate("/student/dashboard")} className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl transition">
                Quay lại Khóa học
              </button>
            )}
          </motion.div>
        )}

        {/* List */}
        {!loading && filtered.length > 0 && (
          <div className="space-y-3">
            {filtered.map((p, i) => {
              const sc = statusConfig[p.status] || { label: p.status, color: "bg-slate-100 text-slate-700 border-slate-200" };
              return (
                <motion.button
                  key={p.presentationId}
                  custom={i}
                  initial="hidden"
                  animate="visible"
                  variants={cardVariants}
                  onClick={() => navigate(`/student/presentation/${p.presentationId}`)}
                  className="w-full bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex items-center justify-between hover:shadow-lg hover:border-blue-200 transition-all duration-300 text-left group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="text-sm sm:text-base font-semibold text-slate-900">{p.title}</h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${sc.color}`}>{sc.label}</span>
                      </div>
                      <p className="text-xs text-slate-500 mb-1">
                        {p.topic?.topicName || "Không có chủ đề"} • {p.class?.classCode || ""}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-slate-400">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(p.createdAt)}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDuration(p.durationSeconds)}</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              );
            })}
          </div>
        )}
      </div>
    </StudentLayout>
  );
};

export default MyPresentationsPage;
