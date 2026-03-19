import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import Button from "@/components/yoodli/Button";
import { RubricCriteriaPayload } from "@/services/features/rubric/rubricSilce";

interface RubricFormState {
  criteriaName: string;
  criteriaDescription: string;
  weight: string;
  maxScore: string;
  displayOrder: string;
  evaluationGuide: string;
}

interface RubricModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rubricData: RubricCriteriaPayload) => void;
  isLoading?: boolean;
  mode?: "create" | "edit";
  initialData?: Partial<RubricCriteriaPayload>;
  defaultDisplayOrder?: number;
}

const RubricModal: React.FC<RubricModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  mode = "create",
  initialData,
  defaultDisplayOrder = 1,
}) => {
  const [formData, setFormData] = useState<RubricFormState>({
    criteriaName: "",
    criteriaDescription: "",
    weight: "1",
    maxScore: "10",
    displayOrder: String(defaultDisplayOrder),
    evaluationGuide: "",
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof RubricCriteriaPayload, string>>
  >({});

  useEffect(() => {
    if (!isOpen) {
      setErrors({});
      return;
    }

    setFormData({
      criteriaName: initialData?.criteriaName ?? "",
      criteriaDescription: initialData?.criteriaDescription ?? "",
      weight: String(Number(initialData?.weight ?? 1)),
      maxScore: String(Number(initialData?.maxScore ?? 10)),
      displayOrder: String(
        Number(initialData?.displayOrder ?? defaultDisplayOrder),
      ),
      evaluationGuide: initialData?.evaluationGuide ?? "",
    });
    setErrors({});
  }, [isOpen, initialData, defaultDisplayOrder]);

  const normalizeNumberValue = (
    field: "persen" | "maxScore" | "displayOrder",
    raw: string,
  ) => {
    if (raw.trim() === "") {
      setFormData((prev) => ({ ...prev, [field]: "" }));
      return;
    }

    const parsed = Number(raw);
    if (Number.isNaN(parsed)) return;

    if (field === "displayOrder") {
      setFormData((prev) => ({ ...prev, [field]: String(Math.trunc(parsed)) }));
      return;
    }

    setFormData((prev) => ({ ...prev, [field]: String(parsed) }));
  };

  const validateForm = () => {
    const newErrors: Partial<Record<keyof RubricCriteriaPayload, string>> = {};
    const weight = Number(formData.weight);
    const maxScore = Number(formData.maxScore);
    const displayOrder = Number(formData.displayOrder);

    if (!formData.criteriaName.trim()) {
      newErrors.criteriaName = "Criteria name is required";
    }
    if (!Number.isFinite(weight) || weight <= 0) {
      newErrors.weight = "Weight must be greater than 0";
    }
    if (!Number.isFinite(maxScore) || maxScore <= 0) {
      newErrors.maxScore = "Max score must be greater than 0";
    }
    if (!Number.isFinite(displayOrder) || displayOrder <= 0) {
      newErrors.displayOrder = "Display order must be greater than 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "persen" || name === "maxScore" || name === "displayOrder"
          ? value
          : value,
    }));

    if (errors[name as keyof RubricCriteriaPayload]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    onSubmit({
      criteriaName: formData.criteriaName.trim(),
      criteriaDescription: formData.criteriaDescription.trim(),
      weight: Number(formData.weight),
      maxScore: Number(formData.maxScore),
      displayOrder: Math.trunc(Number(formData.displayOrder)),
      evaluationGuide: formData.evaluationGuide.trim(),
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {mode === "create"
              ? "Create Rubric Criteria"
              : "Edit Rubric Criteria"}
          </h2>
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
              Criteria Name *
            </label>
            <input
              name="criteriaName"
              value={formData.criteriaName}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                errors.criteriaName ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.criteriaName && (
              <p className="text-red-600 text-sm mt-1">{errors.criteriaName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="criteriaDescription"
              value={formData.criteriaDescription}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Persen *
              </label>
              <input
                type="number"
                step="0.1"
                name="weight"
                value={formData.weight}
                onChange={handleChange}
                onBlur={() => normalizeNumberValue("persen", formData.weight)}
                className={`w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                  errors.weight ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.weight && (
                <p className="text-red-600 text-sm mt-1">{errors.weight}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Score *
              </label>
              <input
                type="number"
                step="0.1"
                name="maxScore"
                value={formData.maxScore}
                onChange={handleChange}
                onBlur={() =>
                  normalizeNumberValue("maxScore", formData.maxScore)
                }
                className={`w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                  errors.maxScore ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.maxScore && (
                <p className="text-red-600 text-sm mt-1">{errors.maxScore}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Display Order *
              </label>
              <input
                type="number"
                name="displayOrder"
                value={formData.displayOrder}
                onChange={handleChange}
                onBlur={() =>
                  normalizeNumberValue("displayOrder", formData.displayOrder)
                }
                className={`w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                  errors.displayOrder ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.displayOrder && (
                <p className="text-red-600 text-sm mt-1">
                  {errors.displayOrder}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Evaluation Guide
            </label>
            <textarea
              name="evaluationGuide"
              value={formData.evaluationGuide}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200 mt-8">
            <Button
              text="Cancel"
              variant="secondary"
              fontSize="14px"
              borderRadius="999px"
              paddingWidth="18px"
              paddingHeight="10px"
              onClick={onClose}
            />
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-sky-600 text-white rounded-full font-medium hover:bg-sky-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
            >
              {isLoading
                ? "Processing..."
                : mode === "create"
                  ? "Create Criteria"
                  : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RubricModal;
