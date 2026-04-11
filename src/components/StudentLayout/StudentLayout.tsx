import React, { useState } from "react";
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

  const [mobileOpen, setMobileOpen] = useState(false);

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

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const getSelectedKey = () => {
    if (location.pathname.startsWith("/student/my-presentations")) return "/student/my-presentations";
    if (location.pathname.startsWith("/student/my-class")) return "/student/my-class";
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
    <Layout className="min-h-screen bg-[#f5f6fa]">
      {/* Top Header: container có max-width + padding ngang — tránh dính sát mép */}
      <Header
        className="fixed top-0 left-0 right-0 z-50 !h-[68px] !leading-none !px-0 !py-0 bg-white/95 backdrop-blur-sm border-b border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
      >
        <div className="mx-auto flex h-[68px] w-full max-w-none items-center px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="grid w-full min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 sm:gap-4 lg:gap-8">
            {/* Logo */}
            <div className="flex min-w-0 shrink-0 items-center">
              <div className="flex flex-col justify-center leading-tight">
                <AppLogo to="/" size="lg" className="!text-xl !font-bold !tracking-tight sm:!text-2xl" />
                <Text className="text-[11px] sm:text-xs text-slate-400 font-vn font-normal -mt-0.5">
                  Học sinh
                </Text>
              </div>
            </div>

            {/* Desktop Nav — custom (không dùng antd Menu ngang: tránh thu gọn … và ẩn "Bài thuyết trình") */}
            <nav
              className="hidden min-h-0 min-w-0 items-center justify-center gap-2 overflow-x-auto lg:flex xl:gap-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
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
                      "inline-flex shrink-0 items-center gap-2.5 rounded-2xl px-5 py-3 text-sm font-medium transition-all lg:px-4 xl:px-6 xl:py-3.5",
                      active
                        ? "bg-blue-50 text-blue-600 shadow-sm ring-1 ring-blue-100"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                    ].join(" ")}
                  >
                    {item.icon}
                    <span className="whitespace-nowrap">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Right */}
            <div className="flex shrink-0 items-center justify-end gap-1 sm:gap-2">
              <Badge count={0} size="small" offset={[-2, 2]}>
                <Button
                  type="text"
                  icon={<Bell className="h-5 w-5" />}
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Thông báo"
                />
              </Badge>

              <Dropdown menu={{ items: userMenuItems }} trigger={["click"]} placement="bottomRight">
                <Button
                  type="text"
                  className="flex h-auto max-w-[220px] items-center gap-3 rounded-xl py-2 pl-2 pr-3 hover:bg-slate-100 sm:max-w-[280px]"
                >
                  <Avatar
                    size={38}
                    className="flex shrink-0 items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-semibold text-white"
                  >
                    {initials}
                  </Avatar>
                  <div className="hidden min-w-0 flex-col items-start text-left sm:flex">
                    <Text className="max-w-full truncate text-sm font-semibold text-slate-800">
                      {fullName}
                    </Text>
                    <Text className="text-xs text-slate-400">Học sinh</Text>
                  </div>
                </Button>
              </Dropdown>

              <Button
                type="text"
                icon={mobileOpen ? <X className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
                onClick={() => setMobileOpen(!mobileOpen)}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 lg:hidden"
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
            <Text className="text-[10px] text-slate-400 font-vn">Học sinh</Text>
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
            <Avatar size={28} className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xs font-semibold">
              {initials}
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
