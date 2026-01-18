import React, { useState, useEffect, useCallback } from "react";
import { User as UserIcon, Lock } from "lucide-react";
import SidebarAdmin from "@/components/Sidebar/SidebarAdmin/SidebarAdmin";
import SidebarStudent from "@/components/Sidebar/SidebarStudent/SidebarStudent";
import { useAppDispatch, useAppSelector } from "@/services/store/store";
import { getProfile, changePassword } from "@/services/features/auth/authSlice";
import { useLocation } from "react-router-dom";
import type { User, ProfileUser } from "@/interfaces/auth";
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

const { Title, Text } = Typography;

const SettingsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const { user, loading } = useAppSelector((state) => state.auth);
  const [form] = Form.useForm();

  // Determine which sidebar to use based on route
  const isStudentRoute = location.pathname.includes("/student");
  const [profileData, setProfileData] = useState<ProfileUser | null>(null);

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

  const displayUser: ProfileUser | User | null = profileData || user;
  const fullName = displayUser
    ? `${displayUser.firstName || ""} ${displayUser.lastName || ""}`.trim()
    : "";
  const initials = fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const SidebarComponent = isStudentRoute ? SidebarStudent : SidebarAdmin;

  return (
    <div className="flex h-screen bg-gray-50">
      <SidebarComponent activeItem="settings" />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto">
          <Title level={2} className="mb-6">
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
                  {initials || "U"}
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
        </div>
      </main>
    </div>
  );
};

export default SettingsPage;
