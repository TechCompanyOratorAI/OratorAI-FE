import React, { useState, useEffect, useCallback, useRef } from "react";
import { User as UserIcon, Lock } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/services/store/store";
import { getProfile, changePassword } from "@/services/features/auth/authSlice";
import { useNavigate, Link } from "react-router-dom";
import {
  Card,
  Form,
  Input,
  Button,
  Descriptions,
  Avatar,
  Space,
  Typography,
  Tag,
} from "antd";
import {
  UserOutlined,
  MailOutlined,
  LockOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import {
  Bell,
  Menu,
  X,
  LogOut,
  ChevronDown,
} from "lucide-react";
import type { User, ProfileUser } from "@/interfaces/auth";
import { logout } from "@/services/features/auth/authSlice";

const { Title, Text } = Typography;

const StudentSettingsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user, loading } = useAppSelector((state) => state.auth);
  const [form] = Form.useForm();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [profileData, setProfileData] = useState<ProfileUser | null>(null);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    };

    if (isUserMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isUserMenuOpen]);

  const loadProfile = useCallback(async () => {
    try {
      const result = await dispatch(getProfile());
      if (getProfile.fulfilled.match(result)) {
        setProfileData(result.payload.user);
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  }, [dispatch]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handlePasswordChange = async (values: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => {
    try {
      const result = await dispatch(
        changePassword({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        })
      );

      if (changePassword.fulfilled.match(result)) {
        form.resetFields();
      }
    } catch (error) {
      console.error("Error changing password:", error);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const displayUser: ProfileUser | User | null = profileData || user;
  const fullName = displayUser
    ? `${displayUser.firstName || ""} ${displayUser.lastName || ""}`.trim()
    : "Student";

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
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Courses
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
                      className="block px-4 py-2 text-sm text-gray-900 bg-gray-50 font-medium"
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
                className="block px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg"
              >
                Courses
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
                className="block px-3 py-2 text-sm font-medium text-gray-900 bg-gray-50 rounded-lg"
              >
                Settings
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Title level={2} className="mb-6 text-gray-900">
          Settings
        </Title>

        {/* Profile Section */}
        <Card
          title={
            <Space>
              <UserIcon className="w-5 h-5" />
              <span>Thông tin Profile</span>
            </Space>
          }
          className="mb-6"
        >
          <div className="flex flex-col md:flex-row gap-6 mb-6">
            <div className="flex flex-col items-center md:items-start">
              <Avatar
                size={100}
                style={{
                  backgroundColor: "#0ea5e9",
                  fontSize: "32px",
                  fontWeight: "bold",
                }}
              >
                {fullName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2) || "U"}
              </Avatar>
              <Text className="mt-3 text-base font-semibold">{fullName || "User"}</Text>
              <Text type="secondary" className="text-sm">
                {displayUser?.username || "N/A"}
              </Text>
            </div>
            <div className="flex-1">
              <Descriptions column={1} bordered>
                <Descriptions.Item
                  label={
                    <Space>
                      <UserOutlined />
                      <span>First Name</span>
                    </Space>
                  }
                >
                  {displayUser?.firstName || "N/A"}
                </Descriptions.Item>
                <Descriptions.Item
                  label={
                    <Space>
                      <UserOutlined />
                      <span>Last Name</span>
                    </Space>
                  }
                >
                  {displayUser?.lastName || "N/A"}
                </Descriptions.Item>
                <Descriptions.Item
                  label={
                    <Space>
                      <MailOutlined />
                      <span>Email</span>
                    </Space>
                  }
                >
                  <Space>
                    <span>{displayUser?.email || "N/A"}</span>
                    {displayUser?.isEmailVerified ? (
                      <Tag icon={<CheckCircleOutlined />} color="success">
                        Verified
                      </Tag>
                    ) : (
                      <Tag icon={<CloseCircleOutlined />} color="error">
                        Not Verified
                      </Tag>
                    )}
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item
                  label={
                    <Space>
                      <UserOutlined />
                      <span>Username</span>
                    </Space>
                  }
                >
                  {displayUser?.username || "N/A"}
                </Descriptions.Item>
              </Descriptions>
            </div>
          </div>
        </Card>

        {/* Change Password Section */}
        <Card
          title={
            <Space>
              <Lock className="w-5 h-5" />
              <span>Đổi Mật Khẩu</span>
            </Space>
          }
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handlePasswordChange}
            autoComplete="off"
          >
            <Form.Item
              name="currentPassword"
              label="Mật khẩu hiện tại"
              rules={[
                {
                  required: true,
                  message: "Vui lòng nhập mật khẩu hiện tại",
                },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Nhập mật khẩu hiện tại"
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="newPassword"
              label="Mật khẩu mới"
              rules={[
                {
                  required: true,
                  message: "Vui lòng nhập mật khẩu mới",
                },
                {
                  min: 8,
                  message: "Mật khẩu phải có ít nhất 8 ký tự",
                },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Nhập mật khẩu mới (ít nhất 8 ký tự)"
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              label="Xác nhận mật khẩu mới"
              dependencies={["newPassword"]}
              rules={[
                {
                  required: true,
                  message: "Vui lòng xác nhận mật khẩu",
                },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("newPassword") === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(
                      new Error("Mật khẩu xác nhận không khớp")
                    );
                  },
                }),
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (
                      !value ||
                      getFieldValue("currentPassword") !== value
                    ) {
                      return Promise.resolve();
                    }
                    return Promise.reject(
                      new Error("Mật khẩu mới phải khác mật khẩu hiện tại")
                    );
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Nhập lại mật khẩu mới"
                size="large"
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                size="large"
                block
                style={{
                  background: "linear-gradient(to right, #0ea5e9, #6366f1)",
                  border: "none",
                  height: "44px",
                  borderRadius: "12px",
                  fontWeight: 600,
                }}
              >
                {loading ? "Đang xử lý..." : "Đổi Mật Khẩu"}
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </main>
    </div>
  );
};

export default StudentSettingsPage;
