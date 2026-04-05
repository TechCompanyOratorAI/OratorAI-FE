import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Users,
  BarChart3,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Loader2,
  Presentation,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import SidebarInstructor from "@/components/Sidebar/SidebarInstructor/SidebarInstructor";
import { useAppDispatch, useAppSelector } from "@/services/store/store";
import {
  fetchClassScores,
  ClassScoreCriterion,
} from "@/services/features/classScore/classScoreSlice";

// ── Helpers ────────────────────────────────────────────────────────────────────

const scoreColor = (score: number | null): string => {
  if (score === null) return "text-slate-400";
  if (score >= 80) return "text-emerald-700";
  if (score >= 60) return "text-amber-700";
  return "text-red-600";
};

const scoreBg = (score: number | null): string => {
  if (score === null) return "bg-slate-50";
  if (score >= 80) return "bg-emerald-50";
  if (score >= 60) return "bg-amber-50";
  return "bg-red-50";
};

const statusConfig: Record<
  string,
  { label: string; icon: React.ElementType; color: string; bg: string }
> = {
  confirmed: {
    label: "Đã duyệt",
    icon: CheckCircle,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  pending_review: {
    label: "Chờ duyệt",
    icon: Clock,
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  rejected: {
    label: "Từ chối",
    icon: XCircle,
    color: "text-red-600",
    bg: "bg-red-50",
  },
  processing: {
    label: "Đang xử lý",
    icon: Loader2,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  submitted: {
    label: "Đã nộp",
    icon: CheckCircle,
    color: "text-violet-600",
    bg: "bg-violet-50",
  },
};

const presentationStatusConfig: Record<string, { label: string; color: string; bg: string }> = {
  submitted: { label: "Đã nộp", color: "text-violet-600", bg: "bg-violet-50" },
  processing: { label: "Đang xử lý", color: "text-blue-600", bg: "bg-blue-50" },
  completed: { label: "Hoàn thành", color: "text-emerald-600", bg: "bg-emerald-50" },
  failed: { label: "Thất bại", color: "text-red-600", bg: "bg-red-50" },
};

const getReportStatusDisplay = (
  status: string | null,
): { label: string; color: string; bg: string } => {
  if (!status) return { label: "—", color: "text-slate-400", bg: "bg-slate-50" };
  const cfg = statusConfig[status];
  return cfg
    ? { label: cfg.label, color: cfg.color, bg: cfg.bg }
    : { label: status, color: "text-slate-600", bg: "bg-slate-50" };
};

const getPresentationDisplay = (
  status: string | undefined,
): { label: string; color: string; bg: string } => {
  if (!status) return { label: "—", color: "text-slate-400", bg: "bg-slate-50" };
  const cfg = presentationStatusConfig[status];
  return cfg
    ? { label: cfg.label, color: cfg.color, bg: cfg.bg }
    : { label: status, color: "text-slate-600", bg: "bg-slate-50" };
};

// ── ScoreBadge component ───────────────────────────────────────────────────────

const ScoreBadge: React.FC<{ score: number | null; size?: "sm" | "md" }> = ({
  score,
  size = "sm",
}) => {
  if (score === null) {
    return (
      <span className="text-slate-400 text-xs italic">
        —
      </span>
    );
  }
  return (
    <span
      className={`inline-block font-bold tabular-nums ${scoreColor(
        score,
      )} ${scoreBg(score)} px-2 py-0.5 rounded-md ${
        size === "sm" ? "text-xs" : "text-sm"
      }`}
    >
      {score.toFixed(1)}
    </span>
  );
};

// ── Main component ─────────────────────────────────────────────────────────────

const InstructorClassStudentsPage: React.FC = () => {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const parsed = classId ? parseInt(classId, 10) : NaN;
  const numericClassId = Number.isInteger(parsed) && parsed > 0 ? parsed : null;

  const { classScores, loading: loadingByClassId, error: errorByClassId } =
    useAppSelector((state) => state.classScore);
  const data = numericClassId != null ? classScores[numericClassId] : undefined;
  const scoresLoading =
    numericClassId != null ? Boolean(loadingByClassId[numericClassId]) : false;
  const scoresError =
    numericClassId != null ? errorByClassId[numericClassId] ?? null : null;

  const [expandedStudent, setExpandedStudent] = useState<number | null>(null);

  useEffect(() => {
    if (numericClassId) {
      dispatch(fetchClassScores(numericClassId));
    }
  }, [dispatch, numericClassId]);

  useEffect(() => {
    if (scoresError) toast.error(scoresError);
  }, [scoresError]);

  const sortedCriteria: ClassScoreCriterion[] = useMemo(() => {
    if (!data?.criteria) return [];
    return [...data.criteria].sort(
      (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0),
    );
  }, [data]);

  const classAverageByCriterion = useMemo(() => {
    if (!data?.students || !sortedCriteria.length) return {};
    const result: Record<number, number | null> = {};
    sortedCriteria.forEach((c) => {
      const scores = data.students
        .flatMap((s) => s.rubricScores)
        .filter((rs) => rs.classRubricCriteriaId === c.classRubricCriteriaId)
        .map((rs) => rs.averageScore)
        .filter((v): v is number => v !== null);
      result[c.classRubricCriteriaId] =
        scores.length > 0
          ? scores.reduce((a, b) => a + b, 0) / scores.length
          : null;
    });
    return result;
  }, [data, sortedCriteria]);

  const overallClassAverage = useMemo(() => {
    if (!data?.students) return null;
    const scores = data.students
      .map((s) => s.overallAverageScore)
      .filter((v): v is number => v !== null);
    return scores.length > 0
      ? scores.reduce((a, b) => a + b, 0) / scores.length
      : null;
  }, [data]);

  if (numericClassId == null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <AlertCircle className="w-12 h-12 text-slate-300" />
          <p className="font-semibold text-slate-700">Mã lớp không hợp lệ</p>
          <button
            type="button"
            onClick={() => navigate("/instructor/students")}
            className="text-blue-600 hover:underline"
          >
            Quay lại danh sách lớp
          </button>
        </div>
      </div>
    );
  }

  if (scoresLoading && !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p>Đang tải dữ liệu lớp...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <AlertCircle className="w-12 h-12 text-slate-300" />
          <p className="font-semibold text-slate-700">
            {scoresError || "Không tìm thấy dữ liệu lớp học"}
          </p>
          <button
            type="button"
            onClick={() => dispatch(fetchClassScores(numericClassId))}
            className="text-sm text-blue-600 hover:underline"
          >
            Thử lại
          </button>
          <button
            type="button"
            onClick={() => navigate("/instructor/students")}
            className="text-blue-600 hover:underline"
          >
            Quay lại danh sách lớp
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarInstructor activeItem="students" />
      <main className="flex-1 overflow-y-auto lg:ml-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          {/* Back + Header */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/instructor/students")}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Quay lại
            </button>
            <div className="h-4 w-px bg-slate-200" />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  {data.class.classCode}
                </h1>
                <p className="text-xs text-slate-500">
                  {data.totalStudents} sinh viên ·{" "}
                  {sortedCriteria.length} tiêu chí đánh giá
                </p>
              </div>
            </div>
            <div className="ml-auto">
              <button
                type="button"
                onClick={() => dispatch(fetchClassScores(numericClassId))}
                disabled={scoresLoading}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 disabled:opacity-60 transition-colors"
              >
                <RefreshCw
                  className={`w-4 h-4 ${scoresLoading ? "animate-spin" : ""}`}
                />
                Làm mới
              </button>
            </div>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4"
            >
              <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-0.5">
                  Tổng SV
                </p>
                <p className="text-xl font-bold text-slate-900">
                  {data.totalStudents}
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4"
            >
              <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-0.5">
                  Đã chấm
                </p>
                <p className="text-xl font-bold text-slate-900">
                  {
                    data.students.filter(
                      (s) => s.overallAverageScore !== null,
                    ).length
                  }
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4"
            >
              <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-0.5">
                  Chưa chấm
                </p>
                <p className="text-xl font-bold text-slate-900">
                  {
                    data.students.filter(
                      (s) => s.overallAverageScore === null,
                    ).length
                  }
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4"
            >
              <div className="w-11 h-11 rounded-xl bg-violet-50 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-0.5">
                  Điểm TB lớp
                </p>
                <p className={`text-xl font-bold ${scoreColor(overallClassAverage)}`}>
                  {overallClassAverage !== null
                    ? `${overallClassAverage.toFixed(1)}%`
                    : "—"}
                </p>
              </div>
            </motion.div>
          </div>

          {/* Criteria summary bar */}
          {sortedCriteria.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl border border-slate-200 p-5"
            >
              <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-slate-600" />
                Điểm trung bình theo tiêu chí
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {sortedCriteria.map((c) => {
                  const avg = classAverageByCriterion[c.classRubricCriteriaId];
                  return (
                    <div
                      key={c.classRubricCriteriaId}
                      className="rounded-xl border border-slate-100 p-3 flex flex-col gap-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-800 leading-tight">
                          {c.criteriaName}
                        </p>
                        <ScoreBadge score={avg} size="md" />
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span>Trọng số: {c.weight}%</span>
                        <span>Max: {c.maxScore}</span>
                      </div>
                      {avg !== null && (
                        <div className="w-full bg-slate-100 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full transition-all ${
                              avg >= 80
                                ? "bg-emerald-500"
                                : avg >= 60
                                ? "bg-amber-500"
                                : "bg-red-500"
                            }`}
                            style={{ width: `${Math.min(100, avg)}%` }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Students score table */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-white rounded-2xl border border-slate-200 overflow-hidden"
          >
            <div className="p-5 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-600" />
                Điểm theo sinh viên
              </h3>
            </div>

            {/* Table header */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-4 py-3 text-left font-semibold text-slate-700 w-8">
                      #
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700 min-w-48">
                      Sinh viên
                    </th>
                    {sortedCriteria.map((c) => (
                      <th
                        key={c.classRubricCriteriaId}
                        className="px-3 py-3 text-center font-semibold text-slate-700 whitespace-nowrap"
                      >
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="text-xs">{c.criteriaName}</span>
                          <span className="text-xs text-slate-400 font-normal">
                            (w:{c.weight}%)
                          </span>
                        </div>
                      </th>
                    ))}
                    <th className="px-4 py-3 text-center font-semibold text-slate-700 whitespace-nowrap">
                      TB chung
                    </th>
                    <th className="px-4 py-3 text-center font-semibold text-slate-700 whitespace-nowrap">
                      Bài TL
                    </th>
                    <th className="px-4 py-3 text-center font-semibold text-slate-700 w-10">
                      Chi tiết
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.students.length === 0 ? (
                    <tr>
                      <td
                        colSpan={
                          3 + sortedCriteria.length + 2
                        }
                        className="px-4 py-12 text-center text-slate-500"
                      >
                        Chưa có sinh viên trong lớp này.
                      </td>
                    </tr>
                  ) : (
                    data.students.map((student, idx) => {
                      const isExpanded = expandedStudent === student.enrollmentId;
                      return (
                        <React.Fragment key={student.enrollmentId}>
                          <tr
                            className={`border-t border-slate-100 hover:bg-slate-50 transition-colors ${
                              isExpanded ? "bg-blue-50/30" : ""
                            }`}
                          >
                            <td className="px-4 py-3 text-slate-500">{idx + 1}</td>
                            <td className="px-4 py-3">
                              <div>
                                <p className="font-semibold text-slate-900">
                                  {student.student.firstName}{" "}
                                  {student.student.lastName}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {student.student.email}
                                </p>
                              </div>
                            </td>
                            {sortedCriteria.map((c) => {
                              const rubricScore = student.rubricScores.find(
                                (rs) =>
                                  rs.classRubricCriteriaId ===
                                  c.classRubricCriteriaId,
                              );
                              return (
                                <td
                                  key={c.classRubricCriteriaId}
                                  className="px-3 py-3 text-center"
                                >
                                  <ScoreBadge
                                    score={rubricScore?.averageScore ?? null}
                                  />
                                </td>
                              );
                            })}
                            <td className="px-4 py-3 text-center">
                              <ScoreBadge
                                score={student.overallAverageScore}
                                size="md"
                              />
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex flex-col items-center gap-0.5">
                                <span className="text-xs font-semibold text-slate-700">
                                  {student.totalReports} /{" "}
                                  {student.totalPresentations}
                                </span>
                                <span className="text-xs text-slate-400">
                                  đã chấm
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={() =>
                                  setExpandedStudent(
                                    isExpanded ? null : student.enrollmentId,
                                  )
                                }
                                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                                title={isExpanded ? "Thu gọn" : "Xem chi tiết"}
                              >
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                )}
                              </button>
                            </td>
                          </tr>

                          {/* Expanded row */}
                          {isExpanded && (
                            <tr className="border-t border-blue-100 bg-blue-50/30">
                              <td colSpan={3 + sortedCriteria.length + 3}>
                                <div className="p-4 space-y-4">
                                  {/* Presentations */}
                                  <div>
                                    <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                                      <Presentation className="w-3.5 h-3.5" />
                                      Bài thuyết trình ({student.totalPresentations})
                                    </p>
                                    {student.presentations.length === 0 ? (
                                      <p className="text-sm text-slate-400 italic">
                                        Chưa có bài thuyết trình nào.
                                      </p>
                                    ) : (
                                      <div className="space-y-2">
                                        {student.presentations.map((p) => {
                                          const reportDisplay =
                                            getReportStatusDisplay(
                                              p.reportStatus,
                                            );
                                          const presDisplay =
                                            getPresentationDisplay(p.status);
                                          return (
                                            <div
                                              key={p.presentationId}
                                              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white bg-white p-3 shadow-sm"
                                            >
                                              <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-slate-900 mb-1">
                                                  {p.title}
                                                </p>
                                                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                                                  <span
                                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium ${presDisplay.bg} ${presDisplay.color}`}
                                                  >
                                                    {presDisplay.label}
                                                  </span>
                                                  <span
                                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium ${reportDisplay.bg} ${reportDisplay.color}`}
                                                  >
                                                    {reportDisplay.label}
                                                  </span>
                                                  {p.submittedAt && (
                                                    <span>
                                                      Nộp lúc{" "}
                                                      {new Date(
                                                        p.submittedAt,
                                                      ).toLocaleString(
                                                        "vi-VN",
                                                      )}
                                                    </span>
                                                  )}
                                                </div>
                                              </div>
                                              <div className="flex items-center gap-3">
                                                {p.overallScore !== null ? (
                                                  <ScoreBadge
                                                    score={
                                                      Number(p.overallScore) *
                                                      100
                                                    }
                                                    size="md"
                                                  />
                                                ) : (
                                                  <span className="text-slate-400 text-xs italic">
                                                    —
                                                  </span>
                                                )}
                                                {p.hasReport && (
                                                  <button
                                                    onClick={() =>
                                                      navigate(
                                                        `/instructor/presentation/${p.presentationId}`,
                                                      )
                                                    }
                                                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline whitespace-nowrap"
                                                  >
                                                    Xem báo cáo →
                                                  </button>
                                                )}
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>

                                  {/* Rubric breakdown */}
                                  <div>
                                    <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                                      <BarChart3 className="w-3.5 h-3.5" />
                                      Chi tiết điểm rubric
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                      {student.rubricScores.map((rs) => {
                                        return (
                                          <div
                                            key={rs.classRubricCriteriaId}
                                            className="rounded-xl border border-white bg-white p-3 shadow-sm"
                                          >
                                            <p className="text-xs font-semibold text-slate-700 mb-1">
                                              {rs.criteriaName}
                                            </p>
                                            <div className="flex items-center justify-between gap-2">
                                              <ScoreBadge
                                                score={rs.averageScore}
                                                size="md"
                                              />
                                              <span className="text-xs text-slate-400">
                                                / {rs.maxScore} (w:{rs.weight}
                                                %)
                                              </span>
                                            </div>
                                            {rs.averageScore !== null && (
                                              <div className="w-full bg-slate-100 rounded-full h-1 mt-2">
                                                <div
                                                  className={`h-1 rounded-full ${
                                                    rs.averageScore >= 80
                                                      ? "bg-emerald-500"
                                                      : rs.averageScore >= 60
                                                      ? "bg-amber-500"
                                                      : "bg-red-500"
                                                  }`}
                                                  style={{
                                                    width: `${Math.min(
                                                      100,
                                                      rs.averageScore,
                                                    )}%`,
                                                  }}
                                                />
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default InstructorClassStudentsPage;
