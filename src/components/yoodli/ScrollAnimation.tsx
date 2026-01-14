import React, { ReactNode } from "react";

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

// Bản đơn giản: chỉ bọc children, bỏ animation framer-motion để không cần thêm dependency
const ScrollAnimation: React.FC<ScrollAnimationProps> = ({
  children,
  className,
}) => {
  return <div className={className}>{children}</div>;
};

export default ScrollAnimation;

