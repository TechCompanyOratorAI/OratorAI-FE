import React, { useState } from "react";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  BarChart3,
  Settings,
  Menu,
  X,
  LogOut,
  FileText,
  ChevronRight,
} from "lucide-react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "@/services/store/store";
import { logout } from "@/services/features/auth/authSlice";
import AppLogo from "@/components/AppLogo/AppLogo";

interface SidebarInstructorProps {
  activeItem?: string;
}

const SidebarInstructor: React.FC<SidebarInstructorProps> = ({ activeItem }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  const expanded = !collapsed || isHovered;

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const fullName = user
    ? `${user.firstName} ${user.lastName}`.trim()
    : "Giảng viên";
  const userRole = user?.roles?.[0]?.roleName || "Giảng viên";

  const menuItems = [
    { id: "dashboard", label: "Bảng điều khiển", icon: LayoutDashboard, path: "/instructor/dashboard" },
    { id: "manage-classes", label: "Lớp học của tôi", icon: BookOpen, path: "/instructor/manage-classes" },
    { id: "students", label: "Sinh viên", icon: Users, path: "/instructor/students" },
    { id: "presentations", label: "Bài thuyết trình", icon: FileText, path: "/instructor/presentations" },
    { id: "analytics", label: "Phân tích", icon: BarChart3, path: "/instructor/analytics" },
  ];

  const isActive = (itemId: string) => {
    if (activeItem) return activeItem === itemId;
    if (itemId === "manage-classes") {
      return location.pathname.includes("/instructor/manage-classes") ||
             location.pathname.includes("/instructor/class/");
    }
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
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/25"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }
                  ${!expanded ? "lg:justify-center lg:px-2" : ""}
                `}
              >
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

        {/* Settings */}
        <div className={`px-3 pt-3 ${expanded ? "" : "lg:px-2"}`}>
          <Link
            to="/instructor/settings"
            title={!expanded ? "Cài đặt" : undefined}
            className={`
              flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
              transition-all duration-200 group relative
              ${isActive("settings")
                ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/25"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }
              ${!expanded ? "lg:justify-center lg:px-2" : ""}
            `}
          >
            {isActive("settings") && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full shadow-sm" />
            )}
            <Settings className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 ${isActive("settings") ? "" : "group-hover:scale-110"}`} />
            {expanded && <span className="lg:block hidden flex-1 truncate">Cài đặt</span>}
          </Link>
        </div>

        {/* User section */}
        <div className={`flex-shrink-0 border-t border-slate-200/80 p-3 space-y-1 mt-1 ${expanded ? "" : "lg:px-2"}`}>
          {expanded && (
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-lg shadow-indigo-500/25 flex-shrink-0">
                {fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{fullName}</p>
                <p className="text-xs text-slate-500 truncate">{userRole}</p>
              </div>
            </div>
          )}
          {!expanded && (
            <div className="hidden lg:flex w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 items-center justify-center text-xs font-bold text-white mx-auto shadow-lg shadow-indigo-500/25 mb-1">
              {fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
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

export default SidebarInstructor;
