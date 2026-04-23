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
  ChevronRight,
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
    { id: "dashboard", label: "Bảng điều khiển", icon: LayoutDashboard, path: "/admin/dashboard" },
    { id: "user-management", label: "Quản lý người dùng", icon: Users, path: "/admin/user-management" },
    { id: "ai-configuration", label: "Cấu hình AI", icon: Cog, path: "/admin/ai-configuration" },
    { id: "analysis-logs", label: "Nhật ký phân tích", icon: FileText, path: "/admin/analysis-logs" },
    { id: "manage-classes", label: "Quản lý lớp học", icon: Shapes, path: "/admin/manage-classes" },
    { id: "manage-courses", label: "Quản lý môn học", icon: Book, path: "/admin/manage-courses" },
    { id: "manage-departments", label: "Quản lý chuyên ngành", icon: FolderCog, path: "/admin/manage-departments" },
    { id: "rubric-templates", label: "Mẫu tiêu chí", icon: ClipboardList, path: "/admin/rubric-templates" },
    { id: "settings", label: "Cài đặt", icon: Settings, path: "/admin/settings" },
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
      ? user.roles[0].roleName === "Student"
        ? "Sinh viên"
        : user.roles[0].roleName === "Instructor"
          ? "Giảng viên"
          : user.roles[0].roleName === "Admin"
            ? "Quản trị viên"
            : user.roles[0].roleName
      : "Super Admin";

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const isActive = (itemId: string) => {
    if (activeItem) return activeItem === itemId;
    return location.pathname.includes(itemId);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-[60] p-2.5 bg-white rounded-xl shadow-lg border border-slate-200/80 backdrop-blur-sm hover:shadow-xl transition-all"
      >
        {isMobileOpen ? (
          <X className="w-5 h-5 text-slate-600" />
        ) : (
          <Menu className="w-5 h-5 text-slate-600" />
        )}
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => { setIsHovered(false); setCollapsed(true); }}
        className={`
          fixed inset-y-0 left-0 z-50 flex flex-col h-screen bg-white
          transform transition-all duration-300 ease-out
          lg:sticky lg:top-0 lg:self-stretch
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          ${expanded ? "lg:w-[268px]" : "lg:w-[72px]"}
        `}
      >
        {/* Header */}
        <div className="relative overflow-hidden flex-shrink-0 px-6 py-4">
          <div className="relative flex items-center lg:justify-start">
            {expanded && <AppLogo to="/" size="md" />}
          </div>
        </div>

        {/* Navigation */}
        <nav className={`flex-1 px-3 py-4 space-y-1 overflow-y-auto ${expanded ? "" : "lg:px-2"} [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full`}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.id);
            return (
              <Link
                key={item.id}
                to={item.path}
                title={!expanded ? item.label : undefined}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                  transition-all duration-200 group relative
                  ${active
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/25"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }
                  ${!expanded ? "lg:justify-center lg:px-2" : ""}
                `}
              >
                {/* Active indicator dot */}
                {active && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full shadow-sm" />
                )}
                <Icon className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 ${active ? "" : "group-hover:scale-110"}`} />
                {expanded && (
                  <span className="lg:block hidden flex-1 truncate">{item.label}</span>
                )}
                {active && expanded && (
                  <ChevronRight className="w-4 h-4 opacity-70" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className={`flex-shrink-0 border-t border-slate-200/80 p-3 space-y-1 ${expanded ? "" : "lg:px-2"}`}>
          {expanded && (
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-lg shadow-blue-500/25 flex-shrink-0">
                {userInitial}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{userDisplayName}</p>
                <p className="text-xs text-slate-500 truncate">{userRoleLabel}</p>
              </div>
            </div>
          )}
          {!expanded && (
            <div className="hidden lg:flex w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 items-center justify-center text-xs font-bold text-white mx-auto shadow-lg shadow-blue-500/25 mb-1">
              {userInitial}
            </div>
          )}
          <button
            onClick={handleLogout}
            title={!expanded ? "Đăng xuất" : undefined}
            className={`
              w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
              transition-all duration-200
              text-slate-500 hover:bg-red-50 hover:text-red-600
              ${!expanded ? "lg:justify-center lg:px-2" : ""}
            `}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {expanded && <span className="lg:block hidden">Đăng xuất</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default SidebarAdmin;
