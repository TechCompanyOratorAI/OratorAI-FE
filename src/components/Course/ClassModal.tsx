import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Space,
  Typography,
  Button,
} from "antd";
import dayjs, { Dayjs } from "dayjs";
import { ClassData } from "@/services/features/admin/classSlice";

const { Text } = Typography;

interface ClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (classData: Record<string, unknown>) => void;
  initialData?: ClassData;
  isLoading?: boolean;
  courses?: Array<{ courseId: number; courseCode: string; courseName: string }>;
}

interface ClassFormData {
  courseId: number;
  classCode: string;
  startDate: Dayjs;
  endDate: Dayjs;
  maxStudents: number;
  maxGroupMembers: number | null;
  enrollKey: string;
  keyExpiresAt: Dayjs;
  keyMaxUses: number;
}

const ClassModal: React.FC<ClassModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading = false,
  courses = [],
}) => {
  const [form] = Form.useForm<ClassFormData>();
  const [submitting, setSubmitting] = useState(false);

  // 填充初始数据
  useEffect(() => {
    if (!isOpen) return;
    if (initialData) {
      const keySource =
        initialData.activeKeys?.[0] || initialData.enrollKeys?.[0];
      form.setFieldsValue({
        courseId: initialData.courseId,
        classCode: initialData.classCode,
        startDate: initialData.startDate
          ? dayjs(initialData.startDate)
          : undefined,
        endDate: initialData.endDate ? dayjs(initialData.endDate) : undefined,
        maxStudents: initialData.maxStudents,
        maxGroupMembers: initialData.maxGroupMembers ?? undefined,
        enrollKey: keySource?.keyValue || "",
        keyExpiresAt: keySource?.expiresAt
          ? dayjs(keySource.expiresAt)
          : undefined,
        keyMaxUses: keySource?.maxUses || 1,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        courseId: courses.length > 0 ? courses[0].courseId : undefined,
        maxStudents: 35,
        maxGroupMembers: undefined,
        keyMaxUses: 1,
      });
    }
  }, [initialData, isOpen, courses, form]);

  const handleFinish = async (values: ClassFormData) => {
    setSubmitting(true);
    try {
      const payload = {
        courseId: values.courseId,
        classCode: values.classCode,
        startDate: values.startDate.format("YYYY-MM-DD"),
        endDate: values.endDate.format("YYYY-MM-DD"),
        maxStudents: values.maxStudents,
        maxGroupMembers: values.maxGroupMembers ?? null,
        enrollKey: values.enrollKey,
        keyExpiresAt: values.keyExpiresAt.toISOString(),
        keyMaxUses: values.keyMaxUses ?? 1,
      };
      onSubmit(payload);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  const courseDisabled = !!initialData || courses.length === 0;

  return (
    <Modal
      title={initialData ? "Chỉnh sửa lớp học" : "Tạo lớp học mới"}
      open={isOpen}
      onCancel={handleCancel}
      footer={null}
      centered
      width={560}
      destroyOnHidden
      maskClosable={!(submitting || isLoading)}
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
        disabled={submitting || isLoading}
        className="mt-4"
      >
        <Form.Item
          name="courseId"
          label={<Text strong>Khóa học</Text>}
          rules={[{ required: true, message: "Vui lòng chọn khóa học" }]}
        >
          <Select
            placeholder="Chọn khóa học..."
            disabled={courseDisabled}
            options={courses.map((c) => ({
              value: c.courseId,
              label: `${c.courseCode} – ${c.courseName}`,
            }))}
          />
        </Form.Item>

        {courseDisabled && (
          <Text type="secondary" className="text-xs block mb-3 -mt-2">
            Không thể đổi khóa học khi đang chỉnh sửa lớp.
          </Text>
        )}

        <Form.Item
          name="classCode"
          label={<Text strong>Mã lớp</Text>}
          rules={[
            { required: true, message: "Mã lớp không được để trống" },
            {
              min: 2,
              max: 50,
              message: "Mã lớp từ 2 – 50 ký tự",
            },
          ]}
        >
          <Input placeholder="VD: SE101-L01" />
        </Form.Item>

        <div className="grid grid-cols-2 gap-x-4">
          <Form.Item
            name="maxStudents"
            label={<Text strong>Số sinh viên tối đa</Text>}
            rules={[
              { required: true, message: "Bắt buộc" },
              { type: "number", min: 1, message: "Tối thiểu 1" },
              { type: "number", max: 1000, message: "Tối đa 1000" },
            ]}
          >
            <InputNumber className="w-full" min={1} max={1000} />
          </Form.Item>

          <Form.Item
            name="maxGroupMembers"
            label={<Text strong>Số nhóm tối đa</Text>}
            dependencies={["maxStudents"]}
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const maxStudents = getFieldValue("maxStudents") as
                    | number
                    | undefined;

                  if (value === undefined || value === null || value === "") {
                    return Promise.resolve();
                  }

                  if (maxStudents && Number(value) >= Number(maxStudents)) {
                    return Promise.reject(
                      new Error(
                        "Số nhóm tối đa phải nhỏ hơn Số sinh viên tối đa",
                      ),
                    );
                  }

                  return Promise.resolve();
                },
              }),
            ]}
          >
            <InputNumber
              className="w-full"
              min={1}
              placeholder="Không giới hạn"
            />
          </Form.Item>
        </div>

        <div className="grid grid-cols-2 gap-x-4">
          <Form.Item
            name="startDate"
            label={<Text strong>Ngày bắt đầu</Text>}
            rules={[{ required: true, message: "Bắt buộc" }]}
          >
            <DatePicker className="w-full" format="YYYY-MM-DD" />
          </Form.Item>

          <Form.Item
            name="endDate"
            label={<Text strong>Ngày kết thúc</Text>}
            dependencies={["startDate"]}
            rules={[
              { required: true, message: "Bắt buộc" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const start = getFieldValue("startDate");
                  if (!value) return Promise.resolve();
                  if (start && value.isBefore(start)) {
                    return Promise.reject(
                      new Error("Ngày kết thúc phải sau ngày bắt đầu"),
                    );
                  }
                  return Promise.resolve();
                },
              }),
            ]}
          >
            <DatePicker className="w-full" format="YYYY-MM-DD" />
          </Form.Item>
        </div>

        <div className="grid grid-cols-2 gap-x-4">
          <Form.Item
            name="enrollKey"
            label={<Text strong>Mã đăng ký</Text>}
            rules={[
              { required: true, message: "Bắt buộc" },
              { min: 6, message: "Tối thiểu 6 ký tự" },
              { max: 50, message: "Tối đa 50 ký tự" },
            ]}
          >
            <Input placeholder="VD: SE1025" />
          </Form.Item>

          <Form.Item
            name="keyExpiresAt"
            label={<Text strong>Thời hạn mã</Text>}
            dependencies={["startDate"]}
            rules={[
              { required: true, message: "Bắt buộc" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const startDate = getFieldValue("startDate") as
                    | Dayjs
                    | undefined;

                  if (!value || !startDate) return Promise.resolve();

                  if (value.isBefore(startDate, "day")) {
                    return Promise.reject(
                      new Error(
                        "Thời hạn mã phải bằng hoặc sau ngày bắt đầu lớp",
                      ),
                    );
                  }

                  return Promise.resolve();
                },
              }),
            ]}
          >
            <DatePicker
              className="w-full"
              format="YYYY-MM-DD HH:mm"
              showTime={{ format: "HH:mm" }}
            />
          </Form.Item>
        </div>

        <Form.Item
          name="keyMaxUses"
          label={<Text strong>Số lượt sử dụng mã</Text>}
          dependencies={["maxStudents"]}
          rules={[
            { required: true, message: "Bắt buộc" },
            { type: "number", min: 1, message: "Tối thiểu 1" },
            ({ getFieldValue }) => ({
              validator(_, value) {
                const maxStudents = getFieldValue("maxStudents") as
                  | number
                  | undefined;

                if (value === undefined || value === null || value === "") {
                  return Promise.resolve();
                }

                if (maxStudents && Number(value) > Number(maxStudents)) {
                  return Promise.reject(
                    new Error(
                      "Số lượt sử dụng mã không được lớn hơn Số sinh viên tối đa",
                    ),
                  );
                }

                return Promise.resolve();
              },
            }),
          ]}
        >
          <InputNumber className="w-full" min={1} max={10000} />
        </Form.Item>

        <Form.Item className="!mb-0">
          <Space className="w-full justify-end pt-2">
            <Button
              onClick={handleCancel}
              disabled={submitting || isLoading}
              className="!rounded-full"
            >
              Hủy
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={submitting || isLoading}
              className="!rounded-full"
            >
              {submitting || isLoading ? "Đang lưu..." : "Lưu lớp học"}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ClassModal;
