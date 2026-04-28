import React, { useEffect, useState } from "react";
import {
  Button,
  Input,
  InputNumber,
  Space,
  Popconfirm,
  Typography,
  Divider,
} from "antd";
import { SaveOutlined, EditOutlined } from "@ant-design/icons";
import { getErrorMessage, getResponseMessage, toast } from "@/lib/toast";
import { useAppDispatch, useAppSelector } from "@/services/store/store";
import {
  createCriterionFeedback,
  upsertCriterionFeedback,
  deleteCriterionFeedback,
  fetchCriterionFeedbacks,
  CriterionFeedback,
  CriterionScore,
} from "@/services/features/report/reportSlice";

const { Text, Paragraph } = Typography;
const { TextArea } = Input;

export interface CriterionFeedbackRubricFormProps {
  reportId: number;
  criterion: CriterionScore;
  existingFeedback?: CriterionFeedback | null;
  disabled?: boolean;
  /** Gọi sau khi tạo/cập nhật/xóa thành công (vd: refetch báo cáo để đồng bộ embedded criterionFeedbacks) */
  onFeedbackChanged?: () => void;
}

const CriterionFeedbackRubricForm: React.FC<CriterionFeedbackRubricFormProps> = ({
  reportId,
  criterion,
  existingFeedback,
  disabled = false,
  onFeedbackChanged,
}) => {
  const dispatch = useAppDispatch();
  const { feedbackMutating, feedbackLoading } = useAppSelector(
    (state) => state.report,
  );

  const criteriaId = criterion.criteriaId;
  const [score, setScore] = useState("");
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  /** Chỉ khi đã có feedback trên server: false = xem gọn, true = mở form sửa */
  const [editing, setEditing] = useState(false);

  const exists = !!existingFeedback;
  const showForm = !exists || editing;

  useEffect(() => {
    if (!existingFeedback) {
      setScore("");
      setComment("");
      setEditing(false);
      return;
    }
    setScore(
      existingFeedback.score !== undefined && existingFeedback.score !== null
        ? String(existingFeedback.score)
        : "",
    );
    setComment(existingFeedback.comment ?? "");
  }, [
    existingFeedback?.criterionFeedbackId,
    existingFeedback?.score,
    existingFeedback?.comment,
  ]);

  const isBusy = feedbackMutating || feedbackLoading;
  const scoreNum = score === "" ? null : Number.parseFloat(score);
  const inputScore =
    scoreNum !== null && Number.isFinite(scoreNum) ? scoreNum : null;

  const syncAfterMutation = async () => {
    await dispatch(fetchCriterionFeedbacks(reportId));
    onFeedbackChanged?.();
  };

  const handleSave = async () => {
    const scoreVal = score !== "" ? parseFloat(score) : undefined;
    const commentVal = comment.trim() || undefined;

    if (scoreVal !== undefined && (isNaN(scoreVal) || scoreVal < 0 || scoreVal > 100)) {
      toast.error("Điểm phải từ 0 đến 100");
      return;
    }
    if (comment.length > 2000) {
      toast.error("Nhận xét không được quá 2000 ký tự");
      return;
    }

    setSaving(true);
    try {
      if (!exists) {
        const result = await dispatch(
          createCriterionFeedback({
            reportId,
            classRubricCriteriaId: criteriaId,
            score: scoreVal,
            comment: commentVal,
          }),
        ).unwrap();
        toast.success(getResponseMessage(result, "Đã tạo feedback cho tiêu chí"));
      } else {
        const result = await dispatch(
          upsertCriterionFeedback({
            reportId,
            classRubricCriteriaId: criteriaId,
            score: scoreVal,
            comment: commentVal,
          }),
        ).unwrap();
        toast.success(getResponseMessage(result, "Đã cập nhật feedback"));
      }
      await syncAfterMutation();
      setEditing(false);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Thao tác thất bại"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      const result = await dispatch(
        deleteCriterionFeedback({ reportId, classRubricCriteriaId: criteriaId }),
      ).unwrap();
      toast.success(getResponseMessage(result, "Đã xóa feedback"));
      setScore("");
      setComment("");
      setEditing(false);
      await syncAfterMutation();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Xóa thất bại"));
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (existingFeedback) {
      setScore(
        existingFeedback.score !== undefined && existingFeedback.score !== null
          ? String(existingFeedback.score)
          : "",
      );
      setComment(existingFeedback.comment ?? "");
    }
    setEditing(false);
  };

  const displayScore =
    score !== ""
      ? Number.isFinite(Number.parseFloat(score))
        ? Number.parseFloat(score).toFixed(2)
        : score
      : "—";

  return (
    <div className={disabled ? "pointer-events-none opacity-50" : undefined}>
      <Divider orientation="left" plain className="!mt-2 !mb-3">
        <Text type="secondary" className="text-xs font-medium uppercase tracking-wide">
          Phản hồi giảng viên (tiêu chí này)
        </Text>
      </Divider>

      {exists && existingFeedback && (
        <Text type="success" className="text-xs block mb-2">
          Đã có feedback · {existingFeedback.instructor?.firstName}{" "}
          {existingFeedback.instructor?.lastName}
        </Text>
      )}

      {exists && !editing && (
        <div className="rounded-lg bg-slate-50 border border-slate-100 p-3">
          <div className="flex justify-between items-start gap-3">
            <div className="flex-1 min-w-0 space-y-2">
              <div>
                <Text type="secondary" className="text-xs block">
                  Điểm (0 – 100)
                </Text>
                <Text strong className="text-indigo-700 text-base">
                  {displayScore}
                  {displayScore !== "—" ? " / 100" : ""}
                </Text>
              </div>
              <div>
                <Text type="secondary" className="text-xs block mb-0.5">
                  Nhận xét
                </Text>
                <Paragraph className="!mb-0 text-sm text-slate-800 whitespace-pre-wrap">
                  {comment.trim() ? comment : "—"}
                </Paragraph>
              </div>
            </div>
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => setEditing(true)}
              disabled={saving || isBusy}
              aria-label="Chỉnh sửa phản hồi"
              className="shrink-0 text-indigo-600"
            />
          </div>
        </div>
      )}

      {showForm && (
        <>
          <Space direction="vertical" size="small" className="w-full">
            <div>
              <Text className="text-xs text-slate-600 block mb-1">Điểm (0 – 100)</Text>
              <InputNumber
                className="w-full max-w-xs"
                min={0}
                max={100}
                step={0.01}
                placeholder={`Gợi ý: ${Math.round((criterion.score / criterion.maxScore) * 100)}`}
                value={inputScore}
                onChange={(v) => setScore(v === null ? "" : String(v))}
                disabled={saving || isBusy}
              />
            </div>
            <div>
              <Text className="text-xs text-slate-600 block mb-1">
                Nhận xét (tối đa 2000 ký tự)
              </Text>
              <TextArea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={2000}
                rows={4}
                placeholder="Nhập nhận xét cho tiêu chí này..."
                disabled={saving || isBusy}
                className="!pb-3"
              />
              <div className="flex justify-end mt-1.5">
                <Text type="secondary" className="text-xs tabular-nums">
                  {comment.length} / 2000
                </Text>
              </div>
            </div>
          </Space>

          <div className="flex flex-wrap justify-end gap-2 mt-4 pt-3 border-t border-slate-100">
            {exists && editing && (
              <Button onClick={handleCancelEdit} disabled={saving || isBusy}>
                Hủy
              </Button>
            )}
            {exists && editing && (
              <Popconfirm
                title="Xóa feedback?"
                description="Bạn có chắc muốn xóa phản hồi cho tiêu chí này?"
                okText="Xóa"
                cancelText="Hủy"
                okButtonProps={{ danger: true }}
                onConfirm={handleDelete}
                disabled={saving || isBusy}
              >
                <Button danger type="default" disabled={saving || isBusy}>
                  Xóa
                </Button>
              </Popconfirm>
            )}
            <Button
              type="primary"
              icon={<SaveOutlined />}
              loading={saving}
              disabled={(isBusy && !saving) || disabled}
              onClick={handleSave}
            >
              {exists ? "Lưu thay đổi" : "Tạo feedback"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default CriterionFeedbackRubricForm;
