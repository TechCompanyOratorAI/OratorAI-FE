import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "antd";
import {
  ArrowLeft,
  FileText,
  Clock,
  Calendar,
  User,
  BookOpen,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";
import { BarChartOutlined } from "@ant-design/icons";
import { useAppDispatch, useAppSelector } from "@/services/store/store";
import { fetchSharedPresentation } from "@/services/features/share/shareSlice";
import PresentationPlayer from "@/components/Presentation/PresentationPlayer";

const statusConfig: Record<string, { label: string; gradient: string; border: string }> = {
  draft: { label: "Nháp", gradient: "from-slate-100 to-slate-200", border: "border-slate-300" },
  submitted: { label: "Đã nộp", gradient: "from-sky-100 to-blue-200", border: "border-blue-300" },
  processing: { label: "Đang xử lý", gradient: "from-amber-100 to-orange-200", border: "border-amber-300" },
  analyzed: { label: "Đã chấm", gradient: "from-emerald-100 to-green-200", border: "border-emerald-300" },
  done: { label: "Hoàn thành", gradient: "from-emerald-100 to-green-200", border: "border-emerald-300" },
  failed: { label: "Thất bại", gradient: "from-red-100 to-rose-200", border: "border-red-300" },
};

const SharePage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const dispatch = useAppDispatch();
  const { sharedPresentation: presentation, sharedLoading, sharedError } =
    useAppSelector((s) => s.share);

  const [showReport, setShowReport] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (token) {
      dispatch(fetchSharedPresentation(token));
    }
  }, [token, dispatch]);

  const criteriaScores = useMemo(() => {
    if (!presentation?.aiReport?.criterionScores) return [];
    return Object.values(presentation.aiReport.criterionScores).sort(
      (a, b) => a.criteriaId - b.criteriaId,
    );
  }, [presentation]);

  if (sharedLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500">Đang tải bài thuyết trình...</p>
        </div>
      </div>
    );
  }

  if (sharedError || !presentation) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-2xl border border-red-200 p-8 text-center shadow-sm">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-lg font-bold text-slate-800 mb-2">
              Không thể truy cập
            </h2>
            <p className="text-sm text-slate-500 mb-6">
              {sharedError || "Link chia sẻ không hợp lệ hoặc đã hết hạn."}
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Về trang chủ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const studentName = presentation.presentation.student
    ? `${presentation.presentation.student.firstName || ""} ${presentation.presentation.student.lastName || ""}`.trim() || "Student"
    : "Unknown";

  const sc = statusConfig[presentation.presentation.status?.toLowerCase()] || statusConfig.draft;

  const statCards = [
    {
      icon: User,
      label: "Người thuyết trình",
      value: studentName,
      gradient: "from-blue-50 to-indigo-50",
      iconColor: "text-blue-600",
      iconBg: "bg-blue-100",
    },
    {
      icon: BookOpen,
      label: "Chủ đề",
      value: presentation.presentation.topic?.topicName || "N/A",
      gradient: "from-emerald-50 to-teal-50",
      iconColor: "text-emerald-600",
      iconBg: "bg-emerald-100",
    },
    {
      icon: Clock,
      label: "Thời lượng",
      value: presentation.presentation.durationSeconds
        ? `${Math.floor(presentation.presentation.durationSeconds / 60)}m ${presentation.presentation.durationSeconds % 60}s`
        : "Chưa có",
      gradient: "from-amber-50 to-orange-50",
      iconColor: "text-amber-600",
      iconBg: "bg-amber-100",
    },
    {
      icon: Calendar,
      label: "Trạng thái",
      value: sc.label,
      gradient: `bg-gradient-to-br ${sc.gradient}`,
      iconColor: "text-slate-600",
      iconBg: "bg-white",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Public header bar */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span className="text-xs text-slate-500">
            Đang xem bài thuyết trình được chia sẻ
          </span>
        </div>
        <Link
          to="/"
          className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Về trang chủ
        </Link>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Status badge */}
        <div className="flex items-center justify-end">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border font-semibold bg-gradient-to-r ${sc.gradient} ${sc.border}`}
          >
            <FileText className="w-3.5 h-3.5" />
            {sc.label}
          </span>
        </div>

        {/* Page title */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            {presentation.presentation.title}
          </h1>
          {presentation.presentation.description && (
            <p className="text-slate-500 mt-1">{presentation.presentation.description}</p>
          )}
        </motion.div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map(
            ({ icon: Icon, label, value, gradient, iconColor, iconBg }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className={`bg-gradient-to-br ${gradient} rounded-2xl border border-slate-200 shadow-sm p-5 flex items-center gap-4`}
              >
                <div
                  className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}
                >
                  <Icon className={`w-5 h-5 ${iconColor}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-0.5">
                    {label}
                  </p>
                  <p className="font-bold text-slate-900 truncate">{value}</p>
                </div>
              </motion.div>
            ),
          )}
        </div>

        {/* Presentation Player */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <PresentationPlayer
            slides={presentation.presentation.slides || []}
            audioRecord={presentation.presentation.audioRecord || null}
            title={presentation.presentation.title}
            description={presentation.presentation.description}
            status={presentation.presentation.status}
            studentName={studentName}
            createdAt={presentation.presentation.createdAt}
          />
        </motion.div>

        {/* AI Report */}
        {presentation.aiReport && (
          <motion.div
            ref={reportRef}
            id="ai-report-section"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div
              className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 cursor-pointer hover:border-sky-300 transition-colors"
              onClick={() => setShowReport((v) => !v)}
            >
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                  Kết quả đánh giá AI
                </h2>
                <span className="text-sm text-slate-400">
                  {new Date(presentation.aiReport.generatedAt).toLocaleString("vi-VN")}
                </span>
              </div>

              {showReport && (
                <div className="pt-2 space-y-4">
                  <div className="rounded-xl border border-sky-100 bg-sky-50 p-4">
                    <p className="text-sm text-slate-600">Điểm tổng</p>
                    <p className="text-2xl font-bold text-sky-700">
                      {`${(Number(presentation.aiReport.overallScore) * 100).toFixed(0)}%`}
                    </p>
                  </div>

                  <div className="space-y-3">
                    {criteriaScores.map((criterion) => (
                      <div
                        key={criterion.criteriaId}
                        className="rounded-xl border border-slate-200 p-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                          <h3 className="font-semibold text-slate-900">
                            {criterion.criteriaName}
                          </h3>
                          <span className="text-sm font-semibold text-sky-700">
                            {criterion.score}/{criterion.maxScore} (w: {criterion.weight}%)
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 mb-3">
                          {criterion.comment}
                        </p>
                        {criterion.suggestions?.length > 0 && (
                          <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
                            {criterion.suggestions.map((suggestion, index) => (
                              <li key={`${criterion.criteriaId}-${index}`}>
                                {suggestion}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {!presentation.aiReport && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
            <p className="text-slate-500">Bài thuyết trình này chưa có kết quả đánh giá AI.</p>
          </div>
        )}

        {/* Floating "View Report" button */}
        {!showReport && presentation.aiReport && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            style={{ position: "fixed", bottom: 24, right: 24, zIndex: 100 }}
          >
            <Button
              type="primary"
              size="large"
              icon={<BarChartOutlined />}
              onClick={() => {
                setShowReport(true);
                setTimeout(() => {
                  reportRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                }, 50);
              }}
              style={{
                background: "linear-gradient(135deg, #4f46e5, #3730a3)",
                border: "none",
                borderRadius: 14,
                height: 52,
                paddingInline: 24,
                fontWeight: 700,
                fontSize: 15,
                boxShadow: "0 8px 24px rgba(79, 70, 229, 0.314)",
              }}
            >
              Xem kết quả AI
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default SharePage;
