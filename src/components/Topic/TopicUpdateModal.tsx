import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import Button from "@/components/yoodli/Button";
import { CreateTopicData } from "@/services/features/topic/topicSlice";

interface UpdateTopicFormData {
  topicName: string;
  maxDurationMinutes: number;
  dueDate: string; // datetime-local string
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
  title = "Edit Topic",
  submitText = "Save Changes",
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

    if (isOpen && initialData) {
      const dueDateValue = initialData.dueDate
        ? (() => {
            try {
              const d = new Date(initialData.dueDate);
              const pad = (n: number) => String(n).padStart(2, "0");
              const yyyy = d.getFullYear();
              const mm = pad(d.getMonth() + 1);
              const dd = pad(d.getDate());
              const hh = pad(d.getHours());
              const min = pad(d.getMinutes());
              return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
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

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof UpdateTopicFormData, string>> = {};

    if (!formData.topicName.trim())
      newErrors.topicName = "Topic name is required";
    if (formData.maxDurationMinutes <= 0)
      newErrors.maxDurationMinutes = "Duration must be greater than 0";
    if (!formData.dueDate) newErrors.dueDate = "Due date is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "maxDurationMinutes"
          ? value === ""
            ? 0
            : parseInt(value, 10)
          : value,
    }));
    if (errors[name as keyof UpdateTopicFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    let dueDateISO = formData.dueDate;
    if (
      formData.dueDate &&
      !formData.dueDate.includes("Z") &&
      !formData.dueDate.includes("+")
    ) {
      dueDateISO = new Date(formData.dueDate).toISOString();
    }

    const submitData: Partial<CreateTopicData> = {
      topicName: formData.topicName,
      maxDurationMinutes: formData.maxDurationMinutes,
      dueDate: dueDateISO,
    };
    onSubmit(submitData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Topic Name *
            </label>
            <input
              type="text"
              name="topicName"
              value={formData.topicName}
              onChange={handleChange}
              placeholder="e.g., Advanced Agile & Scrum"
              className={`w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                errors.topicName ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.topicName && (
              <p className="text-red-600 text-sm mt-1">{errors.topicName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Duration (minutes) *
            </label>
            <input
              type="number"
              name="maxDurationMinutes"
              value={formData.maxDurationMinutes || ""}
              onChange={handleChange}
              min="1"
              className={`w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                errors.maxDurationMinutes ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.maxDurationMinutes && (
              <p className="text-red-600 text-sm mt-1">
                {errors.maxDurationMinutes}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Due Date *
            </label>
            <input
              type="datetime-local"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                errors.dueDate ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.dueDate && (
              <p className="text-red-600 text-sm mt-1">{errors.dueDate}</p>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200 mt-8">
            <Button
              text="Cancel"
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
              {isLoading ? "Processing..." : submitText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TopicUpdateModal;
