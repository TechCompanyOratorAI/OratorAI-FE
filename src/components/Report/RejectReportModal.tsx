import React, { useState } from "react";
import { Modal } from "antd";
import { useAppDispatch } from "@/services/store/store";
import { rejectPresentationReport, fetchPresentationReport } from "@/services/features/report/reportSlice";
import { toast } from "react-toastify";

interface RejectReportModalProps {
  isOpen: boolean;
  reportId: number;
  presentationId: number;
  onClose: () => void;
}

const RejectReportModal: React.FC<RejectReportModalProps> = ({
  isOpen,
  reportId,
  presentationId,
  onClose,
}) => {
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    try {
      setLoading(true);
      await dispatch(rejectPresentationReport(reportId)).unwrap();
      await dispatch(fetchPresentationReport(presentationId)).unwrap();
      toast.success("Đã từ chối AI report");
      onClose();
    } catch (err: unknown) {
      const msg =
        typeof err === "string"
          ? err
          : (err as { message?: string })?.message || "Không thể từ chối AI report";
      toast.error(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      title="Từ chối báo cáo AI"
      centered
      width={480}
      okText="Từ chối"
      cancelText="Hủy"
      onCancel={onClose}
      onOk={handleConfirm}
      confirmLoading={loading}
      maskClosable={!loading}
      destroyOnClose
      okButtonProps={{ danger: true }}
    >
      <p className="text-slate-600 leading-relaxed">
        Bạn có chắc chắn muốn <strong className="text-red-600">từ chối</strong> báo cáo này?
        Hành động này đánh dấu báo cáo không được chấp nhận theo quy trình hiện tại.
      </p>
    </Modal>
  );
};

export default RejectReportModal;
