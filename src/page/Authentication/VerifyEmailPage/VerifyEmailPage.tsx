import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useAppDispatch, useAppSelector } from "@/services/store/store";
import { verifyEmail } from "@/services/features/auth/authSlice";
import Button from "@/components/yoodli/Button";
import ScrollAnimation from "@/components/yoodli/ScrollAnimation";
import AppLogo from "@/components/AppLogo/AppLogo";
import ResendVerificationForm from "@/components/Authentication/ResendVerificationForm/ResendVerificationForm";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

const VerifyEmailPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const dispatch = useAppDispatch();
  const { isAuthenticated, user, loading } = useAppSelector((state) => state.auth);
  const [verifyResult, setVerifyResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const verifyCalled = useRef(false);

  useEffect(() => {
    if (token && !verifyCalled.current) {
      verifyCalled.current = true;
      dispatch(verifyEmail(token))
        .then((action) => {
          if (verifyEmail.fulfilled.match(action)) {
            setVerifyResult({
              success: true,
              message: action.payload.message ?? "",
            });
          } else if (verifyEmail.rejected.match(action)) {
            setVerifyResult({
              success: false,
              message: action.payload?.message ?? "",
            });
          }
        });
    }
  }, [token, dispatch]);

  useEffect(() => {
    if (token) return;
    if (!isAuthenticated || !user) {
      navigate("/login", { replace: true });
      return;
    }
    if (user.isEmailVerified) {
      const primaryRole = user.roles?.[0]?.roleName;
      if (primaryRole === "Admin") {
        navigate("/admin/dashboard", { replace: true });
      } else if (primaryRole === "Instructor") {
        navigate("/instructor/manage-classes", { replace: true });
      } else if (primaryRole === "Student") {
        navigate("/student/dashboard", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    }
  }, [token, isAuthenticated, user, navigate]);

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

  if (token) {
    const isSuccess = verifyResult?.success;
    const isError = verifyResult && !verifyResult.success;
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
        <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12">
          <motion.div
            className="w-full max-w-md bg-white/90 backdrop-blur border border-slate-100 shadow-xl shadow-sky-100/30 rounded-2xl p-8 md:p-10"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            {loading && !verifyResult && (
              <div className="flex flex-col items-center gap-5 py-6">
                <div className="rounded-full bg-sky-50 p-4">
                  <Loader2 className="w-10 h-10 text-sky-500 animate-spin" />
                </div>
                <p className="text-slate-600 text-sm font-medium">
                  Đang xác thực email...
                </p>
                <p className="text-slate-400 text-xs max-w-[260px] text-center">
                  Vui lòng đợi trong giây lát
                </p>
              </div>
            )}
            {verifyResult && (
              <motion.div
                className="flex flex-col items-center text-center"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                <div
                  className={`rounded-full p-4 mb-5 ${
                    isSuccess ? "bg-green-50" : "bg-red-50"
                  }`}
                >
                  {isSuccess ? (
                    <CheckCircle className="w-14 h-14 text-green-600" />
                  ) : (
                    <XCircle className="w-14 h-14 text-red-500" />
                  )}
                </div>
                <h2
                  className={`text-lg font-semibold mb-2 ${
                    isSuccess ? "text-slate-900" : "text-slate-800"
                  }`}
                >
                  {isSuccess ? "Xác thực thành công" : "Xác thực thất bại"}
                </h2>
                <p
                  className={`text-sm mb-6 leading-relaxed ${
                    isSuccess
                      ? "text-slate-600"
                      : "text-red-700 bg-red-50/80 border border-red-100 rounded-xl px-4 py-3"
                  }`}
                >
                  {verifyResult.message}
                </p>
                {isError && (
                  <p className="text-xs text-slate-500 mb-4 max-w-[280px]">
                    Liên kết có thể đã hết hạn. Đăng nhập và dùng chức năng gửi
                    lại email xác thực nếu cần.
                  </p>
                )}
                <div className="flex flex-col gap-3 w-full items-center">
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
                    className="text-sm text-slate-500 hover:text-slate-800 transition-colors py-1"
                  >
                    Về trang chủ
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        </main>
      </div>
    );
  }

  if (!isAuthenticated || !user || user.isEmailVerified) {
    return null;
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
          <motion.div
            className="flex items-center gap-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <AppLogo to="/" size="md" />
          </motion.div>

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
                Xác thực tài khoản
              </p>
            </ScrollAnimation>

            <ScrollAnimation type="slide" direction="up" delay={0.2}>
              <h1 className="text-3xl md:text-4xl font-semibold text-slate-900 leading-tight">
                Xác thực{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-indigo-500">
                  email
                </span>
              </h1>
            </ScrollAnimation>

            <ScrollAnimation type="slide" direction="up" delay={0.3}>
              <p className="text-slate-600 text-sm md:text-base">
                Tài khoản của bạn chưa xác thực email. Vui lòng kiểm tra hộp thư
                và bấm vào liên kết trong email. Nếu chưa nhận được, bạn có thể
                gửi lại email xác thực.
              </p>
            </ScrollAnimation>

            <ScrollAnimation type="slide" direction="up" delay={0.4}>
              <ul className="space-y-2 text-sm text-slate-700">
                {[
                  "Kiểm tra hộp thư đến và thư mục spam",
                  "Bấm vào liên kết xác thực trong email",
                  "Sau khi xác thực, đăng nhập lại để vào trang của bạn",
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

          <ResendVerificationForm email={user.email} />
        </div>
      </main>
    </div>
  );
};

export default VerifyEmailPage;
