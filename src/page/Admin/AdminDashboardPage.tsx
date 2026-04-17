import React, { useState } from "react";
import SidebarAdmin from "@/components/Sidebar/SidebarAdmin/SidebarAdmin";
import SummaryMetrics, {
  SummaryMetricItem,
} from "@/components/Dashboard/SummaryMetrics";
import Button from "@/components/yoodli/Button";
import {
  Download,
  UserPlus,
  Activity,
  Users,
  Cpu,
  ChevronDown,
  Check,
  X,
  Cog,
} from "lucide-react";
import { Table, Select, Slider, Input } from "antd";
import type { ColumnsType } from "antd/es/table";
import { Link } from "react-router-dom";

interface Presentation {
  key: string;
  student: {
    name: string;
    id: string;
    initials: string;
  };
  topic: string;
  duration: string;
  aiScore: string;
  status: "completed" | "processing";
}

const AdminDashboardPage: React.FC = () => {
  const [temperature, setTemperature] = useState(0.7);
  const [systemPrompt, setSystemPrompt] = useState(
    "You are an expert academic evaluator. Focus on clarity, pacing, and visual aid relevance..."
  );

  const columns: ColumnsType<Presentation> = [
    {
      title: "Sinh viên",
      dataIndex: "student",
      key: "student",
      width: 213,
      render: (student: Presentation["student"]) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
            <span className="text-xs font-medium text-gray-700">
              {student.initials}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{student.name}</p>
            <p className="text-xs text-gray-500">ID: {student.id}</p>
          </div>
        </div>
      ),
    },
    {
      title: "Chủ đề",
      dataIndex: "topic",
      key: "topic",
      width: 274,
      render: (text: string) => (
        <span className="text-sm text-gray-900">{text}</span>
      ),
    },
    {
      title: "Thời lượng",
      dataIndex: "duration",
      key: "duration",
      width: 141,
      render: (text: string) => (
        <span className="text-sm text-gray-700">{text}</span>
      ),
    },
    {
      title: "Điểm AI",
      dataIndex: "aiScore",
      key: "aiScore",
      width: 133,
      render: (text: string) => (
        <span className="text-sm text-gray-900">{text}</span>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 162,
      render: (status: string) => {
        const label = status === "completed" ? "Hoàn thành" : "Đang xử lý";
        return (
          <div
            className={`inline-flex items-center px-3 py-1 rounded ${status === "completed"
              ? "bg-green-50 text-green-700"
              : "bg-orange-50 text-orange-700"
              }`}
          >
            <span className="text-xs font-medium">{label}</span>
          </div>
        );
      },
    },
  ];

  const presentations: Presentation[] = [
    {
      key: "1",
      student: {
        name: "John Doe",
        id: "2024001",
        initials: "JD",
      },
      topic: "Intro to Neural Networks",
      duration: "12m 30s",
      aiScore: "88/100",
      status: "completed",
    },
    {
      key: "2",
      student: {
        name: "Alice Smith",
        id: "2024045",
        initials: "AS",
      },
      topic: "History of Renaissance Art",
      duration: "--",
      aiScore: "--",
      status: "processing",
    },
    {
      key: "3",
      student: {
        name: "Michael Kim",
        id: "2024102",
        initials: "MK",
      },
      topic: "Global Economics 101",
      duration: "45m 00s",
      aiScore: "92/100",
      status: "completed",
    },
  ];

  // Mock data for bar chart (simplified representation)
  const chartData = [
    { value: 90, height: "89.59px" },
    { value: 134, height: "134.39px" },
    { value: 101, height: "100.8px" },
    { value: 157, height: "156.8px" },
    { value: 123, height: "123.19px" },
    { value: 179, height: "179.19px" },
    { value: 146, height: "145.59px" },
    { value: 202, height: "201.59px" },
    { value: 168, height: "168px" },
    { value: 112, height: "112px" },
  ];

  const summaryItems: SummaryMetricItem[] = [
    {
      key: "health",
      title: "Sức khỏe hệ thống",
      value: "99.9%",
      icon: <Activity className="w-5 h-5" />,
      tone: "green",
      deltaLabel: "+0.1%",
      deltaType: "success",
      description: "Uptime 30 ngày",
      progress: 99.9,
    },
    {
      key: "users",
      title: "Người dùng hoạt động",
      value: "1,245",
      icon: <Users className="w-5 h-5" />,
      tone: "blue",
      deltaLabel: "+12%",
      deltaType: "success",
      description: "Tuần hiện tại",
    },
    {
      key: "ai-load",
      title: "Tải xử lý AI",
      value: "78%",
      icon: <Cpu className="w-5 h-5" />,
      tone: "amber",
      deltaLabel: "Tải cao",
      deltaType: "warning",
      description: "13 hàng đợi",
      progress: 78,
    },
    {
      key: "processed",
      title: "Bài đã phân tích",
      value: 324,
      icon: <Cog className="w-5 h-5" />,
      tone: "purple",
      deltaLabel: "+24 hôm nay",
      deltaType: "default",
      description: "Cập nhật theo thời gian thực",
    },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      <SidebarAdmin activeItem="dashboard" />
      <main className="flex-1 overflow-y-auto lg:ml-0">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 mb-2">
                <Link to="/" className="hover:text-gray-900">
                  Trang chủ
                </Link>
                <span>/</span>
                <span className="text-gray-900">Bảng điều khiển quản trị</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                Tổng quan hệ thống
              </h1>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Button
                text="Xuất báo cáo"
                variant="secondary"
                icon={<Download className="w-4 h-4" />}
                iconPosition="left"
                fontSize="16px"
                paddingWidth="17px"
                paddingHeight="9px"
                borderRadius="8px"
              />
              <Button
                text="Người dùng mới"
                variant="primary"
                icon={<UserPlus className="w-4 h-4" />}
                iconPosition="left"
                fontSize="16px"
                paddingWidth="16px"
                paddingHeight="8px"
                borderRadius="8px"
              />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-[1400px] mx-auto">
            {/* Metric Cards */}
            <div className="mb-6">
              <SummaryMetrics items={summaryItems} />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_450px] gap-6">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Recent Presentations Table */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                  <div className="px-6 py-6 border-b border-gray-200 flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        Bài thuyết trình được phân tích gần đây
                      </h3>
                      <p className="text-sm text-gray-500">
                        Luồng trực tiếp các bài nộp của sinh viên do AI xử lý.
                      </p>
                    </div>
                    <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                      Xem toàn bộ nhật ký
                    </button>
                  </div>
                  <Table
                    columns={columns}
                    dataSource={presentations}
                    pagination={false}
                    className="[&_.ant-table-thead>tr>th]:bg-gray-50 [&_.ant-table-thead>tr>th]:text-gray-700 [&_.ant-table-thead>tr>th]:font-semibold [&_.ant-table-thead>tr>th]:text-sm [&_.ant-table-thead>tr>th]:border-b [&_.ant-table-thead>tr>th]:px-6 [&_.ant-table-thead>tr>th]:py-4 [&_.ant-table-tbody>tr>td]:px-6 [&_.ant-table-tbody>tr>td]:py-4 [&_.ant-table-tbody>tr]:border-b [&_.ant-table-tbody>tr]:border-gray-100"
                  />
                </div>

                {/* System Throughput Chart */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Thông lượng hệ thống
                    </h3>
                    <Select
                      defaultValue="24h"
                      suffixIcon={<ChevronDown className="w-4 h-4" />}
                      className="w-[111px]"
                      options={[
                        { value: "24h", label: "24 giờ qua" },
                        { value: "7d", label: "7 ngày qua" },
                        { value: "30d", label: "30 ngày qua" },
                      ]}
                    />
                  </div>
                  {/* Simplified Bar Chart */}
                  <div className="h-64 flex items-end gap-2">
                    {chartData.map((bar, index) => (
                      <div
                        key={index}
                        className="flex-1 bg-gradient-to-t from-blue-500 to-blue-400 rounded-t"
                        style={{ height: bar.height }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* AI Configuration */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-blue-50 rounded flex items-center justify-center">
                      <Cog className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Cấu hình AI
                      </h3>
                      <p className="text-xs text-gray-500">
                        Thiết lập mô hình đang hoạt động
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* LLM Model Provider */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nhà cung cấp mô hình LLM
                      </label>
                      <Select
                        defaultValue="gpt-4-turbo"
                        suffixIcon={<ChevronDown className="w-4 h-4" />}
                        className="w-full"
                        options={[
                          { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
                          { value: "gpt-4", label: "GPT-4" },
                          { value: "gpt-3.5", label: "GPT-3.5" },
                        ]}
                      />
                    </div>

                    {/* Temperature */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Độ ngẫu nhiên
                        </label>
                        <span className="text-sm text-gray-600">{temperature}</span>
                      </div>
                      <Slider
                        value={temperature}
                        onChange={setTemperature}
                        min={0}
                        max={1}
                        step={0.1}
                        className="mb-2"
                      />
                      <p className="text-xs text-gray-500">
                        Điều chỉnh mức độ ngẫu nhiên trong phản hồi phân tích.
                      </p>
                    </div>

                    {/* System Prompt Tuning */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tùy chỉnh prompt hệ thống
                      </label>
                      <Input.TextArea
                        value={systemPrompt}
                        onChange={(e) => setSystemPrompt(e.target.value)}
                        rows={4}
                        className="resize-none"
                      />
                    </div>

                    {/* Apply Changes Button */}
                    <div className="w-full">
                      <Button
                        text="Áp dụng thay đổi"
                        variant="primary"
                        fontSize="16px"
                        paddingWidth="16px"
                        paddingHeight="10px"
                        borderRadius="8px"
                      />
                    </div>
                  </div>
                </div>

                {/* Pending Approvals */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">
                    Chờ phê duyệt
                  </h3>

                  <div className="space-y-4 mb-6">
                    {/* Approval Item 1 */}
                    <div className="flex items-center justify-between py-4 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Dr. Sarah Jenkins
                          </p>
                          <p className="text-xs text-gray-500">Quyền giảng viên</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="w-8 h-8 rounded flex items-center justify-center hover:bg-green-50 text-green-600">
                          <Check className="w-5 h-5" />
                        </button>
                        <button className="w-8 h-8 rounded flex items-center justify-center hover:bg-red-50 text-red-600">
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Approval Item 2 */}
                    <div className="flex items-center justify-between py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Prof. Alan Turing
                          </p>
                          <p className="text-xs text-gray-500">Quyền quản trị</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="w-8 h-8 rounded flex items-center justify-center hover:bg-green-50 text-green-600">
                          <Check className="w-5 h-5" />
                        </button>
                        <button className="w-8 h-8 rounded flex items-center justify-center hover:bg-red-50 text-red-600">
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="w-full">
                    <Button
                      text="Quản lý tất cả người dùng"
                      variant="secondary"
                      fontSize="16px"
                      paddingWidth="16px"
                      paddingHeight="10px"
                      borderRadius="8px"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboardPage;

