import React, { useState } from "react";
import { Modal, Checkbox, Button, List, Typography } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import { InstructorInfo } from "@/services/features/admin/classSlice";

const { Text } = Typography;

interface InstructorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentInstructors: InstructorInfo[];
  availableInstructors: InstructorInfo[];
  onAddInstructor: (userIds: number[]) => void;
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
  const [selectedInstructorIds, setSelectedInstructorIds] = useState<number[]>([]);

  const availableForSelection = availableInstructors.filter(
    (instructor) => !currentInstructors.find((i) => i.userId === instructor.userId),
  );

  const handleAddInstructor = () => {
    if (selectedInstructorIds.length === 0) return;
    const selectedSet = new Set(selectedInstructorIds);
    const selectedInstructors = availableForSelection.filter((i) =>
      selectedSet.has(i.userId),
    );
    if (selectedInstructors.length === 0) return;
    onAddInstructor(selectedInstructorIds);
    setSelectedInstructorIds([]);
  };

  const handleRemoveInstructor = (userId: number) => {
    onRemoveInstructor(userId);
  };

  const handleClose = () => {
    setSelectedInstructorIds([]);
    onClose();
  };

  return (
    <Modal
      title="Quản lý giảng viên"
      open={isOpen}
      onCancel={handleClose}
      footer={null}
      centered
      width={640}
      destroyOnHidden
      maskClosable={!isLoading}
    >
      <div className="space-y-6 mt-4">
        {/* Add Instructor */}
        <div>
          <Text strong className="block mb-3">
            Danh sách giảng viên của môn học ({availableForSelection.length})
          </Text>
          {availableForSelection.length === 0 ? (
            <div className="text-gray-400 py-4 text-center border rounded-md">
              Không có giảng viên khả dụng
            </div>
          ) : (
            <Checkbox.Group
              className="w-full"
              value={selectedInstructorIds}
              onChange={(vals) => setSelectedInstructorIds(vals as number[])}
              disabled={isLoading}
            >
              <div className="max-h-56 overflow-y-auto border border-gray-200 rounded-lg p-3 grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                {availableForSelection.map((instructor) => (
                  <Checkbox
                    key={instructor.userId}
                    value={instructor.userId}
                    className="truncate"
                  >
                    <span className="inline-block max-w-full truncate align-bottom">
                      {instructor.firstName} {instructor.lastName} ({instructor.email})
                    </span>
                  </Checkbox>
                ))}
              </div>
            </Checkbox.Group>
          )}
          <div className="flex justify-end mt-3">
            <Button
              type="primary"
              onClick={handleAddInstructor}
              disabled={
                isLoading ||
                selectedInstructorIds.length === 0 ||
                availableForSelection.length === 0
              }
            >
              Thêm đã chọn
            </Button>
          </div>
        </div>

        {/* Current Instructors */}
        <div>
          <Text strong className="block mb-3">
            Giảng viên hiện tại ({currentInstructors.length})
          </Text>
          {currentInstructors.length === 0 ? (
            <div className="text-gray-400 py-4 text-center">
              Chưa có giảng viên nào
            </div>
          ) : (
            <List
              size="small"
              bordered
              dataSource={currentInstructors}
              renderItem={(instructor) => (
                <List.Item
                  actions={[
                    <Button
                      key="remove"
                      type="text"
                      icon={<DeleteOutlined />}
                      danger
                      onClick={() => handleRemoveInstructor(instructor.userId)}
                      disabled={isLoading}
                    />,
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <Text>
                        {instructor.firstName} {instructor.lastName}
                      </Text>
                    }
                    description={
                      <Text type="secondary">{instructor.email}</Text>
                    }
                  />
                </List.Item>
              )}
            />
          )}
        </div>
      </div>

      <div className="flex justify-end mt-6 pt-4 border-t">
        <Button onClick={handleClose} disabled={isLoading}>
          Đóng
        </Button>
      </div>
    </Modal>
  );
};

export default InstructorModal;
