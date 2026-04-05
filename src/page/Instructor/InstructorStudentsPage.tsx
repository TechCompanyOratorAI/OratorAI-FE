import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  Users,
  ChevronRight,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { motion } from "framer-motion";
import SidebarInstructor from "@/components/Sidebar/SidebarInstructor/SidebarInstructor";
import { useAppDispatch, useAppSelector } from "@/services/store/store";
import { fetchClassesByInstructor } from "@/services/features/admin/classSlice";

const InstructorStudentsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { classes, loading, pagination } = useAppSelector(
    (state) => state.class,
  );
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  useEffect(() => {
    dispatch(
      fetchClassesByInstructor({ page: currentPage, limit: pageSize }),
    );
  }, [dispatch, currentPage]);

  const handleRefresh = () => {
    dispatch(fetchClassesByInstructor({ page: currentPage, limit: pageSize }));
  };

  const listTotal =
    pagination?.total && pagination.total > 0
      ? pagination.total
      : classes.length;
  const totalPages = Math.max(1, Math.ceil(listTotal / pageSize) || 1);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarInstructor activeItem="students" />
      <main className="flex-1 overflow-y-auto lg:ml-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Danh sách lớp học
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Chọn một lớp để xem điểm và tiến độ của sinh viên
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 disabled:opacity-60 transition-colors"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
              Làm mới
            </button>
          </div>

          {/* Loading */}
          {loading && classes.length === 0 && (
            <div className="flex items-center justify-center py-20 text-slate-500">
              <Loader2 className="w-6 h-6 animate-spin mr-3" />
              Đang tải danh sách lớp...
            </div>
          )}

          {/* Error */}
          {!loading && classes.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
              <AlertCircle className="w-12 h-12 text-slate-300 mb-4" />
              <p className="font-semibold text-slate-700 mb-1">
                Chưa có lớp học nào
              </p>
              <p className="text-sm">
                Bạn chưa được phân công giảng dạy lớp nào.
              </p>
            </div>
          )}

          {/* Class cards grid */}
          {!loading || classes.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {classes.map((cls, idx) => (
                  <motion.div
                    key={cls.classId}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() =>
                      navigate(`/instructor/class/${cls.classId}/students`)
                    }
                    className="group cursor-pointer rounded-2xl border border-slate-200 bg-white p-5 hover:border-blue-300 hover:shadow-md hover:shadow-blue-100 transition-all"
                  >
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-blue-600" />
                      </div>
                      <span
                        className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${cls.status === "active"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-600"
                          }`}
                      >
                        {cls.status === "active" ? "Hoạt động" : "Lưu trữ"}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 mb-1 group-hover:text-blue-700 transition-colors">
                      {cls.classCode}
                    </h3>
                    <p className="text-sm text-slate-500 mb-4">
                      {cls.course?.courseName ?? ""}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-4 h-4" />
                        <span>
                          {cls.enrollmentCount ??
                            cls.enrollments?.length ??
                            0}{" "}
                          Sinh viên
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs text-slate-400">
                        Xem điểm &amp; tiến độ
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.max(1, p - 1))
                    }
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Trước
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(
                        (p) =>
                          p === 1 ||
                          p === totalPages ||
                          Math.abs(p - currentPage) <= 2,
                      )
                      .map((p, idx, arr) => (
                        <React.Fragment key={p}>
                          {idx > 0 && arr[idx - 1] !== p - 1 && (
                            <span className="px-1 text-slate-400">...</span>
                          )}
                          <button
                            onClick={() => setCurrentPage(p)}
                            className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${p === currentPage
                              ? "bg-blue-600 text-white"
                              : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                              }`}
                          >
                            {p}
                          </button>
                        </React.Fragment>
                      ))}
                  </div>
                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Sau
                  </button>
                </div>
              )}
            </>
          ) : null}
        </div>
      </main>
    </div>
  );
};

export default InstructorStudentsPage;
