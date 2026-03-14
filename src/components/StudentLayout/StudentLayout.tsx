import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Menu,
  X,
  LogOut,
  ChevronDown,
  Settings,
  GraduationCap,
  BookOpen,
  Mic2,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/services/store/store";
import { logout } from "@/services/features/auth/authSlice";
import AppLogo from "@/components/AppLogo/AppLogo";

interface StudentLayoutProps {
  children: React.ReactNode;
}

const navLinks = [
  { to: "/student/dashboard", label: "Khóa học", icon: GraduationCap },
  { to: "/student/my-class", label: "Lớp của tôi", icon: BookOpen },
  { to: "/student/my-presentations", label: "Thuyết trình", icon: Mic2 },
];

const StudentLayout: React.FC<StudentLayoutProps> = ({ children }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAppSelector((state) => state.auth);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

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

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + "/");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <AppLogo to="/" size="md" />
              <span className="hidden sm:block text-xs text-slate-400 font-medium bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                Student
              </span>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map(({ to, label, icon: Icon }) => {
                const active = isActive(to);
                return (
                  <Link
                    key={to}
                    to={to}
                    className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      active
                        ? "text-blue-700 bg-blue-50"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                    {active && (
                      <motion.div
                        layoutId="nav-indicator"
                        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-blue-600 rounded-full"
                      />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              {/* Bell */}
              <button className="relative p-2 hover:bg-slate-100 rounded-xl transition">
                <Bell className="w-5 h-5 text-slate-500" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
              </button>

              {/* User Menu */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 pl-1 pr-2 py-1 hover:bg-slate-100 rounded-xl transition"
                >
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-inner">
                    <span className="text-white font-bold text-xs">{initials}</span>
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-slate-700 max-w-[100px] truncate">
                    {fullName}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isUserMenuOpen ? "rotate-180" : ""}`}
                  />
                </button>

                <AnimatePresence>
                  {isUserMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-50"
                    >
                      <div className="px-4 py-3 border-b border-slate-100 bg-gradient-to-br from-blue-50 to-indigo-50">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                            <span className="text-white font-bold text-sm">{initials}</span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{fullName}</p>
                            <p className="text-xs text-slate-500">{user?.email || "Student"}</p>
                          </div>
                        </div>
                      </div>
                      <div className="p-1">
                        <Link
                          to="/student/settings"
                          className="flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-xl transition"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <Settings className="w-4 h-4 text-slate-400" />
                          Cài đặt
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-xl transition"
                        >
                          <LogOut className="w-4 h-4" />
                          Đăng xuất
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Mobile Toggle */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 hover:bg-slate-100 rounded-xl transition"
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5 text-slate-600" />
                ) : (
                  <Menu className="w-5 h-5 text-slate-600" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden border-t border-slate-200 bg-white overflow-hidden"
            >
              <nav className="px-4 py-3 space-y-1">
                {navLinks.map(({ to, label, icon: Icon }) => {
                  const active = isActive(to);
                  return (
                    <Link
                      key={to}
                      to={to}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition ${
                        active
                          ? "text-blue-700 bg-blue-50"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </Link>
                  );
                })}
                <Link
                  to="/student/settings"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition ${
                    isActive("/student/settings")
                      ? "text-blue-700 bg-blue-50"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  Cài đặt
                </Link>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Page Content */}
      <main className="flex-1">{children}</main>
    </div>
  );
};

export default StudentLayout;
