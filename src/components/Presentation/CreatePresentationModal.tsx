import React, { useState } from "react";
import { Modal, Form, Input, Button, Typography, Space, Alert } from "antd";
import { CrownOutlined, TeamOutlined } from "@ant-design/icons";

const { Text } = Typography;
const { TextArea } = Input;

interface CreatePresentationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (title: string, description?: string) => Promise<void>;
  groupName?: string;
}

const CreatePresentationModal: React.FC<CreatePresentationModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
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
      await onSubmit(values.title.trim(), values.description?.trim());
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
      title={
        <div>
          <Space className="mb-1">
            <CrownOutlined className="text-amber-500" />
            <Text className="text-xs text-amber-600 font-semibold uppercase tracking-wide">
              Chỉ nhóm trưởng
            </Text>
          </Space>
          <h3 className="!mb-0 block font-semibold text-base">
            Tạo bài thuyết trình
          </h3>
        </div>
      }
      open={isOpen}
      onCancel={handleClose}
      footer={
        <Space className="w-full justify-end">
          <Button onClick={handleClose}>Hủy</Button>
          <Button
            type="primary"
            loading={submitting}
            onClick={handleSubmit}
          >
            Tạo bài thuyết trình
          </Button>
        </Space>
      }
      className="!rounded-2xl"
      centered
      destroyOnClose
    >
      <Form form={form} layout="vertical" className="mt-4">
        <Form.Item
          name="title"
          label={<Text strong>Tiêu đề</Text>}
          rules={[{ required: true, message: "Vui lòng nhập tiêu đề" }]}
        >
          <Input
            placeholder="Nhập tiêu đề bài thuyết trình"
            size="large"
            className="!rounded-xl"
          />
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
            placeholder="Mô tả bài thuyết trình"
            rows={3}
            className="!rounded-xl"
          />
        </Form.Item>
        {groupName && (
          <Alert
            type="info"
            icon={<TeamOutlined />}
            showIcon
            message={
              <span>
                Bài thuyết trình sẽ được tạo cho nhóm:{" "}
                <Text strong>{groupName}</Text>
              </span>
            }
            className="!rounded-xl"
          />
        )}
      </Form>
    </Modal>
  );
};

export default CreatePresentationModal;
