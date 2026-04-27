import React, { useState } from "react";
import { Modal, Button, Checkbox, Select } from "antd";
import { CheckCircleOutlined } from "@ant-design/icons";
import type { PickRubricTemplatePayload, RubricTemplateForInstructor } from "@/services/features/rubric/rubricSilce";

interface RubricTemplateConfigModalProps {
  isOpen: boolean;
  pendingTemplate: RubricTemplateForInstructor | null;
  pickSettings: PickRubricTemplatePayload;
  onSettingsChange: (settings: PickRubricTemplatePayload) => void;
  onCancel: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}

const RubricTemplateConfigModal: React.FC<RubricTemplateConfigModalProps> = ({
  isOpen,
  pendingTemplate,
  pickSettings,
  onSettingsChange,
  onCancel,
  onConfirm,
  isLoading,
}) => {
  const [confirmApplyPick, setConfirmApplyPick] = useState(false);
  const [confirmImmutableConfig, setConfirmImmutableConfig] = useState(false);
  const canApplyTemplate = confirmApplyPick && confirmImmutableConfig;

  const handleClose = () => {
    setConfirmApplyPick(false);
    setConfirmImmutableConfig(false);
    onCancel();
  };

  const handleConfirm = () => {
    if (!canApplyTemplate || isLoading) return;
    onConfirm();
  };

  return (
    <Modal
      open={isOpen && !!pendingTemplate}
      title={
        <div className="flex items-center gap-2">
          <CheckCircleOutlined style={{ color: "#0284c7" }} />
          <span>Cấu hình mẫu rubric</span>
        </div>
      }
      width={640}
      closable={!isLoading}
      maskClosable={!isLoading}
      onCancel={handleClose}
      footer={[
        <Button key="cancel" shape="round" disabled={isLoading} onClick={handleClose}>
          Hủy
        </Button>,
        <Button
          key="apply"
          type="primary"
          shape="round"
          loading={isLoading}
          disabled={!canApplyTemplate}
          onClick={handleConfirm}
        >
          Sử dụng mẫu
        </Button>,
      ]}
    >
      {pendingTemplate && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
              Mẫu đã chọn
            </p>
            <p className="text-base font-bold text-slate-900 mt-1">
              {pendingTemplate.templateName}
            </p>
            <p className="text-sm text-slate-500 mt-0.5">
              Loại bài nộp: {pendingTemplate.assignmentType}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-4">
            <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-slate-700">Ngôn ngữ phản hồi</span>
                <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  Tiếng Việt
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-slate-700">Định dạng báo cáo</span>
                <Select
                  value={pickSettings.reportFormat || "detailed"}
                  onChange={(val) => onSettingsChange({ ...pickSettings, reportFormat: val })}
                  options={[
                    { value: "detailed", label: "Chi tiết" },
                    { value: "summary", label: "Tóm tắt" },
                  ]}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                <Checkbox
                  checked={!!pickSettings.allowInstructorEdit}
                  onChange={(e) =>
                    onSettingsChange({ ...pickSettings, allowInstructorEdit: e.target.checked })
                  }
                >
                  Cho phép giảng viên chỉnh sửa
                </Checkbox>
                <Checkbox
                  checked={!!pickSettings.includeCriterionComments}
                  onChange={(e) =>
                    onSettingsChange({ ...pickSettings, includeCriterionComments: e.target.checked })
                  }
                >
                  Bao gồm nhận xét theo tiêu chí
                </Checkbox>
                <Checkbox
                  checked={!!pickSettings.includeOverallSummary}
                  onChange={(e) =>
                    onSettingsChange({ ...pickSettings, includeOverallSummary: e.target.checked })
                  }
                >
                  Bao gồm tổng kết chung
                </Checkbox>
                <Checkbox
                  checked={!!pickSettings.includeSuggestions}
                  onChange={(e) =>
                    onSettingsChange({ ...pickSettings, includeSuggestions: e.target.checked })
                  }
                >
                  Bao gồm gợi ý
                </Checkbox>
              </div>
            </div>

            <div className="rounded-xl border border-sky-200 bg-sky-50 p-3">
              <Checkbox
                checked={confirmImmutableConfig}
                onChange={(e) => setConfirmImmutableConfig(e.target.checked)}
              >
                Lưu ý: Chỉ được chọn một lần và không thể chỉnh sửa cấu hình.
              </Checkbox>
              <Checkbox
                className="mt-2"
                checked={confirmApplyPick}
                onChange={(e) => setConfirmApplyPick(e.target.checked)}
              >
                Xác nhận sử dụng mẫu này và các cấu hình AI cho lớp học này.
              </Checkbox>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default RubricTemplateConfigModal;
