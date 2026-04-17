import React from "react";
import { Modal, Form, Input, Switch, Button, Space, Typography } from "antd";
import { Department } from "@/services/features/admin/adminSlice";

const { Text } = Typography;

interface DepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: DepartmentFormData) => void;
  initialData?: Department;
  isLoading?: boolean;
}

export interface DepartmentFormData {
  departmentCode: string;
  departmentName: string;
  description: string;
  isActive: boolean;
}

const DepartmentModal: React.FC<DepartmentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading = false,
}) => {
  const [form] = Form.useForm<DepartmentFormData>();

  const handleFinish = (values: DepartmentFormData) => {
    onSubmit(values);
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title={initialData ? "Chỉnh sửa khoa" : "Tạo khoa mới"}
      open={isOpen}
      onCancel={handleCancel}
      footer={null}
      centered
      width={560}
      destroyOnClose
      loading={isLoading}
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
          departmentCode: initialData?.departmentCode || "",
          departmentName: initialData?.departmentName || "",
          description: initialData?.description || "",
          isActive: initialData?.isActive ?? true,
        }}
      >
        {!initialData && (
          <Form.Item
            name="departmentCode"
            label={<Text strong>Mã khoa</Text>}
            rules={[
              { required: true, message: "Mã khoa không được để trống" },
              { min: 2, max: 20, message: "Mã khoa từ 2 – 20 ký tự" },
            ]}
          >
            <Input placeholder="VD: SE" />
          </Form.Item>
        )}

        {initialData && (
          <Form.Item name="departmentCode" label={<Text strong>Mã khoa</Text>}>
            <Input disabled />
          </Form.Item>
        )}

        <Form.Item
          name="departmentName"
          label={<Text strong>Tên khoa</Text>}
          rules={[
            { required: true, message: "Tên khoa không được để trống" },
            { min: 2, max: 100, message: "Tên khoa từ 2 – 100 ký tự" },
          ]}
        >
          <Input placeholder="VD: Software Engineering" />
        </Form.Item>

        <Form.Item name="description" label={<Text strong>Mô tả</Text>}>
          <Input.TextArea placeholder="Nhập mô tả khoa..." rows={4} />
        </Form.Item>

        {initialData && (
          <Form.Item
            name="isActive"
            label={<Text strong>Hoạt động</Text>}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        )}

        <Form.Item className="!mb-0">
          <Space className="w-full justify-end pt-2">
            <Button onClick={handleCancel} disabled={isLoading}>
              Hủy
            </Button>
            <Button type="primary" htmlType="submit" loading={isLoading}>
              {isLoading
                ? "Đang lưu..."
                : initialData
                  ? "Lưu thay đổi"
                  : "Tạo khoa"}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default DepartmentModal;
