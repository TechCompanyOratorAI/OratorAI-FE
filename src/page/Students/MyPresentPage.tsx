import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  PlayCircle,
  FileText,
  Clock,
  Calendar,
  ChevronRight,
  Loader2,
  Bell,
  Menu,
  X,
  LogOut,
  ChevronDown,
} from "lucide-react";
import Toast from "@/components/Toast/Toast";
import AppLogo from "@/components/AppLogo/AppLogo";
import { useAppDispatch, useAppSelector } from "@/services/store/store";
import {
  fetchPresentations,
  clearError,
} from "@/services/features/presentation/presentationSlice";
import { logout } from "@/services/features/auth/authSlice";

const statusColorMap: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700",
  processing: "bg-amber-100 text-amber-700",
  analyzed: "bg-emerald-100 text-emerald-700",
  failed: "bg-red-100 text-red-700",
  submitted: "bg-sky-100 text-sky-700",
};

const statusLabelMap: Record<string, string> = {
  draft: "Nháp",
  processing: "Đang xử lý",
  analyzed: "Đã chấm",
  failed: "Thất bại",
  submitted: "Đã nộp",
};

const MyPresentationsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { presentations, loading, error } = useAppSelector(
    (state) => state.presentation,
  );
  const { user } = useAppSelector((state) => state.auth);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  useEffect(() => {
    dispatch(fetchPresentations());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      setToast({ message: String(error), type: "error" });
      dispatch(clearError());
    }
  }, [error, dispatch]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleOpenDetail = (presentationId: number) => {
    navigate(`/student/presentation/${presentationId}`);
  };

  const formatDate = (iso?: string | null) => {
    if (!iso) return "Chưa nộp";
    const d = new Date(iso);
    return d.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatDuration = (seconds: number | null | undefined) => {
    if (!seconds || seconds <= 0) return "—";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m${secs ? ` ${secs}s` : ""}`;
  };

  const fullName = user
    ? `${user.firstName} ${user.lastName}`.trim()
    : "Student";

  const hasPresentations = presentations && presentations.length > 0;

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div>
                <AppLogo to="/" size="md" />
                <p className="text-xs text-slate-500 font-vn">Student workspace</p>
              </div>
            </div>
            <nav className="hidden md:flex items-center gap-8 font-vn">
              <Link
                to="/student/dashboard"
                className="text-sm font-medium text-slate-700 hover:text-slate-900"
              >
                Khóa học
              </Link>
              <Link
                to="/student/my-class"
                className="text-sm font-medium text-slate-700 hover:text-slate-900"
              >
                Lớp của tôi
              </Link>
              <Link
                to="/student/my-presentations"
                className="text-sm font-medium text-slate-900 border-b-2 border-sky-500 pb-1"
              >
                Bài thuyết trình
              </Link>
            </nav>
            <div className="flex items-center gap-4">
              <button className="relative p-2 hover:bg-sky-50 rounded-full transition">
                <Bell className="w-5 h-5 text-slate-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </button>
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 p-1 hover:bg-sky-50 rounded-full transition"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-sky-500 to-cyan-500 flex items-center justify-center">
                    <span className="text-white font-semibold text-xs">
                      {fullName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-600" />
                </button>
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="text-sm font-semibold text-slate-900">{fullName}</p>
                      <p className="text-xs text-slate-500">Student</p>
                    </div>
                    <Link
                      to="/student/settings"
                      className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 font-vn"
                    >
                      Cài đặt
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 font-vn"
                    >
                      <LogOut className="w-4 h-4" />
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 hover:bg-slate-100 rounded-full"
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5 text-slate-600" />
                ) : (
                  <Menu className="w-5 h-5 text-slate-600" />
                )}
              </button>
            </div>
          </div>
        </div>
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white">
            <nav className="px-4 py-3 space-y-1 font-vn">
              <Link
                to="/student/dashboard"
                className="block px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg"
              >
                Khóa học
              </Link>
              <Link
                to="/student/my-class"
                className="block px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg"
              >
                Lớp của tôi
              </Link>
              <Link
                to="/student/my-presentations"
                className="block px-3 py-2 text-sm font-medium text-slate-900 bg-sky-50 rounded-lg"
              >
                Bài thuyết trình
              </Link>
              <Link
                to="/student/settings"
                className="block px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg"
              >
                Cài đặt
              </Link>
              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Đăng xuất
              </button>
            </nav>
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 font-vn">
              Bài thuyết trình của tôi
            </h1>
            <p className="text-sm text-slate-600 mt-1 font-vn">
              Tất cả bài thuyết trình mà{" "}
              <span className="font-medium">{fullName}</span> đã tạo.
            </p>
          </div>
        </div>

        {loading && (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="w-6 h-6 text-sky-500 animate-spin mr-2" />
            <span className="text-sm text-slate-600 font-vn">Đang tải bài thuyết trình...</span>
          </div>
        )}

        {!loading && !hasPresentations && (
          <div className="bg-white border border-dashed border-slate-200 rounded-2xl shadow-md p-8 text-center max-w-xl mx-auto mt-8">
            <PlayCircle className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-slate-900 mb-1 font-vn">
              Chưa có bài thuyết trình nào
            </h2>
            <p className="text-sm text-slate-600 mb-4 font-vn">
              Hãy vào lớp học hoặc chủ đề được giao để tạo bài thuyết trình đầu tiên.
            </p>
            <button
              onClick={() => navigate("/student/dashboard")}
              className="rounded-full bg-sky-600 hover:bg-sky-500 text-white px-5 py-2.5 text-sm font-semibold transition font-vn"
            >
              Quay lại Khóa học
            </button>
          </div>
        )}

        {!loading && hasPresentations && (
          <div className="space-y-4 mt-4">
            {presentations.map((p) => {
              const statusColor =
                statusColorMap[p.status] || "bg-slate-100 text-slate-700";
              const statusLabel = statusLabelMap[p.status] || p.status;
              return (
                <button
                  key={p.presentationId}
                  onClick={() => handleOpenDetail(p.presentationId)}
                  className="w-full bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between hover:shadow-lg hover:border-sky-200 transition text-left font-vn"
                >
                  <div className="flex items-start gap-4">
                    <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100">
                      <FileText className="w-5 h-5 text-sky-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h2 className="text-sm sm:text-base font-semibold text-slate-900">
                          {p.title}
                        </h2>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}`}
                        >
                          {statusLabel}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mb-1">
                        {p.topic?.topicName || "Không có chủ đề"} •{" "}
                        {p.class?.classCode || "Không có lớp"}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(p.createdAt)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDuration(p.durationSeconds)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                </button>
              );
            })}
          </div>
        )}
      </main>

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

export default MyPresentationsPage;

