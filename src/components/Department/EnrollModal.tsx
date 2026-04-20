import React, { useState } from "react";
import { Modal, Input, Typography } from "antd";
import { KeyRound } from "lucide-react";
import { useAppDispatch } from "@/services/store/store";
import {
  enrollClassByKey,
  fetchEnrolledClasses,
} from "@/services/features/enrollment/enrollmentSlice";
import { toast } from "react-toastify";

const { Text } = Typography;

interface EnrollModalProps {
  open: boolean;
  classData: {
    classId: number;
    className: string;
  } | null;
  onClose: () => void;
}

const BRAND_GRADIENT = "linear-gradient(135deg, #1da9e6 0%, #6966fe 100%)";

const EnrollModal: React.FC<EnrollModalProps> = ({
  open,
  classData,
  onClose,
}) => {
  const dispatch = useAppDispatch();
  const [enrollKey, setEnrollKey] = useState("");
  const [enrollError, setEnrollError] = useState("");
  const [enrolling, setEnrolling] = useState(false);

  const handleClose = () => {
    setEnrollKey("");
    setEnrollError("");
    setEnrolling(false);
    onClose();
  };

  const handleSubmit = async () => {
    const trimmed = enrollKey.trim();
    if (!trimmed) {
      setEnrollError("Vui lòng nhập mã ghi danh");
      return;
    }
    if (!classData) return;

    try {
      setEnrolling(true);
      setEnrollError("");
      await dispatch(
        enrollClassByKey({ classId: classData.classId, enrollKey: trimmed }),
      ).unwrap();
      await dispatch(fetchEnrolledClasses());
      toast.success(`Đã ghi danh thành công lớp "${classData.className}"!`);
      handleClose();
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Ghi danh thất bại. Vui lòng thử lại.";
      setEnrollError(message);
    } finally {
      setEnrolling(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      footer={null}
      centered
      width={440}
      destroyOnHidden
      styles={{
        content: {
          borderRadius: 16,
          padding: "24px 20px 20px",
          fontFamily: "'Poppins', sans-serif",
        },
        header: { display: "none" },
      }}
    >
      <div className="space-y-5">
        <div
          className="flex items-center gap-3 rounded-xl p-4"
          style={{ background: BRAND_GRADIENT, color: "white" }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: "rgba(255,255,255,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <KeyRound style={{ width: 24, height: 24, color: "white" }} />
          </div>
          <div>
            <Text strong style={{ color: "white", fontSize: 17 }}>
              Ghi danh lớp học
            </Text>
            <Text
              style={{
                color: "rgba(255,255,255,0.85)",
                fontSize: 13,
                display: "block",
              }}
            >
              {classData?.className}
            </Text>
          </div>
        </div>

        <div>
          <label
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "#374151",
              display: "block",
              marginBottom: 8,
            }}
          >
            Mã ghi danh
          </label>
          <Input
            placeholder="Nhập mã ghi danh do giáo viên cung cấp"
            prefix={
              <KeyRound style={{ width: 16, height: 16, color: "#9CA3AF" }} />
            }
            value={enrollKey}
            onChange={(e) => {
              setEnrollKey(e.target.value);
              if (enrollError) setEnrollError("");
            }}
            onPressEnter={handleSubmit}
            status={enrollError ? "error" : undefined}
            style={{
              borderRadius: 12,
              height: 46,
              fontSize: 14,
              border: "1.5px solid #E5E7EB",
            }}
          />
          {enrollError && (
            <Text
              type="danger"
              style={{ fontSize: 13, marginTop: 6, display: "block" }}
            >
              {enrollError}
            </Text>
          )}
        </div>

        <div className="flex items-center justify-end gap-2">
          <button
            onClick={handleClose}
            disabled={enrolling}
            style={{
              padding: "0 20px",
              height: 40,
              borderRadius: 10,
              border: "1.5px solid #E5E7EB",
              background: "white",
              color: "#6B7280",
              fontSize: 14,
              fontWeight: 600,
              cursor: enrolling ? "not-allowed" : "pointer",
              fontFamily: "'Poppins', sans-serif",
            }}
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={enrolling}
            style={{
              padding: "0 20px",
              height: 40,
              borderRadius: 10,
              border: "none",
              background: BRAND_GRADIENT,
              color: "white",
              fontSize: 14,
              fontWeight: 600,
              cursor: enrolling ? "not-allowed" : "pointer",
              fontFamily: "'Poppins', sans-serif",
              boxShadow: "0 2px 8px rgba(29,169,230,0.3)",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {enrolling ? "Đang ghi danh..." : "Xác nhận"}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default EnrollModal;
