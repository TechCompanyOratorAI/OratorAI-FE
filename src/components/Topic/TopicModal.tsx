import React, { useEffect, useState } from "react";
import { Button, DatePicker, Input, InputNumber, Modal, Select } from "antd";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { CreateTopicData } from "@/services/features/topic/topicSlice";

const { TextArea } = Input;
const RequiredStar = () => <span className="text-red-500">*</span>;

export interface TopicClassOption {
  classId: number;
  className: string;
  classCode?: string;
  endDate?: string;
}

interface TopicModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    topicData: CreateTopicData,
    meta?: { classId: number },
  ) => void;
  isLoading?: boolean;
  classOptions?: TopicClassOption[];
}

const initialFormData: CreateTopicData = {
  topicName: "",
  description: "",
  submissionStartDate: "",
  submissionDeadline: "",
  minGroups: 1,
  maxGroups: 1,
  maxDurationMinutes: 20,
  requirements: "",
};

const TopicModal: React.FC<TopicModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  classOptions,
}) => {
  const [formData, setFormData] = useState<CreateTopicData>(initialFormData);
  const [errors, setErrors] = useState<
    Partial<Record<keyof CreateTopicData, string>>
  >({});
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [classError, setClassError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setFormData(initialFormData);
      setErrors({});
      setSelectedClassId(null);
      setClassError(null);
      return;
    }

    if (classOptions?.length) {
      setSelectedClassId(classOptions[0].classId);
    }
  }, [isOpen, classOptions]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CreateTopicData, string>> = {};

    if (!formData.topicName.trim()) {
      newErrors.topicName = "Tên chủ đề không được để trống";
    }
    if (!formData.description.trim()) {
      newErrors.description = "Mô tả không được để trống";
    }
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const classEnd = selectedClass?.endDate ? new Date(selectedClass.endDate) : null;

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
      new Date(formData.submissionDeadline) <= new Date(formData.submissionStartDate)
    ) {
      newErrors.submissionDeadline = "Hạn nộp phải sau ngày bắt đầu";
    }
    if ((formData.minGroups ?? 0) <= 0) {
      newErrors.minGroups = "Số nhóm tối thiểu phải lớn hơn 0";
    }
    if ((formData.maxGroups ?? 0) < (formData.minGroups ?? 0)) {
      newErrors.maxGroups = "Số nhóm tối đa phải ≥ số nhóm tối thiểu";
    }
    if ((formData.maxDurationMinutes ?? 0) <= 0) {
      newErrors.maxDurationMinutes = "Thời lượng phải lớn hơn 0";
    }

    if (classOptions?.length && selectedClassId == null) {
      setClassError("Chọn lớp để gán chủ đề");
    } else {
      setClassError(null);
    }

    setErrors(newErrors);
    return (
      Object.keys(newErrors).length === 0 &&
      !(classOptions?.length && selectedClassId == null)
    );
  };

  const updateField = <K extends keyof CreateTopicData>(
    key: K,
    value: CreateTopicData[K],
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const toISO = (val: string) => {
    if (!val) return "";
    if (val.includes("Z") || val.includes("+")) return val;
    return new Date(val).toISOString();
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    const submitData: CreateTopicData = {
      ...formData,
      submissionStartDate: toISO(formData.submissionStartDate),
      submissionDeadline: toISO(formData.submissionDeadline),
      requirements: formData.requirements || undefined,
    };

    if (classOptions?.length && selectedClassId != null) {
      onSubmit(submitData, { classId: selectedClassId });
      return;
    }

    onSubmit(submitData);
  };

  const selectedClass = classOptions?.find((c) => c.classId === selectedClassId);
  const classEndDate = selectedClass?.endDate
    ? dayjs(selectedClass.endDate)
    : null;

  const disabledDate = (current: Dayjs): boolean => {
    if (current < dayjs().startOf("day")) return true;
    if (classEndDate && current > classEndDate.endOf("day")) return true;
    return false;
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
      title="Tạo chủ đề mới"
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
          Tạo chủ đề
        </Button>,
      ]}
    >
      <div className="space-y-4 pt-2">
        {classOptions && classOptions.length > 1 && (
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Lớp học <RequiredStar />
            </label>
            <Select
              className="w-full"
              placeholder="Chọn lớp"
              value={selectedClassId ?? undefined}
              onChange={(value) => {
                setSelectedClassId(value);
                if (classError) setClassError(null);
              }}
              options={classOptions.map((c) => ({
                value: c.classId,
                label: `${c.classCode ? `${c.classCode} — ` : ""}${c.className}`,
              }))}
              status={classError ? "error" : undefined}
            />
            {classError && (
              <p className="mt-1 text-sm text-red-600">{classError}</p>
            )}
          </div>
        )}

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Tên chủ đề <RequiredStar />
          </label>
          <Input
            value={formData.topicName}
            onChange={(e) => updateField("topicName", e.target.value)}
            placeholder="VD: Phương pháp phát triển Agile"
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
            rows={4}
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
              value={startDateValue && startDateValue.isValid() ? startDateValue : null}
              onChange={(value: Dayjs | null) =>
                updateField("submissionStartDate", value ? value.toISOString() : "")
              }
              disabledDate={disabledDate}
              status={errors.submissionStartDate ? "error" : undefined}
            />
            {errors.submissionStartDate && (
              <p className="mt-1 text-sm text-red-600">{errors.submissionStartDate}</p>
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
              value={deadlineValue && deadlineValue.isValid() ? deadlineValue : null}
              onChange={(value: Dayjs | null) =>
                updateField("submissionDeadline", value ? value.toISOString() : "")
              }
              disabledDate={disabledDate}
              status={errors.submissionDeadline ? "error" : undefined}
            />
            {errors.submissionDeadline && (
              <p className="mt-1 text-sm text-red-600">{errors.submissionDeadline}</p>
            )}
          </div>
        </div>
        {classEndDate && (
          <p className="text-xs text-gray-400 -mt-2">
            Giới hạn theo ngày kết thúc lớp học:{" "}
            <span className="font-medium">
              {classEndDate.format("DD/MM/YYYY")}
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

export default TopicModal;
