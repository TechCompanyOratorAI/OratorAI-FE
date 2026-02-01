import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import Button from "@/components/yoodli/Button";
import { ClassData } from "@/services/features/admin/classSlice";

interface ClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (classData: any) => void;
  initialData?: ClassData;
  isLoading?: boolean;
  courses?: Array<{ courseId: number; courseCode: string; courseName: string }>;
}

interface ClassFormData {
  courseId: number;
  classCode: string;
  className: string;
  description: string;
  startDate: string;
  endDate: string;
  maxStudents: number;
}

const ClassModal: React.FC<ClassModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading = false,
  courses = [],
}) => {
  const [formData, setFormData] = useState<ClassFormData>({
    courseId: 0,
    classCode: "",
    className: "",
    description: "",
    startDate: "",
    endDate: "",
    maxStudents: 30,
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof ClassFormData, string>>
  >({});

  // Populate form with initial data when editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        courseId: initialData.courseId,
        classCode: initialData.classCode,
        className: initialData.className,
        description: initialData.description,
        startDate: initialData.startDate,
        endDate: initialData.endDate,
        maxStudents: initialData.maxStudents,
      });
    } else {
      setFormData({
        courseId: courses.length > 0 ? courses[0].courseId : 0,
        classCode: "",
        className: "",
        description: "",
        startDate: "",
        endDate: "",
        maxStudents: 30,
      });
    }
    setErrors({});
  }, [initialData, isOpen, courses]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ClassFormData, string>> = {};

    if (formData.courseId <= 0) {
      newErrors.courseId = "Please select a course";
    }
    if (!formData.classCode.trim()) {
      newErrors.classCode = "Class code is required";
    }
    if (!formData.className.trim()) {
      newErrors.className = "Class name is required";
    }
    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }
    if (!formData.startDate) {
      newErrors.startDate = "Start date is required";
    }
    if (!formData.endDate) {
      newErrors.endDate = "End date is required";
    }
    if (
      formData.startDate &&
      formData.endDate &&
      formData.startDate > formData.endDate
    ) {
      newErrors.endDate = "End date must be after start date";
    }
    if (formData.maxStudents <= 0) {
      newErrors.maxStudents = "Max students must be greater than 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "maxStudents" || name === "courseId"
          ? parseInt(value) || 0
          : value,
    }));
    // Clear error for this field
    if (errors[name as keyof ClassFormData]) {
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
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {initialData ? "Edit Class" : "Create New Class"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Course Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Course
            </label>
            <select
              name="courseId"
              value={formData.courseId}
              onChange={handleChange}
              disabled={initialData !== undefined || courses.length === 0}
              className={`w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                errors.courseId ? "border-red-500" : "border-gray-300"
              } ${initialData !== undefined ? "bg-gray-100 cursor-not-allowed" : ""}`}
            >
              <option value="0">Select a course...</option>
              {courses.map((course) => (
                <option key={course.courseId} value={course.courseId}>
                  {course.courseCode} - {course.courseName}
                </option>
              ))}
            </select>
            {errors.courseId && (
              <p className="text-red-600 text-sm mt-1">{errors.courseId}</p>
            )}
            {courses.length === 0 && (
              <p className="text-amber-600 text-sm mt-1">
                Please create a course first
              </p>
            )}
          </div>

          {/* Class Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Class Code
            </label>
            <input
              type="text"
              name="classCode"
              value={formData.classCode}
              onChange={handleChange}
              placeholder="e.g., SE101-L01"
              className={`w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                errors.classCode ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.classCode && (
              <p className="text-red-600 text-sm mt-1">{errors.classCode}</p>
            )}
          </div>

          {/* Class Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Class Name
            </label>
            <input
              type="text"
              name="className"
              value={formData.className}
              onChange={handleChange}
              placeholder="e.g., Section A - Monday 8AM"
              className={`w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                errors.className ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.className && (
              <p className="text-red-600 text-sm mt-1">{errors.className}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter class description..."
              rows={3}
              className={`w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none ${
                errors.description ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.description && (
              <p className="text-red-600 text-sm mt-1">{errors.description}</p>
            )}
          </div>

          {/* Max Students */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Students
            </label>
            <input
              type="number"
              name="maxStudents"
              value={formData.maxStudents}
              onChange={handleChange}
              placeholder="30"
              min="1"
              className={`w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                errors.maxStudents ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.maxStudents && (
              <p className="text-red-600 text-sm mt-1">{errors.maxStudents}</p>
            )}
          </div>

          {/* Start Date and End Date */}
          <div className="grid grid-cols-2 gap-4">
            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                  errors.startDate ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.startDate && (
                <p className="text-red-600 text-sm mt-1">{errors.startDate}</p>
              )}
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                  errors.endDate ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.endDate && (
                <p className="text-red-600 text-sm mt-1">{errors.endDate}</p>
              )}
            </div>
          </div>

          {/* Footer */}
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
              {isLoading ? "Saving..." : "Save Class"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClassModal;
