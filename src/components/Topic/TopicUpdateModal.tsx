import React, { useEffect, useState } from "react";
import { Button, DatePicker, Input, InputNumber, Modal } from "antd";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { CreateTopicData } from "@/services/features/topic/topicSlice";

interface UpdateTopicFormData {
  topicName: string;
  maxDurationMinutes: number;
  dueDate: string;
}

interface TopicUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (topicData: Partial<CreateTopicData>) => void;
  isLoading?: boolean;
  title?: string;
  submitText?: string;
  initialData?: Partial<CreateTopicData>;
}

const TopicUpdateModal: React.FC<TopicUpdateModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  title = "Sửa chủ đề",
  submitText = "Lưu thay đổi",
  initialData,
}) => {
  const [formData, setFormData] = useState<UpdateTopicFormData>({
    topicName: "",
    maxDurationMinutes: 20,
    dueDate: "",
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof UpdateTopicFormData, string>>
  >({});

  useEffect(() => {
    if (!isOpen) {
      setFormData({ topicName: "", maxDurationMinutes: 20, dueDate: "" });
      setErrors({});
      return;
    }

    if (initialData) {
      const dueDateValue = initialData.dueDate
        ? (() => {
            try {
              return new Date(initialData.dueDate).toISOString();
            } catch {
              return "";
            }
          })()
        : "";

      setFormData({
        topicName: initialData.topicName ?? "",
        maxDurationMinutes: initialData.maxDurationMinutes ?? 20,
        dueDate: dueDateValue,
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

  const validateForm = () => {
    const newErrors: Partial<Record<keyof UpdateTopicFormData, string>> = {};

    if (!formData.topicName.trim()) {
      newErrors.topicName = "Tên chủ đề không được để trống";
    }
    if (formData.maxDurationMinutes <= 0) {
      newErrors.maxDurationMinutes = "Thời lượng phải lớn hơn 0";
    }
    if (!formData.dueDate) {
      newErrors.dueDate = "Hạn nộp không được để trống";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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

    onSubmit({
      topicName: formData.topicName,
      maxDurationMinutes: formData.maxDurationMinutes,
      dueDate: dueDateISO,
    });
  };

  const dueDateValue = formData.dueDate ? dayjs(formData.dueDate) : null;

  return (
    <Modal
      open={isOpen}
      title={title}
      onCancel={onClose}
      width={620}
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
            Tên chủ đề *
          </label>
          <Input
            value={formData.topicName}
            onChange={(e) => updateField("topicName", e.target.value)}
            placeholder="VD: Agile va Scrum nang cao"
            status={errors.topicName ? "error" : undefined}
          />
          {errors.topicName && (
            <p className="mt-1 text-sm text-red-600">{errors.topicName}</p>
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
      </div>
    </Modal>
  );
};

export default TopicUpdateModal;
