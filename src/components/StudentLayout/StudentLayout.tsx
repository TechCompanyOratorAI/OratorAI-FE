import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Layout,
  Menu,
  Avatar,
  Badge,
  Dropdown,
  Button,
  Typography,
  Drawer,
} from "antd";
import type { MenuProps } from "antd";
import {
  BookOpen,
  Mic2,
  Bell,
  Menu as MenuIcon,
  LogOut,
  Settings,
  X,
  Home,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/services/store/store";
import { logout } from "@/services/features/auth/authSlice";
import { addNotification } from "@/services/features/notification/notificationSlice";
import { useSocket } from "@/hooks/useSocket";
import AppLogo from "@/components/AppLogo/AppLogo";

const { Header, Content } = Layout;
const { Text } = Typography;

interface StudentLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { key: "/student/dashboard", label: "Trang chủ", icon: <Home className="h-5 w-5" /> },
  { key: "/student/my-class", label: "Lớp của tôi", icon: <BookOpen className="h-5 w-5" /> },
  { key: "/student/my-presentations", label: "Bài thuyết trình", icon: <Mic2 className="h-5 w-5" /> },
];

const StudentLayout: React.FC<StudentLayoutProps> = ({ children }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAppSelector((state) => state.auth);
  const { unreadCount } = useAppSelector((state) => state.notification);
  const { on } = useSocket();

  const [mobileOpen, setMobileOpen] = useState(false);

  // ── Global socket listeners for notifications ──────────────────────────────────
  useEffect(() => {
    const unwatchReportGenerated = on<{ presentationId: number; message?: string }>(
      "report:generated",
      () => {
        dispatch(addNotification({
          type: "report:generated",
          presentationId: 0,
          title: "Báo cáo AI sẵn sàng",
          message: "Báo cáo đánh giá mới đã được tạo xong!",
        }));
      }
    );

    const unwatchReportConfirmed = on<{ presentationId: number }>(
      "report:confirmed",
      () => {
        dispatch(addNotification({
          type: "report:confirmed",
          presentationId: 0,
          title: "Báo cáo được xác nhận",
          message: "Giảng viên đã xác nhận báo cáo AI của bạn!",
        }));
      }
    );

    const unwatchReportRejected = on<{ presentationId: number; message?: string }>(
      "report:rejected",
      () => {
        dispatch(addNotification({
          type: "report:rejected",
          presentationId: 0,
          title: "Báo cáo bị từ chối",
          message: "Giảng viên đã từ chối báo cáo AI của bạn.",
        }));
      }
    );

    const unwatchGradeDistributed = on<{ groupId: number; reportId: number }>(
      "grade:distributed",
      () => {
        dispatch(addNotification({
          type: "grade:distributed",
          presentationId: 0,
          title: "Điểm đã được phân chia",
          message: "Trưởng nhóm đã phân chia điểm cho các thành viên.",
        }));
      }
    );

    const unwatchGradeFinalized = on<{ groupId: number; reportId: number }>(
      "grade:finalized",
      () => {
        dispatch(addNotification({
          type: "grade:finalized",
          presentationId: 0,
          title: "Điểm đã được chốt",
          message: "Điểm đã được chốt bởi giảng viên.",
        }));
      }
    );

    return () => {
      unwatchReportGenerated?.();
      unwatchReportConfirmed?.();
      unwatchReportRejected?.();
      unwatchGradeDistributed?.();
      unwatchGradeFinalized?.();
    };
  }, [on, dispatch]);

  const fullName = user
    ? `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
    user.username ||
    "Student"
    : "Student";

  const initials = fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const avatarSrc = user?.avatar || null;

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const getSelectedKey = () => {
    const path = location.pathname;
    if (
      path === "/student/my-presentations" ||
      path.startsWith("/student/presentation/") ||
      path.startsWith("/student/presentation-detail/")
    ) return "/student/my-presentations";
    if (
      path === "/student/my-class" ||
      path.startsWith("/student/class/") ||
      path.startsWith("/student/my-class/")
    ) return "/student/my-class";
    return "/student/dashboard";
  };

  const menuItems: MenuProps["items"] = navItems.map((item) => ({
    key: item.key,
    icon: item.icon,
    label: item.label,
    onClick: () => { navigate(item.key); setMobileOpen(false); },
  }));

  const userMenuItems: MenuProps["items"] = [
    {
      key: "settings",
      icon: <Settings className="w-4 h-4" />,
      label: "Cài đặt tài khoản",
      onClick: () => navigate("/student/settings"),
    },
    { type: "divider" },
    {
      key: "logout",
      icon: <LogOut className="w-4 h-4" />,
      label: "Đăng xuất",
      danger: true,
      onClick: handleLogout,
    },
  ];

  const selectedKey = getSelectedKey();

  return (
    <Layout className="min-h-screen bg-slate-50/50">
      {/* Top Header */}
      <Header
        className="fixed top-0 left-0 right-0 z-50 !h-[68px] !leading-none !px-0 !py-0 bg-white/95 backdrop-blur-md border-b border-slate-200/60 shadow-sm"
      >
        <div className="mx-auto flex h-[68px] w-full max-w-none items-center px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="grid w-full min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 sm:gap-4 lg:gap-8">
            {/* Logo */}
            <div className="flex min-w-0 shrink-0 items-center">
              <AppLogo to="/" size="lg" className="!text-xl !font-bold !tracking-tight sm:!text-2xl" />
            </div>

            {/* Desktop Nav */}
            <nav
              className="hidden min-h-0 min-w-0 items-center justify-center gap-2 overflow-x-auto lg:flex xl:gap-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
              aria-label="Điều hướng học sinh"
            >
              {navItems.map((item) => {
                const active = selectedKey === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => navigate(item.key)}
                    className={[
                      "inline-flex shrink-0 items-center gap-2.5 rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-200",
                      active
                        ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 hover:shadow-sm",
                    ].join(" ")}
                  >
                    {item.icon}
                    <span className="whitespace-nowrap">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Right */}
            <div className="flex shrink-0 items-center justify-end gap-1.5 sm:gap-2">
              <Badge count={unreadCount} size="small" offset={[-2, 2]} overflowCount={99}>
                <Button
                  type="text"
                  icon={<Bell className="h-5 w-5" />}
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-all duration-200"
                  aria-label="Thông báo"
                  onClick={() => dispatch({ type: "notification/markAllRead" })}
                />
              </Badge>

              <Dropdown menu={{ items: userMenuItems }} trigger={["click"]} placement="bottomRight">
                <Button
                  type="text"
                  className="flex h-auto max-w-[220px] items-center gap-3 rounded-xl py-1.5 pl-1.5 pr-3 hover:bg-slate-100 transition-all duration-200 sm:max-w-[280px]"
                >
                  <Avatar
                    size={38}
                    src={avatarSrc}
                    className="flex shrink-0 items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-bold text-white shadow-lg shadow-blue-500/20"
                  >
                    {!avatarSrc && initials}
                  </Avatar>
                  <div className="hidden min-w-0 flex-col items-start text-left sm:flex">
                    <Text className="max-w-full truncate text-sm font-semibold text-slate-800">
                      {fullName}
                    </Text>
                  </div>
                </Button>
              </Dropdown>

              <Button
                type="text"
                icon={mobileOpen ? <X className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
                onClick={() => setMobileOpen(!mobileOpen)}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 lg:hidden transition-all duration-200"
                aria-label="Mở menu"
              />
            </div>
          </div>
        </div>
      </Header>

      {/* Mobile Drawer */}
      <Drawer
        title={
          <div className="flex flex-col gap-0.5 min-w-0">
            <AppLogo to="/" size="md" />
          </div>
        }
        placement="left"
        onClose={() => setMobileOpen(false)}
        open={mobileOpen}
        width={280}
        className="[&_.ant-drawer-body]:!p-0"
        styles={{ body: { padding: 0 } }}
        extra={
          <div className="flex items-center gap-2 px-1">
            <Avatar size={28} src={avatarSrc} className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xs font-semibold">
              {!avatarSrc && initials}
            </Avatar>
            <Text className="text-sm font-medium text-slate-700">{fullName}</Text>
          </div>
        }
      >
        <Menu
          mode="vertical"
          selectedKeys={[selectedKey]}
          items={menuItems}
          className="border-0 mt-2"
        />
      </Drawer>

      {/* Main Content */}
      <Layout className="mt-[68px]" style={{ background: "transparent" }}>
        <Content className="w-full max-w-none px-3 py-5 sm:px-4 sm:py-6 md:px-5 md:py-6 lg:px-6 lg:py-6 xl:px-8">
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default StudentLayout;
