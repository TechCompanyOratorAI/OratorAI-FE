import React, { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  BarChart3,
  Settings,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  LogOut,
  FileText,
} from "lucide-react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "@/services/store/store";
import { logout } from "@/services/features/auth/authSlice";

interface SidebarInstructorProps {
  activeItem?: string;
}

const SidebarInstructor: React.FC<SidebarInstructorProps> = ({ activeItem }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebarInstructorCollapsed");
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem("sidebarInstructorCollapsed", JSON.stringify(collapsed));
  }, [collapsed]);

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

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 bg-white border-r border-gray-200 flex flex-col h-screen transform transition-all duration-300 ease-in-out lg:sticky lg:top-0 ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          } ${collapsed ? "lg:w-20" : "lg:w-64"
          }`}
      >
        {/* Logo */}
        <div className={`p-6 ${collapsed ? "lg:p-4" : ""}`}>
          <div className={`flex items-center gap-3 mb-1 ${collapsed ? "lg:justify-center" : ""}`}>
            <div className="w-10 h-10 bg-gradient-to-r from-sky-500 to-indigo-500 rounded flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">E</span>
            </div>
            {!collapsed && (
              <div className="lg:block hidden">
                <h1 className="text-base font-semibold text-gray-900">
                  EduSpeak AI
                </h1>
                <p className="text-xs text-gray-500">Instructor Portal</p>
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

        {/* Settings and User Profile */}
        <div className={`p-4 border-t border-gray-200 space-y-4 ${collapsed ? "lg:px-2" : ""}`}>
          <Link
            to="/instructor/settings"
            title={collapsed ? "Settings" : undefined}
            className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors ${isActive("settings")
              ? "text-blue-600 bg-blue-50"
              : "text-gray-700 hover:bg-gray-100"
              } ${collapsed ? "lg:justify-center" : ""}`}
          >
            <Settings className="w-6 h-6 flex-shrink-0" />
            {!collapsed && <span className="lg:block hidden">Settings</span>}
          </Link>
          {!collapsed && (
            <div className="lg:block hidden relative" ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="w-full flex items-center gap-3 pt-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-semibold text-xs">
                    {fullName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </span>
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-gray-900">
                    {fullName}
                  </p>
                  <p className="text-xs text-gray-500">{userRole}</p>
                </div>
              </button>
              {isUserMenuOpen && (
                <div className="absolute bottom-full left-0 mb-2 w-full bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50">
                  <div className="p-3 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-semibold text-sm">
                          {fullName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {fullName}
                        </p>
                        <p className="text-xs text-gray-500">{userRole}</p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Đăng Xuất</span>
                  </button>
                </div>
              )}
            </div>
          )}
          {collapsed && (
            <div className="lg:flex hidden justify-center pt-2 relative" ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="w-8 h-8 rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 flex items-center justify-center flex-shrink-0"
              >
                <span className="text-white font-semibold text-xs">
                  {fullName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)}
                </span>
              </button>
              {isUserMenuOpen && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50">
                  <div className="p-3 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-semibold text-sm">
                          {fullName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {fullName}
                        </p>
                        <p className="text-xs text-gray-500">{userRole}</p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-center gap-3-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Đăng Xuất</span>
                  </button>
                </div>
              )}
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

export default SidebarInstructor;
