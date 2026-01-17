import React from "react";
import SidebarStudent from "@/components/Sidebar/SidebarStudent/SidebarStudent";
import Button from "@/components/yoodli/Button";
import {
  Upload,
  TrendingUp,
  Gauge,
  CheckCircle2,
  FileText,
  Clock,
  ArrowRight,
} from "lucide-react";
import { Progress, Table } from "antd";
import type { ColumnsType } from "antd/es/table";

interface Recording {
  key: string;
  title: string;
  course: string;
  date: string;
  status: "analyzed" | "processing";
  action: string;
}

const StudentDashboardPage: React.FC = () => {
  const columns: ColumnsType<Recording> = [
    {
      title: "Presentation Title",
      dataIndex: "title",
      key: "title",
      width: 394,
      render: (text: string) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gray-100 rounded flex items-center justify-center">
            <FileText className="w-5 h-5 text-gray-600" />
          </div>
          <span className="text-sm text-gray-900">{text}</span>
        </div>
      ),
    },
    {
      title: "Course",
      dataIndex: "course",
      key: "course",
      width: 149,
      render: (text: string) => (
        <span className="text-sm text-gray-700">{text}</span>
      ),
    },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      width: 187,
      render: (text: string) => (
        <span className="text-sm text-gray-700">{text}</span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 214,
      render: (status: string) => (
        <div
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded ${
            status === "analyzed"
              ? "bg-blue-50 text-blue-700 border border-blue-200"
              : "bg-orange-50 text-orange-700 border border-orange-200"
          }`}
        >
          {status === "analyzed" ? (
            <CheckCircle2 className="w-3.5 h-3.5" />
          ) : (
            <Clock className="w-3.5 h-3.5 animate-spin" />
          )}
          <span className="text-xs font-medium capitalize">{status}</span>
        </div>
      ),
    },
    {
      title: "Action",
      key: "action",
      width: 190,
      align: "right",
      render: (_, record) => (
        <div className="flex justify-end">
          <Button
            text={record.status === "analyzed" ? "View Report" : "Check Status"}
            variant={record.status === "analyzed" ? "primary" : "secondary"}
            fontSize="14px"
            borderRadius="6px"
            paddingWidth="12px"
            paddingHeight="6px"
            onClick={() => {}}
          />
        </div>
      ),
    },
  ];

  const data: Recording[] = [
    {
      key: "1",
      title: "Marketing Final Pitch",
      course: "BUS101",
      date: "Oct 24, 2023",
      status: "analyzed",
      action: "View Report",
    },
    {
      key: "2",
      title: "Thesis Draft 1",
      course: "ENG400",
      date: "Oct 22, 2023",
      status: "processing",
      action: "Check Status",
    },
    {
      key: "3",
      title: "Persuasive Speech Practice",
      course: "COM202",
      date: "Oct 15, 2023",
      status: "analyzed",
      action: "View Report",
    },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <SidebarStudent activeItem="dashboard" />

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6 sm:mb-8">
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-[32px] font-bold text-gray-900 mb-2">
                  Welcome back, Sarah
                </h1>
                <p className="text-sm sm:text-base text-gray-600">
                  Here is an overview of your recent presentation performance.
                </p>
              </div>
              <div className="w-full sm:w-auto">
                <Button
                  text="Upload New Presentation"
                  variant="primary"
                  fontSize="14px"
                  borderRadius="8px"
                  paddingWidth="20px"
                  paddingHeight="8px"
                  icon={<Upload className="w-5 h-5" />}
                  iconPosition="left"
                  onClick={() => {}}
                />
              </div>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
              {/* Overall Score */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Overall Score</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-gray-900">88</span>
                      <span className="text-xl text-gray-500">/100</span>
                    </div>
                  </div>
                  <div className="relative w-16 h-16">
                    <Progress
                      type="circle"
                      percent={88}
                      strokeColor={{
                        "0%": "#0ea5e9",
                        "100%": "#6366f1",
                      }}
                      strokeWidth={6}
                      size={64}
                      showInfo={false}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-semibold text-gray-900">
                        88%
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>+5% from last week</span>
                </div>
              </div>

              {/* Speaking Pace */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Speaking Pace</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-gray-900">140</span>
                      <span className="text-xl text-gray-500">wpm</span>
                    </div>
                  </div>
                  <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                    <Gauge className="w-5 h-5 text-gray-600" />
                  </div>
                </div>
                <div className="mb-2">
                  <Progress
                    percent={70}
                    strokeColor={{
                      "0%": "#0ea5e9",
                      "100%": "#6366f1",
                    }}
                    showInfo={false}
                    strokeWidth={6}
                  />
                </div>
                <p className="text-xs text-gray-600">
                  Optimal Range (130-150 wpm)
                </p>
              </div>

              {/* Filler Words */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Filler Words</p>
                    <p className="text-2xl font-bold text-gray-900">Low Usage</p>
                  </div>
                  <div className="w-10 h-10 bg-green-100 rounded flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  </div>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Great job! You used fewer "um"s and "ah"s than 90% of
                  students.
                </p>
              </div>
            </div>

            {/* Recent Recordings */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-4">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                  Recent Recordings
                </h2>
                <a
                  href="#"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                >
                  View All
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-x-auto">
                <Table
                  columns={columns}
                  dataSource={data}
                  pagination={false}
                  scroll={{ x: 'max-content' }}
                  className="[&_.ant-table-thead>tr>th]:bg-gray-50 [&_.ant-table-thead>tr>th]:text-gray-700 [&_.ant-table-thead>tr>th]:font-semibold [&_.ant-table-thead>tr>th]:text-sm [&_.ant-table-thead>tr>th]:border-b [&_.ant-table-thead>tr>th]:px-3 [&_.ant-table-thead>tr>th]:sm:px-6 [&_.ant-table-thead>tr>th]:py-3 [&_.ant-table-thead>tr>th]:sm:py-4 [&_.ant-table-tbody>tr>td]:px-3 [&_.ant-table-tbody>tr>td]:sm:px-6 [&_.ant-table-tbody>tr>td]:py-3 [&_.ant-table-tbody>tr>td]:sm:py-4 [&_.ant-table-tbody>tr]:border-b [&_.ant-table-tbody>tr]:border-gray-100 [&_.ant-table-tbody>tr:hover]:bg-gray-50"
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentDashboardPage;

