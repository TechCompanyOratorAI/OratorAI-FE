import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import Button from "@/components/yoodli/Button";
import { Department } from "@/services/features/admin/adminSlice";

interface DepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: DepartmentFormData) => void;
  initialData?: Department;
  isLoading?: boolean;
}

export interface DepartmentFormData {
  departmentCode: string;
  departmentName: string;
  description: string;
  isActive: boolean;
}

const DepartmentModal: React.FC<DepartmentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<DepartmentFormData>({
    departmentCode: "",
    departmentName: "",
    description: "",
    isActive: true,
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof DepartmentFormData, string>>
  >({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        departmentCode: initialData.departmentCode,
        departmentName: initialData.departmentName,
        description: initialData.description || "",
        isActive: initialData.isActive,
      });
    } else {
      setFormData({
        departmentCode: "",
        departmentName: "",
        description: "",
        isActive: true,
      });
    }
    setErrors({});
  }, [initialData, isOpen]);

  const validateForm = () => {
    const nextErrors: Partial<Record<keyof DepartmentFormData, string>> = {};

    if (!formData.departmentCode.trim() && !initialData) {
      nextErrors.departmentCode = "Department code is required";
    }
    if (!formData.departmentName.trim()) {
      nextErrors.departmentName = "Department name is required";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = e.target;
    const nextValue =
      type === "checkbox" && e.target instanceof HTMLInputElement
        ? e.target.checked
        : value;

    setFormData((prev) => ({
      ...prev,
      [name]: nextValue,
    }));

    if (errors[name as keyof DepartmentFormData]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {initialData ? "Edit Department" : "Create New Department"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {!initialData && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="departmentCode"
                value={formData.departmentCode}
                onChange={handleChange}
                placeholder="e.g., SE"
                className={`w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                  errors.departmentCode ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.departmentCode && (
                <p className="text-red-600 text-sm mt-1">
                  {errors.departmentCode}
                </p>
              )}
            </div>
          )}

          {initialData && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department Code
              </label>
              <input
                type="text"
                value={formData.departmentCode}
                disabled
                className="w-full px-4 py-2 border rounded-xl bg-gray-50 text-gray-600 border-gray-200"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Department Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="departmentName"
              value={formData.departmentName}
              onChange={handleChange}
              placeholder="e.g., Software Engineering"
              className={`w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                errors.departmentName ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.departmentName && (
              <p className="text-red-600 text-sm mt-1">
                {errors.departmentName}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter department description..."
              rows={4}
              className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none border-gray-300"
            />
          </div>

          {initialData && (
            <div className="flex items-center gap-2">
              <input
                id="departmentIsActive"
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
              />
              <label
                htmlFor="departmentIsActive"
                className="text-sm font-medium text-gray-700"
              >
                Active
              </label>
            </div>
          )}

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
              disabled={isLoading}
              className="px-6 py-2 bg-sky-600 text-white rounded-full font-medium hover:bg-sky-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
            >
              {isLoading
                ? "Saving..."
                : initialData
                  ? "Save Changes"
                  : "Create Department"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DepartmentModal;
