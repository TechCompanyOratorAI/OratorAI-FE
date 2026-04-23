import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Card,
  Input,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  Eye,
  FileText,
  Search,
  User,
  BookOpen,
  Clock3,
} from "lucide-react";
import SidebarInstructor from "@/components/Sidebar/SidebarInstructor/SidebarInstructor";
import { useAppDispatch, useAppSelector } from "@/services/store/store";
import { fetchInstructorPresentations } from "@/services/features/presentation/presentationSlice";

const { Text, Title } = Typography;

type InstructorPresentation = {
  presentationId: number;
  title: string;
  description?: string | null;
  status: "draft" | "submitted" | "processing" | "done" | "failed";
  durationSeconds?: number | null;
  submissionDate?: string | null;
  createdAt: string;
  student?: {
    userId: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  class?: {
    classId: number;
    classCode: string;
    className?: string;
  };
  topic?: {
    topicId: number;
    topicName: string;
  };
  submission?: {
    reportId?: number;
    overallScore?: number | null;
    gradeForInstructor?: number | null;
    reportStatus?: string | null;
  } | null;
};

const statusMeta: Record<
  InstructorPresentation["status"],
  { label: string; color: string }
> = {
  draft: { label: "Nháp", color: "default" },
  submitted: { label: "Đã nộp", color: "processing" },
  processing: { label: "Đang xử lý", color: "warning" },
  done: { label: "Hoàn thành", color: "success" },
  failed: { label: "Thất bại", color: "error" },
};

const InstructorPresentationsPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { presentations, total, loading } = useAppSelector(
    (state) => state.presentation,
  );

  const [searchValue, setSearchValue] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearchQuery(searchValue.trim());
      setPage(1);
    }, 350);

    return () => window.clearTimeout(timer);
  }, [searchValue]);

  useEffect(() => {
    dispatch(
      fetchInstructorPresentations({
        search: searchQuery || undefined,
        status,
        page,
        limit: pageSize,
      }),
    );
  }, [dispatch, page, pageSize, searchQuery, status]);

  const dataSource = useMemo(
    () => presentations as InstructorPresentation[],
    [presentations],
  );

  const columns: ColumnsType<InstructorPresentation> = [
    {
      title: "Bài thuyết trình",
      dataIndex: "title",
      key: "title",
      render: (_, record) => (
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: "#DBEAFE",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <FileText size={18} color="#2563EB" />
          </div>
          <div style={{ minWidth: 0 }}>
            <Text strong style={{ display: "block", fontSize: 14 }}>
              {record.title}
            </Text>
            {record.description && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                {record.description}
              </Text>
            )}
          </div>
        </div>
      ),
    },
    {
      title: "Sinh viên",
      key: "student",
      render: (_, record) => (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <User size={14} color="#64748B" />
          <div>
            <Text style={{ display: "block", fontSize: 13 }}>
              {record.student
                ? `${record.student.firstName || ""} ${record.student.lastName || ""}`.trim()
                : "—"}
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.student?.email || ""}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: "Lớp / Chủ đề",
      key: "classTopic",
      render: (_, record) => (
        <div>
          <Tag color="blue" style={{ marginBottom: 6 }}>
            {record.class?.classCode || "Không có lớp"}
          </Tag>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <BookOpen size={13} color="#64748B" />
            <Text style={{ fontSize: 13 }}>
              {record.topic?.topicName || "Chưa có chủ đề"}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: "Trạng thái",
      key: "status",
      render: (_, record) => (
        <Tag color={statusMeta[record.status]?.color || "default"}>
          {statusMeta[record.status]?.label || record.status}
        </Tag>
      ),
    },
    {
      title: "Thời lượng",
      key: "duration",
      render: (_, record) => (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Clock3 size={13} color="#64748B" />
          <Text style={{ fontSize: 13 }}>
            {record.durationSeconds
              ? `${Math.floor(record.durationSeconds / 60)}m ${record.durationSeconds % 60}s`
              : "—"}
          </Text>
        </div>
      ),
    },
    {
      title: "Điểm",
      key: "score",
      render: (_, record) => {
        const score = record.submission?.gradeForInstructor;
        return (
          <Text strong style={{ color: score != null ? "#0369A1" : "#94A3B8" }}>
            {score != null ? Number(score).toFixed(1) : "—"}
          </Text>
        );
      },
    },
    {
      title: "Hành động",
      key: "actions",
      render: (_, record) => (
        <Button
          type="text"
          icon={<Eye size={14} />}
          onClick={() => navigate(`/instructor/presentation/${record.presentationId}`)}
        >
          Xem
        </Button>
      ),
    },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarInstructor activeItem="presentations" />
      <main className="flex-1 overflow-y-auto">
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "24px 16px 32px" }}>
          <Card
            style={{
              borderRadius: 20,
              border: "none",
              boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
              marginBottom: 16,
            }}
            styles={{ body: { padding: 24 } }}
          >
            <Title level={3} style={{ margin: 0 }}>
              Bài thuyết trình
            </Title>
            <Text type="secondary">
              Toàn bộ bài thuyết trình thuộc các lớp bạn đang phụ trách.
            </Text>

            <Space wrap style={{ marginTop: 16 }}>
              <Input
                allowClear
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                prefix={<Search size={14} />}
                placeholder="Tìm theo tiêu đề, sinh viên, lớp, chủ đề..."
                style={{ width: 320 }}
              />
              <Select
                allowClear
                placeholder="Lọc trạng thái"
                value={status}
                onChange={(value) => {
                  setStatus(value);
                  setPage(1);
                }}
                style={{ width: 180 }}
                options={[
                  { label: "Nháp", value: "draft" },
                  { label: "Đã nộp", value: "submitted" },
                  { label: "Đang xử lý", value: "processing" },
                  { label: "Hoàn thành", value: "done" },
                  { label: "Thất bại", value: "failed" },
                ]}
              />
            </Space>
          </Card>

          <Card
            style={{
              borderRadius: 20,
              border: "none",
              boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
            }}
            styles={{ body: { padding: 16 } }}
          >
            <Table
              rowKey="presentationId"
              loading={loading}
              columns={columns}
              dataSource={dataSource}
              pagination={{
                current: page,
                pageSize,
                total,
                showSizeChanger: true,
                pageSizeOptions: ["12", "20", "50"],
                onChange: (nextPage, nextPageSize) => {
                  setPage(nextPage);
                  setPageSize(nextPageSize);
                },
              }}
            />
          </Card>
        </div>
      </main>
    </div>
  );
};

export default InstructorPresentationsPage;
