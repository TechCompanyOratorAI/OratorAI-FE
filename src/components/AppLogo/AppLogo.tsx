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
  sm: "text-base font-semibold",
  md: "text-lg font-semibold",
  lg: "text-xl font-semibold",
};

const AppLogo: React.FC<AppLogoProps> = ({
  to = "/",
  size = "md",
  className = "",
}) => {
  const textClass = `text-slate-900 ${sizeClasses[size]} ${className}`.trim();
  const content = <span className={textClass}>FPTOratorAI</span>;

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
