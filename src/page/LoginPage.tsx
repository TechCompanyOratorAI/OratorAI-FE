import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "@/components/yoodli/Button";

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: call API login ở đây
    // Tạm thời chỉ mock chuyển về trang chủ
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-indigo-50 flex flex-col">
      {/* Top nav đơn giản với logo */}
      <header className="px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate("/")}
          >
            <img
              src="/yoodli_logo.svg"
              alt="OratorAI Logo"
              className="w-8 h-8"
            />
            <span className="font-semibold text-lg text-slate-900">
              OratorAI
            </span>
          </div>

          <button
            className="text-sm text-slate-600 hover:text-slate-900"
            onClick={() => navigate("/")}
          >
            Quay lại trang chủ
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          {/* Left intro */}
          <div className="space-y-6">
            <p className="inline-flex items-center text-xs font-semibold tracking-wide text-sky-600 uppercase bg-sky-50 border border-sky-100 rounded-full px-3 py-1 w-fit">
              Hệ thống AI đánh giá bài thuyết trình OratorAI
            </p>

            <h1 className="text-3xl md:text-4xl font-semibold text-slate-900 leading-tight">
              Đăng nhập để{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-indigo-500">
                quản lý và đánh giá thuyết trình
              </span>
            </h1>

            <p className="text-slate-600 text-sm md:text-base">
              Dành cho giảng viên, sinh viên và đơn vị đào tạo muốn tự động hoá việc
              ghi lại, chấm điểm và phân tích mức độ bám sát slide của từng bài
              thuyết trình.
            </p>

            <ul className="space-y-2 text-sm text-slate-700">
              <li className="flex items-start gap-2">
                <span className="mt-1 h-5 w-5 rounded-full bg-sky-100 flex items-center justify-center text-sky-600 text-xs">
                  ✓
                </span>
                Chuyển đổi giọng nói thành transcript song ngữ Việt – Anh
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-5 w-5 rounded-full bg-sky-100 flex items-center justify-center text-sky-600 text-xs">
                  ✓
                </span>
                Đánh giá độ liên quan giữa lời nói và nội dung từng trang slide
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-5 w-5 rounded-full bg-sky-100 flex items-center justify-center text-sky-600 text-xs">
                  ✓
                </span>
                Dashboard theo dõi tiến bộ cho từng sinh viên, lớp học và khoá học
              </li>
            </ul>
          </div>

          {/* Right form */}
          <div className="bg-white/80 backdrop-blur border border-slate-100 shadow-xl shadow-sky-100/40 rounded-2xl p-6 md:p-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-2">
              Đăng nhập vào hệ thống OratorAI
            </h2>
            <p className="text-sm text-slate-500 mb-6">
              Sử dụng tài khoản do quản trị viên cấp hoặc email trường để truy cập
              lớp học và bài thuyết trình của bạn.
            </p>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-1.5">
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-slate-700"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-sky-500/60 focus:border-sky-400 bg-white"
                  placeholder="you@company.com"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-slate-700"
                >
                  Mật khẩu
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-sky-500/60 focus:border-sky-400 bg-white"
                  placeholder="Nhập mật khẩu của bạn"
                />
              </div>

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
                <button
                  type="button"
                  className="text-sky-600 hover:text-sky-700 font-medium"
                >
                  Quên mật khẩu?
                </button>
              </div>

              <div className="pt-2">
                <Button
                  text="Đăng nhập"
                  variant="primary"
                  paddingHeight="10px"
                  paddingWidth="16px"
                  fontSize="14px"
                />
              </div>
            </form>

            <div className="mt-6">
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span className="flex-1 h-px bg-slate-200" />
                Hoặc
                <span className="flex-1 h-px bg-slate-200" />
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                <button className="flex items-center justify-center gap-2 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50">
                  <span className="w-4 h-4 bg-slate-200 rounded" />
                  Đăng nhập với Google
                </button>
                <button className="flex items-center justify-center gap-2 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50">
                  <span className="w-4 h-4 bg-slate-200 rounded" />
                  Đăng nhập với Microsoft
                </button>
              </div>
            </div>

            <p className="mt-6 text-[11px] text-slate-400 text-center leading-relaxed">
              Bằng việc tiếp tục, bạn đồng ý với{" "}
              <span className="text-sky-600">Điều khoản sử dụng</span> và{" "}
              <span className="text-sky-600">Chính sách bảo mật</span> của
              OratorAI.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;

