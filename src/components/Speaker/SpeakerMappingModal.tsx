import React, { useEffect, useState } from "react";
import {
  Modal,
  Table,
  Select,
  Tag,
  Button,
  Space,
  Typography,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  BulbOutlined,
  SaveOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { useAppDispatch, useAppSelector } from "../../services/store/store";
import {
  fetchSpeakers,
  fetchSuggestions,
  fetchGroupMembers,
  batchMapSpeakers,
  unmapSpeaker,
  type Speaker,
} from "../../services/features/speaker/speakerSlice";

const { Text } = Typography;

interface Props {
  presentationId: number;
  open: boolean;
  onClose: () => void;
}

const formatDuration = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
};

const SpeakerMappingModal: React.FC<Props> = ({
  presentationId,
  open,
  onClose,
}) => {
  const dispatch = useAppDispatch();
  const { speakers, suggestions, groupMembers, loading, suggestLoading, mappingLoading } =
    useAppSelector((state) => state.speaker);

  const [localMappings, setLocalMappings] = useState<
    Record<number, number | null>
  >({});

  // Load data when modal opens
  useEffect(() => {
    if (open) {
      dispatch(fetchSpeakers(presentationId));
      dispatch(fetchGroupMembers(presentationId));
    }
  }, [open, presentationId, dispatch]);

  // Pre-populate localMappings from already-mapped speakers
  useEffect(() => {
    const initial: Record<number, number | null> = {};
    speakers.forEach((s) => {
      if (s.isMapped && s.studentId) {
        initial[s.speakerId] = s.studentId;
      }
    });
    setLocalMappings(initial);
  }, [speakers]);

  // When suggestions arrive, fill dropdowns that aren't set yet
  useEffect(() => {
    if (suggestions.length === 0) return;
    setLocalMappings((prev) => {
      const next = { ...prev };
      suggestions.forEach((s) => {
        if (next[s.speakerId] === undefined || next[s.speakerId] === null) {
          next[s.speakerId] = s.suggestedStudent.userId;
        }
      });
      return next;
    });
  }, [suggestions]);

  const handleAutoSuggest = async () => {
    await dispatch(fetchSuggestions(presentationId));
  };

  const handleSave = async () => {
    const mappings = Object.entries(localMappings)
      .filter(([, sId]) => sId !== null)
      .map(([spId, sId]) => ({
        speakerId: Number(spId),
        studentId: sId as number,
      }));

    if (mappings.length === 0) {
      message.warning("Chưa chọn sinh viên nào");
      return;
    }

    const result = await dispatch(batchMapSpeakers(mappings));
    if (batchMapSpeakers.fulfilled.match(result)) {
      message.success("Đã lưu ánh xạ thành công");
      dispatch(fetchSpeakers(presentationId));
    } else {
      message.error(
        (result.payload as string) ?? "Lỗi khi lưu ánh xạ"
      );
    }
  };

  const handleUnmap = async (speakerId: number) => {
    const result = await dispatch(unmapSpeaker(speakerId));
    if (unmapSpeaker.fulfilled.match(result)) {
      setLocalMappings((prev) => ({ ...prev, [speakerId]: null }));
      message.success("Đã hủy ánh xạ");
    } else {
      message.error((result.payload as string) ?? "Lỗi khi hủy ánh xạ");
    }
  };

  const memberOptions = groupMembers.map((m) => ({
    value: m.userId,
    label:
      m.role === "leader"
        ? `${m.firstName} ${m.lastName} (Trưởng nhóm)`
        : `${m.firstName} ${m.lastName}`,
  }));

  const columns: ColumnsType<Speaker> = [
    {
      title: "Diễn giả AI",
      dataIndex: "aiSpeakerLabel",
      key: "aiSpeakerLabel",
      render: (label: string) => <Tag color="blue">{label}</Tag>,
    },
    {
      title: "Thời lượng",
      dataIndex: "totalDurationSeconds",
      key: "duration",
      render: (s: number) => formatDuration(s ?? 0),
    },
    {
      title: "Phân đoạn",
      dataIndex: "segmentCount",
      key: "segmentCount",
    },
    {
      title: "Trạng thái",
      key: "status",
      render: (_: unknown, record: Speaker) =>
        record.isMapped ? (
          <Tag color="success" icon={<CheckCircleOutlined />}>
            Đã ánh xạ
          </Tag>
        ) : (
          <Tag>Chưa ánh xạ</Tag>
        ),
    },
    {
      title: "Sinh viên",
      key: "student",
      render: (_: unknown, record: Speaker) => (
        <Select
          style={{ minWidth: 200 }}
          placeholder="Chọn sinh viên"
          allowClear
          options={memberOptions}
          value={
            localMappings[record.speakerId] !== undefined
              ? localMappings[record.speakerId] ?? undefined
              : record.studentId ?? undefined
          }
          onChange={(val: number | undefined) =>
            setLocalMappings((prev) => ({
              ...prev,
              [record.speakerId]: val ?? null,
            }))
          }
        />
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      render: (_: unknown, record: Speaker) =>
        record.isMapped ? (
          <Button
            size="small"
            danger
            loading={mappingLoading}
            onClick={() => handleUnmap(record.speakerId)}
          >
            Hủy
          </Button>
        ) : null,
    },
  ];

  return (
    <Modal
      title="Ánh xạ diễn giả → Sinh viên"
      open={open}
      onCancel={onClose}
      footer={null}
      width={820}
      centered
      destroyOnClose
    >
      <Space
        style={{ width: "100%", justifyContent: "space-between", marginBottom: 16 }}
        align="center"
      >
        <Text type="secondary">
          Chọn sinh viên tương ứng cho mỗi diễn giả AI được phát hiện
        </Text>
        <Space>
          <Button
            icon={<BulbOutlined />}
            loading={suggestLoading}
            onClick={handleAutoSuggest}
          >
            Tự động gợi ý
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={mappingLoading}
            onClick={handleSave}
          >
            Lưu ánh xạ
          </Button>
        </Space>
      </Space>

      <Table
        dataSource={speakers}
        columns={columns}
        rowKey="speakerId"
        loading={loading}
        pagination={false}
        size="middle"
      />
    </Modal>
  );
};

export default SpeakerMappingModal;
