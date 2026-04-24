import React, { useState } from "react";
import { Modal, Form, Input, DatePicker, InputNumber } from "antd";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";

interface EnrollKeyModalProps {
  isOpen: boolean;
  classData: { classId: number; classCode: string; className: string } | null;
  onClose: () => void;
  onSubmit: (data: { customKey?: string; expiresAt?: Dayjs; maxUses?: number }) => Promise<void>;
  isLoading: boolean;
}

const EnrollKeyModal: React.FC<EnrollKeyModalProps> = ({
  isOpen,
  classData,
  onClose,
  onSubmit,
  isLoading,
}) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      await onSubmit({
        customKey: values.customKey?.trim() || undefined,
        expiresAt: values.expiresAt || undefined,
        maxUses: values.maxUses || undefined,
      });
      form.resetFields();
      handleClose();
    } catch {
      // validation error shown automatically
    } finally {
      setSubmitting(false);
    }
  };

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
        <Form.Item
          label="Mã vào lớp"
          name="customKey"
          rules={[{ max: 50, message: "Tối đa 50 ký tự" }]}
        >
          <Input.Password placeholder="Nhập mã vào lớp học" />
        </Form.Item>
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
