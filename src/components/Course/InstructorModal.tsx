import React, { useState, useEffect } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { InstructorInfo } from "@/services/features/admin/classSlice";

interface InstructorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentInstructors: InstructorInfo[];
  availableInstructors: InstructorInfo[];
  onAddInstructor: (userId: number) => void;
  onRemoveInstructor: (userId: number) => void;
  isLoading?: boolean;
}

const InstructorModal: React.FC<InstructorModalProps> = ({
  isOpen,
  onClose,
  currentInstructors,
  availableInstructors,
  onAddInstructor,
  onRemoveInstructor,
  isLoading = false,
}) => {
  const [selectedInstructor, setSelectedInstructor] = useState<number>(0);
  const [instructorList, setInstructorList] = useState<InstructorInfo[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    setInstructorList(currentInstructors);
  }, [currentInstructors, isOpen]);

  const handleAddInstructor = () => {
    if (selectedInstructor === 0) return;

    const instructor = availableInstructors.find(
      (i) => i.userId === selectedInstructor,
    );
    if (
      instructor &&
      !instructorList.find((i) => i.userId === selectedInstructor)
    ) {
      const newList = [...instructorList, instructor];
      setInstructorList(newList);
      onAddInstructor(selectedInstructor);
      setSelectedInstructor(0);
    }
  };

  const handleRemoveInstructor = (userId: number) => {
    setInstructorList(instructorList.filter((i) => i.userId !== userId));
    onRemoveInstructor(userId);
  };

  if (!isOpen) return null;

  // Filter out already added instructors from available list
  const availableForSelection = availableInstructors.filter(
    (instructor) => !instructorList.find((i) => i.userId === instructor.userId),
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            Manage Instructors
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Add Instructor Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Add Instructor
            </h3>
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  disabled={isLoading || availableForSelection.length === 0}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-left bg-white hover:border-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  {selectedInstructor === 0
                    ? availableForSelection.length === 0
                      ? "No instructors available"
                      : "Select instructor"
                    : availableForSelection.find(
                          (i) => i.userId === selectedInstructor,
                        )
                      ? `${availableForSelection.find((i) => i.userId === selectedInstructor)?.firstName} ${availableForSelection.find((i) => i.userId === selectedInstructor)?.lastName}`
                      : "Select instructor"}
                </button>
                {isDropdownOpen && availableForSelection.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 border border-gray-300 rounded-xl bg-white shadow-lg z-10 max-h-64 overflow-y-auto">
                    {availableForSelection.map((instructor) => (
                      <div
                        key={instructor.userId}
                        onClick={() => {
                          setSelectedInstructor(instructor.userId);
                          setIsDropdownOpen(false);
                        }}
                        className="px-4 py-3 hover:bg-sky-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium text-gray-900">
                          {instructor.firstName} {instructor.lastName}
                        </div>
                        <div className="text-sm text-gray-600">
                          {instructor.email}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={handleAddInstructor}
                disabled={
                  isLoading ||
                  selectedInstructor === 0 ||
                  availableForSelection.length === 0
                }
                className="px-6 py-2 bg-sky-600 text-white rounded-xl font-medium hover:bg-sky-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add
              </button>
            </div>
          </div>

          {/* Current Instructors Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Current Instructors ({instructorList.length})
            </h3>
            {instructorList.length === 0 ? (
              <p className="text-gray-500 py-4">No instructors assigned yet</p>
            ) : (
              <div className="space-y-2">
                {instructorList.map((instructor) => (
                  <div
                    key={instructor.userId}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {instructor.firstName} {instructor.lastName}
                      </p>
                      <p className="text-sm text-gray-600">
                        {instructor.email}
                      </p>
                      <p className="text-xs text-gray-500">
                        ID: {instructor.userId}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveInstructor(instructor.userId)}
                      disabled={isLoading}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200 mt-8">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-full font-medium hover:bg-gray-50 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstructorModal;
