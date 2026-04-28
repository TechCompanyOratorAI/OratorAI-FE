import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import SidebarInstructor from "@/components/Sidebar/SidebarInstructor/SidebarInstructor";import {
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  BookOpen,
  User,
} from "lucide-react";
import {
  Table,
  Card,
  Button,
  Tag,
  Space,
  Typography,
  Segmented,
  Empty,
  Spin,
  Popconfirm,
  message,
  Tooltip,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useAppDispatch, useAppSelector } from "@/services/store/store";
import {
  fetchPendingApprovals,
  fetchApprovedPresentations,
  approvePresentation,
  unapprovePresentation,
} from "@/services/features/instructor/instructorApprovalSlice";
import { getErrorMessage, getResponseMessage } from "@/lib/toast";

const { Text } = Typography;

const timeAgo = (dateStr: string): string => {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return "Vừa xong";
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  if (diff < 172800) return "Hôm qua";
  return `${Math.floor(diff / 86400)} ngày trước`;
};

interface PendingPresentation {
  presentationId: number;
  title: string;
  description: string | null;
  status: string;
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
    className: string;
  };
  course?: {
    courseId: number;
    courseCode: string;
    courseName: string;
  };
}

const InstructorApprovalPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const {
    pendingPresentations,
    approvedPresentations,
    totalPending,
    totalApproved,
    loading,
    approvingIds,
  } = useAppSelector((state) => state.instructorApproval);

  const [activeTab, setActiveTab] = useState<"pending" | "approved">("pending");

  useEffect(() => {
    dispatch(fetchPendingApprovals());
    dispatch(fetchApprovedPresentations());
  }, [dispatch]);

  const handleApprove = async (presentationId: number) => {
    try {
      const result = await dispatch(
        approvePresentation({ presentationId }),
      ).unwrap();
      message.success(getResponseMessage(result, "Duyệt thành công!"));
    } catch (error) {
      message.error(getErrorMessage(error, "Duyệt thất bại"));
    }
  };

  const handleUnapprove = async (presentationId: number) => {
    try {
      const result = await dispatch(
        unapprovePresentation(presentationId),
      ).unwrap();
      message.success(getResponseMessage(result, "Đã huỷ duyệt!"));
    } catch (error) {
      message.error(getErrorMessage(error, "Huỷ duyệt thất bại"));
    }
  };

  const pendingColumns: ColumnsType<PendingPresentation> = [
    {
      title: "Bài thuyết trình",
      key: "presentation",
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-sky-100 to-blue-100 flex items-center justify-center">
            <FileText className="w-5 h-5 text-sky-600" />
          </div>
          <div>
            <p className="font-semibold text-slate-900 line-clamp-1">
              {record.title}
            </p>
            {record.description && (
              <p className="text-xs text-slate-500 line-clamp-1">
                {record.description}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      title: "Sinh viên",
      key: "student",
      render: (_, record) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
            <User className="w-4 h-4 text-slate-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-900">
              {record.student?.firstName} {record.student?.lastName}
            </p>
            <p className="text-xs text-slate-500">{record.student?.email}</p>
          </div>
        </div>
      ),
    },
    {
      title: "Lớp",
      key: "class",
      render: (_, record) => (
        <div>
          {record.class ? (
            <Tag icon={<BookOpen className="w-3 h-3" />} color="blue">
              {record.class.classCode}
            </Tag>
          ) : (
            <Text type="secondary">-</Text>
          )}
        </div>
      ),
    },
    {
      title: "Khóa học",
      key: "course",
      render: (_, record) => (
        <div>
          {record.course ? (
            <Text className="text-sm">{record.course.courseName}</Text>
          ) : (
            <Text type="secondary">-</Text>
          )}
        </div>
      ),
    },
    {
      title: "Trạng thái",
      key: "status",
      render: (_, record) => (
        <Tag
          icon={<Clock className="w-3 h-3" />}
          color="default"
          className="!text-xs"
        >
          {record.status === "draft" ? "Nháp" : "Đã nộp"}
        </Tag>
      ),
    },
    {
      title: "Thời gian",
      key: "createdAt",
      render: (_, record) => (
        <Tooltip title={new Date(record.createdAt).toLocaleString("vi-VN")}>
          <Text className="text-sm text-slate-500">{timeAgo(record.createdAt)}</Text>
        </Tooltip>
      ),
    },
    {
      title: "Hành động",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<Eye className="w-4 h-4" />}
            onClick={() => navigate(`/student/presentation/${record.presentationId}`)}
            className="text-sky-600 hover:text-sky-700 hover:bg-sky-50"
          >
            Xem
          </Button>
          <Popconfirm
            title="Duyệt cho nộp bài?"
            description="Sinh viên sẽ có thể nộp bài thuyết trình sau khi duyệt."
            okText="Duyệt"
            cancelText="Hủy"
            onConfirm={() => handleApprove(record.presentationId)}
            okButtonProps={{
              loading: approvingIds.includes(record.presentationId),
            }}
          >
            <Button
              type="primary"
              icon={<CheckCircle className="w-4 h-4" />}
              style={{
                background: "linear-gradient(135deg, #10b981, #059669)",
                borderColor: "#10b981",
              }}
              loading={approvingIds.includes(record.presentationId)}
            >
              Duyệt
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const approvedColumns: ColumnsType<PendingPresentation> = [
    {
      title: "Bài thuyết trình",
      key: "presentation",
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-100 to-green-100 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="font-semibold text-slate-900 line-clamp-1">
              {record.title}
            </p>
            {record.description && (
              <p className="text-xs text-slate-500 line-clamp-1">
                {record.description}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      title: "Sinh viên",
      key: "student",
      render: (_, record) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
            <User className="w-4 h-4 text-slate-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-900">
              {record.student?.firstName} {record.student?.lastName}
            </p>
            <p className="text-xs text-slate-500">{record.student?.email}</p>
          </div>
        </div>
      ),
    },
    {
      title: "Lớp",
      key: "class",
      render: (_, record) => (
        <div>
          {record.class ? (
            <Tag icon={<BookOpen className="w-3 h-3" />} color="blue">
              {record.class.classCode}
            </Tag>
          ) : (
            <Text type="secondary">-</Text>
          )}
        </div>
      ),
    },
    {
      title: "Khóa học",
      key: "course",
      render: (_, record) => (
        <div>
          {record.course ? (
            <Text className="text-sm">{record.course.courseName}</Text>
          ) : (
            <Text type="secondary">-</Text>
          )}
        </div>
      ),
    },
    {
      title: "Trạng thái",
      key: "status",
      render: (_) => (
        <Tag
          icon={<CheckCircle className="w-3 h-3" />}
          color="success"
          className="!text-xs"
        >
          Đã duyệt
        </Tag>
      ),
    },
    {
      title: "Thời gian",
      key: "createdAt",
      render: (_, record) => (
        <Tooltip title={new Date(record.createdAt).toLocaleString("vi-VN")}>
          <Text className="text-sm text-slate-500">{timeAgo(record.createdAt)}</Text>
        </Tooltip>
      ),
    },
    {
      title: "Hành động",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<Eye className="w-4 h-4" />}
            onClick={() => navigate(`/student/presentation/${record.presentationId}`)}
            className="text-sky-600 hover:text-sky-700 hover:bg-sky-50"
          >
            Xem
          </Button>
          <Popconfirm
            title="Huỷ duyệt?"
            description="Sinh viên sẽ không thể nộp bài cho đến khi được duyệt lại."
            okText="Huỷ duyệt"
            cancelText="Hủy"
            onConfirm={() => handleUnapprove(record.presentationId)}
            okButtonProps={{
              danger: true,
              loading: approvingIds.includes(record.presentationId),
            }}
          >
            <Button
              danger
              type="text"
              icon={<AlertCircle className="w-4 h-4" />}
              loading={approvingIds.includes(record.presentationId)}
            >
              Huỷ duyệt
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      <SidebarInstructor />
      <main className="flex-1 ml-64 p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Duyệt nộp bài
              </h1>
              <p className="text-slate-500 mt-1">
                Quản lý và duyệt các bài thuyết trình trước khi sinh viên nộp
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Pending Card */}
          <Card
            className="!border-orange-200 !bg-gradient-to-br from-orange-50 to-amber-50"
            styles={{ body: { padding: "20px" } }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 font-medium">Chờ duyệt</p>
                <p className="text-3xl font-bold text-orange-600 mt-1">
                  {totalPending}
                </p>
                <p className="text-xs text-slate-500 mt-1">bài thuyết trình</p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-orange-100 flex items-center justify-center">
                <Clock className="w-7 h-7 text-orange-600" />
              </div>
            </div>
          </Card>

          {/* Approved Card */}
          <Card
            className="!border-emerald-200 !bg-gradient-to-br from-emerald-50 to-green-50"
            styles={{ body: { padding: "20px" } }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 font-medium">Đã duyệt</p>
                <p className="text-3xl font-bold text-emerald-600 mt-1">
                  {totalApproved}
                </p>
                <p className="text-xs text-slate-500 mt-1">bài thuyết trình</p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center">
                <CheckCircle className="w-7 h-7 text-emerald-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <Card
          className="!rounded-2xl !shadow-sm"
          styles={{ body: { padding: "0" } }}
        >
          <div className="p-4 border-b border-slate-100">
            <Segmented
              value={activeTab}
              onChange={(value) => setActiveTab(value as "pending" | "approved")}
              options={[
                {
                  label: (
                    <div className="flex items-center gap-2 px-2">
                      <Clock className="w-4 h-4" />
                      <span>Chờ duyệt ({totalPending})</span>
                    </div>
                  ),
                  value: "pending",
                },
                {
                  label: (
                    <div className="flex items-center gap-2 px-2">
                      <CheckCircle className="w-4 h-4" />
                      <span>Đã duyệt ({totalApproved})</span>
                    </div>
                  ),
                  value: "approved",
                },
              ]}
              className="!bg-slate-100"
            />
          </div>

          <div className="p-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Spin size="large" />
              </div>
            ) : activeTab === "pending" ? (
              pendingPresentations.length === 0 ? (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <span className="text-slate-500">
                      Không có bài thuyết trình nào chờ duyệt
                    </span>
                  }
                  className="py-12"
                >
                  <Tag icon={<CheckCircle className="w-4 h-4" />} color="success">
                    Tất cả đã được duyệt!
                  </Tag>
                </Empty>
              ) : (
                <Table
                  columns={pendingColumns}
                  dataSource={pendingPresentations}
                  rowKey="presentationId"
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showTotal: (total) => `Tổng ${total} bài`,
                  }}
                  className="!text-sm"
                />
              )
            ) : approvedPresentations.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <span className="text-slate-500">
                    Chưa có bài thuyết trình nào được duyệt
                  </span>
                }
                className="py-12"
              />
            ) : (
              <Table
                columns={approvedColumns}
                dataSource={approvedPresentations}
                rowKey="presentationId"
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showTotal: (total) => `Tổng ${total} bài`,
                }}
                className="!text-sm"
              />
            )}
          </div>
        </Card>
      </main>
    </div>
  );
};

export default InstructorApprovalPage;
