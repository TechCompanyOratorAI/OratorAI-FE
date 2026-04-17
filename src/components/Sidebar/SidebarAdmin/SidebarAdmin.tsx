import React, { useState } from "react";
import {
  LayoutDashboard,
  Users,
  Settings,
  FileText,
  Cog,
  Menu,
  X,
  Shapes,
  Book,
  FolderCog,
  LogOut,
  ClipboardList,
} from "lucide-react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/services/store/store";
import { logout } from "@/services/features/auth/authSlice";
import AppLogo from "@/components/AppLogo/AppLogo";

interface SidebarAdminProps {
  activeItem?: string;
}

const SidebarAdmin: React.FC<SidebarAdminProps> = ({ activeItem }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  const expanded = !collapsed || isHovered;

  const menuItems = [
    {
      id: "dashboard",
      label: "Bảng điều khiển",
      icon: LayoutDashboard,
      path: "/admin/dashboard",
    },
    {
      id: "user-management",
      label: "Quản lý người dùng",
      icon: Users,
      path: "/admin/user-management",
    },
    {
      id: "ai-configuration",
      label: "Cấu hình AI",
      icon: Cog,
      path: "/admin/ai-configuration",
    },
    {
      id: "analysis-logs",
      label: "Nhật ký phân tích",
      icon: FileText,
      path: "/admin/analysis-logs",
    },
    {
      id: "manage-classes",
      label: "Quản lý lớp học",
      icon: Shapes,
      path: "/admin/manage-classes",
    },
    {
      id: "manage-courses",
      label: "Quản lý khóa học",
      icon: Book,
      path: "/admin/manage-courses",
    },
    {
      id: "manage-departments",
      label: "Quản lý bộ môn",
      icon: FolderCog,
      path: "/admin/manage-departments",
    },
    {
      id: "rubric-templates",
      label: "Mẫu rubric",
      icon: ClipboardList,
      path: "/admin/rubric-templates",
    },
    {
      id: "settings",
      label: "Cài đặt",
      icon: Settings,
      path: "/admin/settings",
    },
  ];

  const userInitial =
    user?.firstName?.[0]?.toUpperCase() ||
    user?.username?.[0]?.toUpperCase() ||
    "A";

  const userDisplayName =
    (user
      ? `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
      user.username ||
      "Admin"
      : "Admin") || "Admin";

  const userRoleLabel =
    user?.roles && user.roles.length > 0
      ? user.roles[0].roleName
      : "Super Admin";

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const isActive = (itemId: string) => {
    if (activeItem) {
      return activeItem === itemId;
    }
    return location.pathname.includes(itemId);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md border border-gray-200"
      >
        {isMobileOpen ? (
          <X className="w-6 h-6 text-gray-700" />
        ) : (
          <Menu className="w-6 h-6 text-gray-700" />
        )}
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar: desktop = hover để mở rộng khi đang thu gọn */}
      <aside
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setCollapsed(true);
        }}
        className={`fixed inset-y-0 left-0 z-40 bg-white border-r border-gray-200 flex flex-col h-screen transform transition-all duration-300 ease-in-out lg:sticky lg:top-0 ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          } ${expanded ? "lg:w-64" : "lg:w-20"}`}
      >
        {/* Logo */}
        <div className={`p-4 ${expanded ? "" : "lg:p-4"}`}>
          <div
            className={`flex items-center gap-3 mb-1 ${expanded ? "" : "lg:justify-center"}`}
          >
            {expanded && (
              <div className="lg:block hidden">
                <AppLogo to="/" size="lg" />
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className={`flex-1 px-4 space-y-1 ${expanded ? "" : "lg:px-2"}`}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.id);
            return (
              <Link
                key={item.id}
                to={item.path}
                title={!expanded ? item.label : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors ${active
                  ? "text-blue-600 bg-blue-50"
                  : "text-gray-700 hover:bg-gray-100"
                  } ${!expanded ? "lg:justify-center" : ""}`}
              >
                <Icon className="w-6 h-6 flex-shrink-0" />
                {expanded && (
                  <span className="lg:block hidden">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User info + Đăng xuất (luôn hiện, không popup) */}
        <div
          className={`p-4 border-t border-gray-200 space-y-2 ${expanded ? "" : "lg:px-2"}`}
        >
          {expanded && (
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg">
              <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold text-gray-700 flex-shrink-0">
                {userInitial}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {userDisplayName}
                </p>
                <p className="text-xs text-gray-500">{userRoleLabel}</p>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            title={!expanded ? "Đăng xuất" : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors text-gray-700 hover:bg-red-50 hover:text-red-600 ${!expanded ? "lg:justify-center" : ""
              }`}
          >
            <LogOut className="w-6 h-6 flex-shrink-0" />
            {expanded && <span className="lg:block hidden">Đăng xuất</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default SidebarAdmin;
