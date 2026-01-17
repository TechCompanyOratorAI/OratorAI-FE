import React, { useState } from "react";
import SidebarAdmin from "@/components/Sidebar/SidebarAdmin/SidebarAdmin";
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
import { Table, Progress, Select, Slider, Input } from "antd";
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
      title: "Student",
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
      title: "Topic",
      dataIndex: "topic",
      key: "topic",
      width: 274,
      render: (text: string) => (
        <span className="text-sm text-gray-900">{text}</span>
      ),
    },
    {
      title: "Duration",
      dataIndex: "duration",
      key: "duration",
      width: 141,
      render: (text: string) => (
        <span className="text-sm text-gray-700">{text}</span>
      ),
    },
    {
      title: "AI Score",
      dataIndex: "aiScore",
      key: "aiScore",
      width: 133,
      render: (text: string) => (
        <span className="text-sm text-gray-900">{text}</span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 162,
      render: (status: string) => (
        <div
          className={`inline-flex items-center px-3 py-1 rounded ${
            status === "completed"
              ? "bg-green-50 text-green-700"
              : "bg-orange-50 text-orange-700"
          }`}
        >
          <span className="text-xs font-medium capitalize">{status}</span>
        </div>
      ),
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
                  Home
                </Link>
                <span>/</span>
                <span className="text-gray-900">Admin Dashboard</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                System Overview
              </h1>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Button
                text="Export Report"
                variant="secondary"
                icon={<Download className="w-4 h-4" />}
                iconPosition="left"
                fontSize="16px"
                paddingWidth="17px"
                paddingHeight="9px"
                borderRadius="8px"
              />
              <Button
                text="New User"
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
              {/* System Health */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-700">
                    System Health
                  </h3>
                  <Activity className="w-6 h-6 text-gray-400" />
                </div>
                <div className="flex items-baseline gap-3 mb-4">
                  <span className="text-3xl font-bold text-gray-900">99.9%</span>
                  <span className="px-2 py-1 bg-green-50 text-green-700 text-xs font-medium rounded">
                    +0.1%
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  Uptime over last 30 days
                </p>
              </div>

              {/* Active Users */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-700">
                    Active Users
                  </h3>
                  <Users className="w-6 h-6 text-gray-400" />
                </div>
                <div className="flex items-baseline gap-3 mb-4">
                  <span className="text-3xl font-bold text-gray-900">1,245</span>
                  <span className="px-2 py-1 bg-green-50 text-green-700 text-xs font-medium rounded">
                    +12%
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  Active students & faculty this week
                </p>
              </div>

              {/* AI Processing Load */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-700">
                    AI Processing Load
                  </h3>
                  <Cpu className="w-6 h-6 text-gray-400" />
                </div>
                <div className="flex items-baseline gap-3 mb-4">
                  <span className="text-3xl font-bold text-gray-900">78%</span>
                  <span className="px-2 py-1 bg-orange-50 text-orange-700 text-xs font-medium rounded">
                    High Load
                  </span>
                </div>
                <div className="mt-2">
                  <Progress
                    percent={78}
                    showInfo={false}
                    strokeColor="#f97316"
                    className="[&_.ant-progress-bg]:bg-orange-100"
                  />
                </div>
              </div>
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
                        Recent Presentations Analyzed
                      </h3>
                      <p className="text-sm text-gray-500">
                        Live feed of student submissions processed by the AI.
                      </p>
                    </div>
                    <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                      View All Logs
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
                      System Throughput
                    </h3>
                    <Select
                      defaultValue="24h"
                      suffixIcon={<ChevronDown className="w-4 h-4" />}
                      className="w-[111px]"
                      options={[
                        { value: "24h", label: "Last 24 Hours" },
                        { value: "7d", label: "Last 7 Days" },
                        { value: "30d", label: "Last 30 Days" },
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
                        AI Configuration
                      </h3>
                      <p className="text-xs text-gray-500">
                        Active Model Settings
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* LLM Model Provider */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        LLM Model Provider
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
                          Temperature
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
                        Controls randomness in analysis feedback.
                      </p>
                    </div>

                    {/* System Prompt Tuning */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        System Prompt Tuning
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
                        text="Apply Changes"
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
                    Pending Approvals
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
                          <p className="text-xs text-gray-500">Faculty Access</p>
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
                          <p className="text-xs text-gray-500">Admin Access</p>
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
                      text="Manage All Users"
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

