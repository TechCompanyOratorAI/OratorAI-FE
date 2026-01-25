import React, { useEffect, useState } from "react";
import ScrollAnimation from "./ScrollAnimation";

const Roleplay: React.FC = () => {
    const [activeCard, setActiveCard] = useState(-1);
    const images = [
        "/roleplay/yoodli-HIW2.webp",
        "/roleplay/yoodli-HIW3.webp",
        "/roleplay/yoodli-HIW4.webp",
    ];

    const cardTexts = [
        {
            title: "Chọn môn học và bài thuyết trình",
            desc: "Giảng viên cấu hình chủ đề, rubric và upload slide tham chiếu",
        },
        {
            title: "Sinh viên bắt đầu trình bày",
            desc: "Hệ thống ghi lại bài nói, nhận dạng giọng nói và đồng bộ với từng slide",
        },
        {
            title: "Xem kết quả phân tích",
            desc: "OratorAI chấm điểm theo rubric, đánh giá độ bám sát slide và gợi ý cải thiện",
        },
    ];

    useEffect(() => {
        const handleScroll = () => {
            const cards = document.querySelectorAll(".card");
            let newActiveCard = -1;
            cards.forEach((card) => {
                const rect = card.getBoundingClientRect();
                if (rect.top <= 0) {
                    newActiveCard = Math.max(
                        newActiveCard,
                        Number(card.getAttribute("data-index"))
                    );
                }
            });
            setActiveCard(newActiveCard);
        };

        window.addEventListener("scroll", handleScroll);
        handleScroll();
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const [windowWidth, setWindowWidth] = useState<number>(0);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const handleResize = () => setWindowWidth(window.innerWidth);
            window.addEventListener("resize", handleResize);
            handleResize();
            return () => window.removeEventListener("resize", handleResize);
        }
    }, []);

    return (
        <>
            <div className="py-20 pb-0 mt-25 bg-[#f6f8ff]">
                <ScrollAnimation
                    type="slide"
                    direction="up"
                    delay={0.1}
                    duration={0.5}
                >
                    <h2 className="text-center text-[28px] font-bold mb-10">
                        How OratorAI Roleplays work
                    </h2>
                </ScrollAnimation>

                {windowWidth > 1320 && (
                    <div className="flex mx-auto max-w-[1300px] h-[2100px]">
                        <div
                            className="relative w-[578px] h-[464px] sticky top-[50%] transform translate-y-[-50%] left-0 ml-32 mt-80 p-[64px] rounded-xl"
                            style={{
                                background: "linear-gradient(72deg, #eff5fd 0%, #eeeefe 79%)",
                            }}
                        >
                            {images.map((src, index) => (
                                <ScrollAnimation
                                    key={index}
                                    type="fade"
                                    delay={0.1 * index}
                                    duration={0.5}
                                >
                                    <div
                                        className={`absolute top-[64px] left-[64px] w-[448px] h-[333px] transition-opacity duration-500 ${
                                            // Show only the image corresponding to the next card (activeCard + 1).
                                            index === activeCard + 1
                                                ? "opacity-100"
                                                : "opacity-0"
                                        }`}
                                    >
                                        <img
                                            src={src}
                                            alt={cardTexts[index].title}
                                            className="rounded-lg w-[448px] h-[333px] object-cover"
                                        />
                                    </div>
                                </ScrollAnimation>
                            ))}
                        </div>
                        <div className="h-screen p-5 mt-60 transform translate-x-[-60px]">
                            {cardTexts.map((cardText, index) => (
                                <ScrollAnimation
                                    key={index}
                                    type="slide"
                                    direction="left"
                                    delay={0.1 * index}
                                    duration={0.5}
                                >
                                    <div
                                        className="w-[560px] h-fit p-[32px] bg-white rounded-2xl shadow-sm card mb-120"
                                        data-index={index}
                                    >
                                        <h3 className="mb-[16px] font-bold text-[28px]">
                                            {cardText.title}
                                        </h3>
                                        <p className="text-[16px] font-[500]">
                                            {cardText.desc}
                                        </p>
                                    </div>
                                </ScrollAnimation>
                            ))}
                        </div>
                    </div>
                )}

                {windowWidth <= 1320 && (
                    <div className="px-10 w-full h-fit flex flex-col gap-10 mb-35 justify-center align-center max-w-[600px] mx-auto">
                        {images.map((src, index) => (
                            <div key={"image-cont-" + index}>
                                <ScrollAnimation
                                    key={index}
                                    type="slide"
                                    direction="right"
                                    delay={0.1}
                                    duration={0.5}
                                >
                                    <div
                                        className="grid place-item-center w-full p-5 pb-0 rounded-2xl shadow-sm"
                                        style={{
                                            background:
                                                "linear-gradient(72deg, #eff5fd 0%, #eeeefe 79%)",
                                        }}
                                    >
                                        <img
                                            src={src}
                                            alt={cardTexts[index].title}
                                            className="rounded-lg w-fit"
                                        />
                                    </div>
                                </ScrollAnimation>

                                <ScrollAnimation
                                    type="slide"
                                    direction="left"
                                    delay={0.2}
                                    duration={0.5}
                                >
                                    <div
                                        className="w-full h-fit p-[32px] bg-white rounded-2xl shadow-sm card"
                                        data-index={index}
                                    >
                                        <h3 className="mb-[16px] font-bold text-[20px] lg:text-[28px]">
                                            {cardTexts[index].title}
                                        </h3>
                                        <p className="text-[12px] lg:text-[16px] font-[500]">
                                            {cardTexts[index].desc}
                                        </p>
                                    </div>
                                </ScrollAnimation>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <div className="overflow-hidden w-full h-[300px] mt-[-150px]">
                <div
                    className="grid justify-items-center items-start w-[100.1%] h-full bg-indigo-950"
                    style={{
                        backgroundImage: "url('/hero_back.svg')",
                        backgroundSize: "cover",
                        backgroundPositionY: "bottom",
                        backgroundPositionX: "50%",
                    }}
                >

                </div>
            </div>
        </>
    );
};

export default Roleplay;

