import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import Button from "@/components/yoodli/Button";
import ScrollAnimation from "@/components/yoodli/ScrollAnimation";
import AppLogo from "@/components/AppLogo/AppLogo";
import ResetPasswordForm from "@/components/Authentication/ResetPasswordForm/ResetPasswordForm";
import { AlertCircle } from "lucide-react";

const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const headerVariants = {
    hidden: { y: -20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5, ease: "easeOut" as const },
    },
  };

  const fadeInVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
    },
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-indigo-50 flex flex-col">
        <motion.header
          className="px-4 py-4"
          initial="hidden"
          animate="visible"
          variants={headerVariants}
        >
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <AppLogo to="/" size="md" />
            <Button
              text="Quay lại trang chủ"
              variant="tertiary"
              fontSize="14px"
              paddingWidth="12px"
              paddingHeight="8px"
              onClick={() => navigate("/")}
            />
          </div>
        </motion.header>
        <main className="flex-1 flex items-center justify-center px-4 py-8">
          <motion.div
            className="w-full max-w-md bg-white/90 backdrop-blur border border-slate-100 shadow-xl shadow-sky-100/30 rounded-2xl p-8 text-center"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="text-amber-600" size={32} />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">
              Thiếu liên kết đặt lại mật khẩu
            </h2>
            <p className="text-sm text-slate-600 mb-6">
              Trang này cần link từ email. Nếu bạn chưa nhận được email, hãy yêu
              cầu gửi lại liên kết đặt lại mật khẩu.
            </p>
            <div className="flex flex-col gap-3 items-center">
              <Button
                text="Gửi lại link đặt mật khẩu"
                variant="primary"
                paddingHeight="10px"
                paddingWidth="16px"
                fontSize="14px"
                borderRadius="12px"
                onClick={() => navigate("/forgot-password")}
              />
              <button
                onClick={() => navigate("/login")}
                className="text-sm text-slate-500 hover:text-slate-800"
              >
                Quay lại đăng nhập
              </button>
            </div>
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-indigo-50 flex flex-col">
      <motion.header
        className="px-4 py-4"
        initial="hidden"
        animate="visible"
        variants={headerVariants}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <AppLogo to="/" size="md" />
          <Button
            text="Quay lại trang chủ"
            variant="tertiary"
            fontSize="14px"
            paddingWidth="12px"
            paddingHeight="8px"
            onClick={() => navigate("/")}
          />
        </div>
      </motion.header>

      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-6 sm:py-8">
        <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10 items-center">
          <div className="space-y-6">
            <ScrollAnimation type="slide" direction="right" delay={0.1}>
              <p className="inline-flex items-center text-xs font-semibold tracking-wide text-sky-600 uppercase bg-sky-50 border border-sky-100 rounded-full px-3 py-1 w-fit">
                Đặt lại mật khẩu
              </p>
            </ScrollAnimation>

            <ScrollAnimation type="slide" direction="up" delay={0.2}>
              <h1 className="text-3xl md:text-4xl font-semibold text-slate-900 leading-tight">
                Mật khẩu{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-indigo-500">
                  mới
                </span>
              </h1>
            </ScrollAnimation>

            <ScrollAnimation type="slide" direction="up" delay={0.3}>
              <p className="text-slate-600 text-sm md:text-base">
                Bạn đã nhấn vào link từ email. Nhập mật khẩu mới và xác nhận để
                hoàn tất đặt lại mật khẩu.
              </p>
            </ScrollAnimation>

            <ScrollAnimation type="slide" direction="up" delay={0.4}>
              <ul className="space-y-2 text-sm text-slate-700">
                {[
                  "Mật khẩu ít nhất 6 ký tự",
                  "Không dùng mật khẩu cũ",
                  "Sau khi đổi xong, đăng nhập bằng mật khẩu mới",
                ].map((item, index) => (
                  <motion.li
                    key={index}
                    className="flex items-start gap-2"
                    initial="hidden"
                    animate="visible"
                    variants={fadeInVariants}
                    transition={{
                      delay: 0.5 + index * 0.1,
                      duration: 0.5,
                      ease: "easeOut",
                    }}
                  >
                    <span className="mt-1 h-5 w-5 rounded-full bg-sky-100 flex items-center justify-center text-sky-600 text-xs">
                      ✓
                    </span>
                    {item}
                  </motion.li>
                ))}
              </ul>
            </ScrollAnimation>
          </div>

          <ResetPasswordForm token={token} />
        </div>
      </main>
    </div>
  );
};

export default ResetPasswordPage;
