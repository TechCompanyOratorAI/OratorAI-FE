import React, { useState, useEffect } from "react";
import { Modal, Select, Button, Space, List, Typography } from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { InstructorInfo } from "@/services/features/admin/classSlice";

const { Text } = Typography;

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
  const [selectedInstructorId, setSelectedInstructorId] = useState<
    number | null
  >(null);
  const [instructorList, setInstructorList] = useState<InstructorInfo[]>([]);

  useEffect(() => {
    setInstructorList(currentInstructors);
  }, [currentInstructors, isOpen]);

  const availableForSelection = availableInstructors.filter(
    (instructor) => !instructorList.find((i) => i.userId === instructor.userId),
  );

  const handleAddInstructor = () => {
    if (selectedInstructorId === null) return;

    const instructor = availableInstructors.find(
      (i) => i.userId === selectedInstructorId,
    );
    if (instructor) {
      const newList = [...instructorList, instructor];
      setInstructorList(newList);
      onAddInstructor(selectedInstructorId);
      setSelectedInstructorId(null);
    }
  };

  const handleRemoveInstructor = (userId: number) => {
    const newList = instructorList.filter((i) => i.userId !== userId);
    setInstructorList(newList);
    onRemoveInstructor(userId);
  };

  const handleClose = () => {
    setSelectedInstructorId(null);
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
            Thêm giảng viên
          </Text>
          <Space.Compact style={{ width: "100%" }}>
            <Select
              placeholder="Chọn giảng viên..."
              value={selectedInstructorId}
              onChange={(val) => setSelectedInstructorId(val)}
              disabled={isLoading || availableForSelection.length === 0}
              style={{ flex: 1 }}
              allowClear
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              options={availableForSelection.map((i) => ({
                value: i.userId,
                label: `${i.firstName} ${i.lastName} (${i.email})`,
              }))}
              notFoundContent={
                availableForSelection.length === 0
                  ? "Không có giảng viên khả dụng"
                  : null
              }
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddInstructor}
              disabled={
                isLoading ||
                selectedInstructorId === null ||
                availableForSelection.length === 0
              }
            >
              Thêm
            </Button>
          </Space.Compact>
        </div>

        {/* Current Instructors */}
        <div>
          <Text strong className="block mb-3">
            Giảng viên hiện tại ({instructorList.length})
          </Text>
          {instructorList.length === 0 ? (
            <div className="text-gray-400 py-4 text-center">
              Chưa có giảng viên nào
            </div>
          ) : (
            <List
              size="small"
              bordered
              dataSource={instructorList}
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
