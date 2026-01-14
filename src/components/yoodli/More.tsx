import React from "react";
import ScrollAnimation from "./ScrollAnimation";

// Bản rút gọn của section "More" với hình minh hoạ tĩnh

const More: React.FC = () => {
  return (
    <section className="flex flex-col lg:flex-row justify-center items-center lg:gap-20 py-16 md:py-24 px-4">
      <ScrollAnimation>
        <div className="hidden lg:block lg:w-[456px] h-[350px] bg-gradient-to-br from-sky-50 to-indigo-50 rounded-3xl shadow-inner" />
      </ScrollAnimation>
      <ScrollAnimation>
        <div className="max-w-[480px] space-y-4">
          <h2 className="text-[26px] md:text-[32px] font-bold">
            Không chỉ là luyện nói. Là nền tảng kỹ năng giao tiếp cho cả tổ chức.
          </h2>
          <p className="text-[15px] text-gray-700">
            Theo dõi tiến bộ, chuẩn hoá thông điệp, và giúp mọi người tự tin hơn trong phỏng vấn, thuyết trình,
            hội họp, và mọi cuộc trò chuyện quan trọng.
          </p>
        </div>
      </ScrollAnimation>
    </section>
  );
};

export default More;

