import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, ArrowLeft } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/services/store/store";
import { resendVerification } from "@/services/features/auth/authSlice";
import Button from "@/components/yoodli/Button";
import ScrollAnimation from "@/components/yoodli/ScrollAnimation";

interface ResendVerificationFormProps {
  email: string;
}

const ResendVerificationForm: React.FC<ResendVerificationFormProps> = ({
  email,
}) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { loading } = useAppSelector((state) => state.auth);
  const [apiMessage, setApiMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiMessage(null);

    const resultAction = await dispatch(resendVerification({ email }));

    if (resendVerification.fulfilled.match(resultAction)) {
      const message = resultAction.payload.message;
      setApiMessage({
        type: "success",
        text: message ?? "",
      });
      return;
    }

    if (resendVerification.rejected.match(resultAction)) {
      const payload = resultAction.payload;
      const message =
        payload?.message ??
        (payload?.errors && payload.errors[0]?.msg
          ? payload.errors[0].msg
          : "");
      setApiMessage({
        type: "error",
        text: message,
      });
    }
  };

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
            Xác thực email
          </h2>
        </ScrollAnimation>
        <ScrollAnimation type="fade" delay={0.5}>
          <p className="text-sm text-slate-500 mb-6">
            Tài khoản của bạn chưa xác thực email. Chúng tôi sẽ gửi lại liên
            kết xác thực đến <span className="font-medium text-slate-700">{email}</span>.
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
                  readOnly
                  value={email}
                  className="w-full border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-sm outline-none bg-slate-50 text-slate-700 relative z-0"
                  whileFocus={{ scale: 1.01 }}
                />
              </div>
            </div>
          </ScrollAnimation>

          <ScrollAnimation type="fade" delay={0.7}>
            <div className="pt-2">
              <Button
                text={loading ? "Đang gửi..." : "Gửi lại email xác thực"}
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
              Đã xác thực?{" "}
              <button
                onClick={() => navigate("/login")}
                className="text-sky-600 hover:text-sky-700 font-medium"
              >
                Đăng nhập lại
              </button>
            </p>
          </div>
        </ScrollAnimation>
      </div>
    </ScrollAnimation>
  );
};

export default ResendVerificationForm;
