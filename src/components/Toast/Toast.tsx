import React, { useEffect } from "react";
import { CheckCircle2, XCircle, AlertCircle, X } from "lucide-react";

interface ToastProps {
  message: string;
  type: "success" | "error" | "info";
  onClose: () => void;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose, duration = 3000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const bgColor = {
    success: "bg-green-50 border-green-200",
    error: "bg-red-50 border-red-200",
    info: "bg-blue-50 border-blue-200",
  };

  const textColor = {
    success: "text-green-800",
    error: "text-red-800",
    info: "text-blue-800",
  };

  const Icon = {
    success: CheckCircle2,
    error: XCircle,
    info: AlertCircle,
  };

  const iconColor = {
    success: "text-green-600",
    error: "text-red-600",
    info: "text-blue-600",
  };

  const CurrentIcon = Icon[type];

  return (
    <div
      className={`flex items-center gap-3 p-4 rounded-lg border shadow-lg ${bgColor[type]} animate-slide-in-right`}
      style={{
        animation: "slideInRight 0.3s ease-out",
      }}
    >
      <CurrentIcon className={`w-5 h-5 flex-shrink-0 ${iconColor[type]}`} />
      <p className={`flex-1 text-sm font-medium ${textColor[type]}`}>{message}</p>
      <button
        onClick={onClose}
        className={`p-1 rounded hover:bg-white/50 transition ${textColor[type]}`}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Toast;
