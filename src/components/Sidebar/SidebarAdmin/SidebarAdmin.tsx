import React, { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard,
  Users,
  Settings,
  FileText,
  Cog,
  Menu,
  X,
  Shapes,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/services/store/store";
import { logout } from "@/services/features/auth/authSlice";

interface SidebarAdminProps {
  activeItem?: string;
}

const SidebarAdmin: React.FC<SidebarAdminProps> = ({ activeItem }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebarAdminCollapsed");
    return saved ? JSON.parse(saved) : false;
  });
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    localStorage.setItem("sidebarAdminCollapsed", JSON.stringify(collapsed));
  }, [collapsed]);

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

  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      path: "/admin/dashboard",
    },
    {
      id: "user-management",
      label: "User Management",
      icon: Users,
      path: "/admin/user-management",
    },
    {
      id: "ai-configuration",
      label: "AI Configuration",
      icon: Cog,
      path: "/admin/ai-configuration",
    },
    {
      id: "analysis-logs",
      label: "Analysis Logs",
      icon: FileText,
      path: "/admin/analysis-logs",
    },
    {
      id: "manage-classes",
      label: "Manage Classes",
      icon: Shapes,
      path: "/admin/manage-classes",
    },
    {
      id: "settings",
      label: "Settings",
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

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 bg-white border-r border-gray-200 flex flex-col h-screen overflow-y-auto transform transition-all duration-300 ease-in-out ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } ${collapsed ? "lg:w-20" : "lg:w-64"}`}
      >
        {/* Logo */}
        <div className={`p-4 ${collapsed ? "lg:p-4" : ""}`}>
          <div className={`flex items-center gap-3 mb-1 ${collapsed ? "lg:justify-center" : ""}`}>
            <div className="w-10 h-10 bg-gradient-to-r from-sky-500 to-indigo-500 rounded flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">E</span>
            </div>
            {!collapsed && (
              <div className="lg:block hidden">
                <h1 className="text-base font-semibold text-gray-900">
                  EduAnalyze AI
                </h1>
                <p className="text-xs text-gray-500">Admin Console</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className={`flex-1 px-4 space-y-1 ${collapsed ? "lg:px-2" : ""}`}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.id);
            return (
              <Link
                key={item.id}
                to={item.path}
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors ${active
                  ? "text-blue-600 bg-blue-50"
                  : "text-gray-700 hover:bg-gray-100"
                  } ${collapsed ? "lg:justify-center" : ""}`}
              >
                <Icon className="w-6 h-6 flex-shrink-0" />
                {!collapsed && <span className="lg:block hidden">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User Profile */}
        <div
          ref={userMenuRef}
          className={`relative p-4 border-t border-gray-200 ${
            collapsed ? "lg:px-2" : ""
          }`}
        >
          {!collapsed && (
            <button
              type="button"
              onClick={() => setIsUserMenuOpen((prev) => !prev)}
              className="lg:flex hidden items-center gap-3 w-full text-left hover:bg-gray-50 rounded-lg px-2 py-1.5"
            >
              <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-sm font-semibold text-gray-700">
                {userInitial}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {userDisplayName}
                </p>
                <p className="text-xs text-gray-500">{userRoleLabel}</p>
              </div>
            </button>
          )}
          {collapsed && (
            <button
              type="button"
              onClick={() => setIsUserMenuOpen((prev) => !prev)}
              className="lg:flex hidden justify-center w-full hover:bg-gray-50 rounded-lg px-2 py-1.5"
            >
              <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-sm font-semibold text-gray-700">
                {userInitial}
              </div>
            </button>
          )}

          {isUserMenuOpen && (
            <div className="absolute left-4 right-4 bottom-20 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-900">
                  {userDisplayName}
                </p>
                <p className="text-xs text-gray-500">{userRoleLabel}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
              >
                Logout
              </button>
            </div>
          )}
        </div>

        {/* Toggle Button */}
        <div className="hidden lg:flex items-center justify-end p-2 border-t border-gray-200">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 transition-colors"
            title={collapsed ? "Expand" : "Collapse"}
          >
            {collapsed ? (
              <ChevronRight className="w-5 h-5 text-gray-600" />
            ) : (
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            )}
          </button>
        </div>
      </aside>
    </>
  );
};

export default SidebarAdmin;

