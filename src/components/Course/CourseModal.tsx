import React, { useEffect, useMemo } from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  Checkbox,
  Button,
  Space,
  Typography,
} from "antd";
import { CourseData } from "@/services/features/course/courseSlice";
import dayjs from "dayjs";

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
  subjectAreas?: Array<{
    subjectAreaId: number;
    subjectCode: string;
    subjectName: string;
    departmentId: number | null;
    isActive: boolean;
  }>;
  academicBlocks?: Array<{
    academicBlockId: number;
    blockCode: string;
    term: string;
    half?: string | null;
    blockType: string;
    startDate: string;
    endDate: string;
    isActive: boolean;
    academicYear?: {
      academicYearId: number;
      year: number;
      name: string;
    };
  }>;
}

interface CourseFormData {
  courseCode: string;
  courseName: string;
  departmentId: number;
  subjectAreaId?: number;
  academicBlockIds: number[];
  description: string;
}

const CourseModal: React.FC<CourseModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading = false,
  departments = [],
  subjectAreas = [],
  academicBlocks = [],
}) => {
  const [form] = Form.useForm<CourseFormData>();
  const selectedDepartmentId = Form.useWatch("departmentId", form);
  const defaultDepartmentId = useMemo(
    () => departments[0]?.departmentId,
    [departments],
  );

  const initialAcademicBlockIds = useMemo(
    () =>
      initialData?.academicBlocks?.map((item) => item.academicBlockId) ||
      (initialData?.academicBlockId ? [initialData.academicBlockId] : []),
    [initialData],
  );

  useEffect(() => {
    if (!isOpen) return;

    form.setFieldsValue({
      courseCode: initialData?.courseCode || "",
      courseName: initialData?.courseName || "",
      departmentId: initialData?.departmentId || defaultDepartmentId,
      subjectAreaId: initialData?.subjectAreaId || undefined,
      academicBlockIds: initialAcademicBlockIds,
      description: initialData?.description || "",
    });
  }, [isOpen, initialData, defaultDepartmentId, form, initialAcademicBlockIds]);

  const handleFinish = (values: CourseFormData) => {
    onSubmit({
      courseCode: values.courseCode,
      courseName: values.courseName,
      departmentId: values.departmentId,
      subjectAreaId: values.subjectAreaId,
      academicBlockIds: values.academicBlockIds,
      description: values.description,
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

  const subjectAreaOptions = subjectAreas
    .filter(
      (item) =>
        item.isActive &&
        (!selectedDepartmentId || item.departmentId === selectedDepartmentId),
    )
    .map((item) => ({
      value: item.subjectAreaId,
      label: `${item.subjectCode} – ${item.subjectName}`,
    }));

  const formatAcademicBlockLabel = (block: {
    blockCode?: string;
    term: string;
    half?: string | null;
    blockType: string;
    academicYear?: { year: number };
  }) => {
    if (block.blockCode) {
      return block.blockCode;
    }
    const year = block.academicYear?.year;
    const suffix = block.blockType === "BLOCK3" ? "BLOCK3" : block.half || "H1";
    if (year) {
      return `${year}-${block.term}-${suffix}`;
    }
    return `${block.term}-${suffix}`;
  };

  const academicBlockOptions = academicBlocks
    .filter((item) => item.isActive)
    .map((item) => ({
      value: item.academicBlockId,
      label: formatAcademicBlockLabel(item),
      startDate: item.startDate,
      endDate: item.endDate,
      term: item.term,
      sortHalf:
        item.blockType === "BLOCK3"
          ? 3
          : item.half === "H1"
            ? 1
            : item.half === "H2"
              ? 2
              : 4,
    }));

  const groupedAcademicBlockOptions = academicBlockOptions.reduce(
    (acc, option) => {
      if (!acc[option.term]) {
        acc[option.term] = [];
      }
      acc[option.term].push(option);
      return acc;
    },
    {} as Record<
      string,
      Array<{
        value: number;
        label: string;
        startDate: string;
        endDate: string;
        term: string;
        sortHalf: number;
      }>
    >,
  );

  const termOrder = ["SPRING", "SUMMER", "FALL"];
  const sortedTerms = Object.keys(groupedAcademicBlockOptions).sort((a, b) => {
    const idxA = termOrder.indexOf(a);
    const idxB = termOrder.indexOf(b);
    if (idxA === -1 && idxB === -1) return a.localeCompare(b);
    if (idxA === -1) return 1;
    if (idxB === -1) return -1;
    return idxA - idxB;
  });

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
          subjectAreaId: initialData?.subjectAreaId || undefined,
          academicBlockIds: initialAcademicBlockIds,
          description: initialData?.description || "",
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
            onChange={() => {
              form.setFieldValue("subjectAreaId", undefined);
            }}
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
          name="subjectAreaId"
          label={<Text strong>Lĩnh vực môn học</Text>}
          rules={[
            { required: true, message: "Vui lòng chọn lĩnh vực môn học" },
          ]}
        >
          <Select
            placeholder="Chọn lĩnh vực môn học..."
            options={subjectAreaOptions}
            showSearch
            optionFilterProp="label"
            filterOption={(input, option) =>
              (option?.label ?? "")
                .toString()
                .toLowerCase()
                .includes(input.toLowerCase())
            }
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

        <Form.Item
          name="academicBlockIds"
          label={<Text strong>Kỳ học (Academic Blocks)</Text>}
          rules={[{ required: true, message: "Vui lòng chọn ít nhất một kỳ học" }]}
        >
          <Checkbox.Group className="w-full">
            <div className="max-h-56 overflow-y-auto border border-gray-200 rounded-lg p-3 grid grid-cols-1 md:grid-cols-3 gap-4">
              {sortedTerms.map((term) => {
                const options = [...groupedAcademicBlockOptions[term]].sort(
                  (a, b) => a.sortHalf - b.sortHalf,
                );
                return (
                  <div key={term}>
                    <p className="text-xs font-semibold text-gray-500 mb-1">{term}</p>
                    <div className="flex flex-col gap-1">
                      {options.map((option) => (
                        <Checkbox
                          key={option.value}
                          value={option.value}
                          disabled={dayjs(option.startDate).isBefore(dayjs(), "day")}
                        >
                          {option.label}
                        </Checkbox>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </Checkbox.Group>
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
