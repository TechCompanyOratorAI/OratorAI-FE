import React, { useEffect, useState } from "react";
import { Button, DatePicker, Input, InputNumber, Modal, Select } from "antd";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { CreateTopicData } from "@/services/features/topic/topicSlice";

const { TextArea } = Input;

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
  sequenceNumber: 1,
  dueDate: "",
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
    if (!formData.dueDate) {
      newErrors.dueDate = "Hạn nộp không được để trống";
    }
    if ((formData.maxDurationMinutes ?? 0) <= 0) {
      newErrors.maxDurationMinutes = "Thời lượng phải lớn hơn 0";
    }
    if ((formData.sequenceNumber ?? 0) <= 0) {
      newErrors.sequenceNumber = "Thứ tự phải lớn hơn 0";
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

  const handleSubmit = () => {
    if (!validateForm()) return;

    let dueDateISO = formData.dueDate;
    if (
      formData.dueDate &&
      !formData.dueDate.includes("Z") &&
      !formData.dueDate.includes("+")
    ) {
      dueDateISO = new Date(formData.dueDate).toISOString();
    }

    const submitData: CreateTopicData = {
      ...formData,
      dueDate: dueDateISO,
      requirements: formData.requirements || undefined,
    };

    if (classOptions?.length && selectedClassId != null) {
      onSubmit(submitData, { classId: selectedClassId });
      return;
    }

    onSubmit(submitData);
  };

  const dueDateValue = formData.dueDate ? dayjs(formData.dueDate) : null;

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
              Lớp học *
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
            Tên chủ đề *
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
            Mô tả *
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
              Thứ tự *
            </label>
            <InputNumber
              className="w-full"
              min={1}
              value={formData.sequenceNumber}
              onChange={(value) => updateField("sequenceNumber", Number(value || 0))}
              status={errors.sequenceNumber ? "error" : undefined}
            />
            {errors.sequenceNumber && (
              <p className="mt-1 text-sm text-red-600">
                {errors.sequenceNumber}
              </p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Thời lượng tối đa (phút) *
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
            Hạn nộp *
          </label>
          <DatePicker
            showTime={{ format: "HH:mm" }}
            format="YYYY-MM-DD HH:mm"
            className="w-full"
            value={dueDateValue && dueDateValue.isValid() ? dueDateValue : null}
            onChange={(value: Dayjs | null) =>
              updateField("dueDate", value ? value.toISOString() : "")
            }
            status={errors.dueDate ? "error" : undefined}
          />
          {errors.dueDate && (
            <p className="mt-1 text-sm text-red-600">{errors.dueDate}</p>
          )}
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
