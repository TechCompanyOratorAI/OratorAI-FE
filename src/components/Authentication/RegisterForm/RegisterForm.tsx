import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/services/store/store";
import { registerUser } from "@/services/features/auth/authSlice";
import Button from "@/components/yoodli/Button";
import ScrollAnimation from "@/components/yoodli/ScrollAnimation";

const RegisterForm: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { loading } = useAppSelector((state) => state.auth);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    firstName: "",
    lastName: "",
  });
  const [passwordError, setPasswordError] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validatePassword = (password: string): string => {
    if (password.length < 8) {
      return "Mật khẩu phải có ít nhất 8 ký tự";
    }
    if (!/[A-Z]/.test(password)) {
      return "Mật khẩu phải có ít nhất 1 chữ hoa";
    }
    if (!/[a-z]/.test(password)) {
      return "Mật khẩu phải có ít nhất 1 chữ thường";
    }
    if (!/[0-9]/.test(password)) {
      return "Mật khẩu phải có ít nhất 1 số";
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return "Mật khẩu phải có ít nhất 1 ký tự đặc biệt";
    }
    return "";
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "password") {
      const error = validatePassword(value);
      setPasswordError(error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate password
    const error = validatePassword(formData.password);
    if (error) {
      setPasswordError(error);
      return;
    }

    // Validate confirm password
    if (formData.password !== confirmPassword) {
      setPasswordError("Mật khẩu xác nhận không khớp");
      return;
    }

    try {
      const resultAction = await dispatch(registerUser(formData));

      if (registerUser.fulfilled.match(resultAction)) {
        // Redirect to login page after successful registration
        navigate("/login");
      }
    } catch (error) {
      // Error is handled by authSlice with toast
      console.error("Register error:", error);
    }
  };

  return (
    <ScrollAnimation type="slide" direction="left" delay={0.2}>
      <div className="bg-white/80 backdrop-blur border border-slate-100 shadow-xl shadow-sky-100/40 rounded-2xl p-6 md:p-8">
        <ScrollAnimation type="fade" delay={0.3}>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            Đăng ký tài khoản OratorAI
          </h2>
        </ScrollAnimation>
        <ScrollAnimation type="fade" delay={0.4}>
          <p className="text-sm text-slate-500 mb-6">
            Tạo tài khoản mới để bắt đầu sử dụng hệ thống đánh giá bài thuyết trình
            với AI.
          </p>
        </ScrollAnimation>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <ScrollAnimation type="fade" delay={0.5}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="firstName"
                  className="text-sm font-medium text-slate-700"
                >
                  Họ
                </label>
                <motion.input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-sky-500/60 focus:border-sky-400 bg-white"
                  placeholder="Họ của bạn"
                  whileFocus={{ scale: 1.01 }}
                />
              </div>
              <div className="space-y-1.5">
                <label
                  htmlFor="lastName"
                  className="text-sm font-medium text-slate-700"
                >
                  Tên
                </label>
                <motion.input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-sky-500/60 focus:border-sky-400 bg-white"
                  placeholder="Tên của bạn"
                  whileFocus={{ scale: 1.01 }}
                />
              </div>
            </div>
          </ScrollAnimation>

          <ScrollAnimation type="fade" delay={0.6}>
            <div className="space-y-1.5">
              <label
                htmlFor="username"
                className="text-sm font-medium text-slate-700"
              >
                Username
              </label>
              <motion.input
                id="username"
                name="username"
                type="text"
                required
                value={formData.username}
                onChange={handleChange}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-sky-500/60 focus:border-sky-400 bg-white"
                placeholder="username"
                whileFocus={{ scale: 1.01 }}
              />
            </div>
          </ScrollAnimation>

          <ScrollAnimation type="fade" delay={0.7}>
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="text-sm font-medium text-slate-700"
              >
                Email
              </label>
              <motion.input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-sky-500/60 focus:border-sky-400 bg-white"
                placeholder="you@company.com"
                whileFocus={{ scale: 1.01 }}
              />
            </div>
          </ScrollAnimation>

          <ScrollAnimation type="fade" delay={0.8}>
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
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full border rounded-xl px-3 py-2.5 pr-10 text-sm outline-none focus:ring-2 focus:ring-sky-500/60 bg-white ${
                    passwordError
                      ? "border-red-300 focus:border-red-400"
                      : "border-slate-200 focus:border-sky-400"
                  }`}
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
              {passwordError && (
                <p className="text-xs text-red-500 mt-1">{passwordError}</p>
              )}
              {!passwordError && formData.password && (
                <p className="text-xs text-slate-500 mt-1">
                  Mật khẩu phải có ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt
                </p>
              )}
            </div>
          </ScrollAnimation>

          <ScrollAnimation type="fade" delay={0.9}>
            <div className="space-y-1.5">
              <label
                htmlFor="confirmPassword"
                className="text-sm font-medium text-slate-700"
              >
                Xác nhận mật khẩu
              </label>
              <div className="relative">
                <motion.input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (e.target.value !== formData.password) {
                      setPasswordError("Mật khẩu xác nhận không khớp");
                    } else if (formData.password) {
                      const error = validatePassword(formData.password);
                      setPasswordError(error);
                    }
                  }}
                  className={`w-full border rounded-xl px-3 py-2.5 pr-10 text-sm outline-none focus:ring-2 focus:ring-sky-500/60 bg-white ${
                    passwordError && confirmPassword
                      ? "border-red-300 focus:border-red-400"
                      : "border-slate-200 focus:border-sky-400"
                  }`}
                  placeholder="Nhập lại mật khẩu"
                  whileFocus={{ scale: 1.01 }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>
          </ScrollAnimation>

          <ScrollAnimation type="fade" delay={1.0}>
            <div className="pt-2">
              <Button
                text={loading ? "Đang đăng ký..." : "Đăng ký"}
                variant="primary"
                paddingHeight="10px"
                paddingWidth="16px"
                fontSize="14px"
                borderRadius="12px"
                type="submit"
              />
            </div>
          </ScrollAnimation>
        </form>

        <ScrollAnimation type="fade" delay={1.1}>
          <div className="mt-6">
            <p className="text-xs text-slate-500 text-center">
              Đã có tài khoản?{" "}
              <button
                onClick={() => navigate("/login")}
                className="text-sky-600 hover:text-sky-700 font-medium"
              >
                Đăng nhập ngay
              </button>
            </p>
          </div>
        </ScrollAnimation>

        <ScrollAnimation type="fade" delay={1.2}>
          <p className="mt-4 text-[11px] text-slate-400 text-center leading-relaxed">
            Bằng việc đăng ký, bạn đồng ý với{" "}
            <span className="text-sky-600">Điều khoản sử dụng</span> và{" "}
            <span className="text-sky-600">Chính sách bảo mật</span> của
            OratorAI.
          </p>
        </ScrollAnimation>
      </div>
    </ScrollAnimation>
  );
};

export default RegisterForm;

