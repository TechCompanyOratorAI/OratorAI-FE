import React, { useState } from "react";
import { Modal, Input, Typography, Spin, Tag } from "antd";
import { KeyRound, CheckCircle, BookOpen, Users, GraduationCap } from "lucide-react";
import { useAppDispatch } from "@/services/store/store";
import {
  enrollClassByKey,
  fetchEnrolledClasses,
  previewClassByKey,
  type ClassPreview,
} from "@/services/features/enrollment/enrollmentSlice";
import { toast } from "react-toastify";

const { Text } = Typography;

interface EnrollModalProps {
  open: boolean;
  /**
   * classData: nếu có thì modal chỉ dùng để nhập key cho lớp cụ thể đó.
   * Nếu null: "Quick Join" mode — sinh viên chỉ nhập key, BE tự tìm lớp.
   */
  classData: {
    classId: number;
    className: string;
  } | null;
  onClose: () => void;
}

const BRAND_GRADIENT = "linear-gradient(135deg, #1da9e6 0%, #6966fe 100%)";

type Step = "input" | "preview" | "done";

const EnrollModal: React.FC<EnrollModalProps> = ({
  open,
  classData,
  onClose,
}) => {
  const dispatch = useAppDispatch();
  const [enrollKey, setEnrollKey] = useState("");
  const [enrollError, setEnrollError] = useState("");
  const [enrolling, setEnrolling] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [step, setStep] = useState<Step>("input");
  const [preview, setPreview] = useState<ClassPreview | null>(null);

  const isQuickJoin = !classData;

  const handleClose = () => {
    setEnrollKey("");
    setEnrollError("");
    setEnrolling(false);
    setPreviewing(false);
    setStep("input");
    setPreview(null);
    onClose();
  };

  // Quick join: validate key and show preview first
  const handlePreview = async () => {
    const trimmed = enrollKey.trim().toUpperCase();
    if (!trimmed) {
      setEnrollError("Vui lòng nhập mã tham gia");
      return;
    }

    try {
      setPreviewing(true);
      setEnrollError("");
      const result = await dispatch(previewClassByKey(trimmed)).unwrap();
      setPreview(result.class);
      setStep("preview");
    } catch (err: unknown) {
      const message =
        typeof err === "string" ? err : "Mã đăng ký không hợp lệ hoặc đã hết hạn.";
      setEnrollError(message);
    } finally {
      setPreviewing(false);
    }
  };

  const handleSubmit = async () => {
    const trimmed = enrollKey.trim().toUpperCase();
    if (!trimmed) {
      setEnrollError("Vui lòng nhập mã tham gia");
      return;
    }

    try {
      setEnrolling(true);
      setEnrollError("");
      const result = await dispatch(enrollClassByKey({ enrollKey: trimmed })).unwrap();
      await dispatch(fetchEnrolledClasses());

      const name = preview?.className || classData?.className || "lớp học";

      if (result.alreadyEnrolled) {
        toast.info(`Bạn đã tham gia lớp "${name}" rồi.`);
      } else {
        toast.success(`Đã tham gia thành công lớp "${name}"!`);
      }
      handleClose();
    } catch (err: unknown) {
      const message =
        typeof err === "string"
          ? err
          : "Tham gia thất bại. Vui lòng thử lại.";
      setEnrollError(message);
      // Go back to input step so user can retry
      setStep("input");
    } finally {
      setEnrolling(false);
    }
  };

  const instructorNames = preview?.instructors
    ?.map((i) => `${i.firstName || ""} ${i.lastName || ""}`.trim() || i.username)
    .filter(Boolean)
    .join(", ");

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      footer={null}
      centered
      width={460}
      destroyOnHidden
      styles={{
        content: {
          borderRadius: 20,
          padding: "28px 24px 24px",
          fontFamily: "'Poppins', sans-serif",
          boxShadow: "0 20px 60px rgba(29,169,230,0.15)",
        },
        header: { display: "none" },
      }}
    >
      <div className="space-y-5">
        {/* Header */}
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
            {step === "preview" ? (
              <CheckCircle style={{ width: 24, height: 24, color: "white" }} />
            ) : (
              <KeyRound style={{ width: 24, height: 24, color: "white" }} />
            )}
          </div>
          <div>
            <Text strong style={{ color: "white", fontSize: 17 }}>
              {step === "preview" ? "Xác nhận tham gia" : "Tham gia lớp học"}
            </Text>
            <Text
              style={{
                color: "rgba(255,255,255,0.85)",
                fontSize: 12,
                display: "block",
              }}
            >
              {step === "preview"
                ? "Kiểm tra thông tin lớp trước khi tham gia"
                : isQuickJoin
                ? "Nhập mã do giảng viên cung cấp để vào lớp nhanh"
                : classData?.className}
            </Text>
          </div>
        </div>

        {/* Step: Input */}
        {step === "input" && (
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
              Mã tham gia
            </label>
            <Input
              placeholder="VD: ORA-A3F2-9B1C-DE74"
              prefix={
                <KeyRound style={{ width: 16, height: 16, color: "#9CA3AF" }} />
              }
              value={enrollKey}
              onChange={(e) => {
                setEnrollKey(e.target.value.toUpperCase());
                if (enrollError) setEnrollError("");
              }}
              onPressEnter={isQuickJoin ? handlePreview : handleSubmit}
              status={enrollError ? "error" : undefined}
              style={{
                borderRadius: 12,
                height: 48,
                fontSize: 15,
                fontFamily: "monospace",
                letterSpacing: 1,
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
            {isQuickJoin && (
              <Text
                type="secondary"
                style={{ fontSize: 12, marginTop: 6, display: "block" }}
              >
                Mã có dạng <span style={{ fontFamily: "monospace", fontWeight: 600 }}>ORA-XXXX-XXXX-XXXX</span>
              </Text>
            )}
          </div>
        )}

        {/* Step: Preview */}
        {step === "preview" && preview && (
          <div
            style={{
              background: "#F8FAFF",
              borderRadius: 14,
              padding: "16px 18px",
              border: "1px solid #E0E7FF",
            }}
          >
            {/* Class name + code */}
            <div className="flex items-start gap-3 mb-4">
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  background: BRAND_GRADIENT,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <GraduationCap style={{ width: 22, height: 22, color: "white" }} />
              </div>
              <div>
                <Text strong style={{ fontSize: 15, color: "#1F2937", display: "block" }}>
                  {preview.className || preview.classCode}
                </Text>
                <Tag
                  style={{
                    borderRadius: 20,
                    fontSize: 11,
                    padding: "0 10px",
                    background: "#EEF2FF",
                    border: "1px solid #C7D2FE",
                    color: "#6366F1",
                    fontWeight: 600,
                    marginTop: 4,
                  }}
                >
                  {preview.classCode}
                </Tag>
              </div>
            </div>

            {/* Course info */}
            {preview.course && (
              <div className="flex items-center gap-2 mb-2">
                <BookOpen style={{ width: 14, height: 14, color: "#6B7280" }} />
                <Text style={{ fontSize: 12, color: "#6B7280" }}>
                  {preview.course.courseCode} · {preview.course.courseName}
                  {preview.course.semester ? ` · ${preview.course.semester}` : ""}
                  {preview.course.academicYear ? ` ${preview.course.academicYear}` : ""}
                </Text>
              </div>
            )}

            {/* Instructor */}
            {instructorNames && (
              <div className="flex items-center gap-2 mb-2">
                <Users style={{ width: 14, height: 14, color: "#6B7280" }} />
                <Text style={{ fontSize: 12, color: "#6B7280" }}>
                  {instructorNames}
                </Text>
              </div>
            )}

            {/* Status */}
            <div className="flex items-center gap-2">
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: preview.status === "active" ? "#10B981" : "#9CA3AF",
                }}
              />
              <Text style={{ fontSize: 12, color: "#6B7280" }}>
                {preview.status === "active" ? "Đang mở" : "Đã đóng"}
              </Text>
            </div>

            {enrollError && (
              <Text
                type="danger"
                style={{ fontSize: 13, marginTop: 10, display: "block" }}
              >
                {enrollError}
              </Text>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            onClick={step === "preview" ? () => setStep("input") : handleClose}
            disabled={enrolling || previewing}
            style={{
              padding: "0 20px",
              height: 40,
              borderRadius: 10,
              border: "1.5px solid #E5E7EB",
              background: "white",
              color: "#6B7280",
              fontSize: 14,
              fontWeight: 600,
              cursor: enrolling || previewing ? "not-allowed" : "pointer",
              fontFamily: "'Poppins', sans-serif",
              opacity: enrolling || previewing ? 0.6 : 1,
            }}
          >
            {step === "preview" ? "Quay lại" : "Hủy"}
          </button>
          <button
            onClick={step === "preview" ? handleSubmit : isQuickJoin ? handlePreview : handleSubmit}
            disabled={enrolling || previewing}
            style={{
              padding: "0 22px",
              height: 40,
              borderRadius: 10,
              border: "none",
              background: BRAND_GRADIENT,
              color: "white",
              fontSize: 14,
              fontWeight: 600,
              cursor: enrolling || previewing ? "not-allowed" : "pointer",
              fontFamily: "'Poppins', sans-serif",
              boxShadow: "0 2px 8px rgba(29,169,230,0.3)",
              display: "flex",
              alignItems: "center",
              gap: 6,
              opacity: enrolling || previewing ? 0.8 : 1,
            }}
          >
            {previewing ? (
              <>
                <Spin size="small" />
                Đang kiểm tra...
              </>
            ) : enrolling ? (
              <>
                <Spin size="small" />
                Đang tham gia...
              </>
            ) : step === "preview" ? (
              "Xác nhận tham gia"
            ) : isQuickJoin ? (
              "Kiểm tra mã"
            ) : (
              "Xác nhận"
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default EnrollModal;
