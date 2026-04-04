import React, { useEffect, useState } from "react";
import { X, Trash2, Save, AlertCircle } from "lucide-react";
import { toast } from "react-toastify";
import { useAppDispatch, useAppSelector } from "@/services/store/store";
import {
  createCriterionFeedback,
  upsertCriterionFeedback,
  deleteCriterionFeedback,
  fetchCriterionFeedbacks,
  CriterionFeedback,
  CriterionScore,
} from "@/services/features/report/reportSlice";

interface CriterionFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportId: number;
  criteria: CriterionScore[];
  existingFeedbacks: CriterionFeedback[];
  presentationId: number;
}

const CriterionFeedbackModal: React.FC<CriterionFeedbackModalProps> = ({
  isOpen,
  onClose,
  reportId,
  criteria,
  existingFeedbacks,
}) => {
  const dispatch = useAppDispatch();
  const { feedbackMutating, feedbackLoading } = useAppSelector(
    (state) => state.report,
  );

  const [feedbackData, setFeedbackData] = useState<
    Record<number, { score: string; comment: string }>
  >({});
  const [savingId, setSavingId] = useState<number | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const initial: Record<number, { score: string; comment: string }> = {};
    for (const criterion of criteria) {
      const existing = existingFeedbacks.find(
        (f) => f.classRubricCriteriaId === criterion.criteriaId,
      );
      initial[criterion.criteriaId] = {
        score: existing?.score ?? "",
        comment: existing?.comment ?? "",
      };
    }
    setFeedbackData(initial);
  }, [isOpen, criteria, existingFeedbacks]);

  const handleScoreChange = (criteriaId: number, value: string) => {
    setFeedbackData((prev) => ({
      ...prev,
      [criteriaId]: { ...prev[criteriaId], score: value },
    }));
  };

  const handleCommentChange = (criteriaId: number, value: string) => {
    setFeedbackData((prev) => ({
      ...prev,
      [criteriaId]: { ...prev[criteriaId], comment: value },
    }));
  };

  const hasExistingFeedback = (criteriaId: number) => {
    return existingFeedbacks.some((f) => f.classRubricCriteriaId === criteriaId);
  };

  const handleSave = async (criteriaId: number) => {
    const data = feedbackData[criteriaId] ?? { score: "", comment: "" };
    const score = data.score !== "" ? parseFloat(data.score) : undefined;
    const comment = data.comment.trim() || undefined;

    if (score !== undefined && (isNaN(score) || score < 0 || score > 100)) {
      toast.error("Điểm phải từ 0 đến 100");
      return;
    }
    if (data.comment.length > 2000) {
      toast.error("Nhận xét không được quá 2000 ký tự");
      return;
    }

    setSavingId(criteriaId);
    try {
      const isNew = !hasExistingFeedback(criteriaId);
      if (isNew) {
        await dispatch(
          createCriterionFeedback({ reportId, classRubricCriteriaId: criteriaId, score, comment }),
        ).unwrap();
        toast.success("Đã tạo feedback cho tiêu chí");
      } else {
        await dispatch(
          upsertCriterionFeedback({ reportId, classRubricCriteriaId: criteriaId, score, comment }),
        ).unwrap();
        toast.success("Đã cập nhật feedback");
      }
      await dispatch(fetchCriterionFeedbacks(reportId));
    } catch (err: unknown) {
      toast.error(typeof err === "string" ? err : (err as { message?: string })?.message || "Thao tác thất bại");
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (criteriaId: number) => {
    const confirmed = window.confirm("Bạn có chắc chắn muốn xóa feedback này?");
    if (!confirmed) return;

    setSavingId(criteriaId);
    try {
      await dispatch(deleteCriterionFeedback({ reportId, classRubricCriteriaId: criteriaId })).unwrap();
      toast.success("Đã xóa feedback");
      setFeedbackData((prev) => ({
        ...prev,
        [criteriaId]: { score: "", comment: "" },
      }));
    } catch (err: unknown) {
      toast.error(typeof err === "string" ? err : (err as { message?: string })?.message || "Xóa thất bại");
    } finally {
      setSavingId(null);
    }
  };

  if (!isOpen) return null;

  const isLoading = feedbackMutating || feedbackLoading;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Feedback theo tiêu chí
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Cập nhật điểm và nhận xét cho từng tiêu chí đánh giá
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {criteria.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <AlertCircle className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p>Không có tiêu chí đánh giá nào.</p>
            </div>
          ) : (
            criteria.map((criterion) => {
              const feedback = existingFeedbacks.find(
                (f) => f.classRubricCriteriaId === criterion.criteriaId,
              );
              const data = feedbackData[criterion.criteriaId] ?? { score: "", comment: "" };
              const isSaving = savingId === criterion.criteriaId;

              return (
                <div
                  key={criterion.criteriaId}
                  className="rounded-xl border border-slate-200 p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900 text-sm">
                        {criterion.criteriaName}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Tối đa: {criterion.maxScore} điểm · Trọng số:{" "}
                        {criterion.weight}%
                      </p>
                      {feedback && (
                        <p className="text-xs text-emerald-600 font-medium mt-0.5">
                          Đã có feedback · GV:{" "}
                          {feedback.instructor?.firstName}{" "}
                          {feedback.instructor?.lastName}
                        </p>
                      )}
                    </div>
                    {hasExistingFeedback(criterion.criteriaId) && (
                      <button
                        onClick={() => handleDelete(criterion.criteriaId)}
                        disabled={isSaving || isLoading}
                        className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                        title="Xóa feedback"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Score */}
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Điểm (0 – 100)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={data.score}
                      onChange={(e) =>
                        handleScoreChange(criterion.criteriaId, e.target.value)
                      }
                      placeholder={`VD: ${Math.round(criterion.score * 100 / criterion.maxScore)}`}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Comment */}
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Nhận xét (tối đa 2000 ký tự)
                    </label>
                    <textarea
                      value={data.comment}
                      onChange={(e) =>
                        handleCommentChange(criterion.criteriaId, e.target.value)
                      }
                      maxLength={2000}
                      rows={3}
                      placeholder="Nhập nhận xét cho tiêu chí này..."
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-slate-400 text-right mt-0.5">
                      {data.comment.length}/2000
                    </p>
                  </div>

                  {/* Save button */}
                  <div className="flex justify-end">
                    <button
                      onClick={() => handleSave(criterion.criteriaId)}
                      disabled={isSaving || isLoading}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors"
                    >
                      {isSaving ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      {hasExistingFeedback(criterion.criteriaId) ? "Lưu" : "Tạo mới"}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default CriterionFeedbackModal;
