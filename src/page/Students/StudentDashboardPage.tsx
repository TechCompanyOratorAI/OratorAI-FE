import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import Button from "@/components/yoodli/Button";
import Toast from "@/components/Toast/Toast";
import PresentationUploadModal from "@/components/Presentation/PresentationUploadModal";
import {
  Upload,
  CheckCircle2,
  FileText,
  Clock,
  ArrowRight,
  Menu,
  X,
  LogOut,
  Bell,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useAppDispatch, useAppSelector } from "@/services/store/store";
import { logout } from "@/services/features/auth/authSlice";
import {
  fetchPresentations,
  setCurrentPresentation,
} from "@/services/features/presentation/presentationSlice";

// Interfaces based on API response
interface Topic {
  topicId: number;
  topicName: string;
  courseId?: number;
}

interface AudioRecord {
  audioId: number;
  presentationId: number;
  filePath: string;
  fileName: string;
  fileFormat: string;
  fileSizeBytes: number;
  durationSeconds: number | null;
  sampleRate: number | null;
  recordingMethod: string;
  uploadedAt: string;
  createdAt: string;
  updatedAt: string;
}

interface Presentation {
  presentationId: number;
  studentId: number;
  courseId: number;
  classId: number | null;
  topicId: number;
  groupCode: string | null;
  title: string;
  description: string;
  submissionDate: string | null;
  status: "draft" | "processing" | "submitted" | "analyzed";
  durationSeconds: number | null;
  visibility: string;
  versionNumber: number;
  createdAt: string;
  updatedAt: string;
  topic?: Topic;
  audioRecord?: AudioRecord;
}

interface Recording extends Presentation {
  key: string;
  courseName: string;
}

const StudentDashboardPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const { presentations, loading, error } = useAppSelector(
    (state) => state.presentation
  );

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedPresentation, setSelectedPresentation] = useState<Presentation | null>(null);

  // Fetch presentations on mount
  useEffect(() => {
    dispatch(fetchPresentations())
      .unwrap()
      .catch((err: string) => {
        setToast({ message: err, type: "error" });
      });
  }, [dispatch]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const fullName = user
    ? `${user.firstName} ${user.lastName}`.trim()
    : "Student";

  const handlePresentationClick = (presentation: Presentation) => {
    setSelectedPresentation(presentation);
    dispatch(setCurrentPresentation(presentation));
    setIsUploadModalOpen(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
      draft: {
        color: "bg-gray-50 text-gray-700 border-gray-200",
        icon: <FileText className="w-3.5 h-3.5" />,
        label: "Draft",
      },
      processing: {
        color: "bg-orange-50 text-orange-700 border-orange-200",
        icon: <Clock className="w-3.5 h-3.5 animate-spin" />,
        label: "Processing",
      },
      submitted: {
        color: "bg-blue-50 text-blue-700 border-blue-200",
        icon: <Clock className="w-3.5 h-3.5" />,
        label: "Submitted",
      },
      analyzed: {
        color: "bg-green-50 text-green-700 border-green-200",
        icon: <CheckCircle2 className="w-3.5 h-3.5" />,
        label: "Analyzed",
      },
    };
    return configs[status] || configs.draft;
  };

  const columns: ColumnsType<Recording> = [
    {
      title: "Presentation Title",
      dataIndex: "title",
      key: "title",
      width: 300,
      render: (text: string, record: Recording) => (
        <div
          className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 -mx-3 px-3 py-2 rounded-lg transition-colors"
          onClick={() => handlePresentationClick(record)}
        >
          <div className="w-9 h-9 bg-gray-100 rounded flex items-center justify-center">
            <FileText className="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <span className="text-sm text-gray-900 block">{text}</span>
            {record.topic && (
              <span className="text-xs text-gray-500">{record.topic.topicName}</span>
            )}
          </div>
        </div>
      ),
    },
    {
      title: "Course",
      dataIndex: "courseName",
      key: "courseName",
      width: 150,
      render: (text: string) => (
        <span className="text-sm text-gray-700">{text || "N/A"}</span>
      ),
    },
    {
      title: "Date",
      dataIndex: "createdAt",
      key: "date",
      width: 130,
      render: (date: string) => (
        <span className="text-sm text-gray-700">{formatDate(date)}</span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 140,
      render: (status: string) => {
        const config = getStatusConfig(status);
        return (
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded border ${config.color}`}>
            {config.icon}
            <span className="text-xs font-medium">{config.label}</span>
          </div>
        );
      },
    },
    {
      title: "Action",
      key: "action",
      width: 180,
      align: "right",
      render: (_, record) => (
        <div className="flex justify-end">
          <Button
            text={record.status === "analyzed" ? "View Report" : record.status === "draft" ? "Upload" : "Check Status"}
            variant={record.status === "analyzed" ? "primary" : record.status === "draft" ? "primary" : "secondary"}
            fontSize="14px"
            borderRadius="6px"
            paddingWidth="12px"
            paddingHeight="6px"
            onClick={() => {
              handlePresentationClick(record);
            }}
          />
        </div>
      ),
    },
  ];

  // Transform presentations to table data
  const tableData: Recording[] = presentations.map((presentation) => ({
    ...presentation,
    key: presentation.presentationId.toString(),
    courseName: presentation.topic?.courseId
      ? `Course ${presentation.topic.courseId}`
      : "N/A",
  }));

  // Calculate statistics
  const stats = {
    total: presentations.length,
    analyzed: presentations.filter((p) => p.status === "analyzed").length,
    processing: presentations.filter((p) => p.status === "processing" || p.status === "submitted").length,
    draft: presentations.filter((p) => p.status === "draft").length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simple Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-sky-500 to-indigo-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">E</span>
              </div>
              <span className="text-lg font-semibold text-gray-900">OratorAI</span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <Link
                to="/student/dashboard"
                className="text-sm font-medium text-gray-900 border-b-2 border-sky-500 pb-1"
              >
                My Learning
              </Link>
              <Link
                to="/student/my-class"
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                My Classes
              </Link>
              <Link
                to="/student/feedback"
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                My Presentations
              </Link>
            </nav>

            {/* User Actions */}
            <div className="flex items-center gap-4">
              <button className="relative p-2 hover:bg-gray-100 rounded-lg">
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 p-1 hover:bg-gray-100 rounded-lg"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 flex items-center justify-center">
                    <span className="text-white font-semibold text-xs">
                      {fullName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-600" />
                </button>
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900">
                        {fullName}
                      </p>
                      <p className="text-xs text-gray-500">Student</p>
                    </div>
                    <Link
                      to="/student/settings"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Settings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Đăng Xuất
                    </button>
                  </div>
                )}
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5 text-gray-600" />
                ) : (
                  <Menu className="w-5 h-5 text-gray-600" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <nav className="px-4 py-3 space-y-1">
              <Link
                to="/student/dashboard"
                className="block px-3 py-2 text-sm font-medium text-gray-900 bg-gray-50 rounded-lg"
              >
                My Learning
              </Link>
              <Link
                to="/student/my-class"
                className="block px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg"
              >
                My Classes
              </Link>
              <Link
                to="/student/feedback"
                className="block px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg"
              >
                My Presentations
              </Link>
              <Link
                to="/student/settings"
                className="block px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg"
              >
                Settings
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Welcome back, {user?.firstName || "Student"}!
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              Track your learning progress and improve your presentation skills.
            </p>
          </div>
          <div className="w-full sm:w-auto">
            <Button
              text="Upload New Presentation"
              variant="primary"
              fontSize="14px"
              borderRadius="8px"
              paddingWidth="20px"
              paddingHeight="10px"
              icon={<Upload className="w-5 h-5" />}
              iconPosition="left"
              onClick={() => {
                // For now, redirect to feedback page where user can see all presentations
                navigate("/student/feedback");
              }}
            />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-600">Total Presentations</span>
              <FileText className="w-5 h-5 text-blue-500" />
            </div>
            <span className="text-3xl font-bold text-gray-900">{stats.total}</span>
            <p className="text-xs text-gray-500 mt-2">All time submissions</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-600">Analyzed</span>
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            </div>
            <span className="text-3xl font-bold text-gray-900">{stats.analyzed}</span>
            <p className="text-xs text-green-600 mt-2">Completed analysis</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-600">Processing</span>
              <Clock className="w-5 h-5 text-orange-500" />
            </div>
            <span className="text-3xl font-bold text-gray-900">{stats.processing}</span>
            <p className="text-xs text-orange-600 mt-2">In progress</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-600">Drafts</span>
              <FileText className="w-5 h-5 text-gray-400" />
            </div>
            <span className="text-3xl font-bold text-gray-900">{stats.draft}</span>
            <p className="text-xs text-gray-500 mt-2">Pending upload</p>
          </div>
        </div>

        {/* Recent Recordings */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Recent Presentations</h2>
            <Link
              to="/student/feedback"
              className="text-sm text-sky-600 hover:text-sky-700 font-medium flex items-center gap-1"
            >
              View All
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 flex flex-col items-center justify-center">
              <Loader2 className="w-10 h-10 text-sky-500 animate-spin mb-4" />
              <p className="text-gray-600">Loading presentations...</p>
            </div>
          ) : error ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 flex flex-col items-center justify-center">
              <p className="text-red-600 mb-4">{error}</p>
              <Button
                text="Retry"
                variant="primary"
                fontSize="14px"
                borderRadius="8px"
                paddingWidth="16px"
                paddingHeight="8px"
                onClick={() => dispatch(fetchPresentations())}
              />
            </div>
          ) : presentations.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 flex flex-col items-center justify-center">
              <FileText className="w-16 h-16 text-gray-300 mb-4" />
              <p className="text-gray-600 mb-2">No presentations yet</p>
              <p className="text-sm text-gray-500 mb-4">
                Upload your first presentation to get started
              </p>
              <Button
                text="Upload Presentation"
                variant="primary"
                fontSize="14px"
                borderRadius="8px"
                paddingWidth="20px"
                paddingHeight="10px"
                onClick={() => navigate("/student/feedback")}
              />
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
              <Table
                columns={columns}
                dataSource={tableData}
                pagination={false}
                scroll={{ x: 'max-content' }}
                className="[&_.ant-table-thead>tr>th]:bg-gray-50 [&_.ant-table-thead>tr>th]:text-gray-700 [&_.ant-table-thead>tr>th]:font-semibold [&_.ant-table-thead>tr>th]:text-sm [&_.ant-table-thead>tr>th]:border-b [&_.ant-table-thead>tr>th]:px-3 [&_.ant-table-thead>tr>th]:sm:px-6 [&_.ant-table-thead>tr>th]:py-3 [&_.ant-table-thead>tr>th]:sm:py-4 [&_.ant-table-tbody>tr>td]:px-3 [&_.ant-table-tbody>tr>td]:sm:px-6 [&_.ant-table-tbody>tr>td]:py-3 [&_.ant-table-tbody>tr>td]:sm:py-4 [&_.ant-table-tbody>tr]:border-b [&_.ant-table-tbody>tr]:border-gray-100 [&_.ant-table-tbody>tr:hover]:bg-gray-50"
                onRow={(record) => ({
                  onClick: () => handlePresentationClick(record),
                  style: { cursor: "pointer" },
                })}
              />
            </div>
          )}
        </div>
      </main>

      {/* Upload Modal */}
      {selectedPresentation && (
        <PresentationUploadModal
          isOpen={isUploadModalOpen}
          onClose={() => {
            setIsUploadModalOpen(false);
            setSelectedPresentation(null);
          }}
          presentationId={selectedPresentation.presentationId}
          presentationTitle={selectedPresentation.title}
        />
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 max-w-md">
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        </div>
      )}
    </div>
  );
};

export default StudentDashboardPage;
