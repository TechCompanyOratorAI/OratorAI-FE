import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, GraduationCap, UserCog, Settings } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/services/store/store";
import { loginUser, logout } from "@/services/features/auth/authSlice";
import Button from "@/components/yoodli/Button";
import ScrollAnimation from "@/components/yoodli/ScrollAnimation";
import { message } from "antd";

type SelectedRole = "Student" | "Instructor" | "Admin" | null;

const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { loading, user, isAuthenticated } = useAppSelector((state) => state.auth);
  const [selectedRole, setSelectedRole] = useState<SelectedRole>(null);
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // Check if user is logged in and handle role selection
  useEffect(() => {
    if (isAuthenticated && user && selectedRole) {
      const primaryRole = user.roles?.[0]?.roleName;
      // If Student selects Instructor, force logout
      if (primaryRole === "Student" && selectedRole === "Instructor") {
        dispatch(logout());
        message.warning("Vui lòng đăng nhập lại với tài khoản Instructor");
        setSelectedRole(null);
      }
    }
  }, [selectedRole, isAuthenticated, user, dispatch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedRole) {
      message.warning("Vui lòng chọn vai trò của bạn");
      return;
    }

    try {
      const resultAction = await dispatch(
        loginUser({ usernameOrEmail, password })
      );

      if (loginUser.fulfilled.match(resultAction)) {
        // Redirect based on user role
        const user = resultAction.payload.user;
        const primaryRole = user.roles?.[0]?.roleName;

        // Verify selected role matches user's actual role
        if (primaryRole !== selectedRole) {
          message.error(`Bạn không có quyền truy cập với vai trò ${selectedRole}`);
          dispatch(logout());
          return;
        }

        if (primaryRole === "Admin") {
          navigate("/admin/dashboard");
        } else if (primaryRole === "Instructor") {
          navigate("/instructor/manage-courses");
        } else if (primaryRole === "Student") {
          navigate("/student/dashboard");
        } else {
          // Default to home page
          navigate("/");
        }
      }
    } catch (error) {
      // Error is handled by authSlice with toast
      console.error("Login error:", error);
    }
  };

  return (
    <ScrollAnimation type="slide" direction="left" delay={0.2}>
      <div className="bg-white/80 backdrop-blur border border-slate-100 shadow-xl shadow-sky-100/40 rounded-2xl p-6 md:p-8">
        <ScrollAnimation type="fade" delay={0.3}>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            Chào bạn
          </h2>
        </ScrollAnimation>
        <ScrollAnimation type="fade" delay={0.4}>
          <p className="text-sm text-slate-500 mb-4">
            Chọn vai trò để tiếp tục
          </p>
        </ScrollAnimation>

        {/* Role Selection */}
        <ScrollAnimation type="fade" delay={0.45}>
          <div className="grid grid-cols-3 gap-3 mb-6">
            <motion.button
              type="button"
              onClick={() => setSelectedRole("Student")}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${selectedRole === "Student"
                ? "border-sky-500 bg-sky-50 text-sky-700"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <GraduationCap
                size={24}
                className={selectedRole === "Student" ? "text-sky-600" : "text-slate-400"}
              />
              <span className="text-xs font-medium">Student</span>
            </motion.button>

            <motion.button
              type="button"
              onClick={() => setSelectedRole("Instructor")}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${selectedRole === "Instructor"
                ? "border-sky-500 bg-sky-50 text-sky-700"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <UserCog
                size={24}
                className={selectedRole === "Instructor" ? "text-sky-600" : "text-slate-400"}
              />
              <span className="text-xs font-medium">Instructor</span>
            </motion.button>

            <motion.button
              type="button"
              onClick={() => setSelectedRole("Admin")}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${selectedRole === "Admin"
                ? "border-sky-500 bg-sky-50 text-sky-700"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Settings
                size={24}
                className={selectedRole === "Admin" ? "text-sky-600" : "text-slate-400"}
              />
              <span className="text-xs font-medium">Admin</span>
            </motion.button>

          </div>
        </ScrollAnimation>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <ScrollAnimation type="fade" delay={0.5}>
            <div className="space-y-1.5">
              <label
                htmlFor="usernameOrEmail"
                className="text-sm font-medium text-slate-700"
              >
                Username hoặc Email
              </label>
              <motion.input
                id="usernameOrEmail"
                type="text"
                required
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-sky-500/60 focus:border-sky-400 bg-white"
                placeholder="username hoặc you@company.com"
                whileFocus={{ scale: 1.01 }}
              />
            </div>
          </ScrollAnimation>

          <ScrollAnimation type="fade" delay={0.6}>
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="text-sm font-medium text-slate-700"
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
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 pr-10 text-sm outline-none focus:ring-2 focus:ring-sky-500/60 focus:border-sky-400 bg-white"
                  placeholder="Nhập mật khẩu của bạn"
                  whileFocus={{ scale: 1.01 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>
          </ScrollAnimation>

          <ScrollAnimation type="fade" delay={0.7}>
            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-slate-600">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="rounded border-slate-300 text-sky-500 focus:ring-sky-400"
                />
                Ghi nhớ đăng nhập
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
                  paddingHeight="10px"
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
          <div className="mt-6">
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="flex-1 h-px bg-slate-200" />
              Hoặc
              <span className="flex-1 h-px bg-slate-200" />
            </div>

            <div className="mt-4 flex justify-center">
              <div className="w-full max-w-sm flex justify-center">
                <Button
                  text="Đăng nhập với Google"
                  variant="secondary"
                  fontSize="12px"
                  borderRadius="8px"
                  paddingWidth="12px"
                  paddingHeight="8px"
                  onClick={() => { }}
                />
              </div>
            </div>
          </div>
        </ScrollAnimation>

        <ScrollAnimation type="fade" delay={1.0}>
          <div className="mt-6">
            <p className="text-xs text-slate-500 text-center">
              Chưa có tài khoản?{" "}
              {selectedRole === "Instructor" ? (
                <button
                  onClick={() => navigate("/register-instructor")}
                  className="text-sky-600 hover:text-sky-700 font-medium"
                >
                  Yêu cầu truy cập
                </button>
              ) : (
                <button
                  onClick={() => navigate("/register")}
                  className="text-sky-600 hover:text-sky-700 font-medium"
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
            <span className="text-sky-600">Điều khoản sử dụng</span> và{" "}
            <span className="text-sky-600">Chính sách bảo mật</span> của
            OratorAI.
          </p>
        </ScrollAnimation>
      </div>
    </ScrollAnimation>
  );
};

export default LoginForm;

