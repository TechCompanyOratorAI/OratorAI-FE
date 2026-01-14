import React from "react";
import { Button as AntButton } from "antd";

type ButtonProp = {
  text: string;
  variant: "primary" | "secondary" | "tertiary";
  fontSize?: string;
  borderRadius?: string;
  paddingWidth?: string;
  paddingHeight?: string;
  onClick?: () => void;
};

// Wrapper button dùng Ant Design nhưng giữ API giống yoodli-clone
const Button: React.FC<ButtonProp> = ({
  text,
  variant,
  fontSize,
  borderRadius,
  paddingWidth,
  paddingHeight,
  onClick,
}) => {
  const style: React.CSSProperties = {};
  if (fontSize) style.fontSize = fontSize;
  if (borderRadius) style.borderRadius = borderRadius;
  if (paddingWidth) {
    style.paddingLeft = paddingWidth;
    style.paddingRight = paddingWidth;
  }
  if (paddingHeight) {
    style.paddingTop = paddingHeight;
    style.paddingBottom = paddingHeight;
  }

  const type =
    variant === "primary"
      ? "primary"
      : variant === "secondary"
      ? "default"
      : "link";

  const className =
    variant === "primary"
      ? "bg-gradient-to-r from-sky-500 to-indigo-500 border-none"
      : variant === "secondary"
      ? ""
      : "text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-indigo-500";

  return (
    <AntButton
      type={type as any}
      className={className}
      style={style}
      onClick={onClick}
    >
      {text}
    </AntButton>
  );
};

export default Button;

