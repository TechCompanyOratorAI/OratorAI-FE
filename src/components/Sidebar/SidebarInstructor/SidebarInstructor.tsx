import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Settings,
  Menu,
  X,
  LogOut,
  FileText,
  ChevronRight,
  Bell,
  ClipboardList,
  AlertCircle,
} from "lucide-react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { Popover, Divider, Empty } from "antd";
import { useAppSelector, useAppDispatch } from "@/services/store/store";
import { logout } from "@/services/features/auth/authSlice";
import {
  fetchTeachingClasses,
  fetchClassAIRReports,
} from "@/services/features/instructor/instructorDashboardSlice";
import AppLogo from "@/components/AppLogo/AppLogo";

interface SidebarInstructorProps {
  activeItem?: string;
}

const SidebarInstructor: React.FC<SidebarInstructorProps> = ({ activeItem }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { teachingClasses, classStats } = useAppSelector((state) => state.instructorDashboard);

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const hasBootstrappedNotifications = useRef(false);

  const expanded = !collapsed || isHovered;

  // Fetch classes + their report stats for the notification badge
  useEffect(() => {
    if (hasBootstrappedNotifications.current) return;

    // Reuse cached data to avoid re-requesting on each page navigation.
    if (teachingClasses.length > 0) {
      const hasAnyReportStats = teachingClasses.some(
        (cls) => typeof classStats[cls.classId]?.totalReports === "number",
      );
      if (hasAnyReportStats) {
        hasBootstrappedNotifications.current = true;
        return;
      }
    }

    hasBootstrappedNotifications.current = true;
    dispatch(fetchTeachingClasses()).then((action) => {
      if (fetchTeachingClasses.fulfilled.match(action)) {
        const classes = action.payload;
        if (Array.isArray(classes)) {
          classes.forEach((cls) => dispatch(fetchClassAIRReports(cls.classId)));
        }
      }
    });
  }, [dispatch, teachingClasses, classStats]);

  const { totalNeedsFeedback, classFeedbackList } = useMemo(() => {
    let total = 0;
    const list = teachingClasses
      .map((cls) => {
        const stats = classStats[cls.classId];
        const count = stats?.needsFeedback ?? 0;
        total += count;
        return {
          classId: cls.classId,
          classCode: cls.classCode,
          courseName: cls.course?.courseName ?? "",
          semester: cls.course?.semester ?? "",
          count,
        };
      })
      .filter((c) => c.count > 0)
      .sort((a, b) => b.count - a.count);
    return { totalNeedsFeedback: total, classFeedbackList: list };
  }, [teachingClasses, classStats]);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const fullName = user
    ? `${user.firstName} ${user.lastName}`.trim()
    : "Giảng viên";
  const userRole = user?.roles?.[0]?.roleName
    ? user.roles[0].roleName === "Student"
      ? "Sinh viên"
      : user.roles[0].roleName === "Instructor"
        ? "Giảng viên"
        : user.roles[0].roleName === "Admin"
          ? "Quản trị viên"
          : user.roles[0].roleName
    : "Giảng viên";

  const menuItems = [
    { id: "dashboard", label: "Bảng điều khiển", icon: LayoutDashboard, path: "/instructor/dashboard" },
    { id: "manage-classes", label: "Lớp học của tôi", icon: BookOpen, path: "/instructor/manage-classes" },
    { id: "students", label: "Sinh viên", icon: Users, path: "/instructor/students" },
    { id: "presentations", label: "Bài thuyết trình", icon: FileText, path: "/instructor/presentations" },
  ];

  const isActive = (itemId: string) => {
    if (activeItem) return activeItem === itemId;
    if (itemId === "manage-classes") {
      return location.pathname.includes("/instructor/manage-classes") ||
             location.pathname.includes("/instructor/class/");
    }
    return location.pathname.includes(itemId);
  };

  const notifContent = (
    <div className="w-[320px]">
      <div className="flex items-center justify-between px-1 pb-2">
        <span className="font-semibold text-slate-800 text-sm">Báo cáo cần phản hồi</span>
        {totalNeedsFeedback > 0 && (
          <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
            {totalNeedsFeedback} chờ xử lý
          </span>
        )}
      </div>
      <Divider className="!my-1" />
      {classFeedbackList.length === 0 ? (
        <Empty
          description={<span className="text-xs text-slate-500">Không có báo cáo nào cần phản hồi</span>}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          className="py-4"
        />
      ) : (
        <ul className="space-y-1 max-h-[320px] overflow-y-auto">
          {classFeedbackList.map((item) => (
            <li key={item.classId}>
              <Link
                to={`/instructor/class/${item.classId}`}
                onClick={() => setNotifOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-indigo-50 transition-colors group"
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <ClipboardList className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-indigo-700">
                    {item.classCode}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {item.courseName}
                    {item.semester ? ` · ${item.semester}` : ""}
                  </p>
                </div>
                <div className="flex-shrink-0 flex items-center gap-1.5">
                  <span className="text-sm font-bold text-white bg-red-500 rounded-full w-6 h-6 flex items-center justify-center shadow-sm shadow-red-400/40">
                    {item.count}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {classFeedbackList.length > 0 && (
        <>
          <Divider className="!my-2" />
          <Link
            to="/instructor/manage-classes"
            onClick={() => setNotifOpen(false)}
            className="flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            Xem tất cả lớp học
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </>
      )}
    </div>
  );

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
        {/* Header — logo + notification bell */}
        <div className="relative overflow-hidden flex-shrink-0 px-3 py-4">
          <div className="flex items-center justify-between gap-2">
            {expanded && (
              <div className="pl-3">
                <AppLogo to="/" size="md" />
              </div>
            )}

            <Popover
              open={notifOpen}
              onOpenChange={setNotifOpen}
              trigger="click"
              placement={expanded ? "bottomRight" : "right"}
              arrow={false}
              styles={{ body: { padding: 12, borderRadius: 14, minWidth: 320 } }}
              content={notifContent}
            >
              <button
                title="Báo cáo cần phản hồi"
                className={`
                  relative flex items-center justify-center w-10 h-10 rounded-xl
                  transition-all duration-200
                  ${notifOpen
                    ? "bg-indigo-100 text-indigo-700"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                  }
                  ${!expanded ? "mx-auto" : "ml-auto"}
                `}
              >
                <Bell className="w-5 h-5" />
                {totalNeedsFeedback > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shadow-sm shadow-red-400/50">
                    {totalNeedsFeedback > 99 ? "99+" : totalNeedsFeedback}
                  </span>
                )}
              </button>
            </Popover>
          </div>
        </div>

        {/* Feedback summary banner — only when expanded and has pending */}
        {expanded && totalNeedsFeedback > 0 && (
          <div className="mx-3 mb-2 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <p className="text-xs text-amber-700 font-medium leading-snug">
              <span className="font-bold">{totalNeedsFeedback}</span> báo cáo AI chờ phản hồi
            </p>
          </div>
        )}

        {/* Navigation */}
        <nav className={`flex-1 px-3 py-2 space-y-1 overflow-y-auto ${expanded ? "" : "lg:px-2"} [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full`}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.id);
            const isManageClasses = item.id === "manage-classes";
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
                {/* Badge on "Manage Classes" when collapsed */}
                {isManageClasses && !expanded && totalNeedsFeedback > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-0.5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                    {totalNeedsFeedback > 9 ? "9+" : totalNeedsFeedback}
                  </span>
                )}
                {/* Badge on "Manage Classes" when expanded */}
                {isManageClasses && expanded && totalNeedsFeedback > 0 && !active && (
                  <span className="ml-auto min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                    {totalNeedsFeedback}
                  </span>
                )}
                {active && expanded && <ChevronRight className="w-4 h-4 opacity-70 flex-shrink-0" />}
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
