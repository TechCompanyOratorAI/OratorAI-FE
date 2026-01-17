import { ReactNode } from "react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

interface ScrollAnimationProps {
    children: ReactNode;
    className?: string;
    direction?: "up" | "down" | "left" | "right";
    delay?: number;
    duration?: number;
    threshold?: number;
    once?: boolean;
    type?: "fade" | "slide" | "scale" | "none";
}

const ScrollAnimation = ({
    children,
    className = "",
    direction = "up",
    delay = 0,
    duration = 0.5,
    threshold = 0.1,
    once = true,
    type = "fade",
}: ScrollAnimationProps) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { amount: threshold, once });

    // Define direction-based offsets
    const directionOffset = {
        up: { y: 40, x: 0 },
        down: { y: -40, x: 0 },
        left: { y: 0, x: 40 },
        right: { y: 0, x: -40 },
    };

    // Animation variants based on type
    const animations = {
        fade: {
            visible: { opacity: 1, transition: { duration, delay } },
            hidden: { opacity: 0 },
        },
        slide: {
            visible: {
                opacity: 1,
                x: 0,
                y: 0,
                transition: { duration, delay },
            },
            hidden: {
                opacity: 0,
                ...directionOffset[direction],
            },
        },
        scale: {
            visible: {
                opacity: 1,
                scale: 1,
                transition: { duration, delay },
            },
            hidden: { opacity: 0, scale: 0.8 },
        },
        none: {
            visible: {},
            hidden: {},
        },
    };

    const selectedAnimation = animations[type];

    return (
        <motion.div
            ref={ref}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            variants={selectedAnimation}
            className={className}
        >
            {children}
        </motion.div>
    );
};

export default ScrollAnimation;

