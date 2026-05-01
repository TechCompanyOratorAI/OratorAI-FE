import React, { useEffect, useState } from "react";
import { Button, DatePicker, Input, InputNumber, Modal } from "antd";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { CreateTopicData } from "@/services/features/topic/topicSlice";

const { TextArea } = Input;
const RequiredStar = () => <span className="text-red-500">*</span>;

interface UpdateTopicFormData {
  topicName: string;
  description: string;
  submissionStartDate: string;
  submissionDeadline: string;
  minGroups: number;
  maxGroups: number;
  maxDurationMinutes: number;
  requirements: string;
}

interface TopicUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (topicData: Partial<CreateTopicData>) => void;
  isLoading?: boolean;
  title?: string;
  submitText?: string;
  initialData?: Partial<CreateTopicData>;
  classEndDate?: string;
}

const defaultForm: UpdateTopicFormData = {
  topicName: "",
  description: "",
  submissionStartDate: "",
  submissionDeadline: "",
  minGroups: 1,
  maxGroups: 3,
  maxDurationMinutes: 20,
  requirements: "",
};

const toISO = (val: string | undefined) => {
  if (!val) return "";
  try {
    if (val.includes("Z") || val.includes("+")) return val;
    return new Date(val).toISOString();
  } catch {
    return "";
  }
};

const TopicUpdateModal: React.FC<TopicUpdateModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  title = "Sửa chủ đề",
  submitText = "Lưu thay đổi",
  initialData,
  classEndDate,
}) => {
  const [formData, setFormData] = useState<UpdateTopicFormData>(defaultForm);
  const [errors, setErrors] = useState<
    Partial<Record<keyof UpdateTopicFormData, string>>
  >({});

  useEffect(() => {
    if (!isOpen) {
      setFormData(defaultForm);
      setErrors({});
      return;
    }

    if (initialData) {
      setFormData({
        topicName: initialData.topicName ?? "",
        description: initialData.description ?? "",
        submissionStartDate: toISO(initialData.submissionStartDate),
        submissionDeadline: toISO(initialData.submissionDeadline),
        minGroups: initialData.minGroups ?? 1,
        maxGroups: initialData.maxGroups ?? 3,
        maxDurationMinutes: initialData.maxDurationMinutes ?? 20,
        requirements: initialData.requirements ?? "",
      });
      setErrors({});
    }
  }, [isOpen, initialData]);

  const updateField = <K extends keyof UpdateTopicFormData>(
    key: K,
    value: UpdateTopicFormData[K],
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const classEnd = classEndDate ? new Date(classEndDate) : null;

  const disabledDate = (current: Dayjs): boolean => {
    if (current < dayjs().startOf("day")) return true;
    if (classEnd && current > dayjs(classEnd).endOf("day")) return true;
    return false;
  };

  const validateForm = () => {
    const newErrors: Partial<Record<keyof UpdateTopicFormData, string>> = {};
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    if (!formData.topicName.trim()) {
      newErrors.topicName = "Tên chủ đề không được để trống";
    }
    if (!formData.description.trim()) {
      newErrors.description = "Mô tả không được để trống";
    }
    if (!formData.submissionStartDate) {
      newErrors.submissionStartDate = "Ngày bắt đầu nộp không được để trống";
    } else if (new Date(formData.submissionStartDate) < now) {
      newErrors.submissionStartDate = "Ngày bắt đầu không được là ngày trong quá khứ";
    } else if (classEnd && new Date(formData.submissionStartDate) > classEnd) {
      newErrors.submissionStartDate = `Ngày bắt đầu không được vượt quá ngày kết thúc lớp (${classEnd.toLocaleDateString("vi-VN")})`;
    }
    if (!formData.submissionDeadline) {
      newErrors.submissionDeadline = "Hạn nộp không được để trống";
    } else if (new Date(formData.submissionDeadline) < now) {
      newErrors.submissionDeadline = "Hạn nộp không được là ngày trong quá khứ";
    } else if (classEnd && new Date(formData.submissionDeadline) > classEnd) {
      newErrors.submissionDeadline = `Hạn nộp không được vượt quá ngày kết thúc lớp (${classEnd.toLocaleDateString("vi-VN")})`;
    }
    if (
      formData.submissionStartDate &&
      formData.submissionDeadline &&
      new Date(formData.submissionDeadline) <=
        new Date(formData.submissionStartDate)
    ) {
      newErrors.submissionDeadline = "Hạn nộp phải sau ngày bắt đầu";
    }
    if ((formData.minGroups ?? 0) <= 0) {
      newErrors.minGroups = "Số nhóm tối thiểu phải lớn hơn 0";
    }
    if ((formData.maxGroups ?? 0) < (formData.minGroups ?? 0)) {
      newErrors.maxGroups = "Số nhóm tối đa phải ≥ số nhóm tối thiểu";
    }
    if (formData.maxDurationMinutes <= 0) {
      newErrors.maxDurationMinutes = "Thời lượng phải lớn hơn 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    onSubmit({
      topicName: formData.topicName,
      description: formData.description,
      submissionStartDate: toISO(formData.submissionStartDate),
      submissionDeadline: toISO(formData.submissionDeadline),
      minGroups: formData.minGroups,
      maxGroups: formData.maxGroups,
      maxDurationMinutes: formData.maxDurationMinutes,
      requirements: formData.requirements || undefined,
    });
  };

  const startDateValue = formData.submissionStartDate
    ? dayjs(formData.submissionStartDate)
    : null;
  const deadlineValue = formData.submissionDeadline
    ? dayjs(formData.submissionDeadline)
    : null;

  return (
    <Modal
      open={isOpen}
      title={title}
      onCancel={onClose}
      width={760}
      destroyOnHidden
      maskClosable={!isLoading}
      footer={[
        <Button key="cancel" onClick={onClose} disabled={isLoading}>
          Hủy
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={isLoading}
          onClick={handleSubmit}
        >
          {submitText}
        </Button>,
      ]}
    >
      <div className="space-y-4 pt-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Tên chủ đề <RequiredStar />
          </label>
          <Input
            value={formData.topicName}
            onChange={(e) => updateField("topicName", e.target.value)}
            placeholder="VD: Agile và Scrum nâng cao"
            status={errors.topicName ? "error" : undefined}
          />
          {errors.topicName && (
            <p className="mt-1 text-sm text-red-600">{errors.topicName}</p>
          )}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Mô tả <RequiredStar />
          </label>
          <TextArea
            rows={3}
            value={formData.description}
            onChange={(e) => updateField("description", e.target.value)}
            placeholder="Nhập mô tả chủ đề..."
            status={errors.description ? "error" : undefined}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description}</p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Ngày bắt đầu nộp <RequiredStar />
            </label>
            <DatePicker
              showTime={{ format: "HH:mm" }}
              format="YYYY-MM-DD HH:mm"
              className="w-full"
              value={
                startDateValue && startDateValue.isValid()
                  ? startDateValue
                  : null
              }
              onChange={(value: Dayjs | null) =>
                updateField(
                  "submissionStartDate",
                  value ? value.toISOString() : "",
                )
              }
              disabledDate={disabledDate}
              status={errors.submissionStartDate ? "error" : undefined}
            />
            {errors.submissionStartDate && (
              <p className="mt-1 text-sm text-red-600">
                {errors.submissionStartDate}
              </p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Hạn nộp <RequiredStar />
            </label>
            <DatePicker
              showTime={{ format: "HH:mm" }}
              format="YYYY-MM-DD HH:mm"
              className="w-full"
              value={
                deadlineValue && deadlineValue.isValid() ? deadlineValue : null
              }
              onChange={(value: Dayjs | null) =>
                updateField(
                  "submissionDeadline",
                  value ? value.toISOString() : "",
                )
              }
              disabledDate={disabledDate}
              status={errors.submissionDeadline ? "error" : undefined}
            />
            {errors.submissionDeadline && (
              <p className="mt-1 text-sm text-red-600">
                {errors.submissionDeadline}
              </p>
            )}
          </div>
        </div>
        {classEnd && (
          <p className="text-xs text-gray-400 -mt-2">
            Giới hạn theo ngày kết thúc lớp học:{" "}
            <span className="font-medium">
              {dayjs(classEnd).format("DD/MM/YYYY")}
            </span>
          </p>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Số nhóm tối thiểu <RequiredStar />
            </label>
            <InputNumber
              className="w-full"
              min={1}
              value={formData.minGroups}
              onChange={(value) => updateField("minGroups", Number(value || 1))}
              status={errors.minGroups ? "error" : undefined}
            />
            {errors.minGroups && (
              <p className="mt-1 text-sm text-red-600">{errors.minGroups}</p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Số nhóm tối đa <RequiredStar />
            </label>
            <InputNumber
              className="w-full"
              min={1}
              value={formData.maxGroups}
              onChange={(value) => updateField("maxGroups", Number(value || 1))}
              status={errors.maxGroups ? "error" : undefined}
            />
            {errors.maxGroups && (
              <p className="mt-1 text-sm text-red-600">{errors.maxGroups}</p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Thời lượng tối đa (phút) <RequiredStar />
            </label>
            <InputNumber
              className="w-full"
              min={1}
              value={formData.maxDurationMinutes}
              onChange={(value) =>
                updateField("maxDurationMinutes", Number(value || 0))
              }
              status={errors.maxDurationMinutes ? "error" : undefined}
            />
            {errors.maxDurationMinutes && (
              <p className="mt-1 text-sm text-red-600">
                {errors.maxDurationMinutes}
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Yêu cầu (tùy chọn)
          </label>
          <TextArea
            rows={4}
            value={formData.requirements}
            onChange={(e) => updateField("requirements", e.target.value)}
            placeholder="Nhập yêu cầu (mỗi dòng một ý)..."
          />
          <p className="mt-1 text-xs text-gray-500">
            Nhập yêu cầu, mỗi dòng một ý.
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default TopicUpdateModal;
