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
    : "Instructor";
  const userRole = user?.roles?.[0]?.roleName || "Instructor";

  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      path: "/instructor/dashboard",
    },
    {
      id: "manage-classes",
      label: "My Classes",
      icon: BookOpen,
      path: "/instructor/manage-classes",
    },
    {
      id: "students",
      label: "Students",
      icon: Users,
      path: "/instructor/students",
    },
    {
      id: "presentations",
      label: "Presentations",
      icon: FileText,
      path: "/instructor/presentations",
    },
    {
      id: "analytics",
      label: "Analytics",
      icon: BarChart3,
      path: "/instructor/analytics",
    },
  ];

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
        className={`fixed inset-y-0 left-0 z-40 bg-white border-r border-gray-200 flex flex-col h-screen transform transition-all duration-300 ease-in-out lg:sticky lg:top-0 ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } ${expanded ? "lg:w-64" : "lg:w-20"}`}
      >
        {/* Logo */}
        <div className={`p-6 ${expanded ? "" : "lg:p-4"}`}>
          <div className={`flex items-center gap-3 mb-1 ${expanded ? "" : "lg:justify-center"}`}>
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
                className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors ${
                  active ? "text-blue-600 bg-blue-50" : "text-gray-700 hover:bg-gray-100"
                } ${!expanded ? "lg:justify-center" : ""}`}
              >
                <Icon className="w-6 h-6 flex-shrink-0" />
                {expanded && <span className="lg:block hidden">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Settings + User info + Đăng xuất (luôn hiện, không popup) */}
        <div className={`p-4 border-t border-gray-200 space-y-2 ${expanded ? "" : "lg:px-2"}`}>
          <Link
            to="/instructor/settings"
            title={!expanded ? "Settings" : undefined}
            className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors ${
              isActive("settings") ? "text-blue-600 bg-blue-50" : "text-gray-700 hover:bg-gray-100"
            } ${!expanded ? "lg:justify-center" : ""}`}
          >
            <Settings className="w-6 h-6 flex-shrink-0" />
            {expanded && <span className="lg:block hidden">Settings</span>}
          </Link>
          {expanded && (
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg">
              <div className="w-9 h-9 rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-semibold text-xs">
                  {fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{fullName}</p>
                <p className="text-xs text-gray-500">{userRole}</p>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            title={!expanded ? "Đăng xuất" : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors text-gray-700 hover:bg-red-50 hover:text-red-600 ${
              !expanded ? "lg:justify-center" : ""
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

export default SidebarInstructor;
