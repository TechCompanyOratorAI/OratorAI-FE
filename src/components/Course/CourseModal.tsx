import React from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  DatePicker,
  Button,
  Space,
  Typography,
  
} from "antd";
import dayjs, { Dayjs } from "dayjs";
import { CourseData } from "@/services/features/course/courseSlice";

const { Text } = Typography;

interface CourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (courseData: Record<string, unknown>) => void;
  initialData?: CourseData;
  isLoading?: boolean;
  departments?: Array<{
    departmentId: number;
    departmentCode: string;
    departmentName: string;
  }>;
}

interface CourseFormData {
  courseCode: string;
  courseName: string;
  departmentId: number;
  description: string;
  semester: string;
  academicYear: number;
  startDate: Dayjs;
  endDate: Dayjs;
}

const CourseModal: React.FC<CourseModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading = false,
  departments = [],
}) => {
  const [form] = Form.useForm<CourseFormData>();

  const handleFinish = (values: CourseFormData) => {
    onSubmit({
      courseCode: values.courseCode,
      courseName: values.courseName,
      departmentId: values.departmentId,
      description: values.description,
      semester: values.semester,
      academicYear: values.academicYear,
      startDate: values.startDate.format("YYYY-MM-DD"),
      endDate: values.endDate.format("YYYY-MM-DD"),
    });
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  const departmentOptions = departments.map((d) => ({
    value: d.departmentId,
    label: `${d.departmentCode} – ${d.departmentName}`,
  }));

  const semesterOptions = [
    { value: "Fall ", label: "Fall " },
    { value: "Spring ", label: "Spring " },
    { value: "Summer ", label: "Summer " },
  ];

  return (
    <Modal
      title={initialData ? "Chỉnh sửa khóa học" : "Tạo khóa học mới"}
      open={isOpen}
      onCancel={handleCancel}
      footer={null}
      centered
      width={640}
      destroyOnClose
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
          courseCode: initialData?.courseCode || "",
          courseName: initialData?.courseName || "",
          departmentId:
            initialData?.departmentId || departments[0]?.departmentId,
          description: initialData?.description || "",
          semester: initialData?.semester || "",
          academicYear: initialData?.academicYear || dayjs().year(),
          startDate: initialData?.startDate
            ? dayjs(initialData.startDate)
            : undefined,
          endDate: initialData?.endDate
            ? dayjs(initialData.endDate)
            : undefined,
        }}
      >
        <Form.Item
          name="courseCode"
          label={<Text strong>Mã khóa học</Text>}
          rules={[
            { required: true, message: "Mã khóa học không được để trống" },
            { min: 2, max: 20, message: "Mã khóa học từ 2 – 20 ký tự" },
          ]}
        >
          <Input placeholder="VD: SE101" />
        </Form.Item>

        <Form.Item
          name="departmentId"
          label={<Text strong>Khoa</Text>}
          rules={[{ required: true, message: "Vui lòng chọn khoa" }]}
        >
          <Select
            placeholder="Chọn khoa..."
            options={departmentOptions}
            disabled={departments.length === 0}
          />
        </Form.Item>

        <Form.Item
          name="courseName"
          label={<Text strong>Tên khóa học</Text>}
          rules={[
            { required: true, message: "Tên khóa học không được để trống" },
            { min: 2, max: 200, message: "Tên khóa học từ 2 – 200 ký tự" },
          ]}
        >
          <Input placeholder="VD: Software Engineering Fundamentals" />
        </Form.Item>

        <Form.Item
          name="description"
          label={<Text strong>Mô tả</Text>}
          rules={[{ required: true, message: "Mô tả không được để trống" }]}
        >
          <Input.TextArea placeholder="Nhập mô tả khóa học..." rows={3} />
        </Form.Item>

        <div className="grid grid-cols-2 gap-x-4">
          <Form.Item
            name="semester"
            label={<Text strong>Học kỳ</Text>}
            rules={[{ required: true, message: "Vui lòng chọn học kỳ" }]}
          >
            <Select placeholder="Chọn học kỳ..." options={semesterOptions} />
          </Form.Item>

          <Form.Item
            name="academicYear"
            label={<Text strong>Năm học</Text>}
            dependencies={["startDate"]}
            rules={[
              { required: true, message: "Năm học không được để trống" },
              {
                type: "number",
                min: 2000,
                max: 2100,
                message: "Năm học từ 2000 – 2100",
              },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const startDate = getFieldValue("startDate") as
                    | Dayjs
                    | undefined;
                  if (!value || !startDate) return Promise.resolve();

                  if (Number(value) !== startDate.year()) {
                    return Promise.reject(
                      new Error("Năm học phải trùng với năm của ngày bắt đầu"),
                    );
                  }

                  return Promise.resolve();
                },
              }),
            ]}
          >
            <InputNumber className="w-full" min={2000} max={2100} />
          </Form.Item>
        </div>

        <div className="grid grid-cols-2 gap-x-4">
          <Form.Item
            name="startDate"
            label={<Text strong>Ngày bắt đầu</Text>}
            rules={[{ required: true, message: "Vui lòng chọn ngày bắt đầu" }]}
          >
            <DatePicker className="w-full" format="YYYY-MM-DD" />
          </Form.Item>

          <Form.Item
            name="endDate"
            label={<Text strong>Ngày kết thúc</Text>}
            dependencies={["startDate"]}
            rules={[
              { required: true, message: "Vui lòng chọn ngày kết thúc" },
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
                  : "Tạo khóa học"}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CourseModal;
