import React from "react";
import { Modal, Form, Input, Switch, Button, Space, Typography } from "antd";
import { RubricTemplatePayload } from "@/services/features/admin/rubricTempleSlice";

const { Text } = Typography;

interface RubricTemplateModalProps {
  isOpen: boolean;
  mode: "create" | "edit";
  initialData?: RubricTemplatePayload;
  isLoading?: boolean;
  onClose: () => void;
  onSubmit: (payload: RubricTemplatePayload) => void;
}

const RubricTemplateModal: React.FC<RubricTemplateModalProps> = ({
  isOpen,
  mode,
  initialData,
  isLoading = false,
  onClose,
  onSubmit,
}) => {
  const [form] = Form.useForm();

  const handleFinish = (values: any) => {
    onSubmit({
      templateName: values.templateName,
      description: values.description,
      assignmentType: values.assignmentType,
      isDefault: values.isDefault ?? false,
    });
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title={mode === "create" ? "Create Rubric Template" : "Edit Rubric Template"}
      open={isOpen}
      onCancel={handleCancel}
      footer={null}
      centered
      width={520}
      destroyOnClose
      loading={isLoading}
      maskClosable={!isLoading}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        requiredMark="optional"
        disabled={isLoading}
        className="mt-4"
        initialValues={{
          templateName: initialData?.templateName || "",
          description: initialData?.description || "",
          assignmentType: initialData?.assignmentType || "presentation",
          isDefault: initialData?.isDefault ?? false,
        }}
      >
        <Form.Item
          name="templateName"
          label={<Text strong>Template Name</Text>}
          rules={[
            { required: true, message: "Template name is required" },
            { min: 2, max: 200, message: "Template name từ 2 – 200 ký tự" },
          ]}
        >
          <Input placeholder="VD: Presentation Rubric v1" />
        </Form.Item>

        <Form.Item
          name="description"
          label={<Text strong>Description</Text>}
          rules={[
            { required: true, message: "Description is required" },
            { min: 2, max: 1000, message: "Description từ 2 – 1000 ký tự" },
          ]}
        >
          <Input.TextArea
            placeholder="Rubric for group presentations"
            rows={3}
          />
        </Form.Item>

        <Form.Item
          name="assignmentType"
          label={<Text strong>Assignment Type</Text>}
          rules={[
            { required: true, message: "Assignment type is required" },
          ]}
        >
          <Input placeholder="VD: presentation" />
        </Form.Item>

        <Form.Item
          name="isDefault"
          label={<Text strong>Set as default template</Text>}
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Form.Item className="!mb-0">
          <Space className="w-full justify-end pt-2">
            <Button onClick={handleCancel} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={isLoading}
            >
              {isLoading ? "Saving..." : mode === "create" ? "Create" : "Update"}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default RubricTemplateModal;
