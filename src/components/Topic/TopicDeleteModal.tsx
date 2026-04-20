import React from "react";
import { Modal, Button } from "antd";

interface TopicDeleteModalProps {
  isOpen: boolean;
  topicName?: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isLoading: boolean;
}

const TopicDeleteModal: React.FC<TopicDeleteModalProps> = ({
  isOpen,
  topicName,
  onClose,
  onConfirm,
  isLoading,
}) => {
  return (
    <Modal
      open={isOpen}
      title={
        <div className="flex items-center gap-2 text-red-600">
          <span>⚠</span>
          <span>Xóa chủ đề</span>
        </div>
      }
      onCancel={onClose}
      footer={[
        <Button key="cancel" shape="round" onClick={onClose}>
          Hủy
        </Button>,
        <Button
          key="delete"
          danger
          type="primary"
          shape="round"
          loading={isLoading}
          onClick={onConfirm}
        >
          Xóa
        </Button>,
      ]}
    >
      <p className="text-slate-600">
        Bạn có chắc muốn xóa chủ đề <strong>{topicName}</strong>? Hành động này không thể hoàn tác.
      </p>
    </Modal>
  );
};

export default TopicDeleteModal;
