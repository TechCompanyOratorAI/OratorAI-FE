import React from "react";
import Button from "./Button";
import ScrollAnimation from "./ScrollAnimation";

const Pitch: React.FC = () => {
  return (
    <div className="bg-indigo-950 text-white py-16 px-4">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
        <ScrollAnimation>
          <div className="flex flex-col items-center text-center">
            <div className="mb-4">
              <span className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-2xl">
                📋
              </span>
            </div>
            <h3 className="text-2xl font-bold mb-4">
              Bám sát rubric của giảng viên
            </h3>
            <p className="text-lg">
              OratorAI chấm điểm dựa trên rubric của môn học, giúp phản hồi nhất quán
              giữa các lớp và giảng viên.
            </p>
          </div>
        </ScrollAnimation>
        <ScrollAnimation>
          <div className="flex flex-col items-center text-center">
            <div className="mb-4">
              <span className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-2xl">
                🔄
              </span>
            </div>
            <h3 className="text-2xl font-bold mb-4">Cập nhật theo nội dung học phần</h3>
            <p className="text-lg">
              Khi slide hoặc yêu cầu bài thuyết trình thay đổi, hệ thống tự động cập
              nhật cho các lần nộp sau.
            </p>
          </div>
        </ScrollAnimation>
        <ScrollAnimation>
          <div className="flex flex-col items-center text-center">
            <div className="mb-4">
              <span className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-2xl">
                🌐
              </span>
            </div>
            <h3 className="text-2xl font-bold mb-4">
              Theo dõi đồng nhất giữa các khoá
            </h3>
            <p className="text-lg">
              Dễ dàng so sánh kết quả thuyết trình giữa các khoá, lớp và năm học khác
              nhau trên cùng một hệ thống.
            </p>
          </div>
        </ScrollAnimation>
      </div>

      <div className="max-w-3xl mx-auto flex flex-col md:flex-row items-center justify-center gap-8 mb-16">
        <div className="w-40 h-40 relative">
          <ScrollAnimation>
            <div className="w-full h-full rounded-full bg-white/10 flex items-center justify-center text-xl">
              SOC 2
            </div>
          </ScrollAnimation>
        </div>
        <ScrollAnimation>
          <div className="text-center md:text-left">
            <h3 className="text-2xl font-bold mb-4">
              OratorAI ưu tiên bảo mật dữ liệu bài thuyết trình
            </h3>
            <p className="text-lg">
              File audio, video, slide và điểm số của sinh viên được lưu trữ an toàn,
              phục vụ cả mục tiêu giảng dạy và nghiên cứu.
            </p>
          </div>
        </ScrollAnimation>
      </div>
      <ScrollAnimation>
        <div className="flex justify-center">
          <div>
            <Button
              text={"Trao đổi với nhóm phát triển"}
              variant={"primary"}
              fontSize="20px"
              borderRadius="25px"
              paddingWidth="25px"
              paddingHeight="10px"
            />
          </div>
        </div>
      </ScrollAnimation>
    </div>
  );
};

export default Pitch;

