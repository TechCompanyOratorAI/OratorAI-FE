import React, { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard,
  BookOpen,
  Library,
  MessageSquare,
  Settings,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  LogOut,
  GraduationCap,
} from "lucide-react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "@/services/store/store";
import { logout } from "@/services/features/auth/authSlice";

interface SidebarStudentProps {
  activeItem?: string;
}

const SidebarStudent: React.FC<SidebarStudentProps> = ({ activeItem }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebarCollapsed");
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", JSON.stringify(collapsed));
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

  const fullName = user ? `${user.firstName} ${user.lastName}`.trim() : "User";
  const userRole = user?.roles?.[0]?.roleName || "Student";

  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      path: "/student/dashboard",
    },
    {
      id: "courses",
      label: "Courses",
      icon: BookOpen,
      path: "/student/classes",
    },
    {
      id: "my-class",
      label: "My Classes",
      icon: GraduationCap,
      path: "/student/my-class",
    },
    {
      id: "library",
      label: "Library",
      icon: Library,
      path: "/student/library",
    },
    {
      id: "feedback",
      label: "Feedback",
      icon: MessageSquare,
      path: "/student/feedback",
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
        className={`fixed lg:static inset-y-0 left-0 z-40 bg-white border-r border-gray-200 flex flex-col h-screen transform transition-all duration-300 ease-in-out ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } ${collapsed ? "lg:w-20" : "lg:w-64"}`}
      >
        {/* Logo */}
        <div className={`p-6 ${collapsed ? "lg:p-4" : ""}`}>
          <div
            className={`flex items-center gap-3 mb-1 ${collapsed ? "lg:justify-center" : ""}`}
          >
            <div className="w-10 h-10 bg-gradient-to-r from-sky-500 to-cyan-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-sky-200/60">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            {!collapsed && (
              <div className="lg:block">
                <h1 className="text-lg font-bold text-slate-900">
                  OratorAI
                </h1>
                <p className="text-xs text-slate-500">Student workspace</p>
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
                className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all duration-200 ${
                  active
                    ? "text-sky-600 bg-sky-50 font-medium"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                } ${collapsed ? "lg:justify-center" : ""}`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && (
                  <span className="lg:block">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Settings and User Profile */}
        <div
          className={`p-4 border-t border-gray-200 space-y-4 ${collapsed ? "lg:px-2" : ""}`}
        >
          <Link
            to="/student/settings"
            title={collapsed ? "Settings" : undefined}
            className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all duration-200 ${
              isActive("settings")
                ? "text-sky-600 bg-sky-50 font-medium"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            } ${collapsed ? "lg:justify-center" : ""}`}
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span className="lg:block">Settings</span>}
          </Link>
          {!collapsed && (
            <div className="lg:block relative" ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="w-full flex items-center gap-3 pt-2 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-white border-2 border-sky-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <span className="text-sky-600 font-semibold text-sm">
                    {fullName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </span>
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold text-slate-900">
                    {fullName}
                  </p>
                  <p className="text-xs text-slate-500">{userRole}</p>
                </div>
              </button>
              {isUserMenuOpen && (
                <div className="absolute bottom-full left-0 mb-2 w-full bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden z-50">
                  <div className="p-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white border-2 border-sky-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                        <span className="text-sky-600 font-semibold text-sm">
                          {fullName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {fullName}
                        </p>
                        <p className="text-xs text-slate-500">{userRole}</p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-600 hover:bg-slate-50 hover:text-red-600 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Đăng Xuất</span>
                  </button>
                </div>
              )}
            </div>
          )}
          {collapsed && (
            <div
              className="lg:flex hidden justify-center pt-2 relative"
              ref={userMenuRef}
            >
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="w-10 h-10 rounded-full bg-white border-2 border-sky-100 flex items-center justify-center flex-shrink-0 shadow-sm"
              >
                <span className="text-sky-600 font-semibold text-sm">
                  {fullName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)}
                </span>
              </button>
              {isUserMenuOpen && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden z-50">
                  <div className="p-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white border-2 border-sky-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                        <span className="text-sky-600 font-semibold text-sm">
                          {fullName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {fullName}
                        </p>
                        <p className="text-xs text-slate-500">{userRole}</p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-600 hover:bg-slate-50 hover:text-red-600 transition-colors"
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

export default SidebarStudent;
