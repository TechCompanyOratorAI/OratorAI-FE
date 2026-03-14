import React, { useState } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
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
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/services/store/store";
import { changePassword } from "@/services/features/auth/authSlice";
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

  const fullName = user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.username || "Student" : "Student";
  const initials = fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) { toast.error("Vui lòng điền đầy đủ thông tin."); return; }
    if (newPassword !== confirmPassword) { toast.error("Mật khẩu mới không khớp."); return; }
    if (newPassword.length < 6) { toast.error("Mật khẩu mới phải có ít nhất 6 ký tự."); return; }
    if (newPassword === currentPassword) { toast.error("Mật khẩu mới phải khác mật khẩu cũ."); return; }

    setIsChangingPwd(true);
    try {
      await dispatch(changePassword({ currentPassword, newPassword })).unwrap();
      toast.success("Đổi mật khẩu thành công!");
      setPasswordSuccess(true);
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err: any) {
      toast.error(err?.message || "Đổi mật khẩu thất bại.");
    } finally {
      setIsChangingPwd(false);
    }
  };

  const profileFields = [
    { icon: User, label: "Tên đầy đủ", value: fullName },
    { icon: Mail, label: "Email", value: user?.email || "—" },
    { icon: AtSign, label: "Tên đăng nhập", value: user?.username || "—" },
    { icon: IdCard, label: "Vai trò", value: "Học viên (Student)" },
  ];

  return (
    <StudentLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Page Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Cài đặt</h1>
          <p className="text-slate-500 mt-1">Quản lý thông tin cá nhân và bảo mật tài khoản</p>
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
                <Icon className="w-4 h-4" />{label}
              </Tabs.Trigger>
            ))}
          </Tabs.List>

          {/* Profile Tab */}
          <Tabs.Content value="profile" className="mt-4 outline-none">
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {/* Avatar header */}
              <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 p-8 flex flex-col items-center gap-4">
                <div className="w-24 h-24 rounded-2xl bg-white/20 backdrop-blur-sm border-2 border-white/40 flex items-center justify-center text-4xl font-bold text-white shadow-xl">
                  {initials}
                </div>
                <div className="text-center">
                  <h2 className="text-xl font-bold text-white">{fullName}</h2>
                  <p className="text-blue-100 text-sm mt-0.5">{user?.email}</p>
                  <span className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 text-white text-xs font-semibold rounded-full border border-white/30">
                    <User className="w-3.5 h-3.5" /> Student
                  </span>
                </div>
              </div>

              {/* Profile fields */}
              <div className="p-6">
                <h3 className="text-base font-bold text-slate-900 mb-4">Thông tin tài khoản</h3>
                <div className="space-y-3">
                  {profileFields.map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">{label}</p>
                        <p className="text-sm font-semibold text-slate-900 mt-0.5">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-700 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>Để thay đổi thông tin hồ sơ, vui lòng liên hệ quản trị viên hoặc giảng viên phụ trách.</span>
                </div>
              </div>
            </motion.div>
          </Tabs.Content>

          {/* Security Tab */}
          <Tabs.Content value="security" className="mt-4 outline-none">
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Đổi mật khẩu</h3>
                  <p className="text-xs text-slate-500">Cập nhật mật khẩu để bảo vệ tài khoản</p>
                </div>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-4">
                {/* Current password */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Mật khẩu hiện tại *</label>
                  <div className="relative">
                    <input
                      type={showCurrentPwd ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Nhập mật khẩu hiện tại"
                      className="w-full pr-10 px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                    <button type="button" onClick={() => setShowCurrentPwd(!showCurrentPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showCurrentPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* New password */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Mật khẩu mới *</label>
                  <div className="relative">
                    <input
                      type={showNewPwd ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Ít nhất 6 ký tự"
                      className="w-full pr-10 px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                    <button type="button" onClick={() => setShowNewPwd(!showNewPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showNewPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {newPassword.length > 0 && (
                    <div className="mt-2 flex gap-1">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i < (newPassword.length >= 12 ? 4 : newPassword.length >= 8 ? 3 : newPassword.length >= 6 ? 2 : 1) ? "bg-blue-500" : "bg-slate-200"}`} />
                      ))}
                    </div>
                  )}
                </div>

                {/* Confirm password */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Xác nhận mật khẩu mới *</label>
                  <div className="relative">
                    <input
                      type={showConfirmPwd ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Nhập lại mật khẩu mới"
                      className={`w-full pr-10 px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${confirmPassword && newPassword !== confirmPassword ? "border-red-300 bg-red-50" : "border-slate-200"}`}
                      required
                    />
                    <button type="button" onClick={() => setShowConfirmPwd(!showConfirmPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showConfirmPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-xs text-red-600 mt-1">Mật khẩu không khớp</p>
                  )}
                </div>

                {passwordSuccess && (
                  <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700">
                    <CheckCircle2 className="w-4 h-4 shrink-0" /> Đổi mật khẩu thành công!
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isChangingPwd || !currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-3 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isChangingPwd ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Đang đổi...</>
                  ) : (
                    <><Save className="w-4 h-4" /> Đổi mật khẩu</>
                  )}
                </button>
              </form>
            </motion.div>
          </Tabs.Content>
        </Tabs.Root>
      </div>
    </StudentLayout>
  );
};

export default StudentSettingsPage;
