import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import Button from "@/components/yoodli/Button";
import { CreateTopicData } from "@/services/features/topic/topicSlice";

export interface TopicClassOption {
  classId: number;
  className: string;
  classCode?: string;
  endDate?: string; // Thêm trường endDate để kiểm tra lớp hết hạn
}

interface TopicModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    topicData: CreateTopicData,
    meta?: { classId: number },
  ) => void;
  isLoading?: boolean;
  /** When creating from the course page, pick which class receives the new topic */
  classOptions?: TopicClassOption[];
}

const TopicModal: React.FC<TopicModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  classOptions,
}) => {
  const [formData, setFormData] = useState<CreateTopicData>({
    topicName: "",
    description: "",
    sequenceNumber: 1,
    dueDate: "",
    maxDurationMinutes: 20,
    requirements: "",
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof CreateTopicData, string>>
  >({});

  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [classError, setClassError] = useState<string | null>(null);

  // Reset form when modal opens/closes; default class when creating from course page
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        topicName: "",
        description: "",
        sequenceNumber: 1,
        dueDate: "",
        maxDurationMinutes: 20,
        requirements: "",
      });
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
    if (formData.maxDurationMinutes <= 0) {
      newErrors.maxDurationMinutes = "Thời lượng phải lớn hơn 0";
    }
    if (formData.sequenceNumber <= 0) {
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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "sequenceNumber" || name === "maxDurationMinutes"
          ? value === ""
            ? 0
            : parseInt(value, 10)
          : value,
    }));
    // Clear error for this field
    if (errors[name as keyof CreateTopicData]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      // Convert datetime-local format to ISO string
      let dueDateISO = formData.dueDate;
      if (
        formData.dueDate &&
        !formData.dueDate.includes("Z") &&
        !formData.dueDate.includes("+")
      ) {
        // If it's in datetime-local format (YYYY-MM-DDTHH:mm), convert to ISO
        dueDateISO = new Date(formData.dueDate).toISOString();
      }

      const submitData: CreateTopicData = {
        ...formData,
        dueDate: dueDateISO,
        requirements: formData.requirements || undefined,
      };
      if (classOptions?.length && selectedClassId != null) {
        onSubmit(submitData, { classId: selectedClassId });
      } else {
        onSubmit(submitData);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Tạo chủ đề mới</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {classOptions && classOptions.length > 1 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lớp học *
              </label>
              <select
                value={selectedClassId ?? ""}
                onChange={(e) => {
                  const v = e.target.value;
                  setSelectedClassId(v ? parseInt(v, 10) : null);
                  if (classError) setClassError(null);
                }}
                className={`w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 ${classError ? "border-red-500" : "border-gray-300"
                  }`}
              >
                {classOptions.map((c) => (
                  <option key={c.classId} value={c.classId}>
                    {c.classCode ? `${c.classCode} — ` : ""}
                    {c.className}
                  </option>
                ))}
              </select>
              {classError && (
                <p className="text-red-600 text-sm mt-1">{classError}</p>
              )}
            </div>
          )}

          {/* Topic Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tên chủ đề *
            </label>
            <input
              type="text"
              name="topicName"
              value={formData.topicName}
              onChange={handleChange}
              placeholder="VD: Phương pháp phát triển Agile"
              className={`w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 ${errors.topicName ? "border-red-500" : "border-gray-300"
                }`}
            />
            {errors.topicName && (
              <p className="text-red-600 text-sm mt-1">{errors.topicName}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mô tả *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Nhập mô tả chủ đề..."
              rows={4}
              className={`w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none ${errors.description ? "border-red-500" : "border-gray-300"
                }`}
            />
            {errors.description && (
              <p className="text-red-600 text-sm mt-1">{errors.description}</p>
            )}
          </div>

          {/* Sequence Number and Max Duration */}
          <div className="grid grid-cols-2 gap-4">
            {/* Sequence Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Thứ tự *
              </label>
              <input
                type="number"
                name="sequenceNumber"
                value={formData.sequenceNumber || ""}
                onChange={handleChange}
                min="1"
                className={`w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 ${errors.sequenceNumber ? "border-red-500" : "border-gray-300"
                  }`}
              />
              {errors.sequenceNumber && (
                <p className="text-red-600 text-sm mt-1">
                  {errors.sequenceNumber}
                </p>
              )}
            </div>

            {/* Max Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Thời lượng tối đa (phút) *
              </label>
              <input
                type="number"
                name="maxDurationMinutes"
                value={formData.maxDurationMinutes}
                onChange={handleChange}
                min="1"
                className={`w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 ${errors.maxDurationMinutes
                    ? "border-red-500"
                    : "border-gray-300"
                  }`}
              />
              {errors.maxDurationMinutes && (
                <p className="text-red-600 text-sm mt-1">
                  {errors.maxDurationMinutes}
                </p>
              )}
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hạn nộp *
            </label>
            <input
              type="datetime-local"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 ${errors.dueDate ? "border-red-500" : "border-gray-300"
                }`}
            />
            {errors.dueDate && (
              <p className="text-red-600 text-sm mt-1">{errors.dueDate}</p>
            )}
          </div>

          {/* Requirements */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Yêu cầu (tuỳ chọn)
            </label>
            <textarea
              name="requirements"
              value={formData.requirements}
              onChange={handleChange}
              placeholder="Nhập yêu cầu (mỗi dòng một ý)..."
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              Nhập yêu cầu, mỗi dòng một ý (VD: "- Trình bày vai trò trong Scrum")
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200 mt-8">
            <Button
              text="Huỷ"
              variant="secondary"
              fontSize="14px"
              borderRadius="999px"
              paddingWidth="18px"
              paddingHeight="10px"
              onClick={() => onClose()}
            />
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={isLoading}
              className="px-6 py-2 bg-sky-600 text-white rounded-full font-medium hover:bg-sky-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
            >
              {isLoading ? "Đang tạo..." : "Tạo chủ đề"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TopicModal;
