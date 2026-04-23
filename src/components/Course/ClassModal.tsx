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
  mode?: "default" | "instructor-edit";
}

interface ClassFormData {
  courseId: number;
  classCode: string;
  dateRange: [Dayjs, Dayjs];
  maxStudents: number;
  status?: "active" | "inactive" | "archived";
  maxGroupMembers?: number | null;
  enrollKey?: string;
  keyExpiresAt?: Dayjs;
  keyMaxUses?: number;
}

const ClassModal: React.FC<ClassModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading = false,
  courses = [],
  mode = "default",
}) => {
  const [form] = Form.useForm<ClassFormData>();
  const [submitting, setSubmitting] = useState(false);
  const isEditMode = !!initialData;
  const isInstructorEditMode = isEditMode && mode === "instructor-edit";
  const initialCourse = initialData?.course;
  const resolvedCourseId =
    initialData?.courseId ?? initialCourse?.courseId ?? undefined;

  const courseOptions = React.useMemo(() => {
    const mappedCourses = courses.map((c) => ({
      value: c.courseId,
      label: `${c.courseCode} – ${c.courseName}`,
    }));

    if (
      resolvedCourseId &&
      initialCourse?.courseName &&
      !mappedCourses.some((c) => c.value === resolvedCourseId)
    ) {
      mappedCourses.unshift({
        value: resolvedCourseId,
        label: `${initialCourse.courseCode || ""}${initialCourse.courseCode ? " – " : ""}${initialCourse.courseName}`,
      });
    }

    return mappedCourses;
  }, [courses, initialCourse, resolvedCourseId]);

  useEffect(() => {
    if (!isOpen) return;
    if (initialData) {
      const keySource =
        initialData.activeKeys?.[0] || initialData.enrollKeys?.[0];
      form.setFieldsValue({
        courseId: resolvedCourseId,
        classCode: initialData.classCode,
        dateRange:
          initialData.startDate && initialData.endDate
            ? [dayjs(initialData.startDate), dayjs(initialData.endDate)]
            : undefined,
        maxStudents: initialData.maxStudents,
        maxGroupMembers: initialData.maxGroupMembers ?? undefined,
        enrollKey: keySource?.keyValue,
        keyExpiresAt: keySource?.expiresAt
          ? dayjs(keySource.expiresAt)
          : undefined,
        keyMaxUses: keySource?.maxUses,
        status: initialData.status || "active",
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        courseId: courses.length > 0 ? courses[0].courseId : undefined,
        maxStudents: 35,
      });
    }
  }, [initialData, isOpen, courses, form, resolvedCourseId]);

  const handleFinish = async (values: ClassFormData) => {
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = isEditMode
        ? isInstructorEditMode
          ? {
            classCode: values.classCode,
            courseId: values.courseId,
            startDate: values.dateRange?.[0]?.format("YYYY-MM-DD"),
            endDate: values.dateRange?.[1]?.format("YYYY-MM-DD"),
            maxStudents: values.maxStudents,
            maxGroupMembers: values.maxGroupMembers ?? null,
          }
          : {
            courseId: values.courseId,
            classCode: values.classCode,
            startDate: values.dateRange[0].format("YYYY-MM-DD"),
            endDate: values.dateRange[1].format("YYYY-MM-DD"),
            maxStudents: values.maxStudents,
            maxGroupMembers: values.maxGroupMembers ?? null,
          }
        : {
          courseId: values.courseId,
          classCode: values.classCode,
          startDate: values.dateRange[0].format("YYYY-MM-DD"),
          endDate: values.dateRange[1].format("YYYY-MM-DD"),
          maxStudents: values.maxStudents,
          status: "active",
        };

      if (isEditMode) {
        const enrollKey = values.enrollKey?.trim();
        if (enrollKey) {
          payload.enrollKey = enrollKey;
        }

        if (values.keyExpiresAt) {
          payload.keyExpiresAt = values.keyExpiresAt.toISOString();
        }

        if (
          typeof values.keyMaxUses === "number" &&
          Number.isInteger(values.keyMaxUses) &&
          values.keyMaxUses > 0
        ) {
          payload.keyMaxUses = values.keyMaxUses;
        }
      }

      onSubmit(payload);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  const courseDisabled = !!initialData || courseOptions.length === 0;

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
        requiredMark={false}
        disabled={submitting || isLoading}
        className="mt-4"
      >
        {isInstructorEditMode && (
          <Text type="secondary" className="text-xs block mb-3">
            Giảng viên chỉ được chỉnh số nhóm tối đa, mã đăng ký, thời hạn mã và số lượt sử dụng.
          </Text>
        )}

        <Form.Item
          name="courseId"
          label={<Text strong>Khóa học</Text>}
          rules={[{ required: true, message: "Vui lòng chọn khóa học" }]}
        >
          <Select
            placeholder="Chọn khóa học..."
            disabled={courseDisabled}
            options={courseOptions}
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
          <Input
            placeholder="VD: SE101-L01"
            disabled={isInstructorEditMode}
          />
        </Form.Item>

        <div
          className={`grid gap-x-4 ${isEditMode ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"}`}
        >
          <Form.Item
            name="maxStudents"
            label={<Text strong>Số sinh viên tối đa</Text>}
            rules={[
              { required: true, message: "Bắt buộc" },
              { type: "number", min: 1, message: "Tối thiểu 1" },
              { type: "number", max: 35, message: "Không được quá 35" },
            ]}
          >
            <InputNumber
              className="w-full"
              min={1}
              max={35}
              step={1}
              changeOnWheel
              disabled={isInstructorEditMode}
            />
          </Form.Item>

          {isEditMode ? (
            <Form.Item
              name="maxGroupMembers"
              label={
                <>
                  <Text strong>Số thành viên tối đa</Text>{" "}
                  <span style={{ color: "#999", fontSize: "12px" }}>
                    (không bắt buộc)
                  </span>
                </>
              }
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
                          "Số thành viên tối đa phải nhỏ hơn Số sinh viên tối đa",
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
          ) : null}
        </div>

        <Form.Item
          name="dateRange"
          label={<Text strong>Thời gian lớp học</Text>}
          rules={[{ required: true, message: "Bắt buộc" }]}
        >
          <DatePicker.RangePicker
            className="w-full"
            style={{ maxWidth: 420 }}
            format="YYYY-MM-DD"
            disabled={isInstructorEditMode}
          />
        </Form.Item>

        {isEditMode && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
              <Form.Item
                name="enrollKey"
                label={<Text strong>Mã đăng ký</Text>}
                rules={[
                  {
                    validator(_, value) {
                      if (!value) return Promise.resolve();
                      const trimmed = String(value).trim();
                      if (trimmed.length < 6 || trimmed.length > 50) {
                        return Promise.reject(
                          new Error("Mã đăng ký phải từ 6-50 ký tự"),
                        );
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <Input placeholder="VD: SE1025" />
              </Form.Item>

              <Form.Item
                name="keyExpiresAt"
                label={<Text strong>Thời hạn mã</Text>}
                dependencies={["dateRange"]}
                rules={[
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const dateRange = getFieldValue("dateRange") as
                        | [Dayjs, Dayjs]
                        | undefined;
                      const startDate = dateRange?.[0];

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
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    const maxStudents = getFieldValue("maxStudents") as
                      | number
                      | undefined;

                    if (value === undefined || value === null || value === "") {
                      return Promise.resolve();
                    }

                    if (!Number.isInteger(Number(value)) || Number(value) <= 0) {
                      return Promise.reject(
                        new Error("Số lần sử dụng tối đa phải là số nguyên dương"),
                      );
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
              <InputNumber className="w-full" min={0} max={35} />
            </Form.Item>
          </>
        )}

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
