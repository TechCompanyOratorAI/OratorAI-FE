import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, GraduationCap, UserCog, Settings } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/services/store/store";
import { loginUser } from "@/services/features/auth/authSlice";
import Button from "@/components/yoodli/Button";
import ScrollAnimation from "@/components/yoodli/ScrollAnimation";
import { getErrorMessage, getResponseMessage } from "@/lib/toast";
import { App } from "antd";

type SelectedRole = "Student" | "Instructor" | "Admin" | null;

const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { loading } = useAppSelector((state) => state.auth);
  const { notification } = App.useApp();
  const [selectedRole, setSelectedRole] = useState<SelectedRole>(null);
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedRole) {
      notification.warning({
        message: "Cảnh báo",
        description: "Vui lòng chọn vai trò của bạn",
        placement: "topRight",
      });
      return;
    }

    try {
      const resultAction = await dispatch(
        loginUser({ usernameOrEmail, password, selectedRole }),
      );

      if (loginUser.fulfilled.match(resultAction)) {
        const payload = resultAction.payload;

        if (!payload.success) {
          notification.error({
            message: "Đăng nhập thất bại",
            description: payload.message,
            placement: "topRight",
          });
          return;
        }

        // Show success notification
        notification.success({
          message: "Đăng nhập thành công",
          description: getResponseMessage(payload, "Chào mừng bạn đã quay lại!"),
          placement: "topRight",
        });

        const user = payload.user;
        const primaryRole = user.roles?.[0]?.roleName;

        if (!user.isEmailVerified) {
          navigate("/verify-email");
          return;
        }

        if (primaryRole === "Admin") {
          navigate("/admin/dashboard");
        } else if (primaryRole === "Instructor") {
          navigate("/instructor/dashboard");
        } else if (primaryRole === "Student") {
          navigate("/student/my-class");
        } else {
          navigate("/");
        }
      } else if (loginUser.rejected.match(resultAction)) {
        const backendMessage = getErrorMessage(
          resultAction.payload ?? resultAction.error,
          "Đăng nhập thất bại",
        );

        notification.error({
          message: "Đăng nhập thất bại",
          description: backendMessage,
          placement: "topRight",
        });
      }
    } catch (error) {
      // Error is handled by authSlice with toast
      console.error("Login error:", error);
    }
  };

  return (
    <ScrollAnimation type="slide" direction="left" delay={0.2}>
      <div className="bg-white/70 backdrop-blur-xl border border-white/80 shadow-2xl shadow-indigo-100/50 rounded-3xl p-6 md:p-8">
        <ScrollAnimation type="fade" delay={0.3}>
          <h2 className="text-xl font-bold text-slate-800 mb-1">
            Chào bạn
          </h2>
        </ScrollAnimation>
        <ScrollAnimation type="fade" delay={0.4}>
          <p className="text-sm text-slate-500 mb-5">
            Chọn vai trò để tiếp tục
          </p>
        </ScrollAnimation>

        {/* Role Selection */}
        <ScrollAnimation type="fade" delay={0.45}>
          <div className="grid grid-cols-3 gap-3 mb-6">
            <motion.button
              type="button"
              onClick={() => setSelectedRole("Student")}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200 ${
                selectedRole === "Student"
                  ? "border-indigo-500 bg-indigo-50 text-indigo-700 shadow-lg shadow-indigo-200/50"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:shadow-md"
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              <GraduationCap
                size={24}
                className={
                  selectedRole === "Student" ? "text-indigo-600" : "text-slate-400"
                }
              />
              <span className="text-xs font-semibold">Sinh viên</span>
            </motion.button>

            <motion.button
              type="button"
              onClick={() => setSelectedRole("Instructor")}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200 ${
                selectedRole === "Instructor"
                  ? "border-indigo-500 bg-indigo-50 text-indigo-700 shadow-lg shadow-indigo-200/50"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:shadow-md"
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              <UserCog
                size={24}
                className={
                  selectedRole === "Instructor"
                    ? "text-indigo-600"
                    : "text-slate-400"
                }
              />
              <span className="text-xs font-semibold">Giảng viên</span>
            </motion.button>

            <motion.button
              type="button"
              onClick={() => setSelectedRole("Admin")}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200 ${
                selectedRole === "Admin"
                  ? "border-indigo-500 bg-indigo-50 text-indigo-700 shadow-lg shadow-indigo-200/50"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:shadow-md"
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              <Settings
                size={24}
                className={
                  selectedRole === "Admin" ? "text-indigo-600" : "text-slate-400"
                }
              />
              <span className="text-xs font-semibold">Quản trị</span>
            </motion.button>
          </div>
        </ScrollAnimation>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <ScrollAnimation type="fade" delay={0.5}>
            <div className="space-y-1.5">
              <label
                htmlFor="usernameOrEmail"
                className="text-sm font-semibold text-slate-700"
              >
                Tên đăng nhập hoặc Email
              </label>
              <motion.input
                id="usernameOrEmail"
                type="text"
                required
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 focus:bg-indigo-50/30 bg-white/80 transition-all duration-200"
                placeholder="Nhập tên đăng nhập hoặc email"
                whileFocus={{ scale: 1.01 }}
              />
            </div>
          </ScrollAnimation>

          <ScrollAnimation type="fade" delay={0.6}>
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="text-sm font-semibold text-slate-700"
              >
                Mật khẩu
              </label>
              <div className="relative">
                <motion.input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 pr-11 text-sm outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 focus:bg-indigo-50/30 bg-white/80 transition-all duration-200"
                  placeholder="Nhập mật khẩu của bạn"
                  whileFocus={{ scale: 1.01 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-500 transition-colors p-1"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </ScrollAnimation>

          <ScrollAnimation type="fade" delay={0.7}>
            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-500 focus:ring-indigo-400 w-4 h-4"
                />
                <span className="font-medium">Ghi nhớ đăng nhập</span>
              </label>
              <Button
                text="Quên mật khẩu?"
                variant="tertiary"
                fontSize="12px"
                paddingWidth="0px"
                paddingHeight="0px"
                onClick={() => navigate("/forgot-password")}
              />
            </div>
          </ScrollAnimation>

          <ScrollAnimation type="fade" delay={0.8}>
            <div className="pt-2 flex justify-center">
              <div className="w-full max-w-sm flex justify-center">
                <Button
                  text={loading ? "Đang đăng nhập..." : "Đăng nhập"}
                  variant="primary"
                  paddingHeight="11px"
                  paddingWidth="16px"
                  fontSize="14px"
                  borderRadius="12px"
                  type="submit"
                />
              </div>
            </div>
          </ScrollAnimation>
        </form>

        <ScrollAnimation type="fade" delay={0.9}>
          <div className="mt-5">
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="flex-1 h-px bg-slate-200" />
              <span className="font-medium">Hoặc</span>
              <span className="flex-1 h-px bg-slate-200" />
            </div>

            <div className="mt-4 flex justify-center">
              <div className="w-full max-w-sm flex justify-center">
                <Button
                  text="Đăng nhập với Google"
                  variant="secondary"
                  fontSize="12px"
                  borderRadius="12px"
                  paddingWidth="12px"
                  paddingHeight="8px"
                  onClick={() => {}}
                />
              </div>
            </div>
          </div>
        </ScrollAnimation>

        <ScrollAnimation type="fade" delay={1.0}>
          <div className="mt-5">
            <p className="text-xs text-slate-500 text-center">
              Chưa có tài khoản?{" "}
              {selectedRole === "Instructor" ? (
                <button
                  onClick={() => navigate("/register-instructor")}
                  className="text-indigo-600 hover:text-indigo-700 font-semibold transition-colors"
                >
                  Yêu cầu truy cập
                </button>
              ) : (
                <button
                  onClick={() => navigate("/register")}
                  className="text-indigo-600 hover:text-indigo-700 font-semibold transition-colors"
                >
                  Đăng ký ngay
                </button>
              )}
            </p>
          </div>
        </ScrollAnimation>

        <ScrollAnimation type="fade" delay={1.1}>
          <p className="mt-4 text-[11px] text-slate-400 text-center leading-relaxed">
            Bằng việc tiếp tục, bạn đồng ý với{" "}
            <span className="text-indigo-500 font-medium">Điều khoản sử dụng</span> và{" "}
            <span className="text-indigo-500 font-medium">Chính sách bảo mật</span> của
            OratorAI.
          </p>
        </ScrollAnimation>
      </div>
    </ScrollAnimation>
  );
};

export default LoginForm;
