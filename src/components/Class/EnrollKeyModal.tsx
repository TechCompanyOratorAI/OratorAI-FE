import React, { useState } from "react";
import {
  Modal,
  Form,
  DatePicker,
  InputNumber,
  Typography,
  Tag,
  Button,
  Tooltip,
} from "antd";
import { CopyOutlined, CheckCircleOutlined, KeyOutlined } from "@ant-design/icons";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { KeyRound } from "lucide-react";

const { Text } = Typography;

interface EnrollKeyModalProps {
  isOpen: boolean;
  classData: { classId: number; classCode: string; className: string } | null;
  /** Nếu lớp đã có key active, truyền vào đây — modal sẽ hiện key thay vì form tạo */
  existingKey?: { keyId?: number; keyValue: string } | null;
  onClose: () => void;
  onSubmit: (data: { expiresAt?: Dayjs; maxUses?: number }) => Promise<void>;
  onRevoke?: (keyId: number) => Promise<void>;
  onRotate?: (keyId: number) => Promise<void>;
  isLoading: boolean;
}

const EnrollKeyModal: React.FC<EnrollKeyModalProps> = ({
  isOpen,
  classData,
  existingKey,
  onClose,
  onSubmit,
  onRevoke,
  onRotate,
  isLoading,
}) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleClose = () => {
    form.resetFields();
    setCopied(false);
    onClose();
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      await onSubmit({
        expiresAt: values.expiresAt || undefined,
        maxUses: values.maxUses || undefined,
      });
      form.resetFields();
    } catch {
      // validation error shown automatically
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopy = () => {
    if (!existingKey?.keyValue) return;
    navigator.clipboard.writeText(existingKey.keyValue).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // ── Lớp đã có key: hiển thị key, không có form tạo ───────────────────────
  if (existingKey?.keyValue) {
    return (
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <KeyOutlined style={{ color: "#D97706", fontSize: 18 }} />
            <span>Mã đăng ký — {classData?.classCode ?? ""}</span>
          </div>
        }
        open={isOpen}
        onCancel={handleClose}
        footer={null}
        width={440}
        styles={{ content: { borderRadius: 14 } }}
      >
        <div style={{ textAlign: "center", padding: "20px 0 8px" }}>
          <p style={{ color: "#6B7280", marginBottom: 16, fontSize: 14 }}>
            Lớp học này đã có mã đăng ký đang hoạt động.
            <br />
            Chia sẻ mã sau cho sinh viên để tham gia lớp:
          </p>

          {/* Key chip */}
          <div
            style={{
              background: "linear-gradient(135deg, #EFF6FF 0%, #EEF2FF 100%)",
              border: "2px solid #BFDBFE",
              borderRadius: 14,
              padding: "18px 24px",
              marginBottom: 20,
              display: "inline-flex",
              alignItems: "center",
              gap: 12,
              cursor: "pointer",
            }}
            onClick={handleCopy}
          >
            <span
              style={{
                fontFamily: "'Courier New', monospace",
                fontSize: 24,
                fontWeight: 800,
                letterSpacing: 3,
                color: "#1D4ED8",
                userSelect: "all",
              }}
            >
              {existingKey.keyValue}
            </span>
            <Tooltip title="Sao chép">
              {copied ? (
                <CheckCircleOutlined style={{ color: "#059669", fontSize: 18 }} />
              ) : (
                <CopyOutlined style={{ color: "#6B7280", fontSize: 18 }} />
              )}
            </Tooltip>
          </div>

          {/* Copy button */}
          <div>
            <Button
              icon={
                copied ? (
                  <CheckCircleOutlined style={{ color: "#059669" }} />
                ) : (
                  <CopyOutlined />
                )
              }
              onClick={handleCopy}
              size="large"
              style={{
                borderRadius: 10,
                fontWeight: 600,
                background: copied
                  ? "#D1FAE5"
                  : "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)",
                color: copied ? "#059669" : "white",
                border: "none",
                padding: "0 32px",
                height: 44,
                transition: "all 0.2s",
              }}
            >
              {copied ? "Đã sao chép!" : "Sao chép mã"}
            </Button>
          </div>

          <div className="mt-3 flex items-center justify-center gap-2">
            <Button
              onClick={async () => {
                if (!existingKey?.keyId || !onRotate) return;
                setSubmitting(true);
                try {
                  await onRotate(existingKey.keyId);
                } finally {
                  setSubmitting(false);
                }
              }}
              loading={submitting || isLoading}
              disabled={!existingKey?.keyId || !onRotate}
            >
              Đổi key
            </Button>
            <Button
              danger
              onClick={async () => {
                if (!existingKey?.keyId || !onRevoke) return;
                setSubmitting(true);
                try {
                  await onRevoke(existingKey.keyId);
                } finally {
                  setSubmitting(false);
                }
              }}
              loading={submitting || isLoading}
              disabled={!existingKey?.keyId || !onRevoke}
            >
              Thu hồi key
            </Button>
            <Button onClick={handleClose} style={{ borderRadius: 8 }}>
              Đóng
            </Button>
          </div>

          <p style={{ color: "#9CA3AF", fontSize: 11, marginTop: 12 }}>
            Sinh viên nhập mã này tại Dashboard hoặc mục "Lớp của tôi" để tham gia.
          </p>
        </div>
      </Modal>
    );
  }

  // ── Chưa có key: hiển thị form tạo mã ────────────────────────────────────
  return (
    <Modal
      title={`Tạo mã vào lớp học — ${classData?.classCode ?? ""}`}
      open={isOpen}
      onOk={handleSubmit}
      onCancel={handleClose}
      okText="Tạo mã"
      cancelText="Hủy"
      confirmLoading={submitting || isLoading}
    >
      <Form form={form} layout="vertical" className="mt-4">
        {/* Auto-generated key notice */}
        <div
          style={{
            background: "#F0F9FF",
            border: "1px solid #BAE6FD",
            borderRadius: 10,
            padding: "10px 14px",
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <KeyRound style={{ width: 16, height: 16, color: "#0EA5E9", flexShrink: 0 }} />
          <div>
            <Text style={{ fontSize: 13, color: "#0369A1", display: "block", fontWeight: 600 }}>
              Mã được tạo tự động
            </Text>
            <Text style={{ fontSize: 12, color: "#0369A1" }}>
              Hệ thống sẽ sinh mã có định dạng{" "}
              <Tag
                style={{
                  fontFamily: "monospace",
                  fontWeight: 700,
                  fontSize: 11,
                  background: "#E0F2FE",
                  border: "1px solid #BAE6FD",
                  color: "#0369A1",
                }}
              >
                ORA-XXXX-XXXX-XXXX
              </Tag>{" "}
              duy nhất toàn hệ thống.
            </Text>
          </div>
        </div>

        <Form.Item label="Ngày hết hạn" name="expiresAt">
          <DatePicker
            showTime
            format="YYYY-MM-DD HH:mm"
            className="w-full"
            disabledDate={(d) => d && d.isBefore(dayjs(), "day")}
            placeholder="Không giới hạn"
          />
        </Form.Item>
        <Form.Item
          label="Số lượng sử dụng tối đa"
          name="maxUses"
          rules={[{ type: "number", min: 1, max: 35, message: "Tối đa 35 lần sử dụng cho mỗi lớp học" }]}
        >
          <InputNumber min={1} className="w-full" placeholder="Tối đa 35 lần sử dụng cho mỗi lớp học" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default EnrollKeyModal;
