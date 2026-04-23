import React, { useEffect, useState } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { Button, Avatar as AntAvatar, Upload, DatePicker } from "antd";
import type { UploadProps } from "antd";
import dayjs from "dayjs";
import {
  User,
  Lock,
  Eye,
  EyeOff,
  Save,
  Loader2,
  CheckCircle2,
  Mail,
  AtSign,
  IdCard,
  Camera,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/services/store/store";
import {
  changePassword,
  uploadAvatar,
  getProfile,
  updateProfile,
} from "@/services/features/auth/authSlice";
import StudentLayout from "@/components/StudentLayout/StudentLayout";

const StudentSettingsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const [activeTab, setActiveTab] = useState("profile");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [isChangingPwd, setIsChangingPwd] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: "",
    lastName: "",
    dob: "",
    studyMajor: "",
  });

  useEffect(() => {
    dispatch(getProfile());
  }, [dispatch]);

  useEffect(() => {
    setProfileForm({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      dob: user?.dob ? String(user.dob).slice(0, 10) : "",
      studyMajor: user?.studyMajor || "",
    });
  }, [user?.firstName, user?.lastName, user?.dob, user?.studyMajor]);

  const avatarUrl = user?.avatar || null;

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

  const hasProfileChanges =
    profileForm.firstName.trim() !== (user?.firstName || "") ||
    profileForm.lastName.trim() !== (user?.lastName || "") ||
    profileForm.dob !== (user?.dob ? String(user.dob).slice(0, 10) : "") ||
    profileForm.studyMajor.trim() !== (user?.studyMajor || "");

  const uploadProps: UploadProps = {
    accept: "image/jpeg,image/png,image/gif,image/webp",
    showUploadList: false,
    beforeUpload: (file) => {
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Chỉ chấp nhận file ảnh: JPEG, PNG, GIF, WebP");
        return Upload.LIST_IGNORE;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File ảnh không được vượt quá 5MB");
        return Upload.LIST_IGNORE;
      }
      return true;
    },
    customRequest: async ({ file, onSuccess, onError }) => {
      setIsUploadingAvatar(true);
      try {
        await dispatch(uploadAvatar(file as File)).unwrap();
        onSuccess?.({});
      } catch (err: unknown) {
        const error = err as { message?: string };
        onError?.(new Error(error.message || "Upload avatar thất bại"));
      } finally {
        setIsUploadingAvatar(false);
      }
    },
  };

  const handleProfileChange = (
    field: "firstName" | "lastName" | "dob" | "studyMajor",
    value: string,
  ) => {
    setProfileForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profileForm.firstName.trim() || !profileForm.lastName.trim()) {
      toast.error("Họ và tên không được để trống.");
      return;
    }

    setIsSavingProfile(true);
    try {
      await dispatch(
        updateProfile({
          firstName: profileForm.firstName.trim(),
          lastName: profileForm.lastName.trim(),
          dob: profileForm.dob || null,
          studyMajor: profileForm.studyMajor.trim() || null,
        }),
      ).unwrap();
      toast.success("Cập nhật hồ sơ thành công!");
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error?.message || "Cập nhật hồ sơ thất bại.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Vui lòng điền đầy đủ thông tin.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu mới không khớp.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }
    if (newPassword === currentPassword) {
      toast.error("Mật khẩu mới phải khác mật khẩu cũ.");
      return;
    }

    setIsChangingPwd(true);
    try {
      await dispatch(changePassword({ currentPassword, newPassword })).unwrap();
      toast.success("Đổi mật khẩu thành công!");
      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error?.message || "Đổi mật khẩu thất bại.");
    } finally {
      setIsChangingPwd(false);
    }
  };

  return (
    <StudentLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Cài đặt
          </h1>
          <p className="text-slate-500 mt-1">
            Quản lý thông tin cá nhân và bảo mật tài khoản
          </p>
        </motion.div>

        {/* Tabs */}
        <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
          <Tabs.List className="flex gap-1 bg-white border border-slate-200 rounded-2xl p-1 shadow-sm">
            {[
              { value: "profile", label: "Hồ sơ", icon: User },
              { value: "security", label: "Bảo mật", icon: Lock },
            ].map(({ value, label, icon: Icon }) => (
              <Tabs.Trigger
                key={value}
                value={value}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${activeTab === value ? "text-blue-700 bg-blue-50 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"}`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Tabs.Trigger>
            ))}
          </Tabs.List>

          {/* Profile Tab */}
          <Tabs.Content value="profile" className="mt-4 outline-none">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
            >
              {/* Avatar header */}
              <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 p-8 flex flex-col items-center gap-4">
                <Upload {...uploadProps}>
                  <div className="relative group cursor-pointer">
                    <AntAvatar
                      size={96}
                      src={avatarUrl}
                      className="ring-4 ring-white/30 shadow-xl text-3xl font-bold"
                    >
                      {!avatarUrl && initials}
                    </AntAvatar>
                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="w-8 h-8 text-white" />
                    </div>
                    {isUploadingAvatar && (
                      <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                      </div>
                    )}
                  </div>
                </Upload>
                <div className="text-center">
                  <h2 className="text-xl font-bold text-white">{fullName}</h2>
                  <p className="text-blue-100 text-sm mt-0.5">{user?.email}</p>
                  <span className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 text-white text-xs font-semibold rounded-full border border-white/30">
                    <User className="w-3.5 h-3.5" /> Student
                  </span>
                  <p className="mt-2 text-blue-100/70 text-xs">
                    Click vào avatar để thay đổi ảnh
                  </p>
                </div>
              </div>

              {/* Profile fields */}
              <div className="p-6">
                <h3 className="text-base font-bold text-slate-900 mb-4">
                  Thông tin hồ sơ
                </h3>
                <form onSubmit={handleSaveProfile} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Tên *
                      </label>
                      <input
                        type="text"
                        value={profileForm.firstName}
                        onChange={(e) =>
                          handleProfileChange("firstName", e.target.value)
                        }
                        placeholder="Nhập tên"
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Họ *
                      </label>
                      <input
                        type="text"
                        value={profileForm.lastName}
                        onChange={(e) =>
                          handleProfileChange("lastName", e.target.value)
                        }
                        placeholder="Nhập họ"
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Ngày sinh
                      </label>
                      <DatePicker
                        value={profileForm.dob ? dayjs(profileForm.dob) : null}
                        onChange={(date) =>
                          handleProfileChange(
                            "dob",
                            date ? date.format("YYYY-MM-DD") : "",
                          )
                        }
                        format="DD/MM/YYYY"
                        className="w-full h-[42px]"
                        placeholder="dd/mm/yyyy"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Chuyên ngành
                      </label>
                      <input
                        type="text"
                        value={profileForm.studyMajor}
                        onChange={(e) =>
                          handleProfileChange("studyMajor", e.target.value)
                        }
                        placeholder="Ví dụ: Công nghệ thông tin"
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                        <Mail className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">
                          Email
                        </p>
                        <p className="text-sm font-semibold text-slate-900 mt-0.5">
                          {user?.email || "—"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                        <AtSign className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">
                          Tên đăng nhập
                        </p>
                        <p className="text-sm font-semibold text-slate-900 mt-0.5">
                          {user?.username || "—"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                        <IdCard className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">
                          Vai trò
                        </p>
                        <p className="text-sm font-semibold text-slate-900 mt-0.5">
                          Học viên (Student)
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-700 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>
                      Bạn có thể tự cập nhật họ tên, ngày sinh và chuyên ngành.
                      Email và tên đăng nhập hiện chưa chỉnh sửa tại đây.
                    </span>
                  </div>

                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={
                      isSavingProfile ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )
                    }
                    loading={isSavingProfile}
                    disabled={!hasProfileChanges}
                  >
                    Lưu thay đổi
                  </Button>
                </form>
              </div>
            </motion.div>
          </Tabs.Content>

          {/* Security Tab */}
          <Tabs.Content value="security" className="mt-4 outline-none">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Đổi mật khẩu</h3>
                  <p className="text-xs text-slate-500">
                    Cập nhật mật khẩu để bảo vệ tài khoản
                  </p>
                </div>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-4">
                {/* Current password */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Mật khẩu hiện tại *
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPwd ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Nhập mật khẩu hiện tại"
                      className="w-full pr-10 px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPwd(!showCurrentPwd)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showCurrentPwd ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* New password */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Mật khẩu mới *
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPwd ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Ít nhất 6 ký tự"
                      className="w-full pr-10 px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPwd(!showNewPwd)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showNewPwd ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {newPassword.length > 0 && (
                    <div className="mt-2 flex gap-1">
                      {[...Array(4)].map((_, i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-all ${i < (newPassword.length >= 12 ? 4 : newPassword.length >= 8 ? 3 : newPassword.length >= 6 ? 2 : 1) ? "bg-blue-500" : "bg-slate-200"}`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Confirm password */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Xác nhận mật khẩu mới *
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPwd ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Nhập lại mật khẩu mới"
                      className={`w-full pr-10 px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${confirmPassword && newPassword !== confirmPassword ? "border-red-300 bg-red-50" : "border-slate-200"}`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPwd ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-xs text-red-600 mt-1">
                      Mật khẩu không khớp
                    </p>
                  )}
                </div>

                {passwordSuccess && (
                  <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700">
                    <CheckCircle2 className="w-4 h-4 shrink-0" /> Đổi mật khẩu
                    thành công!
                  </div>
                )}

                <Button
                  type="primary"
                  block
                  icon={
                    isChangingPwd ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )
                  }
                  htmlType="submit"
                  loading={isChangingPwd}
                  disabled={
                    !currentPassword ||
                    !newPassword ||
                    !confirmPassword ||
                    newPassword !== confirmPassword
                  }
                >
                  Đổi mật khẩu
                </Button>
              </form>
            </motion.div>
          </Tabs.Content>
        </Tabs.Root>
      </div>
    </StudentLayout>
  );
};

export default StudentSettingsPage;
