import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { RubricTemplatePayload } from "@/services/features/admin/rubricTempleSlice";

interface RubricTemplateModalProps {
  isOpen: boolean;
  mode: "create" | "edit";
  initialData?: RubricTemplatePayload;
  isLoading?: boolean;
  onClose: () => void;
  onSubmit: (payload: RubricTemplatePayload) => void;
}

interface FormState {
  templateName: string;
  description: string;
  assignmentType: string;
  isDefault: boolean;
}

const defaultFormState: FormState = {
  templateName: "",
  description: "",
  assignmentType: "presentation",
  isDefault: false,
};

const RubricTemplateModal: React.FC<RubricTemplateModalProps> = ({
  isOpen,
  mode,
  initialData,
  isLoading = false,
  onClose,
  onSubmit,
}) => {
  const [formState, setFormState] = useState<FormState>(defaultFormState);
  const [errors, setErrors] = useState<
    Partial<Record<keyof FormState, string>>
  >({});

  useEffect(() => {
    if (!isOpen) return;

    if (mode === "edit" && initialData) {
      setFormState({
        templateName: initialData.templateName,
        description: initialData.description,
        assignmentType: initialData.assignmentType,
        isDefault: initialData.isDefault,
      });
    } else {
      setFormState(defaultFormState);
    }

    setErrors({});
  }, [isOpen, mode, initialData]);

  if (!isOpen) return null;

  const validateForm = () => {
    const nextErrors: Partial<Record<keyof FormState, string>> = {};

    if (!formState.templateName.trim()) {
      nextErrors.templateName = "Template name is required";
    }

    if (!formState.description.trim()) {
      nextErrors.description = "Description is required";
    }

    if (!formState.assignmentType.trim()) {
      nextErrors.assignmentType = "Assignment type is required";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) return;

    onSubmit({
      templateName: formState.templateName.trim(),
      description: formState.description.trim(),
      assignmentType: formState.assignmentType.trim(),
      isDefault: formState.isDefault,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl border border-slate-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="text-lg font-semibold text-slate-900">
            {mode === "create"
              ? "Create Rubric Template"
              : "Edit Rubric Template"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1 text-slate-500 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Template Name
            </label>
            <input
              type="text"
              value={formState.templateName}
              onChange={(e) =>
                setFormState((prev) => ({
                  ...prev,
                  templateName: e.target.value,
                }))
              }
              className={`w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-200 ${
                errors.templateName ? "border-rose-300" : "border-slate-300"
              }`}
              placeholder="Presentation Rubric v1"
            />
            {errors.templateName && (
              <p className="mt-1 text-xs text-rose-600">
                {errors.templateName}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Description
            </label>
            <textarea
              value={formState.description}
              onChange={(e) =>
                setFormState((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              rows={3}
              className={`w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-200 ${
                errors.description ? "border-rose-300" : "border-slate-300"
              }`}
              placeholder="Rubric for group presentations"
            />
            {errors.description && (
              <p className="mt-1 text-xs text-rose-600">{errors.description}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Assignment Type
            </label>
            <input
              type="text"
              value={formState.assignmentType}
              onChange={(e) =>
                setFormState((prev) => ({
                  ...prev,
                  assignmentType: e.target.value,
                }))
              }
              className={`w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-200 ${
                errors.assignmentType ? "border-rose-300" : "border-slate-300"
              }`}
              placeholder="presentation"
            />
            {errors.assignmentType && (
              <p className="mt-1 text-xs text-rose-600">
                {errors.assignmentType}
              </p>
            )}
          </div>

          <label className="inline-flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={formState.isDefault}
              onChange={(e) =>
                setFormState((prev) => ({
                  ...prev,
                  isDefault: e.target.checked,
                }))
              }
            />
            Set as default template
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading
                ? "Saving..."
                : mode === "create"
                  ? "Create"
                  : "Update"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RubricTemplateModal;
