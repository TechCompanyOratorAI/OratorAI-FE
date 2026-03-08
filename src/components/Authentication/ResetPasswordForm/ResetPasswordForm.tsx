import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff, ArrowLeft, CheckCircle } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/services/store/store";
import { resetPassword } from "@/services/features/auth/authSlice";
import Button from "@/components/yoodli/Button";
import ScrollAnimation from "@/components/yoodli/ScrollAnimation";

interface ResetPasswordFormProps {
  token: string;
}

const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({ token }) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { loading } = useAppSelector((state) => state.auth);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [apiMessage, setApiMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiMessage(null);

    if (password !== confirmPassword) {
      setApiMessage({ type: "error", text: "Mật khẩu xác nhận không khớp" });
      return;
    }

    if (password.length < 6) {
      setApiMessage({ type: "error", text: "Mật khẩu cần ít nhất 6 ký tự" });
      return;
    }

    const resultAction = await dispatch(resetPassword({ token, password }));

    if (resetPassword.fulfilled.match(resultAction)) {
      setApiMessage({
        type: "success",
        text: resultAction.payload.message ?? "",
      });
      setIsSuccess(true);
      return;
    }

    if (resetPassword.rejected.match(resultAction)) {
      setApiMessage({
        type: "error",
        text: resultAction.payload?.message ?? "",
      });
    }
  };

  if (isSuccess && apiMessage?.type === "success") {
    return (
      <ScrollAnimation type="slide" direction="left" delay={0.2}>
        <div className="bg-white/80 backdrop-blur border border-slate-100 shadow-xl shadow-sky-100/40 rounded-2xl p-6 md:p-8">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="text-green-600" size={32} />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">
              Đặt lại mật khẩu thành công
            </h2>
            <p className="text-sm text-slate-600 mb-6">{apiMessage.text}</p>
            <div className="flex flex-col items-center gap-3">
              <Button
                text="Đăng nhập"
                variant="primary"
                paddingHeight="10px"
                paddingWidth="16px"
                fontSize="14px"
                borderRadius="12px"
                onClick={() => navigate("/login")}
              />
              <button
                onClick={() => navigate("/")}
                className="text-sm text-slate-500 hover:text-slate-800"
              >
                Về trang chủ
              </button>
            </div>
          </div>
        </div>
      </ScrollAnimation>
    );
  }

  return (
    <ScrollAnimation type="slide" direction="left" delay={0.2}>
      <div className="bg-white/80 backdrop-blur border border-slate-100 shadow-xl shadow-sky-100/40 rounded-2xl p-6 md:p-8">
        <ScrollAnimation type="fade" delay={0.3}>
          <button
            onClick={() => navigate("/login")}
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-4 transition-colors"
          >
            <ArrowLeft size={16} />
            Quay lại đăng nhập
          </button>
        </ScrollAnimation>

        <ScrollAnimation type="fade" delay={0.4}>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            Đặt lại mật khẩu
          </h2>
        </ScrollAnimation>
        <ScrollAnimation type="fade" delay={0.5}>
          <p className="text-sm text-slate-500 mb-6">
            Nhập mật khẩu mới cho tài khoản của bạn.
          </p>
        </ScrollAnimation>

        {apiMessage && (
          <div
            className={`mb-4 rounded-xl px-3 py-2.5 text-sm ${
              apiMessage.type === "success"
                ? "bg-green-50 text-green-800 border border-green-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {apiMessage.text}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <ScrollAnimation type="fade" delay={0.6}>
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="text-sm font-medium text-slate-700"
              >
                Mật khẩu mới
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none z-10"
                  size={18}
                />
                <motion.input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-sm outline-none focus:ring-2 focus:ring-sky-500/60 focus:border-sky-400 bg-white relative z-0"
                  placeholder="Nhập mật khẩu mới"
                  whileFocus={{ scale: 1.01 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 z-10"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </ScrollAnimation>

          <ScrollAnimation type="fade" delay={0.65}>
            <div className="space-y-1.5">
              <label
                htmlFor="confirmPassword"
                className="text-sm font-medium text-slate-700"
              >
                Xác nhận mật khẩu
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none z-10"
                  size={18}
                />
                <motion.input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-sm outline-none focus:ring-2 focus:ring-sky-500/60 focus:border-sky-400 bg-white relative z-0"
                  placeholder="Nhập lại mật khẩu mới"
                  whileFocus={{ scale: 1.01 }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 z-10"
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

          <ScrollAnimation type="fade" delay={0.7}>
            <div className="pt-2">
              <Button
                text={loading ? "Đang xử lý..." : "Đặt lại mật khẩu"}
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

        <ScrollAnimation type="fade" delay={0.8}>
          <div className="mt-6">
            <p className="text-xs text-slate-500 text-center">
              Nhớ mật khẩu?{" "}
              <button
                onClick={() => navigate("/login")}
                className="text-sky-600 hover:text-sky-700 font-medium"
              >
                Đăng nhập ngay
              </button>
            </p>
          </div>
        </ScrollAnimation>
      </div>
    </ScrollAnimation>
  );
};

export default ResetPasswordForm;
