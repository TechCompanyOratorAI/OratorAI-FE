import React, { useState } from "react";
import ScrollAnimation from "./ScrollAnimation";

const Demo: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);

  return (
    <div className="px-[32px] py-5 mt-20 h-fit">
      <ScrollAnimation type="slide" direction="up">
        <h2 className="text-center text-[28px] font-bold mt-10 mb-10">
          Xem thử demo chấm điểm bài thuyết trình
        </h2>
      </ScrollAnimation>

      <ScrollAnimation type="scale" threshold={0.3}>
        <div className="relative mx-auto min-mx-[32px] max-w-[800px] aspect-[16/9] w-full h-full rounded-xl shadow-lg overflow-hidden">
          {isVisible ? (
            <>
              <img
                className="brightness-90 hover:brightness-80 duration-100 cursor-pointer w-full h-full object-cover"
                src="/demo_thumbnail.webp"
                alt="OratorAI presentation grading demo"
                onClick={() => setIsVisible(false)}
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="1200"
                height="800"
                viewBox="-35.2 -41.333 305.067 248"
                className="absolute z-20 h-[125px] w-auto left-[calc(50%-100px)] top-[calc(50%-60px)] transition-opacity duration-150 opacity-90 pointer-events-none hover:opacity-100"
              >
                <path
                  fill="red"
                  d="M229.763 25.817c-2.699-10.162-10.65-18.165-20.748-20.881C190.716 0 117.333 0 117.333 0S43.951 0 25.651 4.936C15.553 7.652 7.6 15.655 4.903 25.817 0 44.236 0 82.667 0 82.667s0 38.429 4.903 56.85C7.6 149.68 15.553 157.681 25.65 160.4c18.3 4.934 91.682 4.934 91.682 4.934s73.383 0 91.682-4.934c10.098-2.718 18.049-10.72 20.748-20.882 4.904-18.421 4.904-56.85 4.904-56.85s0-38.431-4.904-56.85"
                ></path>
                <path
                  fill="#fff"
                  d="m93.333 117.559 61.333-34.89-61.333-34.894z"
                ></path>
              </svg>
            </>
          ) : (
            <iframe
              width="100%"
              height="100%"
              src="https://www.youtube-nocookie.com/embed/4O1vnWR9dzM?autoplay=1&iv_load_policy=3&rel=0&playsinline=1"
              title="OratorAI demo"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          )}
        </div>
      </ScrollAnimation>
    </div>
  );
};

export default Demo;

