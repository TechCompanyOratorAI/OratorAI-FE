import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAppSelector } from "@/services/store/store";
import Button from "@/components/yoodli/Button";
import ScrollAnimation from "@/components/yoodli/ScrollAnimation";
import LoginForm from "@/components/Authentication/LoginForm/LoginForm";

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated && user) {
      const primaryRole = user.roles?.[0]?.roleName;
      if (primaryRole === "Admin") {
        navigate("/admin/dashboard");
      } else if (primaryRole === "Instructor") {
        navigate("/instructor/manage-courses");
      } else if (primaryRole === "Student") {
        navigate("/student/dashboard");
      } else {
        navigate("/");
      }
    }
  }, [isAuthenticated, user, navigate]);

  const headerVariants = {
    hidden: { y: -20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  const fadeInVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-indigo-50 flex flex-col">
      {/* Top nav đơn giản với logo */}
      <motion.header
        className="px-4 py-4"
        initial="hidden"
        animate="visible"
        variants={headerVariants as any}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <motion.div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate("/")}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >

            <span className="font-semibold text-lg text-slate-900">
              FPTOratorAI
            </span>
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

      {/* Content */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-6 sm:py-8">
        <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10 items-center">
          {/* Left intro */}
          <div className="space-y-6">
            <ScrollAnimation type="slide" direction="right" delay={0.1}>
              <p className="inline-flex items-center text-xs font-semibold tracking-wide text-sky-600 uppercase bg-sky-50 border border-sky-100 rounded-full px-3 py-1 w-fit">
                OratorAI • AI đánh giá thuyết trình
              </p>
            </ScrollAnimation>

            <ScrollAnimation type="slide" direction="up" delay={0.2}>
              <h1 className="text-3xl md:text-4xl font-semibold text-slate-900 leading-tight">
                Đăng nhập{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-indigo-500">
                  OratorAI
                </span>
              </h1>
            </ScrollAnimation>

            <ScrollAnimation type="slide" direction="up" delay={0.3}>
              <p className="text-slate-600 text-sm md:text-base">
                Ghi âm, chấm điểm và phân tích bài thuyết trình nhanh hơn.
              </p>
            </ScrollAnimation>

            <ScrollAnimation type="slide" direction="up" delay={0.4}>
              <ul className="space-y-2 text-sm text-slate-700">
                {[
                  "Transcript Việt – Anh",
                  "Chấm điểm & báo cáo",
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

          {/* Right form */}
          <LoginForm />
        </div>
      </main>
    </div>
  );
};

export default LoginPage;

