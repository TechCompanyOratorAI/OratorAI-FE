import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, ArrowLeft } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/services/store/store";
import { forgotPassword } from "@/services/features/auth/authSlice";
import Button from "@/components/yoodli/Button";
import ScrollAnimation from "@/components/yoodli/ScrollAnimation";

const ForgotPasswordForm: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { loading } = useAppSelector((state) => state.auth);
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const resultAction = await dispatch(forgotPassword({ email }));

      if (forgotPassword.fulfilled.match(resultAction)) {
        setIsSubmitted(true);
      }
    } catch (error) {
      // Error is handled by authSlice with toast
      console.error("Forgot password error:", error);
    }
  };

  if (isSubmitted) {
    return (
      <ScrollAnimation type="slide" direction="left" delay={0.2}>
        <div className="bg-white/80 backdrop-blur border border-slate-100 shadow-xl shadow-sky-100/40 rounded-2xl p-6 md:p-8">
          <ScrollAnimation type="fade" delay={0.3}>
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-sky-100 rounded-full flex items-center justify-center mb-4">
                <Mail className="text-sky-600" size={32} />
              </div>
              <h2 className="text-xl font-semibold text-slate-900 mb-2">
                Kiểm tra email của bạn
              </h2>
              <p className="text-sm text-slate-500 mb-6">
                Nếu tài khoản với email <span className="font-medium text-slate-700">{email}</span> tồn tại,
                chúng tôi đã gửi liên kết đặt lại mật khẩu đến email của bạn.
              </p>
              <p className="text-xs text-slate-400 mb-6">
                Vui lòng kiểm tra hộp thư đến và làm theo hướng dẫn để đặt lại mật khẩu.
              </p>
              <div className="space-y-3">
                <Button
                  text="Quay lại đăng nhập"
                  variant="primary"
                  paddingHeight="10px"
                  paddingWidth="16px"
                  fontSize="14px"
                  borderRadius="12px"
                  onClick={() => navigate("/login")}
                />
                <button
                  onClick={() => {
                    setIsSubmitted(false);
                    setEmail("");
                  }}
                  className="text-sm text-sky-600 hover:text-sky-700 font-medium"
                >
                  Gửi lại email
                </button>
              </div>
            </div>
          </ScrollAnimation>
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
            Quên mật khẩu?
          </h2>
        </ScrollAnimation>
        <ScrollAnimation type="fade" delay={0.5}>
          <p className="text-sm text-slate-500 mb-6">
            Nhập email của bạn và chúng tôi sẽ gửi cho bạn liên kết để đặt lại mật khẩu.
          </p>
        </ScrollAnimation>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <ScrollAnimation type="fade" delay={0.6}>
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="text-sm font-medium text-slate-700"
              >
                Email
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none z-10"
                  size={18}
                />
                <motion.input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-sky-500/60 focus:border-sky-400 bg-white relative z-0"
                  placeholder="you@company.com"
                  whileFocus={{ scale: 1.01 }}
                />
              </div>
            </div>
          </ScrollAnimation>

          <ScrollAnimation type="fade" delay={0.7}>
            <div className="pt-2">
              <Button
                text={loading ? "Đang gửi..." : "Gửi liên kết đặt lại mật khẩu"}
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

export default ForgotPasswordForm;
