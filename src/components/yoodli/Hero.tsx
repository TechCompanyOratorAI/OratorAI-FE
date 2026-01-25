import React, { useEffect, useState } from "react";
import { Check } from "lucide-react";
import Button from "./Button";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const phrases = [
  "course presentations",
  "capstone projects",
  "thesis defense",
  "team seminars",
  "research pitches",
];

const phraseHeight = 50;

const Hero: React.FC = () => {
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [windowWidth, setWindowWidth] = useState<number>(0);
  const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPhraseIndex((prevIndex) => (prevIndex + 1) % phrases.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const handleResize = () => setWindowWidth(window.innerWidth);
      window.addEventListener("resize", handleResize);
      handleResize();
      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  // Fade in animation variants
  const fadeInVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
    },
  };

  return (
    <section
      className="flex flex-col md:flex-row items-center justify-center px-6 md:px-20 py-5 pb-25 xl:pb-15"
      style={{
        backgroundImage: "url('/hero_back.svg')",
        backgroundSize: "cover",
        backgroundPositionY: "bottom",
        backgroundPositionX: "50%",
      }}
    >
      <div className="flex-1 max-w-[620px]">
        <motion.div
          className="flex flex-col sm:flex-row sm:gap-2 lg:flex-col"
          initial="hidden"
          animate="visible"
          variants={fadeInVariants}
          transition={{ delay: 0 * 0.2, duration: 0.5, ease: "easeOut" }}
        >
          <h1 className="text-[26px] mt-[1px] sm:text-[32px] lg:text-[40px] font-bold w-fit lg:w-full">
            AI presentation feedback for
          </h1>
          <h2 className="text-[26px] sm:text-[32px] lg:text-[40px] font-bold w-fit lg:w-full">
            <div
              style={{
                overflow: "hidden",
                height: `${phraseHeight}px`,
                width: "100%",
                position: "relative",
              }}
            >
              <div
                style={{
                  transform: `translateY(-${
                    currentPhraseIndex * phraseHeight
                  }px)`,
                  transition: "transform 250ms ease-in-out",
                }}
              >
                {phrases.map((phrase, index) => (
                  <div
                    key={index}
                    style={{
                      height: `${phraseHeight}px`,
                      lineHeight: `${phraseHeight}px`,
                    }}
                    className="text-transparent w-fit bg-clip-text bg-gradient-to-r from-sky-500 to-indigo-500"
                  >
                    {phrase}
                  </div>
                ))}
              </div>
            </div>
          </h2>
        </motion.div>
        <motion.p
          className="mt-4 text-[16px] text-stone-900 font-[500]"
          initial="hidden"
          animate="visible"
          variants={fadeInVariants}
          transition={{ delay: 1 * 0.2, duration: 0.5, ease: "easeOut" }}
        >
          Tự động ghi lại, chấm điểm và phân tích bài thuyết trình của sinh viên
          với AI – đồng bộ lời nói với từng slide, giúp giảng viên đánh giá khách
          quan hơn và sinh viên cải thiện qua từng lần luyện tập.
        </motion.p>
        <motion.div
          className="mt-6 flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-3 xl:gap-6"
          initial="hidden"
          animate="visible"
          variants={fadeInVariants}
          transition={{ delay: 2 * 0.2, duration: 0.5, ease: "easeOut" }}
        >
          <Button
            text="Bắt đầu bài thuyết trình mẫu"
            variant="primary"
            onClick={() => navigate("/login")}
            {...(windowWidth < 700
              ? {
                  fontSize: "16px",
                  borderRadius: "20px",
                  paddingWidth: "10px",
                  paddingHeight: "10px",
                }
              : {
                  fontSize: "20px",
                  borderRadius: "25px",
                  paddingWidth: "25px",
                  paddingHeight: "10px",
                })}
          />
          <Button
            text="Xem hệ thống chấm điểm AI"
            variant="secondary"
            {...(windowWidth < 700
              ? {
                  fontSize: "16px",
                  borderRadius: "20px",
                  paddingWidth: "10px",
                  paddingHeight: "10px",
                }
              : {
                  fontSize: "20px",
                  borderRadius: "25px",
                  paddingWidth: "25px",
                  paddingHeight: "10px",
                })}
          />
        </motion.div>
        <motion.div
          className="flex items-center mt-6"
          initial="hidden"
          animate="visible"
          variants={fadeInVariants}
          transition={{ delay: 3 * 0.2, duration: 0.5, ease: "easeOut" }}
        >
          <div className="w-4 h-4 rounded-full bg-zinc-400 flex items-center justify-center mr-3">
            <Check size={12} strokeWidth={3} color="white" />
          </div>
          <span className="text-[16px] text-zinc-400 font-[700]">
            Hỗ trợ phân tích song ngữ Việt – Anh, phù hợp môi trường đại học
          </span>
        </motion.div>
      </div>
      <motion.div
        className="mt-8 md:mt-0 w-[400px] h-[390px] hidden lg:block"
        initial="hidden"
        animate="visible"
        variants={fadeInVariants}
        transition={{ delay: 1 * 0.2, duration: 0.5, ease: "easeOut" }}
      >
        <video
          src="/hero_video.webm"
          autoPlay
          loop
          muted
          playsInline
          className="w-[390px] h-full"
        />
      </motion.div>
    </section>
  );
};

export default Hero;

