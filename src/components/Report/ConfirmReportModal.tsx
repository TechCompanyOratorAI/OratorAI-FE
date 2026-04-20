import React, { useState } from "react";
import { Modal, InputNumber, Input, Typography, Space } from "antd";
import { useAppDispatch } from "@/services/store/store";
import { confirmPresentationReport } from "@/services/features/report/reportSlice";
import { toast } from "react-toastify";

const { Text } = Typography;
const { TextArea } = Input;

interface ConfirmReportModalProps {
  isOpen: boolean;
  reportId: number;
  onClose: () => void;
}

const ConfirmReportModal: React.FC<ConfirmReportModalProps> = ({
  isOpen,
  reportId,
  onClose,
}) => {
  const dispatch = useAppDispatch();
  const [grade, setGrade] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    setGrade(null);
    setFeedback("");
    onClose();
  };

  const handleConfirm = async () => {
    if (grade === null) {
      toast.error("Vui lòng nhập điểm cuối cùng");
      return;
    }
    try {
      setLoading(true);
      await dispatch(
        confirmPresentationReport({
          reportId,
          gradeForInstructor: grade,
          feedbackOfInstructor: feedback.trim() || undefined,
        }),
      ).unwrap();
      toast.success("Đã xác nhận AI report");
      handleClose();
    } catch (err: unknown) {
      const msg =
        typeof err === "string"
          ? err
          : (err as { message?: string })?.message || "Không thể xác nhận AI report";
      toast.error(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      title="Xác nhận báo cáo AI"
      centered
      width={520}
      okText="Xác nhận"
      cancelText="Hủy"
      onCancel={handleClose}
      onOk={handleConfirm}
      confirmLoading={loading}
      maskClosable={!loading}
      destroyOnClose
      okButtonProps={{ style: { background: "#059669", borderColor: "#059669" } }}
    >
      <Space direction="vertical" size="middle" className="w-full">
        <p className="text-slate-600 leading-relaxed">
          Nhập <strong>điểm cuối cùng</strong> và <strong>nhận xét tổng kết</strong> để xác nhận
          báo cáo đánh giá AI này.
        </p>

        <div>
          <Text strong className="text-sm block mb-1">
            Điểm cuối cùng (thang 10) <span className="text-red-500">*</span>
          </Text>
          <InputNumber
            className="w-full"
            min={0}
            max={10}
            step={0.5}
            value={grade}
            onChange={(v) => setGrade(v)}
            placeholder="VD: 8.5"
            disabled={loading}
          />
        </div>

        <div>
          <Text strong className="text-sm block mb-1">
            Nhận xét tổng kết của giảng viên
          </Text>
          <TextArea
            rows={3}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Nhập nhận xét tổng kết cho bài thuyết trình này..."
            maxLength={2000}
            showCount
            disabled={loading}
          />
        </div>
      </Space>
    </Modal>
  );
};

export default ConfirmReportModal;
