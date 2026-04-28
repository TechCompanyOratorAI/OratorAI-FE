import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Checkbox,
  DatePicker,
  Space,
  Typography,
  Button,
} from "antd";
import { Dayjs } from "dayjs";
import { ClassData } from "@/services/features/admin/classSlice";

const { Text } = Typography;

interface ClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (classData: Record<string, unknown>) => void;
  initialData?: ClassData;
  isLoading?: boolean;
  courses?: Array<{
    courseId: number;
    courseCode: string;
    courseName: string;
    academicBlocks?: Array<{ academicBlockId: number }>;
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
  mode?: "default" | "instructor-edit";
}

interface ClassFormData {
  courseId: number;
  classCode: string;
  academicBlockIds?: number[];
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
  academicBlocks = [],
  mode = "default",
}) => {
  const [form] = Form.useForm<ClassFormData>();
  const [submitting, setSubmitting] = useState(false);
  const selectedCourseId = Form.useWatch("courseId", form);
  const isEditMode = !!initialData;
  const isInstructorEditMode = isEditMode && mode === "instructor-edit";
  const initialCourse = initialData?.course;
  const resolvedCourseId =
    initialData?.courseId ?? initialCourse?.courseId ?? undefined;
  const currentKeyUsedCount =
    initialData?.activeKeys?.[0]?.usedCount ?? initialData?.enrollKeys?.[0]?.usedCount;

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
      const initialAcademicBlockIds =
        (initialData as any)?.academicBlockIds ||
        (Array.isArray((initialData as any)?.course?.academicBlocks)
          ? (initialData as any).course.academicBlocks.map(
              (block: { academicBlockId: number }) => block.academicBlockId,
            )
          : []) ||
        (typeof (initialData as any)?.academicBlockId === "number"
          ? [(initialData as any).academicBlockId]
          : []);
      form.setFieldsValue({
        courseId: resolvedCourseId,
        classCode: initialData.classCode,
        academicBlockIds: initialAcademicBlockIds,
        maxStudents: initialData.maxStudents,
        maxGroupMembers: initialData.maxGroupMembers ?? undefined,
        status: initialData.status || "active",
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        courseId: courses.length > 0 ? courses[0].courseId : undefined,
        academicBlockIds: [],
        maxStudents: 35,
      });
    }
  }, [initialData, isOpen, courses, form, resolvedCourseId, academicBlocks]);

  const handleFinish = async (values: ClassFormData) => {
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = isEditMode
        ? isInstructorEditMode
          ? {
            classCode: initialData?.classCode || values.classCode,
            startDate: initialData?.startDate,
            endDate: initialData?.endDate,
            maxStudents: initialData?.maxStudents,
            academicBlockIds:
              values.academicBlockIds ||
              ((initialData as any)?.academicBlockIds as number[]) ||
              [],
            maxGroupMembers: values.maxGroupMembers ?? null,
          }
          : {
            courseId: values.courseId,
            classCode: values.classCode,
            academicBlockIds: values.academicBlockIds || [],
            maxStudents: values.maxStudents,
            maxGroupMembers: values.maxGroupMembers ?? null,
          }
        : {
          courseId: values.courseId,
          classCode: values.classCode,
          academicBlockIds: values.academicBlockIds || [],
          maxStudents: values.maxStudents,
          status: "active",
        };

      if (isEditMode && !isInstructorEditMode) {
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
  const activeAcademicBlockOptions = academicBlocks
    .filter((item) => item.isActive)
    .map((item) => ({
      value: item.academicBlockId,
      label:
        item.blockCode ||
        `${item.academicYear?.year || ""}-${item.term}-${item.blockType === "BLOCK3" ? "BLOCK3" : item.half || "H1"}`,
      blockType: item.blockType,
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
  const selectedCourse = courses.find(
    (course) => course.courseId === (selectedCourseId ?? resolvedCourseId),
  );
  const fallbackCourseBlocks = Array.isArray((initialData as any)?.course?.academicBlocks)
    ? ((initialData as any).course.academicBlocks as Array<{
        academicBlockId: number;
        blockCode?: string;
        term?: string;
        half?: string | null;
        blockType?: string;
        startDate?: string;
        endDate?: string;
      }>).map((block) => ({
        value: block.academicBlockId,
        label:
          block.blockCode ||
          `${block.term || ""}-${block.blockType === "BLOCK3" ? "BLOCK3" : block.half || "H1"}`,
        blockType: block.blockType,
        startDate: block.startDate,
        endDate: block.endDate,
        term: block.term || "OTHER",
        sortHalf:
          block.blockType === "BLOCK3"
            ? 3
            : block.half === "H1"
              ? 1
              : block.half === "H2"
                ? 2
                : 4,
      }))
    : [];
  const allowedCourseBlockIds = new Set(
    (selectedCourse?.academicBlocks || []).map((block) => block.academicBlockId),
  );
  const scopedAcademicBlockOptionsBase =
    allowedCourseBlockIds.size > 0
      ? activeAcademicBlockOptions.filter((option) =>
          allowedCourseBlockIds.has(option.value),
        )
      : activeAcademicBlockOptions;
  const scopedAcademicBlockOptions =
    scopedAcademicBlockOptionsBase.length > 0
      ? scopedAcademicBlockOptionsBase
      : fallbackCourseBlocks;
  const groupedAcademicBlockOptions = scopedAcademicBlockOptions.reduce(
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
        blockType?: string;
        startDate?: string;
        endDate?: string;
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
  const now = Date.now();
  const isWithinBlock3 = scopedAcademicBlockOptions.some((option) => {
    if (option.blockType !== "BLOCK3" || !option.startDate || !option.endDate) return false;
    const startMs = new Date(option.startDate).getTime();
    const endMs = new Date(option.endDate).getTime();
    return now >= startMs && now <= endMs;
  });
  const summerBlocks = scopedAcademicBlockOptions.filter((option) => option.term === "SUMMER");
  const summerEndMs = summerBlocks
    .map((option) => (option.endDate ? new Date(option.endDate).getTime() : NaN))
    .filter((value) => Number.isFinite(value))
    .reduce<number | null>((max, value) => (max === null || value > max ? value : max), null);

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
        requiredMark={
          isInstructorEditMode
            ? false
            : (label, { required }) => (
              <>
                {label}
                {required ? <span style={{ color: "#ff4d4f", marginLeft: 4 }}>*</span> : null}
              </>
            )
        }
        disabled={submitting || isLoading}
        className="mt-4"
      >
        {isInstructorEditMode && (
          <Text type="secondary" className="text-xs block mb-3">
            Giảng viên chỉ được chỉnh số nhóm tối đa.
          </Text>
        )}

        {!isInstructorEditMode && (
          <Form.Item
            name="courseId"
            label={<Text strong>Môn học</Text>}
            rules={[{ required: true, message: "Vui lòng chọn môn học" }]}
          >
            <Select
              placeholder="Chọn môn học..."
              disabled={courseDisabled}
              showSearch
              optionFilterProp="label"
              filterOption={(input, option) =>
                String(option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              options={courseOptions}
            />
          </Form.Item>
        )}

        {(isEditMode || !isInstructorEditMode) && (
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
                            disabled={(() => {
                              const isExpired = option.endDate
                                ? new Date(option.endDate).getTime() < now
                                : false;
                              const shouldLockFallUntilSummerEnds =
                                option.term === "FALL" &&
                                summerEndMs !== null &&
                                now < summerEndMs &&
                                !isWithinBlock3;
                              return isExpired || shouldLockFallUntilSummerEnds;
                            })()}
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
        )}

        {courseDisabled && !isInstructorEditMode && (
          <Text type="secondary" className="text-xs block mb-3 -mt-2">
            Không thể đổi môn học khi đang chỉnh sửa lớp.
          </Text>
        )}

        {!isInstructorEditMode && (
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
            <Input placeholder="VD: SE101-L01" disabled={isInstructorEditMode} />
          </Form.Item>
        )}

        <div className={`grid gap-x-4 ${isInstructorEditMode ? "grid-cols-1" : isEditMode ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"}`}>
          {!isInstructorEditMode && (
            <Form.Item
              name="maxStudents"
              label={<Text strong>Số sinh viên tối đa</Text>}
              rules={[
                { required: true, message: "Bắt buộc" },
                { type: "number", min: 1, message: "Tối thiểu 1" },
                { type: "number", max: 200, message: "Không được quá 200" },
              ]}
            >
              <InputNumber
                className="w-full"
                min={1}
                max={200}
                step={1}
                changeOnWheel
                disabled={isInstructorEditMode}
              />
            </Form.Item>
          )}

          {isEditMode ? (
            <Form.Item
              name="maxGroupMembers"
              label={
                <>
                  <Text strong>Số nhóm tối đa</Text>
                </>
              }
              rules={[
                () => ({
                  validator(_, value) {
                    const maxStudents = initialData?.maxStudents;

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
                placeholder="Tối đa 35 nhóm"
              />
            </Form.Item>
          ) : null}
        </div>

        {isEditMode && !isInstructorEditMode && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
              <Form.Item
                name="enrollKey"
                label={
                  <>
                    <Text strong>Mã đăng ký</Text>{" "}
                    <span style={{ color: "#999", fontSize: "12px" }}>(không bắt buộc)</span>
                  </>
                }
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
                <Input.Password placeholder="VD: SE1025" />
              </Form.Item>

              <Form.Item
                name="keyExpiresAt"
                label={
                  <>
                    <Text strong>Thời hạn mã</Text>{" "}
                    <span style={{ color: "#999", fontSize: "12px" }}>(không bắt buộc)</span>
                  </>
                }
                rules={[
                  () => ({
                    validator() {
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
              label={
                <>
                  <Text strong>Số lượt sử dụng mã</Text>{" "}
                  <span style={{ color: "#999", fontSize: "12px" }}>(không bắt buộc)</span>
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
            {typeof currentKeyUsedCount === "number" && (
              <Text type="secondary" className="text-xs -mt-1 block">
                Đã dùng: {currentKeyUsedCount} lượt
              </Text>
            )}
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
