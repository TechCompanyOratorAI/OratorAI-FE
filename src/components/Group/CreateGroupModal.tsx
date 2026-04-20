import React, { useState } from "react";
import { Modal, Form, Input, Button, Typography, Space } from "antd";

const { Text } = Typography;
const { TextArea } = Input;

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (groupName: string, description?: string) => Promise<void>;
  isLoading: boolean;
  groupName?: string;
}

const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  groupName,
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
      await onSubmit(values.groupName.trim(), values.description?.trim());
      form.resetFields();
      handleClose();
    } catch (err: unknown) {
      // form validation error shown automatically
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={
        <div>
          <Text strong className="text-base block">
            Tạo nhóm mới
          </Text>
          <Text type="secondary" className="text-sm font-normal">
            Nhóm của bạn sẽ tham gia lớp này
          </Text>
        </div>
      }
      open={isOpen}
      onCancel={handleClose}
      footer={
        <Space className="w-full justify-end">
          <Button className="!rounded-xl" onClick={handleClose}>
            Hủy
          </Button>
          <Button
            type="primary"
            className="!rounded-xl"
            loading={submitting || isLoading}
            onClick={handleSubmit}
          >
            Tạo nhóm
          </Button>
        </Space>
      }
      className="!rounded-2xl"
      centered
      destroyOnClose
    >
      <Form form={form} layout="vertical" className="mt-4">
        <Form.Item
          name="groupName"
          label={<Text strong>Tên nhóm</Text>}
          rules={[{ required: true, message: "Vui lòng nhập tên nhóm" }]}
          initialValue={groupName}
        >
          <Input placeholder="Nhập tên nhóm" size="large" className="!rounded-xl" />
        </Form.Item>
        <Form.Item
          name="description"
          label={
            <span>
              <Text strong>Mô tả</Text>{" "}
              <Text type="secondary">(tùy chọn)</Text>
            </span>
          }
        >
          <TextArea
            placeholder="Mô tả nhóm..."
            rows={3}
            className="!rounded-xl"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CreateGroupModal;
