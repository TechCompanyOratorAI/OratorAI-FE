import React from "react";
import { ChevronRight } from "lucide-react";
import ScrollAnimation from "./ScrollAnimation";

type CaseCard = {
    image: string;
    title: string;
    cards: { title: string; background: string; color: string }[];
};

const casesData: CaseCard[] = [
    {
        image: "/cases/google_cloud.png",
        title:
            "Ứng dụng OratorAI để chấm điểm tự động bài thuyết trình của hơn 500 sinh viên trong một học kỳ",
        cards: [
            { title: "Môn Kỹ năng thuyết trình", background: "#ffefe1", color: "#a43826" },
            { title: "Đánh giá tự động", background: "#fffaef", color: "#a0530c" },
            { title: "Báo cáo chi tiết", background: "#e3f8e2", color: "#0b6e47" },
        ],
    },
    {
        image: "/cases/sandler.png",
        title:
            "Hỗ trợ giảng viên giảm 60% thời gian chấm điểm thuyết trình cuối kỳ",
        cards: [
            { title: "Giảm tải chấm điểm", background: "#e6e5ff", color: "#040348" },
            {
                title: "Chuẩn hoá rubric",
                background: "#ffefe1",
                color: "#a43826",
            },
            { title: "Phản hồi khách quan", background: "#e3f8e2", color: "#0b6e47" },
        ],
    },
    {
        image: "/cases/korn_ferry.png",
        title:
            "Triển khai hệ thống quan sát tiến bộ thuyết trình của từng sinh viên qua nhiều học phần",
        cards: [
            { title: "Theo dõi tiến bộ", background: "#e6e5ff", color: "#040348" },
            {
                title: "Dashboard lớp học",
                background: "#fffaef",
                color: "#a0530c",
            },
            {
                title: "Báo cáo cho khoa",
                background: "#e3f8e2",
                color: "#0b6e47",
            },
        ],
    },
];

const Cases: React.FC = () => {
    return (
        <div className="bg-blue-950 text-white py-[80px] px-[30px]">
            <ScrollAnimation type="slide" direction="up">
                <div className="max-w-[1136px] flex justify-between items-center mb-5 mx-auto">
                    <h2 className="text-[20px] sm:text-[28px] font-bold">
                        Check out our case studies
                    </h2>
                    <ScrollAnimation type="slide" direction="left" delay={0.2}>
                        <span className="bg-blue-950 text-[12px] sm:text-[16px] w-[100px] font-bold text-lg flex gap-3 pl-2 rounded-md items-center cursor-pointer duration-100 hover:brightness-120">
                            See all <ChevronRight size={16} />
                        </span>
                    </ScrollAnimation>
                </div>
            </ScrollAnimation>
            <div className="flex flex-col lg:flex-row gap-5 justify-center items-center">
                {casesData.map((caseItem, index) => (
                    <ScrollAnimation
                        key={index}
                        type="slide"
                        direction="up"
                        delay={0.1 * (index + 1)}
                    >
                        <div className="max-w-[360px] bg-white rounded-2xl overflow-hidden shadow-md text-stone-900">
                            <div className="h-[180px] bg-gray-100 flex items-center justify-center">
                                <img
                                    src={caseItem.image}
                                    alt={caseItem.title}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="p-4 space-y-3">
                                <p className="text-[14px] font-semibold">{caseItem.title}</p>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {caseItem.cards.map((card) => (
                                        <span
                                            key={card.title}
                                            className="px-3 py-1 rounded-full text-[11px] font-semibold"
                                            style={{
                                                backgroundColor: card.background,
                                                color: card.color,
                                            }}
                                        >
                                            {card.title}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </ScrollAnimation>
                ))}
            </div>
        </div>
    );
};

export default Cases;

