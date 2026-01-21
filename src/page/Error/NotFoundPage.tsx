import { Link } from "react-router-dom";

const NotFoundPage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <p className="inline-flex items-center px-3 py-1 rounded-full bg-slate-800/70 border border-slate-700 text-xs font-medium tracking-wide uppercase text-slate-300">
          404 • Không tìm thấy trang
        </p>

        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
          Ôi, trang bạn truy cập không tồn tại
        </h1>

        <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
          Đường dẫn có thể đã bị thay đổi, bị xóa hoặc bạn nhập sai URL. Hãy quay về
          trang chính hoặc điều hướng qua các menu trong ứng dụng.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            to="/"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-sky-500 hover:bg-sky-400 text-sm font-semibold shadow-lg shadow-sky-500/30 transition"
          >
            Về trang chủ
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-full border border-slate-600 hover:border-slate-400 hover:bg-slate-800/60 text-sm font-semibold text-slate-200 transition"
          >
            Đi tới trang đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;

