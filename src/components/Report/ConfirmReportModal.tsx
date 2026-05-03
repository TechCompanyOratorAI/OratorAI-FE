import React, { useState } from "react";
import { Modal, InputNumber, Input } from "antd";
import { useAppDispatch } from "@/services/store/store";
import { confirmPresentationReport } from "@/services/features/report/reportSlice";
import { getErrorMessage, getResponseMessage, toast } from "@/lib/toast";

interface ConfirmReportModalProps {
  isOpen: boolean;
  reportId: number;
  initialGrade?: number | null;
  onClose: () => void;
}

const ConfirmReportModal: React.FC<ConfirmReportModalProps> = ({
  isOpen,
  reportId,
  initialGrade,
  onClose,
}) => {
  const dispatch = useAppDispatch();
  const [grade, setGrade] = useState<number | null>(initialGrade ?? null);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (grade === null) { toast.error("Vui lòng nhập điểm cuối cùng"); return; }
    if (!feedback.trim()) { toast.error("Vui lòng nhập nhận xét tổng kết của giảng viên"); return; }
    try {
      setLoading(true);
      const result = await dispatch(
        confirmPresentationReport({ reportId, gradeForInstructor: grade, feedbackOfInstructor: feedback.trim() }),
      ).unwrap();
      toast.success(getResponseMessage(result, "Đã xác nhận AI report"));
      onClose();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Không thể xác nhận AI report"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      title="Chốt điểm bài thuyết trình"
      centered
      width={520}
      okText="Xác nhận"
      cancelText="Hủy"
      onCancel={onClose}
      onOk={handleConfirm}
      confirmLoading={loading}
      maskClosable={!loading}
      destroyOnClose
      okButtonProps={{ style: { background: "#059669", borderColor: "#059669" } }}
    >
      <div className="space-y-4 mt-2">
        <p className="text-slate-600 leading-relaxed">
          Nhập <strong>điểm cuối cùng</strong> và <strong>nhận xét tổng kết</strong> để chốt điểm bài thuyết trình này.
        </p>

        <div>
          <label className="text-sm font-semibold block mb-1">
            Điểm cuối cùng (thang 10) <span className="text-red-500">*</span>
          </label>
          <InputNumber
            className="w-full"
            min={0} max={10} step={0.5}
            value={grade}
            onChange={(v) => setGrade(v)}
            placeholder="VD: 8.5"
            disabled={loading}
          />
        </div>

        <div>
          <label className="text-sm font-semibold block mb-1">
            Nhận xét tổng kết <span className="text-red-500">*</span>
          </label>
          <Input.TextArea
            rows={4}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Nhập nhận xét tổng kết cho bài thuyết trình này..."
            maxLength={2000}
            disabled={loading}
            showCount
          />
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmReportModal;
