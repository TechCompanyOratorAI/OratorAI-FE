import React from "react";
import { Modal, Button } from "antd";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  title: string;
  itemName?: string;
  message?: string;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  title,
  itemName,
  message,
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
          <span>{title}</span>
        </div>
      }
      closable={!isLoading}
      maskClosable={!isLoading}
      onCancel={onClose}
      footer={[
        <Button key="cancel" shape="round" disabled={isLoading} onClick={onClose}>
          Hủy
        </Button>,
        <Button key="delete" danger type="primary" shape="round" loading={isLoading} onClick={onConfirm}>
          Xóa
        </Button>,
      ]}
    >
      <p className="text-slate-600">
        {message ?? (
          <>
            Bạn có chắc muốn xóa <strong>{itemName}</strong>? Hành động này không thể hoàn tác.
          </>
        )}
      </p>
    </Modal>
  );
};

export default DeleteConfirmModal;
