import React, { useState } from "react";
import { CheckOutlined } from "@ant-design/icons";
import ScrollAnimation from "./ScrollAnimation";

const HowToUse: React.FC = () => {
  const [activeTab, setActiveTab] = useState("GTM Enablement");

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

  return (
    <div className="p-5 bg-white">
      <ScrollAnimation>
        <h2 className="text-center text-[28px] font-bold mt-30 mb-10">
          Ai sẽ sử dụng hệ thống OratorAI?
        </h2>
      </ScrollAnimation>
      <ScrollAnimation>
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
                className={`py-4 flex-1 transition-colors duration-200 font-[16px] text-stone-900 font-bold border-b-4 cursor-pointer ${
                  activeTab === tab ? "border-stone-900" : "border-transparent"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex flex-col-reverse lg:flex-row justify-between mt-[40px] lg:gap-10">
            <div className="h-[325px] max-w-[560px] flex flex-col justify-between py-5 place-self-start">
              <div className="h-[200px] sm:h-[175px] flex flex-col justify-between">
                {getBullets(activeTab).map((bullet, index) => (
                  <div
                    key={index}
                    className="flex flex-row items-center sm:ml-5"
                  >
                    <div className="w-5 h-5 rounded-full bg-zinc-900 flex items-center justify-center mr-5 text-white text-[10px]">
                      <CheckOutlined />
                    </div>
                    <p className="w-[calc(100%-40px)] text-[14px]">
                      {bullet}
                    </p>
                  </div>
                ))}
              </div>

              <span className="font-bold text-indigo-500 cursor-pointer py-2 px-4 rounded-2xl w-fit hover:bg-indigo-50">
                Xem chi tiết kịch bản áp dụng
              </span>
            </div>

            <div className="flex justify-center items-center">
              <div className="mx-auto lg:mr-15 lg:mt-[-40px] w-[280px] lg:w-[350px] lg:h-[350px] rounded-2xl bg-gradient-to-br from-sky-100 to-indigo-100" />
            </div>
          </div>
        </div>
      </ScrollAnimation>
    </div>
  );
};

export default HowToUse;

