import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  FileText,
  Clock,
  Calendar,
  User,
  BookOpen,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/services/store/store";
import { fetchPresentationDetail } from "@/services/features/presentation/presentationSlice";
import PresentationPlayer from "@/components/Presentation/PresentationPlayer";
import StudentLayout from "@/components/StudentLayout/StudentLayout";

const statusConfig: Record<
  string,
  { label: string; gradient: string; border: string }
> = {
  draft: {
    label: "Nháp",
    gradient: "from-slate-100 to-slate-200",
    border: "border-slate-300",
  },
  submitted: {
    label: "Đã nộp",
    gradient: "from-sky-100 to-blue-200",
    border: "border-blue-300",
  },
  processing: {
    label: "Đang xử lý",
    gradient: "from-amber-100 to-orange-200",
    border: "border-amber-300",
  },
  analyzed: {
    label: "Đã chấm",
    gradient: "from-emerald-100 to-green-200",
    border: "border-emerald-300",
  },
  failed: {
    label: "Thất bại",
    gradient: "from-red-100 to-rose-200",
    border: "border-red-300",
  },
};

const PresentationDetailPage: React.FC = () => {
  const { presentationId } = useParams<{ presentationId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const {
    currentPresentationDetail: presentation,
    detailLoading,
    error,
  } = useAppSelector((state) => state.presentation);

  const presentationIdNumber = presentationId ? parseInt(presentationId) : null;

  useEffect(() => {
    if (presentationIdNumber)
      dispatch(fetchPresentationDetail(presentationIdNumber));
  }, [presentationIdNumber, dispatch]);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  if (detailLoading) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-500">Đang tải bài thuyết trình...</p>
          </div>
        </div>
      </StudentLayout>
    );
  }

  if (error || !presentation) {
    return (
      <StudentLayout>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mb-6">
            <ArrowLeft className="w-5 h-5" /> Quay lại
          </button>
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
            <p className="text-red-700 font-medium">
              {error || "Không tìm thấy bài thuyết trình"}
            </p>
          </div>
        </div>
      </StudentLayout>
    );
  }

  const studentName = presentation.student
    ? `${presentation.student.firstName || ""} ${presentation.student.lastName || ""}`.trim() ||
      "Student"
    : "Unknown";

  const sc =
    statusConfig[presentation.status?.toLowerCase()] || statusConfig.draft;

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
      value: presentation.topic?.topicName || "N/A",
      gradient: "from-emerald-50 to-teal-50",
      iconColor: "text-emerald-600",
      iconBg: "bg-emerald-100",
    },
    {
      icon: Clock,
      label: "Thời lượng",
      value: presentation.durationSeconds
        ? `${Math.floor(presentation.durationSeconds / 60)}m ${presentation.durationSeconds % 60}s`
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
    <StudentLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-medium transition text-sm">
            <ArrowLeft className="w-4 h-4" /> Quay lại
          </button>
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border font-semibold bg-gradient-to-r ${sc.gradient} ${sc.border}`}>
            <FileText className="w-3.5 h-3.5" /> {sc.label}
          </span>
        </div>

        {/* Page title */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            {presentation.title}
          </h1>
          {presentation.description && (
            <p className="text-slate-500 mt-1">{presentation.description}</p>
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
                className={`bg-gradient-to-br ${gradient} rounded-2xl border border-slate-200 shadow-sm p-5 flex items-center gap-4`}>
                <div
                  className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
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
          transition={{ delay: 0.3 }}>
          <PresentationPlayer
            slides={presentation.slides || []}
            audioRecord={presentation.audioRecord || null}
            title={presentation.title}
            description={presentation.description}
            status={presentation.status}
            studentName={studentName}
            createdAt={presentation.createdAt}
          />
        </motion.div>
      </div>
    </StudentLayout>
  );
};

export default PresentationDetailPage;
