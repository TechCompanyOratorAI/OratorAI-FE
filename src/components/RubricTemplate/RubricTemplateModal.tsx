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
      title={mode === "create" ? "Tạo mẫu rubric" : "Sửa mẫu rubric"}
      open={isOpen}
      onCancel={handleCancel}
      footer={null}
      centered
      width={520}
      destroyOnClose
      maskClosable={!isLoading}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        requiredMark={(label, { required }) =>
          required ? (
            label
          ) : (
            <>
              {label}{" "}
              <span style={{ color: "#999", fontSize: "12px" }}>
                (không bắt buộc)
              </span>
            </>
          )
        }
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
          label={<Text strong>Tên mẫu</Text>}
          rules={[
            { required: true, message: "Tên mẫu không được để trống" },
            { min: 2, max: 200, message: "Tên mẫu từ 2 - 200 ký tự" },
          ]}
        >
          <Input placeholder="VD: Tiêu chí thuyết trình  " />
        </Form.Item>

        <Form.Item
          name="description"
          label={<Text strong>Mô tả</Text>}
          rules={[
            { required: true, message: "Mô tả không được để trống" },
            { min: 2, max: 1000, message: "Mô tả từ 2 - 1000 ký tự" },
          ]}
        >
          <Input.TextArea
            placeholder="Tiêu chí cho bài thuyết trình nhóm"
            rows={3}
          />
        </Form.Item>

        <Form.Item
          name="assignmentType"
          label={<Text strong>Loại bài nộp</Text>}
          rules={[
            { required: true, message: "Loại bài nộp không được để trống" },
          ]}
        >
          <Input placeholder="VD: thuyet-trinh" />
        </Form.Item>

        <Form.Item
          name="isDefault"
          label={<Text strong>Đặt làm mẫu mặc định</Text>}
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Form.Item className="!mb-0">
          <Space className="w-full justify-end pt-2">
            <Button onClick={handleCancel} disabled={isLoading}>
              Hủy
            </Button>
            <Button type="primary" htmlType="submit" loading={isLoading}>
              {isLoading
                ? "Đang lưu..."
                : mode === "create"
                  ? "Tạo"
                  : "Cập nhật"}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default RubricTemplateModal;
