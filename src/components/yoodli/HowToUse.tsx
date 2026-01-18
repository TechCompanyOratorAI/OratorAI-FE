import React, { useState } from "react";
import { Check } from "lucide-react";
import ScrollAnimation from "./ScrollAnimation";
import { motion, AnimatePresence } from "framer-motion";

const HowToUse: React.FC = () => {
  const [activeTab, setActiveTab] = useState("Đại học / Học viện");

  const getBullets = (tab: string) => {
    switch (tab) {
      case "Đại học / Học viện":
        return [
          "Giảng viên tạo lớp học, upload slide và cấu hình rubric chấm điểm",
          "Sinh viên nộp bài thuyết trình (ghi âm hoặc video) trực tiếp trên hệ thống",
          "Tự động sinh báo cáo điểm và biểu đồ tiến bộ cho từng sinh viên",
        ];
      case "Khoa / Bộ môn":
        return [
          "Chuẩn hoá tiêu chí đánh giá thuyết trình giữa các lớp và giảng viên",
          "Tổng hợp kết quả toàn khoá, xuất báo cáo cho từng học phần",
          "Theo dõi xu hướng kỹ năng thuyết trình của sinh viên qua từng năm",
        ];
      case "Trung tâm kỹ năng mềm":
        return [
          "Thiết kế kho bài tập thuyết trình theo chủ đề, kỹ năng, cấp độ",
          "Cho phép sinh viên luyện tập nhiều lần với phản hồi từ AI",
          "Tối ưu hoá nguồn lực huấn luyện viên nhờ chấm điểm bán tự động",
        ];
      case "Nghiên cứu & Thử nghiệm AI":
        return [
          "Thử nghiệm các mô hình ASR và NLP khác nhau cho tiếng Việt – Anh",
          "Đo độ chính xác, độ tương quan ngữ nghĩa giữa lời nói và slide",
          "Xây dựng dataset phục vụ các đề tài nghiên cứu tiếp theo",
        ];
      default:
        return [];
    }
  };

  const getMedia = (tab: string) => {
    switch (tab) {
      case "Đại học / Học viện":
        return "/htu/enablement.webp";
      case "Khoa / Bộ môn":
        return "/htu/learning.webp";
      case "Trung tâm kỹ năng mềm":
        return "/htu/partner.webp";
      case "Nghiên cứu & Thử nghiệm AI":
        return "/htu/corporate.webp";
      default:
        return "/htu/enablement.webp";
    }
  };

  // Motion variants for the content animation
  const contentVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };

  const imageVariants = {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
  };

  return (
    <div className="p-5 bg-white">
      <ScrollAnimation
        type="slide"
        direction="up"
        delay={0.1}
        duration={0.5}
      >
        <h2 className="text-center text-[28px] font-bold mt-30 mb-10">
          Ai sẽ sử dụng hệ thống OratorAI?
        </h2>
      </ScrollAnimation>
      <ScrollAnimation
        type="slide"
        direction="up"
        delay={0.2}
        duration={0.5}
      >
        <div className="max-w-[1100px] bg-blue-50 p-5 lg:py-5 lg:px-15 rounded-2xl mx-auto shadow-md">
          <div className="flex flex-row gap-2 overflow-auto">
            {[
              "Đại học / Học viện",
              "Khoa / Bộ môn",
              "Trung tâm kỹ năng mềm",
              "Nghiên cứu & Thử nghiệm AI",
            ].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 flex-1 transition-colors duration-200 font-[16px] text-stone-900 font-bold border-b-5 cursor-pointer ${
                  activeTab === tab
                    ? "border-stone-900"
                    : "border-transparent"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex flex-col-reverse lg:flex-row justify-between mt-[40px] lg:gap-10">
            {/* Animated bullet list container */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`content-${activeTab}`}
                variants={contentVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="h-[325px] max-w-[560px] flex flex-col justify-between py-5 place-self-start"
              >
                <div className="h-[200px] sm:h-[175px] flex flex-col justify-between">
                  {getBullets(activeTab).map(
                    (bullet: string, index: number) => (
                      <div
                        key={index}
                        className="flex flex-row items-center sm:ml-5"
                      >
                        <div className="w-5 h-5 rounded-full bg-zinc-900 flex items-center justify-center mr-5">
                          <Check
                            size={15}
                            strokeWidth={3}
                            color="white"
                          />
                        </div>
                        <p className="w-[calc(100%-40px)]">
                          {bullet}
                        </p>
                      </div>
                    )
                  )}
                </div>

                <span className="font-bold text-indigo-500 cursor-pointer py-2 px-4 rounded-2xl w-fit hover:bg-indigo-50">
                  Xem chi tiết kịch bản áp dụng
                </span>
              </motion.div>
            </AnimatePresence>

            {/* Animated image container */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`image-${activeTab}`}
                variants={imageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.3 }}
              >
                <img
                  className="mx-auto lg:mr-15 lg:mt-[-40px] w-[280px] lg:w-[350px] lg:h-[350px]"
                  src={getMedia(activeTab)}
                  alt={activeTab}
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </ScrollAnimation>
    </div>
  );
};

export default HowToUse;

