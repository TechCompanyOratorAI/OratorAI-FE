import React, { useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  AutoComplete,
  DatePicker,
  Button,
  Space,
  Typography,
} from "antd";
import dayjs, { Dayjs } from "dayjs";
import { CourseData } from "@/services/features/course/courseSlice";

const { Text } = Typography;

type CourseDateCompatible = CourseData & {
  start_date?: string;
  end_date?: string;
};

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
  academicYear: string;
  dateRange: [Dayjs, Dayjs];
}

const resolveDateRange = (course?: CourseDateCompatible) => {
  if (!course) return undefined;

  const rawStart = course.startDate;
  const rawEnd = course.endDate;
  const fallbackStart = course.start_date;
  const fallbackEnd = course.end_date;

  const start = dayjs((rawStart ?? fallbackStart) as string | undefined);
  const end = dayjs((rawEnd ?? fallbackEnd) as string | undefined);

  if (!start.isValid() || !end.isValid()) return undefined;
  return [start, end] as [Dayjs, Dayjs];
};

const CourseModal: React.FC<CourseModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading = false,
  departments = [],
}) => {
  const [form] = Form.useForm<CourseFormData>();

  useEffect(() => {
    if (!isOpen) return;

    form.setFieldsValue({
      courseCode: initialData?.courseCode || "",
      courseName: initialData?.courseName || "",
      departmentId: initialData?.departmentId || departments[0]?.departmentId,
      description: initialData?.description || "",
      semester: initialData?.semester || "",
      academicYear: String(initialData?.academicYear || dayjs().year()),
      dateRange: resolveDateRange(initialData),
    });
  }, [isOpen, initialData, departments, form]);

  const handleFinish = (values: CourseFormData) => {
    onSubmit({
      courseCode: values.courseCode,
      courseName: values.courseName,
      departmentId: values.departmentId,
      description: values.description,
      semester: values.semester,
      academicYear: Number(values.academicYear),
      startDate: values.dateRange[0].format("YYYY-MM-DD"),
      endDate: values.dateRange[1].format("YYYY-MM-DD"),
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
      title={initialData ? "Chỉnh sửa môn học" : "Tạo môn học mới"}
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
        requiredMark={(label, { required }) =>
          required ? (
            <>
              {label} <span style={{ color: "#ff4d4f" }}>*</span>
            </>
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
          courseCode: initialData?.courseCode || "",
          courseName: initialData?.courseName || "",
          departmentId:
            initialData?.departmentId || departments[0]?.departmentId,
          description: initialData?.description || "",
          semester: initialData?.semester || "",
          academicYear: String(initialData?.academicYear || dayjs().year()),
          dateRange: resolveDateRange(initialData),
        }}
      >
        <Form.Item
          name="courseName"
          label={<Text strong>Tên môn học</Text>}
          rules={[
            { required: true, message: "Tên môn học không được để trống" },
            { min: 2, max: 200, message: "Tên môn học từ 2 – 200 ký tự" },
          ]}
        >
          <Input placeholder="VD: Software Engineering Fundamentals" />
        </Form.Item>

        <Form.Item
          name="departmentId"
          label={<Text strong>Chuyên ngành</Text>}
          rules={[{ required: true, message: "Vui lòng chọn chuyên ngành" }]}
        >
          <Select
            placeholder="Chọn chuyên ngành..."
            options={departmentOptions}
            showSearch
            optionFilterProp="label"
            filterOption={(input, option) =>
              (option?.label ?? "")
                .toString()
                .toLowerCase()
                .includes(input.toLowerCase())
            }
            listHeight={160}
            disabled={departments.length === 0}
          />
        </Form.Item>

        <Form.Item
          name="courseCode"
          label={<Text strong>Mã môn học</Text>}
          rules={[
            { required: true, message: "Mã môn học không được để trống" },
            { min: 2, max: 20, message: "Mã môn học từ 2 – 20 ký tự" },
          ]}
        >
          <Input placeholder="VD: PRJ301" />
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
            dependencies={["dateRange"]}
            rules={[
              { required: true, message: "Năm học không được để trống" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const year = Number(value);
                  if (!value || Number.isNaN(year)) {
                    return Promise.reject(
                      new Error("Năm học phải là số hợp lệ"),
                    );
                  }
                  if (year < 2000 || year > 2100) {
                    return Promise.reject(new Error("Năm học từ 2000 – 2100"));
                  }

                  const dateRange = getFieldValue("dateRange") as
                    | [Dayjs, Dayjs]
                    | undefined;
                  if (!value || !dateRange?.[0]) return Promise.resolve();

                  if (year !== dateRange[0].year()) {
                    return Promise.reject(
                      new Error("Năm học phải trùng với năm của ngày bắt đầu"),
                    );
                  }

                  return Promise.resolve();
                },
              }),
            ]}
          >
            <AutoComplete
              placeholder="Chọn năm học"
              filterOption={(inputValue, option) =>
                (option?.value ?? "")
                  .toString()
                  .toLowerCase()
                  .includes(inputValue.toLowerCase())
              }
              options={[
                { value: 2026, label: "2026" },
                { value: 2027, label: "2027" },
                { value: 2028, label: "2028" },
              ]}
            />
          </Form.Item>
        </div>

        <Form.Item
          name="dateRange"
          label={<Text strong>Thời gian môn học</Text>}
          rules={[{ required: true, message: "Vui lòng chọn khoảng thời gian" }]}
        >
          <DatePicker.RangePicker
            className="w-full"
            style={{ maxWidth: 420 }}
            format="YYYY-MM-DD"
          />
        </Form.Item>

        <Form.Item
          name="description"
          label={<Text strong>Mô tả</Text>}
          rules={[{ required: true, message: "Mô tả không được để trống" }]}
        >
          <Input.TextArea placeholder="Nhập mô tả môn học..." rows={3} />
        </Form.Item>

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
                  : "Tạo môn học"}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CourseModal;
