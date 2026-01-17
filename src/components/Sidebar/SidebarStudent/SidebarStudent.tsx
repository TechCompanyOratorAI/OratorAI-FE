import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { useLocation, Link } from "react-router-dom";

interface SidebarStudentProps {
  activeItem?: string;
}

const SidebarStudent: React.FC<SidebarStudentProps> = ({ activeItem }) => {
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebarCollapsed");
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", JSON.stringify(collapsed));
  }, [collapsed]);

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
      path: "/student/courses",
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
        } ${
          collapsed ? "lg:w-20" : "lg:w-64"
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
                <p className="text-xs text-gray-500">Student Portal</p>
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
                className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors ${
                  active
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
            to="/student/settings"
            title={collapsed ? "Settings" : undefined}
            className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors ${
              isActive("settings")
                ? "text-blue-600 bg-blue-50"
                : "text-gray-700 hover:bg-gray-100"
            } ${collapsed ? "lg:justify-center" : ""}`}
          >
            <Settings className="w-6 h-6 flex-shrink-0" />
            {!collapsed && <span className="lg:block hidden">Settings</span>}
          </Link>
          {!collapsed && (
            <div className="flex items-center gap-3 pt-2 lg:block hidden">
              <div className="w-8 h-8 rounded-full bg-gray-300"></div>
              <div>
                <p className="text-sm font-medium text-gray-900">Sarah M.</p>
                <p className="text-xs text-gray-500">Student</p>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="lg:flex hidden justify-center pt-2">
              <div className="w-8 h-8 rounded-full bg-gray-300"></div>
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

