import React from "react";
import { Modal, Button, Space, Typography, Empty, Card } from "antd";
import { MessageOutlined } from "@ant-design/icons";
import CriterionFeedbackRubricForm from "./CriterionFeedbackRubricForm";
import { CriterionFeedback, CriterionScore } from "@/services/features/report/reportSlice";

const { Paragraph, Text } = Typography;

interface CriterionFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportId: number;
  criteria: CriterionScore[];
  existingFeedbacks: CriterionFeedback[];
}

/** Modal gom nhiều form — mỗi tiêu chí vẫn là một `CriterionFeedbackRubricForm` độc lập. */
const CriterionFeedbackModal: React.FC<CriterionFeedbackModalProps> = ({
  isOpen,
  onClose,
  reportId,
  criteria,
  existingFeedbacks,
}) => {
  return (
    <Modal
      title={
        <Space align="center">
          <MessageOutlined className="text-indigo-600 text-lg" />
          <span>Phản hồi theo tiêu chí</span>
        </Space>
      }
      open={isOpen}
      onCancel={onClose}
      footer={
        <Button type="primary" onClick={onClose} ghost>
          Đóng
        </Button>
      }
      width={720}
      centered
      destroyOnClose
      styles={{
        body: {
          maxHeight: "min(70vh, 560px)",
          overflowY: "auto",
          paddingTop: 8,
        },
      }}
    >
      <Paragraph type="secondary" className="!mb-4">
        Mỗi tiêu chí có form riêng: nhập điểm (0–100) và nhận xét, sau đó bấm lưu từng
        tiêu chí.
      </Paragraph>

      {criteria.length === 0 ? (
        <Empty description="Không có tiêu chí đánh giá nào" className="py-8" />
      ) : (
        <Space direction="vertical" size="large" className="w-full">
          {criteria.map((criterion) => {
            const existing = existingFeedbacks.find(
              (f) => f.classRubricCriteriaId === criterion.criteriaId,
            );
            return (
              <Card
                key={criterion.criteriaId}
                size="small"
                className="shadow-sm border-slate-200"
                styles={{ body: { padding: 16 } }}
              >
                <Text strong className="text-base block mb-1">
                  {criterion.criteriaName}
                </Text>
                <Text type="secondary" className="text-xs block mb-3">
                  Tối đa rubric: {criterion.maxScore} · Trọng số: {criterion.weight}%
                </Text>
                <CriterionFeedbackRubricForm
                  reportId={reportId}
                  criterion={criterion}
                  existingFeedback={existing ?? null}
                />
              </Card>
            );
          })}
        </Space>
      )}
    </Modal>
  );
};

export default CriterionFeedbackModal;
