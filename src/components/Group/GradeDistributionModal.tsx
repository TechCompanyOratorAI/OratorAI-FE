import React, { useEffect, useState, useMemo } from "react";
import {
  Modal,
  Button,
  Space,
  Typography,
  Input,
  Slider,
  Card,
  Divider,
  Avatar,
  Tag,
  Spin,
  Alert,
  Statistic,
  Row,
  Col,
  Progress,
  Empty,
  message,
} from "antd";
import {
  TrophyOutlined,
  CrownOutlined,
  SaveOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { useAppDispatch, useAppSelector } from "@/services/store/store";
import {
  distributeGrade,
  fetchGradeDistributionByReport,
  clearCurrentDistribution,
} from "@/services/features/groupGrade/groupGradeSlice";
import { GroupStudent } from "@/services/features/group/groupSlice";

const { Text } = Typography;
const { TextArea } = Input;

interface MemberGradeEntry {
  studentId: number;
  studentName: string;
  studentEmail?: string;
  isLeader: boolean;
  percentage: number;
  reason: string;
}

interface GradeDistributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportId: number;
  instructorGrade: number;
  /** Danh sách thành viên nhóm (từ groupDetail) */
  groupMembers: GroupStudent[];
  /** userId của leader hiện tại */
  leaderId: number;
  /** studentId của user hiện tại (để kiểm tra có phải leader không) */
  currentUserId?: number;
  /** Callback khi chia điểm thành công */
  onSuccess?: (distributionId: number) => void;
}

const GradeDistributionModal: React.FC<GradeDistributionModalProps> = ({
  isOpen,
  onClose,
  reportId,
  instructorGrade,
  groupMembers,
  leaderId,
  currentUserId,
  onSuccess,
}) => {
  const dispatch = useAppDispatch();
  const { currentDistribution, loading, actionLoading, error } = useAppSelector(
    (state) => state.groupGrade,
  );

  const [overallReason, setOverallReason] = useState("");
  const [members, setMembers] = useState<MemberGradeEntry[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  const isLeader = currentUserId === leaderId;
  const hasDistribution = !!currentDistribution;

  // Initialize members list từ props khi mở modal
  useEffect(() => {
    if (isOpen && groupMembers.length > 0) {
      if (hasDistribution && currentDistribution?.members) {
        // Load lại từ distribution đã có
        const entries: MemberGradeEntry[] = groupMembers.map((gm) => {
          const existing = currentDistribution.members?.find(
            (m) => m.studentId === (gm.userId ?? gm.id),
          );
          const role = gm.GroupStudent?.role;
          const name =
            [gm.firstName, gm.lastName].filter(Boolean).join(" ") ||
            gm.username ||
            "Thành viên";
          return {
            studentId: Number(gm.userId ?? gm.id),
            studentName: name,
            studentEmail: gm.email,
            isLeader: role === "leader",
            percentage: existing ? Number(existing.percentage) : 100,
            reason: existing?.reason || "",
          };
        });
        setMembers(entries);
        setOverallReason(currentDistribution.reason || "");
      } else {
        // Mặc định: mỗi người 100%
        const entries: MemberGradeEntry[] = groupMembers.map((gm) => {
          const role = gm.GroupStudent?.role;
          const name =
            [gm.firstName, gm.lastName].filter(Boolean).join(" ") ||
            gm.username ||
            "Thành viên";
          return {
            studentId: Number(gm.userId ?? gm.id),
            studentName: name,
            studentEmail: gm.email,
            isLeader: role === "leader",
            percentage: 100,
            reason: "",
          };
        });
        setMembers(entries);
        setOverallReason("");
      }
      setHasChanges(false);
    }
  }, [isOpen, groupMembers, hasDistribution, currentDistribution]);

  // Fetch distribution đã có (nếu có)
  useEffect(() => {
    if (isOpen && reportId) {
      void dispatch(fetchGradeDistributionByReport(reportId));
    }
    return () => {
      void dispatch(clearCurrentDistribution());
    };
  }, [isOpen, reportId, dispatch]);

  // Hiển thị lỗi
  useEffect(() => {
    if (error) {
      void message.error(error);
    }
  }, [error]);

  const handlePercentageChange = (studentId: number, newPercentage: number) => {
    setMembers((prev) =>
      prev.map((m) =>
        m.studentId === studentId ? { ...m, percentage: newPercentage } : m,
      ),
    );
    setHasChanges(true);
  };

  const handleReasonChange = (studentId: number, newReason: string) => {
    setMembers((prev) =>
      prev.map((m) =>
        m.studentId === studentId ? { ...m, reason: newReason } : m,
      ),
    );
    setHasChanges(true);
  };

  const handleOverallReasonChange = (val: string) => {
    setOverallReason(val);
    setHasChanges(true);
  };

  // Preview điểm nhận được
  const gradePreview = useMemo(() => {
    return members.map((m) => ({
      ...m,
      receivedGrade: parseFloat(((instructorGrade * m.percentage) / 100).toFixed(2)),
    }));
  }, [members, instructorGrade]);

  const totalPercentage = useMemo(() => {
    return members.reduce((sum, m) => sum + m.percentage, 0);
  }, [members]);

  const handleSave = async () => {
    // Validate
    if (members.length === 0) {
      void message.warning("Không có thành viên nào để phân chia điểm.");
      return;
    }

    // Check % có hợp lệ không
    const invalidMember = members.find(
      (m) => m.percentage < 0 || m.percentage > 100,
    );
    if (invalidMember) {
      void message.warning(
        `Phần trăm của "${invalidMember.studentName}" phải từ 0 đến 100.`,
      );
      return;
    }

    try {
      const result = await dispatch(
        distributeGrade({
          reportId,
          reason: overallReason || undefined,
          members: members.map((m) => ({
            studentId: m.studentId,
            percentage: m.percentage,
            reason: m.reason || undefined,
          })),
        }),
      ).unwrap();

      void message.success("Đã phân chia điểm thành công!");
      setHasChanges(false);
      onSuccess?.(result.id);
      onClose();
    } catch {
      // lỗi đã được xử lý qua slice
    }
  };

  const handleClose = () => {
    if (hasChanges) {
      Modal.confirm({
        title: "Có thay đổi chưa lưu",
        content: "Bạn có chắc muốn đóng mà không lưu không?",
        okText: "Đóng",
        cancelText: "Hủy",
        onOk: () => {
          setHasChanges(false);
          onClose();
        },
      });
    } else {
      onClose();
    }
  };

  return (
    <Modal
      title={
        <Space align="center">
          <TrophyOutlined className="text-amber-500 text-lg" />
          <span>Phân chia điểm cho nhóm</span>
        </Space>
      }
      open={isOpen}
      onCancel={handleClose}
      width={760}
      centered
      destroyOnClose
      maskClosable={!actionLoading}
      footer={
        <Space>
          <Button onClick={handleClose} disabled={actionLoading}>
            Hủy
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={actionLoading}
            onClick={handleSave}
            disabled={!isLeader}
          >
            {hasDistribution ? "Cập nhật phân chia" : "Lưu phân chia điểm"}
          </Button>
        </Space>
      }
      styles={{
        body: {
          maxHeight: "min(75vh, 640px)",
          overflowY: "auto",
          padding: "12px 24px",
        },
      }}
    >
      <Spin spinning={loading}>
        {/* Header info */}
        <Card size="small" className="mb-4 bg-sky-50 border-sky-100">
          <Row gutter={16} align="middle">
            <Col span={8}>
              <Statistic
                title="Điểm GV gốc"
                value={instructorGrade}
                suffix="/ 10"
                valueStyle={{ fontSize: "1.4rem", color: "#0284c7" }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Tổng % đã chia"
                value={totalPercentage}
                suffix="%"
                valueStyle={{
                  fontSize: "1.4rem",
                  color: totalPercentage > 100 ? "#ef4444" : "#16a34a",
                }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Số thành viên"
                value={members.length}
                valueStyle={{ fontSize: "1.4rem" }}
              />
            </Col>
          </Row>
          {totalPercentage > 100 && (
            <Alert
              type="warning"
              message="Tổng phần trăm lớn hơn 100%. Mỗi người có thể nhận điểm vượt quá điểm gốc."
              className="mt-2"
              showIcon
            />
          )}
        </Card>

        {!isLeader && (
          <Alert
            type="info"
            message="Chỉ trưởng nhóm mới có quyền phân chia điểm. Các thành viên khác chỉ có thể xem."
            className="mb-4"
            showIcon
            icon={<InfoCircleOutlined />}
          />
        )}

        {hasDistribution && (
          <Alert
            type="success"
            message={`Đã phân chia điểm bởi ${currentDistribution.leader?.firstName ?? ""} ${currentDistribution.leader?.lastName ?? ""} vào ${currentDistribution.distributedAt ? new Date(currentDistribution.distributedAt).toLocaleDateString("vi-VN") : ""}`}
            className="mb-4"
            showIcon
          />
        )}

        {/* Lý do tổng quát */}
        <div className="mb-4">
          <Text strong className="block mb-1">
            Lý do phân chia điểm (tổng quát)
          </Text>
          <TextArea
            rows={2}
            placeholder="VD: Chia điểm theo mức độ đóng góp của từng thành viên trong nhóm..."
            value={overallReason}
            onChange={(e) => handleOverallReasonChange(e.target.value)}
            disabled={!isLeader}
            maxLength={500}
            showCount
          />
        </div>

        <Divider className="!my-4" />

        {/* Danh sách thành viên */}
        {members.length === 0 ? (
          <Empty description="Không có thành viên nào trong nhóm" />
        ) : (
          <Space direction="vertical" size="middle" className="w-full">
            {gradePreview.map((member) => (
              <Card
                key={member.studentId}
                size="small"
                className={`border-l-4 ${member.isLeader ? "border-l-amber-400" : "border-l-sky-400"}`}
              >
                {/* Header row */}
                <div className="flex items-center justify-between mb-3">
                  <Space size="middle">
                    <Avatar
                      style={{
                        background: member.isLeader
                          ? "linear-gradient(135deg, #f59e0b, #d97706)"
                          : "linear-gradient(135deg, #0ea5e9, #06b6d4)",
                      }}
                    >
                      {member.studentName.charAt(0).toUpperCase()}
                    </Avatar>
                    <div>
                      <Space size={4}>
                        <Text strong className="text-sm">
                          {member.studentName}
                        </Text>
                        {member.isLeader && (
                          <Tag color="gold" icon={<CrownOutlined />} className="text-xs">
                            Trưởng nhóm
                          </Tag>
                        )}
                      </Space>
                      {member.studentEmail && (
                        <Text type="secondary" className="text-xs block">
                          {member.studentEmail}
                        </Text>
                      )}
                    </div>
                  </Space>

                  {/* Điểm nhận được */}
                  <div className="text-right">
                    <Text strong className="text-lg text-sky-700">
                      {Number(member.receivedGrade).toFixed(2)}
                    </Text>
                    <Text type="secondary" className="text-xs block">
                      / {Number(instructorGrade).toFixed(2)} điểm
                    </Text>
                  </div>
                </div>

                {/* Slider % */}
                <div className="mb-2">
                  <div className="flex items-center justify-between mb-1">
                    <Text type="secondary" className="text-xs">
                      Phần trăm đóng góp
                    </Text>
                    <Text strong className="text-sm">
                      {member.percentage}%
                    </Text>
                  </div>
                  <Slider
                    min={0}
                    max={100}
                    value={member.percentage}
                    onChange={(val) => handlePercentageChange(member.studentId, val)}
                    disabled={!isLeader}
                    tooltip={{ formatter: (val) => `${val}%` }}
                    marks={{
                      0: "0%",
                      50: "50%",
                      100: "100%",
                    }}
                  />
                  <Progress
                    percent={member.percentage}
                    showInfo={false}
                    strokeColor={member.isLeader ? "#f59e0b" : "#0ea5e9"}
                    trailColor="#e2e8f0"
                    size="small"
                  />
                </div>

                {/* Lý do riêng */}
                <div>
                  <Text type="secondary" className="text-xs mb-1 block">
                    Lý do được chia {member.percentage}% (VD: "Vì làm phần trình bày chính")
                  </Text>
                  <TextArea
                    rows={1}
                    placeholder="Nhập lý do..."
                    value={member.reason}
                    onChange={(e) =>
                      handleReasonChange(member.studentId, e.target.value)
                    }
                    disabled={!isLeader}
                    maxLength={300}
                    showCount
                    style={{ fontSize: "13px" }}
                  />
                </div>
              </Card>
            ))}
          </Space>
        )}
      </Spin>
    </Modal>
  );
};

export default GradeDistributionModal;
