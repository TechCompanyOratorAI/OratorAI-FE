import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Layout,
  Menu,
  Avatar,
  Badge,
  Dropdown,
  Button,
  Typography,
  Drawer,
  Popover,
  Empty,
  Divider,
  Tag,
} from "antd";
import type { MenuProps } from "antd";
import {
  BookOpen,
  Mic2,
  Bell,
  Menu as MenuIcon,
  LogOut,
  Settings,
  X,
  Home,
  CheckCheck,
  FileText,
  Star,
  AlertTriangle,
  Info,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { useAppDispatch, useAppSelector } from "@/services/store/store";
import { logout } from "@/services/features/auth/authSlice";
import { addNotification, markAllRead, markAllReadApi, fetchNotifications } from "@/services/features/notification/notificationSlice";
import type { Notification } from "@/services/features/notification/notificationSlice";
import type { GradeDistribution } from "@/services/features/groupGrade/groupGradeSlice";
import { useSocket } from "@/hooks/useSocket";
import AppLogo from "@/components/AppLogo/AppLogo";

// ── Rich toast body ───────────────────────────────────────────────────────────
const ToastBody = ({ title, message }: { title: string; message: string }) => (
  <div>
    <p className="font-semibold text-sm leading-tight">{title}</p>
    <p className="text-xs opacity-80 mt-0.5 leading-snug">{message}</p>
  </div>
);

const { Header, Content } = Layout;
const { Text } = Typography;

interface StudentLayoutProps {
  children: React.ReactNode;
}

const notifMeta: Record<string, { color: string; icon: React.ReactNode; tag: string }> = {
  "report:generated":               { color: "blue",    icon: <FileText className="h-4 w-4" />,      tag: "Báo cáo" },
  "report:confirmed":               { color: "green",   icon: <Star className="h-4 w-4" />,           tag: "Xác nhận" },
  "report:rejected":                { color: "red",     icon: <AlertTriangle className="h-4 w-4" />,  tag: "Từ chối" },
  "report:criterion-feedback-changed": { color: "cyan", icon: <Info className="h-4 w-4" />,           tag: "Phản hồi" },
  "grade:distributed":              { color: "purple",  icon: <Info className="h-4 w-4" />,           tag: "Điểm" },
  "grade:finalized":                { color: "green",   icon: <Star className="h-4 w-4" />,           tag: "Điểm" },
  "grade:reopened":                 { color: "orange",  icon: <AlertTriangle className="h-4 w-4" />,  tag: "Điểm" },
  "grade:feedback-updated":         { color: "cyan",    icon: <Info className="h-4 w-4" />,           tag: "Phản hồi" },
  "class:upload-permission-changed":{ color: "gold",    icon: <Info className="h-4 w-4" />,           tag: "Lớp học" },
};

function formatRelativeTime(isoDate: string) {
  const diff = Date.now() - new Date(isoDate).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Vừa xong";
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  return `${Math.floor(h / 24)} ngày trước`;
}

function NotificationPanel({
  items,
  onMarkAllRead,
}: {
  items: Notification[];
  onMarkAllRead: () => void;
}) {
  if (items.length === 0) {
    return (
      <div className="w-[340px] py-6">
        <Empty description="Không có thông báo nào" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </div>
    );
  }

  return (
    <div className="w-[340px] max-h-[480px] flex flex-col">
      <div className="flex items-center justify-between px-4 py-3">
        <span className="font-semibold text-slate-800 text-sm">Thông báo</span>
        <button
          onClick={onMarkAllRead}
          className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 transition-colors"
        >
          <CheckCheck className="h-3.5 w-3.5" />
          Đánh dấu đã đọc
        </button>
      </div>
      <Divider className="!my-0" />
      <ul className="overflow-y-auto flex-1 divide-y divide-slate-100">
        {items.map((notif) => {
          const meta = notifMeta[notif.type] ?? { color: "default", icon: <Info className="h-4 w-4" />, tag: "Thông báo" };
          return (
            <li
              key={notif.id}
              className={[
                "flex gap-3 px-4 py-3 transition-colors",
                !notif.read ? "bg-blue-50/60" : "bg-white hover:bg-slate-50",
              ].join(" ")}
            >
              <div className={`mt-0.5 shrink-0 text-${meta.color}-500`}>{meta.icon}</div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-medium text-slate-800 truncate">{notif.title}</span>
                  <Tag color={meta.color} className="!text-[10px] !px-1.5 !py-0 shrink-0">{meta.tag}</Tag>
                  {!notif.read && <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />}
                </div>
                <p className="text-xs text-slate-500 leading-snug">{notif.message}</p>
                <span className="text-[11px] text-slate-400 mt-1 block">{formatRelativeTime(notif.createdAt)}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

const navItems = [
  { key: "/student/dashboard", label: "Trang chủ", icon: <Home className="h-5 w-5" /> },
  { key: "/student/my-class", label: "Lớp của tôi", icon: <BookOpen className="h-5 w-5" /> },
  { key: "/student/my-presentations", label: "Bài thuyết trình", icon: <Mic2 className="h-5 w-5" /> },
];

const StudentLayout: React.FC<StudentLayoutProps> = ({ children }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAppSelector((state) => state.auth);
  const { unreadCount, items: notifications } = useAppSelector((state) => state.notification);
  const { on } = useSocket();

  // ── Data for enriched notifications ──────────────────────────────────────────
  const { enrolledClasses } = useAppSelector((state) => state.enrollment);
  const { presentations, currentPresentation } = useAppSelector((state) => state.presentation);
  const { distributions } = useAppSelector((state) => state.groupGrade);

  // Refs keep latest Redux values accessible inside stable socket-listener closure
  const enrolledClassesRef = useRef(enrolledClasses);
  const presentationsRef = useRef(presentations);
  const currentPresentationRef = useRef(currentPresentation);
  const distributionsRef = useRef<GradeDistribution[]>(distributions);
  useEffect(() => { enrolledClassesRef.current = enrolledClasses; }, [enrolledClasses]);
  useEffect(() => { presentationsRef.current = presentations; }, [presentations]);
  useEffect(() => { currentPresentationRef.current = currentPresentation; }, [currentPresentation]);
  useEffect(() => { distributionsRef.current = distributions; }, [distributions]);

  // ── Lookup helpers ────────────────────────────────────────────────────────────
  const getClass = useCallback((classId: number) =>
    enrolledClassesRef.current.find((e) => e.class?.classId === classId)?.class,
  []);

  const getPresentation = useCallback((presentationId: number) => {
    const fromList = presentationsRef.current.find((p) => p.presentationId === presentationId);
    if (fromList) return fromList;
    const cur = currentPresentationRef.current;
    return cur?.presentationId === presentationId ? cur : null;
  }, []);

  const getGroupName = useCallback((groupId: number): string | null => {
    const dist = distributionsRef.current.find(
      (d) => d.groupId === groupId || d.group?.groupId === groupId,
    );
    return dist?.group?.groupName ?? null;
  }, []);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  // Fetch persisted notifications from DB on mount (catches missed events while offline)
  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  // ── Global socket listeners for notifications ──────────────────────────────────
  useEffect(() => {
    const notify = (
      type: string,
      title: string,
      message: string,
      toastType: "success" | "info" | "warning" | "error" = "info",
      presentationId = 0,
    ) => {
      dispatch(addNotification({ type, presentationId, title, message }));
      toast[toastType](<ToastBody title={title} message={message} />, {
        toastId: `${type}-${Date.now()}`,
      });
    };

    const unwatchReportGenerated = on<{ presentationId: number; message?: string }>(
      "report:generated",
      (payload) => {
        const pres = getPresentation(payload?.presentationId);
        const presTitle = pres?.title ? `"${pres.title}"` : null;
        const classCode = pres?.class?.classCode ?? null;
        const message = presTitle
          ? `Báo cáo bài ${presTitle}${classCode ? ` (${classCode})` : ""} đã sẵn sàng.`
          : "Báo cáo đánh giá mới đã được tạo xong!";
        notify("report:generated", "Báo cáo AI sẵn sàng", message, "success", payload?.presentationId);
      }
    );

    const unwatchReportConfirmed = on<{ presentationId: number }>(
      "report:confirmed",
      (payload) => {
        const pres = getPresentation(payload?.presentationId);
        const presTitle = pres?.title ? `"${pres.title}"` : null;
        const classCode = pres?.class?.classCode ?? null;
        const message = presTitle
          ? `Giảng viên đã xác nhận báo cáo bài ${presTitle}${classCode ? ` (${classCode})` : ""}.`
          : "Giảng viên đã xác nhận báo cáo AI của bạn!";
        notify("report:confirmed", "Báo cáo được xác nhận", message, "success", payload?.presentationId);
      }
    );

    const unwatchReportRejected = on<{ presentationId: number; message?: string }>(
      "report:rejected",
      (payload) => {
        const pres = getPresentation(payload?.presentationId);
        const presTitle = pres?.title ? `"${pres.title}"` : null;
        const classCode = pres?.class?.classCode ?? null;
        const message = payload?.message
          ?? (presTitle
            ? `Giảng viên đã từ chối báo cáo bài ${presTitle}${classCode ? ` (${classCode})` : ""}.`
            : "Giảng viên đã từ chối báo cáo AI của bạn.");
        notify("report:rejected", "Báo cáo bị từ chối", message, "error", payload?.presentationId);
      }
    );

    const unwatchReportCriterionFeedbackChanged = on<{ presentationId: number; criterionId: number }>(
      "report:criterion-feedback-changed",
      (payload) => {
        const pres = getPresentation(payload?.presentationId);
        const presTitle = pres?.title ? `"${pres.title}"` : null;
        const message = presTitle
          ? `Giảng viên đã cập nhật phản hồi tiêu chí cho bài ${presTitle}.`
          : "Giảng viên đã cập nhật phản hồi cho một tiêu chí đánh giá.";
        notify("report:criterion-feedback-changed", "Phản hồi tiêu chí cập nhật", message, "info", payload?.presentationId);
      }
    );

    const unwatchGradeDistributed = on<{ groupId: number; reportId: number }>(
      "grade:distributed",
      (payload) => {
        const groupName = getGroupName(payload?.groupId);
        const message = groupName
          ? `Trưởng nhóm ${groupName} đã phân chia điểm cho các thành viên.`
          : "Trưởng nhóm đã phân chia điểm cho các thành viên.";
        notify("grade:distributed", "Điểm đã được phân chia", message, "info");
      }
    );

    const unwatchGradeFinalized = on<{ groupId: number; reportId: number }>(
      "grade:finalized",
      (payload) => {
        const groupName = getGroupName(payload?.groupId);
        const message = groupName
          ? `Điểm nhóm ${groupName} đã được giảng viên chốt chính thức.`
          : "Điểm đã được chốt bởi giảng viên.";
        notify("grade:finalized", "Điểm đã được chốt", message, "success");
      }
    );

    const unwatchGradeReopened = on<{ groupId: number; reportId: number }>(
      "grade:reopened",
      (payload) => {
        const groupName = getGroupName(payload?.groupId);
        const message = groupName
          ? `Giảng viên đã mở lại việc phân chia điểm cho nhóm ${groupName}.`
          : "Giảng viên đã mở lại việc phân chia điểm.";
        notify("grade:reopened", "Điểm được mở lại", message, "warning");
      }
    );

    const unwatchGradeFeedbackUpdated = on<{ groupId: number; memberId: number }>(
      "grade:feedback-updated",
      (payload) => {
        const groupName = getGroupName(payload?.groupId);
        const message = groupName
          ? `Phản hồi điểm của nhóm ${groupName} đã được cập nhật.`
          : "Phản hồi về điểm số của bạn đã được cập nhật.";
        notify("grade:feedback-updated", "Phản hồi điểm cập nhật", message, "info");
      }
    );

    const unwatchUploadPermission = on<{ classId: number; isUploadEnabled: boolean }>(
      "class:upload-permission-changed",
      (payload) => {
        const enabled = payload?.isUploadEnabled;
        const cls = getClass(payload?.classId);
        const classLabel = cls?.classCode
          ? `Lớp ${cls.classCode}`
          : `Lớp #${payload?.classId}`;
        const message = enabled
          ? `${classLabel} đã được mở quyền nộp bài thuyết trình.`
          : `${classLabel} đã đóng quyền nộp bài thuyết trình.`;
        notify("class:upload-permission-changed", "Quyền nộp bài thay đổi", message, enabled ? "success" : "warning");
      }
    );

    return () => {
      unwatchReportGenerated?.();
      unwatchReportConfirmed?.();
      unwatchReportRejected?.();
      unwatchReportCriterionFeedbackChanged?.();
      unwatchGradeDistributed?.();
      unwatchGradeFinalized?.();
      unwatchGradeReopened?.();
      unwatchGradeFeedbackUpdated?.();
      unwatchUploadPermission?.();
    };
  }, [on, dispatch, getClass, getPresentation, getGroupName]);

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

  const avatarSrc = user?.avatar || null;

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const getSelectedKey = () => {
    const path = location.pathname;
    if (
      path === "/student/my-presentations" ||
      path.startsWith("/student/presentation/") ||
      path.startsWith("/student/presentation-detail/")
    ) return "/student/my-presentations";
    if (
      path === "/student/my-class" ||
      path.startsWith("/student/class/") ||
      path.startsWith("/student/my-class/")
    ) return "/student/my-class";
    return "/student/dashboard";
  };

  const menuItems: MenuProps["items"] = navItems.map((item) => ({
    key: item.key,
    icon: item.icon,
    label: item.label,
    onClick: () => { navigate(item.key); setMobileOpen(false); },
  }));

  const userMenuItems: MenuProps["items"] = [
    {
      key: "settings",
      icon: <Settings className="w-4 h-4" />,
      label: "Cài đặt tài khoản",
      onClick: () => navigate("/student/settings"),
    },
    { type: "divider" },
    {
      key: "logout",
      icon: <LogOut className="w-4 h-4" />,
      label: "Đăng xuất",
      danger: true,
      onClick: handleLogout,
    },
  ];

  const selectedKey = getSelectedKey();

  return (
    <Layout className="min-h-screen bg-slate-50/50">
      {/* Top Header */}
      <Header
        className="fixed top-0 left-0 right-0 z-50 !h-[68px] !leading-none !px-0 !py-0 bg-white/95 backdrop-blur-md border-b border-slate-200/60 shadow-sm"
      >
        <div className="mx-auto flex h-[68px] w-full max-w-none items-center px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="grid w-full min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 sm:gap-4 lg:gap-8">
            {/* Logo */}
            <div className="flex min-w-0 shrink-0 items-center">
              <AppLogo to="/" size="lg" className="!text-xl !font-bold !tracking-tight sm:!text-2xl" />
            </div>

            {/* Desktop Nav */}
            <nav
              className="hidden min-h-0 min-w-0 items-center justify-center gap-2 overflow-x-auto lg:flex xl:gap-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
              aria-label="Điều hướng học sinh"
            >
              {navItems.map((item) => {
                const active = selectedKey === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => navigate(item.key)}
                    className={[
                      "inline-flex shrink-0 items-center gap-2.5 rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-200",
                      active
                        ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 hover:shadow-sm",
                    ].join(" ")}
                  >
                    {item.icon}
                    <span className="whitespace-nowrap">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Right */}
            <div className="flex shrink-0 items-center justify-end gap-1.5 sm:gap-2">
              <Popover
                open={notifOpen}
                onOpenChange={(open) => {
                  setNotifOpen(open);
                  if (!open) {
                    dispatch(markAllRead());
                    dispatch(markAllReadApi());
                  }
                }}
                trigger="click"
                placement="bottomRight"
                arrow={false}
                overlayInnerStyle={{ padding: 0, borderRadius: 12, overflow: "hidden" }}
                content={
                  <NotificationPanel
                    items={notifications}
                    onMarkAllRead={() => { dispatch(markAllRead()); dispatch(markAllReadApi()); setNotifOpen(false); }}
                  />
                }
              >
                <Badge count={unreadCount} size="small" offset={[-2, 2]} overflowCount={99}>
                  <Button
                    type="text"
                    icon={<Bell className="h-5 w-5" />}
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-all duration-200"
                    aria-label="Thông báo"
                  />
                </Badge>
              </Popover>

              <Dropdown menu={{ items: userMenuItems }} trigger={["click"]} placement="bottomRight">
                <Button
                  type="text"
                  className="flex h-auto max-w-[220px] items-center gap-3 rounded-xl py-1.5 pl-1.5 pr-3 hover:bg-slate-100 transition-all duration-200 sm:max-w-[280px]"
                >
                  <Avatar
                    size={38}
                    src={avatarSrc}
                    className="flex shrink-0 items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-bold text-white shadow-lg shadow-blue-500/20"
                  >
                    {!avatarSrc && initials}
                  </Avatar>
                  <div className="hidden min-w-0 flex-col items-start text-left sm:flex">
                    <Text className="max-w-full truncate text-sm font-semibold text-slate-800">
                      {fullName}
                    </Text>
                  </div>
                </Button>
              </Dropdown>

              <Button
                type="text"
                icon={mobileOpen ? <X className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
                onClick={() => setMobileOpen(!mobileOpen)}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 lg:hidden transition-all duration-200"
                aria-label="Mở menu"
              />
            </div>
          </div>
        </div>
      </Header>

      {/* Mobile Drawer */}
      <Drawer
        title={
          <div className="flex flex-col gap-0.5 min-w-0">
            <AppLogo to="/" size="md" />
          </div>
        }
        placement="left"
        onClose={() => setMobileOpen(false)}
        open={mobileOpen}
        width={280}
        className="[&_.ant-drawer-body]:!p-0"
        styles={{ body: { padding: 0 } }}
        extra={
          <div className="flex items-center gap-2 px-1">
            <Avatar size={28} src={avatarSrc} className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xs font-semibold">
              {!avatarSrc && initials}
            </Avatar>
            <Text className="text-sm font-medium text-slate-700">{fullName}</Text>
          </div>
        }
      >
        <Menu
          mode="vertical"
          selectedKeys={[selectedKey]}
          items={menuItems}
          className="border-0 mt-2"
        />
      </Drawer>

      {/* Main Content */}
      <Layout className="mt-[68px]" style={{ background: "transparent" }}>
        <Content className="w-full max-w-none px-3 py-5 sm:px-4 sm:py-6 md:px-5 md:py-6 lg:px-6 lg:py-6 xl:px-8">
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default StudentLayout;
