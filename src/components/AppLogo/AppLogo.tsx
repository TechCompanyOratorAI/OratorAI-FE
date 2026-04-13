import React from "react";
import { Link } from "react-router-dom";

interface AppLogoProps {
  /** Link khi click (mặc định "/"). Để undefined hoặc "" thì không bọc Link */
  to?: string;
  /** Cỡ chữ: sm (sidebar), md (header), lg (hero) */
  size?: "sm" | "md" | "lg";
  /** Thêm class cho phần chữ */
  className?: string;
}

const sizeClasses = {
  sm: "h-8",
  md: "h-12",
  lg: "h-16",
};

const AppLogo: React.FC<AppLogoProps> = ({
  to = "/",
  size = "md",
  className = "",
}) => {
  const content = (
    <img
      src="/text_fptoratorAI.svg"
      alt="FPTOratorAI"
      className={`object-contain ${sizeClasses[size]} ${className}`.trim()}
    />
  );

  if (to) {
    return (
      <Link
        to={to}
        className="inline-flex items-center hover:opacity-90 transition-opacity"
      >
        {content}
      </Link>
    );
  }

  return content;
};

export default AppLogo;
