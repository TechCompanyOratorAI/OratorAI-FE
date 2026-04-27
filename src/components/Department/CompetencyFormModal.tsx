import React from "react";
import { Form, Input, Modal, Switch } from "antd";
import type { FormInstance } from "antd/es/form";

interface CompetencyFormModalProps {
  open: boolean;
  loading: boolean;
  form: FormInstance;
  onCancel: () => void;
  onSubmit: () => void;
}

const CompetencyFormModal: React.FC<CompetencyFormModalProps> = ({
  open,
  loading,
  form,
  onCancel,
  onSubmit,
}) => {
  return (
    <Modal
      title="Tạo năng lực mới"
      open={open}
      onCancel={onCancel}
      onOk={onSubmit}
      confirmLoading={loading}
      okText="Tạo mới"
      cancelText="Hủy"
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="competencyCode"
          label="Mã năng lực"
          rules={[
            { required: true, message: "Vui lòng nhập mã năng lực." },
            { max: 60, message: "Mã năng lực không quá 60 ký tự." },
          ]}
        >
          <Input placeholder="Ví dụ: NODEJS_BACKEND" />
        </Form.Item>

        <Form.Item
          name="competencyName"
          label="Tên năng lực"
          rules={[
            { required: true, message: "Vui lòng nhập tên năng lực." },
            { max: 150, message: "Tên năng lực không quá 150 ký tự." },
          ]}
        >
          <Input placeholder="Ví dụ: Node.js Backend" />
        </Form.Item>

        <Form.Item
          name="description"
          label="Mô tả"
          rules={[{ max: 500, message: "Mô tả không quá 500 ký tự." }]}
        >
          <Input.TextArea
            rows={4}
            placeholder="Ví dụ: Thiết kế API, auth, service layer"
          />
        </Form.Item>

        <Form.Item
          name="isActive"
          label="Kích hoạt"
          valuePropName="checked"
          initialValue
        >
          <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CompetencyFormModal;
