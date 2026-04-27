import React from "react";
import { Form, Input, Modal, Select, Switch } from "antd";
import type { FormInstance } from "antd/es/form";

interface DepartmentOption {
  departmentId: number;
  departmentCode: string;
  departmentName: string;
}

interface SubjectAreaFormModalProps {
  open: boolean;
  isEditing: boolean;
  loading: boolean;
  form: FormInstance;
  departments: DepartmentOption[];
  disableDepartmentSelect: boolean;
  onCancel: () => void;
  onSubmit: () => void;
}

const SubjectAreaFormModal: React.FC<SubjectAreaFormModalProps> = ({
  open,
  isEditing,
  loading,
  form,
  departments,
  disableDepartmentSelect,
  onCancel,
  onSubmit,
}) => {
  return (
    <Modal
      title={isEditing ? "Cập nhật lĩnh vực môn học" : "Tạo lĩnh vực môn học mới"}
      open={open}
      onCancel={onCancel}
      onOk={onSubmit}
      confirmLoading={loading}
      okText={isEditing ? "Cập nhật" : "Tạo mới"}
      cancelText="Hủy"
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="subjectCode"
          label="Mã lĩnh vực"
          rules={[
            { required: true, message: "Vui lòng nhập mã lĩnh vực." },
            { max: 30, message: "Mã lĩnh vực không quá 30 ký tự." },
          ]}
        >
          <Input placeholder="Ví dụ: BACKEND" />
        </Form.Item>

        <Form.Item
          name="subjectName"
          label="Tên lĩnh vực"
          rules={[
            { required: true, message: "Vui lòng nhập tên lĩnh vực." },
            { max: 150, message: "Tên lĩnh vực không quá 150 ký tự." },
          ]}
        >
          <Input placeholder="Ví dụ: Backend Development" />
        </Form.Item>

        <Form.Item name="departmentId" label="Chuyên ngành">
          <Select
            disabled={disableDepartmentSelect}
            allowClear={!disableDepartmentSelect}
            placeholder="Chọn chuyên ngành"
            options={departments.map((department) => ({
              value: department.departmentId,
              label: `${department.departmentCode} - ${department.departmentName}`,
            }))}
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

export default SubjectAreaFormModal;
