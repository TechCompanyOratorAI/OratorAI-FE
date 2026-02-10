import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import Button from "@/components/yoodli/Button";
import { CourseData } from "@/services/features/course/courseSlice";

interface CourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (courseData: any) => void;
  initialData?: CourseData;
  isLoading?: boolean;
}

interface CourseFormData {
  courseCode: string;
  majorCode: string;
  courseName: string;
  description: string;
  semester: string;
  academicYear: number;
  startDate: string;
  endDate: string;
}

const CourseModal: React.FC<CourseModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading = false,
}) => {
  const getTodayISO = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const [formData, setFormData] = useState<CourseFormData>({
    courseCode: "",
    majorCode: "",
    courseName: "",
    description: "",
    semester: "",
    academicYear: new Date().getFullYear(),
    startDate: "",
    endDate: "",
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof CourseFormData, string>>
  >({});

  // Populate form with initial data when editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        courseCode: initialData.courseCode,
        majorCode: initialData.majorCode,
        courseName: initialData.courseName,
        description: initialData.description,
        semester: initialData.semester,
        academicYear: initialData.academicYear,
        startDate: initialData.startDate,
        endDate: initialData.endDate,
      });
    } else {
      setFormData({
        courseCode: "",
        majorCode: "",
        courseName: "",
        description: "",
        semester: "",
        academicYear: new Date().getFullYear(),
        startDate: "",
        endDate: "",
      });
    }
    setErrors({});
  }, [initialData, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CourseFormData, string>> = {};
    const todayISO = getTodayISO();

    if (!formData.courseCode.trim()) {
      newErrors.courseCode = "Course code is required";
    }
    if (!formData.majorCode.trim()) {
      newErrors.majorCode = "Major code is required";
    }
    if (!formData.courseName.trim()) {
      newErrors.courseName = "Course name is required";
    }
    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }
    if (!formData.semester.trim()) {
      newErrors.semester = "Semester is required";
    }
    if (!formData.academicYear || Number.isNaN(formData.academicYear)) {
      newErrors.academicYear = "Academic year is required";
    } else if (formData.academicYear <= 0) {
      newErrors.academicYear = "Academic year must be greater than 0";
    }
    if (!formData.startDate) {
      newErrors.startDate = "Start date is required";
    }
    if (!formData.endDate) {
      newErrors.endDate = "End date is required";
    }
    if (formData.endDate && formData.endDate < todayISO) {
      newErrors.endDate = "End date cannot be in the past";
    }
    if (
      formData.startDate &&
      formData.endDate &&
      formData.startDate > formData.endDate
    ) {
      newErrors.endDate = "End date must be after start date";
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
      [name]: name === "academicYear" ? parseInt(value) || 0 : value,
    }));
    // Clear error for this field
    if (errors[name as keyof CourseFormData]) {
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

  const todayISO = getTodayISO();
  const minEndDate =
    formData.startDate && formData.startDate > todayISO
      ? formData.startDate
      : todayISO;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {initialData ? "Edit Course" : "Create New Course"}
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
          {/* Course Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Course Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="courseCode"
              value={formData.courseCode}
              onChange={handleChange}
              placeholder="e.g., SE101"
              className={`w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                errors.courseCode ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.courseCode && (
              <p className="text-red-600 text-sm mt-1">{errors.courseCode}</p>
            )}
          </div>

          {/* Major Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Major Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="majorCode"
              value={formData.majorCode}
              onChange={handleChange}
              placeholder="e.g., SE"
              className={`w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                errors.majorCode ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.majorCode && (
              <p className="text-red-500 text-sm mt-1">{errors.majorCode}</p>
            )}
          </div>
          {/* Course Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Course Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="courseName"
              value={formData.courseName}
              onChange={handleChange}
              placeholder="e.g., Software Engineering Fundamentals"
              className={`w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                errors.courseName ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.courseName && (
              <p className="text-red-600 text-sm mt-1">{errors.courseName}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter course description..."
              rows={3}
              className={`w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none ${
                errors.description ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.description && (
              <p className="text-red-600 text-sm mt-1">{errors.description}</p>
            )}
          </div>

          {/* Semester and Academic Year */}
          <div className="grid grid-cols-2 gap-4">
            {/* Semester */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Semester <span className="text-red-500">*</span>
              </label>
              <select
                name="semester"
                value={formData.semester}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                  errors.semester ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="">Select Semester </option>
                <option value="Fall 2026">Fall 2026</option>
                <option value="Spring 2026">Spring 2026</option>
                <option value="Summer 2026">Summer 2026</option>
                <option value="Fall 2027">Fall 2027</option>
                <option value="Spring 2027">Spring 2027</option>
                <option value="Summer 2027">Summer 2027</option>
              </select>
              {errors.semester && (
                <p className="text-red-600 text-sm mt-1">{errors.semester}</p>
              )}
            </div>

            {/* Academic Year */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Academic Year <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="academicYear"
                value={formData.academicYear}
                onChange={handleChange}
                placeholder="2026"
                className={`w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                  errors.academicYear ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.academicYear && (
                <p className="text-red-600 text-sm mt-1">
                  {errors.academicYear}
                </p>
              )}
            </div>
          </div>

          {/* Start Date and End Date */}
          <div className="grid grid-cols-2 gap-4">
            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date <span className="text-red-500">*</span>
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
                End Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                min={minEndDate}
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
              onClick={handleSubmit}
              disabled={isLoading}
              className="px-6 py-2 bg-sky-600 text-white rounded-full font-medium hover:bg-sky-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
            >
              {isLoading ? "Saving..." : "Save Course"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CourseModal;
